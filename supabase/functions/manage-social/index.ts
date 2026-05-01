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

const PROFILE_FIELDS = [
  "full_name", "bio", "department", "level", "avatar_url",
  "location", "headline", "github_url", "linkedin_url", "website_url", "twitter_url",
];

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

    // ===== UPDATE PROFILE =====
    if (action === "update_profile") {
      const updates: Record<string, unknown> = {};
      for (const f of PROFILE_FIELDS) {
        if (f in body) updates[f] = body[f];
      }
      updates.updated_at = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);
      if (error) throw error;
      return json({ success: true });
    }

    // ===== PROJECTS =====
    if (action === "add_project") {
      const { title, description, role, stage, cover_url, link_url, started_at, ended_at } = body;
      if (!title) return json({ error: "Title required" }, 400);
      const { data, error } = await supabaseAdmin
        .from("user_projects")
        .insert({
          user_id: userId,
          title: String(title).slice(0, 200),
          description: String(description ?? "").slice(0, 2000),
          role: String(role ?? "").slice(0, 100),
          stage: String(stage ?? "").slice(0, 50),
          cover_url: String(cover_url ?? ""),
          link_url: String(link_url ?? ""),
          started_at: started_at || null,
          ended_at: ended_at || null,
        })
        .select()
        .single();
      if (error) throw error;
      await supabaseAdmin.from("activity_feed").insert({
        user_id: userId,
        type: "project_added",
        title: `Added a new project: ${title}`,
        ref_id: data.id,
      });
      return json({ project: data });
    }

    if (action === "delete_project") {
      const { project_id } = body;
      const { error } = await supabaseAdmin
        .from("user_projects")
        .delete()
        .eq("id", project_id)
        .eq("user_id", userId);
      if (error) throw error;
      return json({ success: true });
    }

    // ===== SKILLS =====
    if (action === "add_skill") {
      const name = String(body.name ?? "").trim().slice(0, 50);
      if (!name) return json({ error: "Skill name required" }, 400);
      const { data, error } = await supabaseAdmin
        .from("user_skills")
        .upsert({ user_id: userId, name }, { onConflict: "user_id,name" })
        .select()
        .single();
      if (error) throw error;
      return json({ skill: data });
    }

    if (action === "delete_skill") {
      const { skill_id } = body;
      const { error } = await supabaseAdmin
        .from("user_skills")
        .delete()
        .eq("id", skill_id)
        .eq("user_id", userId);
      if (error) throw error;
      return json({ success: true });
    }

    // ===== ACHIEVEMENTS =====
    if (action === "add_achievement") {
      const { title, description, icon, earned_at } = body;
      if (!title) return json({ error: "Title required" }, 400);
      const { data, error } = await supabaseAdmin
        .from("user_achievements")
        .insert({
          user_id: userId,
          title: String(title).slice(0, 200),
          description: String(description ?? "").slice(0, 1000),
          icon: String(icon ?? "trophy"),
          earned_at: earned_at || new Date().toISOString().slice(0, 10),
        })
        .select()
        .single();
      if (error) throw error;
      await supabaseAdmin.from("activity_feed").insert({
        user_id: userId,
        type: "achievement_earned",
        title: `Earned: ${title}`,
        ref_id: data.id,
      });
      return json({ achievement: data });
    }

    if (action === "delete_achievement") {
      const { achievement_id } = body;
      const { error } = await supabaseAdmin
        .from("user_achievements")
        .delete()
        .eq("id", achievement_id)
        .eq("user_id", userId);
      if (error) throw error;
      return json({ success: true });
    }

    // ===== FOLLOW: send request =====
    if (action === "follow") {
      const target = String(body.target_user_id ?? "");
      if (!target || target === userId) return json({ error: "Invalid target" }, 400);
      const { data, error } = await supabaseAdmin
        .from("follows")
        .upsert(
          { follower_id: userId, following_id: target, status: "pending" },
          { onConflict: "follower_id,following_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return json({ follow: data });
    }

    // ===== FOLLOW: cancel/unfollow =====
    if (action === "unfollow") {
      const target = String(body.target_user_id ?? "");
      const { error } = await supabaseAdmin
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("following_id", target);
      if (error) throw error;
      return json({ success: true });
    }

    // ===== FOLLOW: respond to request (accept/reject) =====
    if (action === "respond_follow") {
      const followId = String(body.follow_id ?? "");
      const accept = Boolean(body.accept);
      if (!followId) return json({ error: "Missing follow_id" }, 400);

      // Confirm I'm the recipient
      const { data: f, error: fErr } = await supabaseAdmin
        .from("follows")
        .select("*")
        .eq("id", followId)
        .maybeSingle();
      if (fErr) throw fErr;
      if (!f || f.following_id !== userId) return json({ error: "Forbidden" }, 403);

      if (accept) {
        const { error } = await supabaseAdmin
          .from("follows")
          .update({ status: "accepted", responded_at: new Date().toISOString() })
          .eq("id", followId);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from("follows").delete().eq("id", followId);
        if (error) throw error;
      }
      return json({ success: true });
    }

    // ===== POST a status to your own activity feed =====
    if (action === "post") {
      const text = String(body.text ?? "").trim().slice(0, 500);
      if (!text) return json({ error: "Empty post" }, 400);
      const { data, error } = await supabaseAdmin
        .from("activity_feed")
        .insert({ user_id: userId, type: "post", title: text })
        .select()
        .single();
      if (error) throw error;
      return json({ post: data });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message ?? "Internal server error" }, 500);
  }
});
