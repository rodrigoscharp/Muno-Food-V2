import { createClient } from "@supabase/supabase-js";

// Server-side only — NUNCA importar em componentes client ou hooks client
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
