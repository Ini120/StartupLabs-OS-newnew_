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
  const token = authHeader.slice(7).trim();
  try {
    const { payload } = await jwtVerify(token, JWKS);
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sub) {
      return {
        error: new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }),
      };
    }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await verifyClerkJwt(req);
    if ("error" in auth) return auth.error;
    // Trust the verified caller id, NOT the body.
    const user_id = auth.userId;

    const body = await req.json();
    const { full_name, bio, level, department, profile_completed } = body;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          user_id,
          full_name: full_name || "",
          bio: bio || "",
          level: level || "",
          department: department || "",
          profile_completed: !!profile_completed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (profileError) throw profileError;

    // If student profile completed, auto-assign a mentor
    if (profile_completed) {
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id)
        .maybeSingle();

      if (roleData?.role === "student") {
        // Check if already assigned
        const { data: existing } = await supabaseAdmin
          .from("mentor_assignments")
          .select("id")
          .eq("student_id", user_id)
          .maybeSingle();

        if (!existing) {
          // Find mentor with fewest assignments
          const { data: mentors } = await supabaseAdmin
            .from("user_roles")
            .select("user_id")
            .eq("role", "mentor");

          if (mentors && mentors.length > 0) {
            // Count assignments per mentor
            const { data: assignments } = await supabaseAdmin
              .from("mentor_assignments")
              .select("mentor_id");

            const counts: Record<string, number> = {};
            for (const m of mentors) {
              counts[m.user_id] = 0;
            }
            for (const a of assignments || []) {
              if (counts[a.mentor_id] !== undefined) {
                counts[a.mentor_id]++;
              }
            }

            // Pick mentor with fewest students
            const sortedMentors = Object.entries(counts).sort((a, b) => a[1] - b[1]);
            const selectedMentor = sortedMentors[0][0];

            await supabaseAdmin.from("mentor_assignments").insert({
              student_id: user_id,
              mentor_id: selectedMentor,
              status: "pending",
              assigned_by: "system",
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
