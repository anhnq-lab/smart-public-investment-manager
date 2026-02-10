import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not set. BIM Storage features will be unavailable.');
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseKey || ''
);
