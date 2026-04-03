import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client-side Supabase (anon key, for Realtime subscriptions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase (service role, for admin operations like storage uploads)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
