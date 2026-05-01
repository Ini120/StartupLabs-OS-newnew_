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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = String(body.action ?? "");

  try {
    // ---- Public: bootstrap super_admin (only if no super_admin exists) ----
    if (action === "bootstrap_super_admin") {
      const auth = await verifyClerkJwt(req);
      if ("error" in auth) return auth.error;
      const callerId = auth.userId;

      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin");

      if ((count ?? 0) > 0) {
        return json({ error: "A super admin already exists. Use an invite link." }, 403);
      }

      // Wipe any existing role for this user, then assign super_admin
      await supabaseAdmin.from("user_roles").delete().eq("user_id", callerId);
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: callerId, role: "super_admin" });
      if (error) throw error;

      return json({ success: true, role: "super_admin" });
    }

    // ---- Public: check if super admin exists (for the signup screen) ----
    if (action === "super_admin_exists") {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin");
      return json({ exists: (count ?? 0) > 0 });
    }

    // ---- Public: validate an invite token ----
    if (action === "validate_invite") {
      const token = String(body.token ?? "");
      if (!token) return json({ error: "Missing token" }, 400);
      const { data, error } = await supabaseAdmin
        .from("admin_invites")
        .select("id, email, role, expires_at, used_at")
        .eq("token", token)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ valid: false, reason: "not_found" });
      if (data.used_at) return json({ valid: false, reason: "used" });
      if (new Date(data.expires_at).getTime() < Date.now()) {
        return json({ valid: false, reason: "expired" });
      }
      return json({ valid: true, invite: { email: data.email, role: data.role } });
    }

    // ---- Auth required: redeem invite (called from the in-app accept flow) ----
    if (action === "redeem_invite") {
      const auth = await verifyClerkJwt(req);
      if ("error" in auth) return auth.error;
      const callerId = auth.userId;
      const token = String(body.token ?? "");
      if (!token) return json({ error: "Missing token" }, 400);

      const { data: invite } = await supabaseAdmin
        .from("admin_invites")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (!invite) return json({ error: "Invite not found" }, 404);
      if (invite.used_at) return json({ error: "Invite already used" }, 400);
      if (new Date(invite.expires_at).getTime() < Date.now()) {
        return json({ error: "Invite expired" }, 400);
      }

      // Replace any existing role; assign the role from the invite
      await supabaseAdmin.from("user_roles").delete().eq("user_id", callerId);
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: callerId, role: invite.role });
      if (roleErr) throw roleErr;

      await supabaseAdmin
        .from("admin_invites")
        .update({ used_by: callerId, used_at: new Date().toISOString() })
        .eq("id", invite.id);

      return json({ success: true, role: invite.role });
    }

    // ---- Below: super_admin only ----
    const auth = await verifyClerkJwt(req);
    if ("error" in auth) return auth.error;
    const callerId = auth.userId;

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .maybeSingle();
    if (callerRole?.role !== "super_admin") {
      return json({ error: "Only super admins can perform this action" }, 403);
    }

    if (action === "create_invite") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const role = body.role === "super_admin" ? "super_admin" : "admin";
      if (!email || !email.includes("@")) return json({ error: "Invalid email" }, 400);
      const { data, error } = await supabaseAdmin
        .from("admin_invites")
        .insert({ email, role, created_by: callerId })
        .select()
        .single();
      if (error) throw error;
      return json({ invite: data });
    }

    if (action === "list_invites") {
      const { data, error } = await supabaseAdmin
        .from("admin_invites")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ invites: data });
    }

    if (action === "revoke_invite") {
      const id = String(body.id ?? "");
      if (!id) return json({ error: "Missing id" }, 400);
      // Mark as used so it can no longer be redeemed
      const { error } = await supabaseAdmin
        .from("admin_invites")
        .update({ used_at: new Date().toISOString(), used_by: "revoked" })
        .eq("id", id);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "set_role") {
      // Super admin promotes/demotes any user
      const target_user_id = String(body.target_user_id ?? "");
      const newRole = String(body.role ?? "");
      const valid = ["student", "mentor", "admin", "super_admin"];
      if (!target_user_id || !valid.includes(newRole)) {
        return json({ error: "Invalid input" }, 400);
      }
      // Prevent demoting yourself if you're the only super_admin
      if (target_user_id === callerId && newRole !== "super_admin") {
        const { count } = await supabaseAdmin
          .from("user_roles").select("*", { count: "exact", head: true })
          .eq("role", "super_admin");
        if ((count ?? 0) <= 1) {
          return json({ error: "Cannot demote the only super admin" }, 400);
        }
      }
      await supabaseAdmin.from("user_roles").delete().eq("user_id", target_user_id);
      const { error } = await supabaseAdmin
        .from("user_roles").insert({ user_id: target_user_id, role: newRole });
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error("manage-admin-invites error", err);
    return json({ error: (err as Error).message ?? "Internal error" }, 500);
  }
});
