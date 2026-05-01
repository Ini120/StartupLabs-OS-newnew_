import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "npm:jose@5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CLERK_JWKS_URL =
  Deno.env.get("CLERK_JWKS_URL") ??
  "https://valid-starling-46.clerk.accounts.dev/.well-known/jwks.json";
const JWKS = createRemoteJWKSet(new URL(CLERK_JWKS_URL));

async function verifyClerkJwt(req: Request): Promise<{ userId: string } | { error: Response }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return {
      error: new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  try {
    const { payload } = await jwtVerify(authHeader.slice(7).trim(), JWKS);
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) throw new Error("no sub");
    return { userId: sub };
  } catch {
    return {
      error: new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await verifyClerkJwt(req);
  if ("error" in auth) return auth.error;
  const userId = auth.userId;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const { action } = body;

    // ============= START CONVERSATION =============
    if (action === "start") {
      const otherUserId = String(body.other_user_id ?? "").trim();
      if (!otherUserId || otherUserId === userId)
        return json({ error: "Invalid other_user_id" }, 400);

      // Find existing 1-on-1 conversation
      const { data: mine } = await supabaseAdmin
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

      const myConvIds = (mine ?? []).map((r) => r.conversation_id);
      if (myConvIds.length) {
        const { data: shared } = await supabaseAdmin
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", otherUserId)
          .in("conversation_id", myConvIds);

        if (shared && shared.length) {
          // Verify it's a 2-person conversation
          for (const row of shared) {
            const { count } = await supabaseAdmin
              .from("conversation_participants")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", row.conversation_id);
            if (count === 2) return json({ conversation_id: row.conversation_id });
          }
        }
      }

      // Create
      const { data: conv, error: convErr } = await supabaseAdmin
        .from("conversations")
        .insert({ created_by: userId })
        .select("id")
        .single();
      if (convErr) throw convErr;

      const { error: partErr } = await supabaseAdmin
        .from("conversation_participants")
        .insert([
          { conversation_id: conv.id, user_id: userId },
          { conversation_id: conv.id, user_id: otherUserId },
        ]);
      if (partErr) throw partErr;

      return json({ conversation_id: conv.id });
    }

    // ============= SEND MESSAGE =============
    if (action === "send") {
      const conversationId = String(body.conversation_id ?? "");
      const content = String(body.content ?? "").slice(0, 4000);
      const attachment_url = body.attachment_url ? String(body.attachment_url) : null;
      const attachment_type = body.attachment_type ? String(body.attachment_type) : null;
      const attachment_name = body.attachment_name ? String(body.attachment_name) : null;

      if (!conversationId) return json({ error: "Missing conversation_id" }, 400);
      if (!content && !attachment_url) return json({ error: "Empty message" }, 400);

      // Verify membership
      const { data: member } = await supabaseAdmin
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!member) return json({ error: "Not a participant" }, 403);

      const { data: msg, error } = await supabaseAdmin
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content,
          attachment_url,
          attachment_type,
          attachment_name,
        })
        .select()
        .single();
      if (error) throw error;

      // Update sender's last_read_at
      await supabaseAdmin
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      // Clear typing
      await supabaseAdmin
        .from("typing_indicators")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      return json({ message: msg });
    }

    // ============= MARK READ =============
    if (action === "mark_read") {
      const conversationId = String(body.conversation_id ?? "");
      if (!conversationId) return json({ error: "Missing conversation_id" }, 400);

      const { error } = await supabaseAdmin
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);
      if (error) throw error;
      return json({ success: true });
    }

    // ============= TYPING =============
    if (action === "typing") {
      const conversationId = String(body.conversation_id ?? "");
      const isTyping = Boolean(body.is_typing);
      if (!conversationId) return json({ error: "Missing conversation_id" }, 400);

      if (isTyping) {
        await supabaseAdmin
          .from("typing_indicators")
          .upsert(
            { conversation_id: conversationId, user_id: userId, updated_at: new Date().toISOString() },
            { onConflict: "conversation_id,user_id" }
          );
      } else {
        await supabaseAdmin
          .from("typing_indicators")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("user_id", userId);
      }
      return json({ success: true });
    }

    // ============= UPLOAD ATTACHMENT =============
    if (action === "upload") {
      const conversationId = String(body.conversation_id ?? "");
      const fileName = String(body.file_name ?? "file");
      const fileType = String(body.file_type ?? "application/octet-stream");
      const fileBase64 = String(body.file_base64 ?? "");

      if (!conversationId || !fileBase64) return json({ error: "Missing fields" }, 400);

      // Verify membership
      const { data: member } = await supabaseAdmin
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!member) return json({ error: "Not a participant" }, 403);

      const binary = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
      if (binary.length > 10 * 1024 * 1024) return json({ error: "File too large (max 10MB)" }, 400);

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${conversationId}/${Date.now()}_${safeName}`;

      const { error: upErr } = await supabaseAdmin.storage
        .from("chat-attachments")
        .upload(path, binary, { contentType: fileType, upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabaseAdmin.storage.from("chat-attachments").getPublicUrl(path);
      return json({ url: pub.publicUrl, name: fileName, type: fileType });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message ?? "Internal server error" }, 500);
  }
});
