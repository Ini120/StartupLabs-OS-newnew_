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
    const user_id = auth.userId;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, startup_id, milestone_id, title, description, status, due_date } = body;

    // Verify the user owns the startup
    if (startup_id) {
      const { data: startup } = await supabaseAdmin
        .from("Startups")
        .select("id")
        .eq("id", startup_id)
        .eq("student_id", user_id)
        .maybeSingle();

      if (!startup) {
        return new Response(JSON.stringify({ error: "Startup not found or not yours" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "create") {
      if (!title || !startup_id) {
        return new Response(JSON.stringify({ error: "title and startup_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabaseAdmin
        .from("Milestones")
        .insert({
          startup_id,
          title,
          description: description || null,
          status: status || "pending",
          due_date: due_date || null,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      if (!milestone_id) {
        return new Response(JSON.stringify({ error: "Missing milestone_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Re-verify ownership of the milestone via its startup
      const { data: ms } = await supabaseAdmin
        .from("Milestones")
        .select("startup_id")
        .eq("id", milestone_id)
        .maybeSingle();

      if (!ms?.startup_id) {
        return new Response(JSON.stringify({ error: "Milestone not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: ownedStartup } = await supabaseAdmin
        .from("Startups")
        .select("id")
        .eq("id", ms.startup_id)
        .eq("student_id", user_id)
        .maybeSingle();

      if (!ownedStartup) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = {};
      if (title) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (status) updates.status = status;
      if (due_date !== undefined) updates.due_date = due_date;

      const { data, error } = await supabaseAdmin
        .from("Milestones")
        .update(updates)
        .eq("id", milestone_id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
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
