import { SupabaseClient, createClient } from "https://esm.sh/v135/@supabase/supabase-js@2.42.5";

enum UserRoles {
  SUPERADMIN = 1,
  ADMIN = 2,
  USER = 3,
}

type CreateUserPayload = {
  email: string;
  password: string;
  name: string;
};

Deno.serve(async (req) => {
  const authorization = req.headers.get("Authorization");

  if (!authorization) {
    return new Response(
      JSON.stringify({
        success: false,
      }),
      { 
        status: 401 /* Unauthorized */,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  const payload: CreateUserPayload = await req.json();
  if (!(payload.email && payload.password && payload.password)) {
    return new Response(
      JSON.stringify({
        success: false,
      }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const client: SupabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: authUser , error: signUpError } = await client.auth.signUp({
    email: payload.email,
    password: payload.password,
  });
  
  if (signUpError) {
    return new Response(
      JSON.stringify({
        success: false,
        status: signUpError.status,
        message: signUpError.message,
      }),
      { 
        status: signUpError.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const insertProfileResult = await client.from("user_profiles").insert({
    name: payload.name,
  });
  
  if (insertProfileResult.error) {
    return new Response(
      JSON.stringify({
        success: false,
        status: insertProfileResult.error.code,
        message: insertProfileResult.error.message,
      }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const insertUserRolesResult = await client.from("user_roles").insert({
    user_id: authUser.user!.id,
    role_id: UserRoles.USER,
  });
  
  if (insertUserRolesResult.error) {
    return new Response(
      JSON.stringify({
        success: false,
        status: insertUserRolesResult.error.code,
        message: insertUserRolesResult.error.message,
      }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-user' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
