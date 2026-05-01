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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Helper to get actor display name (for notification messages)
  const actorName = async () => {
    const { data } = await supabaseAdmin.from("profiles")
      .select("full_name").eq("user_id", userId).maybeSingle();
    return data?.full_name || "Someone";
  };

  // Helper to insert a notification (skip if recipient = actor)
  const notify = async (recipient: string, payload: Record<string, unknown>) => {
    if (!recipient || recipient === userId) return;
    await supabaseAdmin.from("notifications").insert({
      user_id: recipient,
      actor_id: userId,
      ...payload,
    });
  };

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const action = String(body.action ?? "");

  try {
    switch (action) {
      case "create_post": {
        const content = String(body.content ?? "").trim().slice(0, 2000);
        const image_url = body.image_url ? String(body.image_url).slice(0, 1000) : "";
        const startup_id = body.startup_id ? String(body.startup_id) : null;
        if (!content && !image_url) return json({ error: "Post is empty" }, 400);
        const { data, error } = await supabaseAdmin
          .from("showcase_posts")
          .insert({ user_id: userId, content, image_url, startup_id })
          .select().single();
        if (error) throw error;
        return json({ post: data });
      }

      case "delete_post": {
        const post_id = String(body.post_id ?? "");
        if (!post_id) return json({ error: "Missing post_id" }, 400);
        const { data: existing } = await supabaseAdmin
          .from("showcase_posts").select("user_id").eq("id", post_id).maybeSingle();
        if (!existing || existing.user_id !== userId) return json({ error: "Forbidden" }, 403);
        const { error } = await supabaseAdmin.from("showcase_posts").delete().eq("id", post_id);
        if (error) throw error;
        return json({ success: true });
      }

      case "toggle_post_like": {
        const post_id = String(body.post_id ?? "");
        if (!post_id) return json({ error: "Missing post_id" }, 400);
        const { data: existing } = await supabaseAdmin
          .from("post_likes").select("id")
          .eq("post_id", post_id).eq("user_id", userId).maybeSingle();
        if (existing) {
          await supabaseAdmin.from("post_likes").delete().eq("id", existing.id);
          return json({ liked: false });
        }
        const { error } = await supabaseAdmin
          .from("post_likes").insert({ post_id, user_id: userId });
        if (error) throw error;

        // Notify post owner
        const { data: post } = await supabaseAdmin
          .from("showcase_posts").select("user_id").eq("id", post_id).maybeSingle();
        if (post?.user_id) {
          const name = await actorName();
          await notify(post.user_id, {
            type: "like_post", post_id, message: `${name} liked your post`,
          });
        }
        return json({ liked: true });
      }

      case "toggle_startup_like": {
        const startup_id = String(body.startup_id ?? "");
        if (!startup_id) return json({ error: "Missing startup_id" }, 400);
        const { data: existing } = await supabaseAdmin
          .from("startup_likes").select("id")
          .eq("startup_id", startup_id).eq("user_id", userId).maybeSingle();
        if (existing) {
          await supabaseAdmin.from("startup_likes").delete().eq("id", existing.id);
          return json({ liked: false });
        }
        const { error } = await supabaseAdmin
          .from("startup_likes").insert({ startup_id, user_id: userId });
        if (error) throw error;

        const { data: startup } = await supabaseAdmin
          .from("Startups").select("student_id, name").eq("id", startup_id).maybeSingle();
        if (startup?.student_id) {
          const name = await actorName();
          await notify(startup.student_id, {
            type: "like_startup", startup_id,
            message: `${name} liked ${startup.name ?? "your startup"}`,
          });
        }
        return json({ liked: true });
      }

      case "create_comment": {
        const content = String(body.content ?? "").trim().slice(0, 1000);
        const post_id = body.post_id ? String(body.post_id) : null;
        const startup_id = body.startup_id ? String(body.startup_id) : null;
        if (!content) return json({ error: "Comment is empty" }, 400);
        if ((post_id && startup_id) || (!post_id && !startup_id)) {
          return json({ error: "Comment must target a post OR a startup" }, 400);
        }
        const { data, error } = await supabaseAdmin
          .from("post_comments")
          .insert({ user_id: userId, content, post_id, startup_id })
          .select().single();
        if (error) throw error;

        const name = await actorName();
        const snippet = content.length > 60 ? content.slice(0, 60) + "…" : content;
        if (post_id) {
          const { data: post } = await supabaseAdmin
            .from("showcase_posts").select("user_id").eq("id", post_id).maybeSingle();
          if (post?.user_id) {
            await notify(post.user_id, {
              type: "comment_post", post_id, comment_id: data.id,
              message: `${name} commented: "${snippet}"`,
            });
          }
        } else if (startup_id) {
          const { data: startup } = await supabaseAdmin
            .from("Startups").select("student_id, name").eq("id", startup_id).maybeSingle();
          if (startup?.student_id) {
            await notify(startup.student_id, {
              type: "comment_startup", startup_id, comment_id: data.id,
              message: `${name} commented on ${startup.name ?? "your startup"}: "${snippet}"`,
            });
          }
        }
        return json({ comment: data });
      }

      case "delete_comment": {
        const comment_id = String(body.comment_id ?? "");
        if (!comment_id) return json({ error: "Missing comment_id" }, 400);
        const { data: existing } = await supabaseAdmin
          .from("post_comments").select("user_id").eq("id", comment_id).maybeSingle();
        if (!existing || existing.user_id !== userId) return json({ error: "Forbidden" }, 403);
        const { error } = await supabaseAdmin.from("post_comments").delete().eq("id", comment_id);
        if (error) throw error;
        return json({ success: true });
      }

      // ---- Notifications ----
      case "mark_notifications_read": {
        const ids = Array.isArray(body.ids) ? (body.ids as string[]) : null;
        let q = supabaseAdmin.from("notifications").update({ read_at: new Date().toISOString() })
          .eq("user_id", userId).is("read_at", null);
        if (ids && ids.length > 0) q = q.in("id", ids);
        const { error } = await q;
        if (error) throw error;
        return json({ success: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("manage-social-feed error", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});
