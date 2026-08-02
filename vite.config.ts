import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The Vercel Supabase integration injects the project URL + anon key under
// non-Vite names (SUPABASE_* or NEXT_PUBLIC_SUPABASE_*). Vite only exposes
// VITE_-prefixed vars to the client, so we bridge them here at build time. The
// anon key is a public client key by design; the service-role key is never
// referenced and never reaches the bundle.
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(SUPABASE_ANON_KEY),
  },
});
