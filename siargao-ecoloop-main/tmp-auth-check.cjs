const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env', 'utf8');
const get = (k) => {
  const line = env.split(/\r?\n/).find((l) => l.startsWith(k + '='));
  return line ? line.slice(k.length + 1).replace(/^['\"]|['\"]$/g, '') : '';
};
const url = get('VITE_SUPABASE_URL');
const key = get('VITE_SUPABASE_PUBLISHABLE_KEY');
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const email = 'copilot-auth-check@example.com';
  const password = 'TestPassword123!';
  const { data, error } = await supabase.auth.signUp({ email, password });
  console.log(JSON.stringify({ data: { user: data?.user?.id || null, session: !!data?.session }, error }, null, 2));
})();
