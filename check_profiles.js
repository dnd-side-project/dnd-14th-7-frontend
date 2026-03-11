const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: users, error: uErr } = await supabase.auth.admin?.listUsers() || await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1/user', { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` }}).then(r=>r.json());
  console.log("Users:", users);

  const { data: profiles, error: pErr } = await supabase.from("profiles").select("*");
  console.log("Profiles:", profiles, pErr);
}
check();
