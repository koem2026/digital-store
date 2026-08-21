import { createClient } from "@supabase/supabase-js";

// Public client — safe to use in browser components.
// Relies on Row Level Security policies (see supabase/schema.sql) to keep data safe.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-only client — uses the service role key, which bypasses RLS.
// NEVER import this in a client component. Only use inside app/api/** routes.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side env var, no NEXT_PUBLIC_ prefix
  );
}
