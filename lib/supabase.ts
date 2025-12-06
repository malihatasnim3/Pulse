import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertPublicEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public env vars are missing.");
  }
}

export function createBrowserSupabaseClient(): SupabaseClient {
  assertPublicEnv();
  return createClient(supabaseUrl!, supabaseAnonKey!);
}

export function createServerSupabaseClient(): SupabaseClient {
  assertPublicEnv();
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function createServiceRoleSupabaseClient(): SupabaseClient {
  assertPublicEnv();
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  }
  return createClient(supabaseUrl!, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
