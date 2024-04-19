import { SupabaseClient, createClient } from "https://esm.sh/v135/@supabase/supabase-js@2.42.5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const client: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

Deno.serve(async (req) => {
  const body = await req.json();
  
  const email = body.email;
  const password = body.password;
  if (!email || !password) {
    return new Response(
      JSON.stringify({
        status: false,
        code: 400,
        message: "email or password should not be empty",
      }),
      { 
        status: 400,
        headers: { "Content-Type": "application/json" } 
      },
    );
  }

  const { data: authToken, error } = await client.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        status: false,
        code: 404,
        message: 'User not found',
      }),
      { 
        status: 404,
        headers: { "Content-Type": "application/json" } 
      },
    );
  }

  const data = {
    access_token: authToken.session?.access_token,
    refresh_token: authToken.session?.refresh_token,
  }

  return new Response(
    JSON.stringify(data),
    { 
      status: 200,
      headers: { "Content-Type": "application/json" } 
    },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/login' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
