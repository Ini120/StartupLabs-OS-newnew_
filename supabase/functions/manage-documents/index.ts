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
    return { error: new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  try {
    const { payload } = await jwtVerify(authHeader.slice(7).trim(), JWKS);
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) throw new Error("no sub");
    return { userId: sub };
  } catch {
    return { error: new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await verifyClerkJwt(req);
  if ("error" in auth) return auth.error;
  const userId = auth.userId;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const action = String(body.action ?? "");

  try {
    switch (action) {
      // Create a signed upload URL the client can PUT to
      case "create_upload_url": {
        const startup_id = String(body.startup_id ?? "");
        const file_name = String(body.file_name ?? "").trim();
        const file_type = String(body.file_type ?? "");
        if (!startup_id || !file_name) return json({ error: "Missing startup_id or file_name" }, 400);

        // Verify the user owns this startup
        const { data: startup } = await supabaseAdmin
          .from("Startups").select("student_id").eq("id", startup_id).maybeSingle();
        if (!startup || startup.student_id !== userId) return json({ error: "Forbidden" }, 403);

        // Sanitize filename and create unique path
        const safe = file_name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
        const path = `${startup_id}/${crypto.randomUUID()}-${safe}`;

        const { data: signed, error } = await supabaseAdmin.storage
          .from("documents").createSignedUploadUrl(path);
        if (error) throw error;

        return json({ path, token: signed.token, signed_url: signed.signedUrl, file_type });
      }

      // Persist document record after successful upload
      case "register_document": {
        const startup_id = String(body.startup_id ?? "");
        const path = String(body.path ?? "");
        const name = String(body.name ?? "").trim().slice(0, 200);
        const file_type = String(body.file_type ?? "").slice(0, 100);
        if (!startup_id || !path || !name) return json({ error: "Missing fields" }, 400);

        const { data: startup } = await supabaseAdmin
          .from("Startups").select("student_id").eq("id", startup_id).maybeSingle();
        if (!startup || startup.student_id !== userId) return json({ error: "Forbidden" }, 403);

        const { data, error } = await supabaseAdmin
          .from("Documents")
          .insert({ startup_id, name, file_url: path, file_type, uploaded_by: userId })
          .select().single();
        if (error) throw error;
        return json({ document: data });
      }

      // Generate a temporary download URL
      case "get_download_url": {
        const document_id = String(body.document_id ?? "");
        if (!document_id) return json({ error: "Missing document_id" }, 400);
        const { data: doc } = await supabaseAdmin
          .from("Documents").select("file_url, name").eq("id", document_id).maybeSingle();
        if (!doc?.file_url) return json({ error: "Not found" }, 404);
        const { data: signed, error } = await supabaseAdmin.storage
          .from("documents").createSignedUrl(doc.file_url, 60 * 5);
        if (error) throw error;
        return json({ url: signed.signedUrl, name: doc.name });
      }

      case "delete_document": {
        const document_id = String(body.document_id ?? "");
        if (!document_id) return json({ error: "Missing document_id" }, 400);
        const { data: doc } = await supabaseAdmin
          .from("Documents").select("uploaded_by, file_url").eq("id", document_id).maybeSingle();
        if (!doc || doc.uploaded_by !== userId) return json({ error: "Forbidden" }, 403);
        if (doc.file_url) {
          await supabaseAdmin.storage.from("documents").remove([doc.file_url]);
        }
        const { error } = await supabaseAdmin.from("Documents").delete().eq("id", document_id);
        if (error) throw error;
        return json({ success: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("manage-documents error", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});
