const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    console.log('[Supabase] Client initialized successfully for:', supabaseUrl);
  } catch (err) {
    console.error('[Supabase] Initialization error:', err.message);
  }
} else {
  console.log('[Supabase] SUPABASE_URL or SUPABASE_KEY not set. Falling back to local file storage.');
}

module.exports = supabase;
