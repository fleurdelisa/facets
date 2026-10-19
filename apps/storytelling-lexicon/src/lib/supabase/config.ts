export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Without Supabase the app runs in preview mode: glossary from seed data,
// catalog unavailable.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
