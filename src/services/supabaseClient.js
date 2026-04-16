import { createClient } from '@supabase/supabase-js';

// These environment variables will be provided by your Supabase project
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail-safe initialization to avoid crashing the whole app if env vars are missing
let supabase;

if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_PROJECT_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn('Supabase URL or Key is missing or using placeholders. Supabase features will be disabled.');
    // Create a proxy that logs errors instead of crashing if any method is called
    supabase = new Proxy({}, {
        get: () => () => {
            console.error('Supabase client is not initialized. Check your environment variables.');
            return { data: null, error: { message: 'Supabase not initialized' } };
        }
    });
}

export { supabase };
