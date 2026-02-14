import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase environment variables not set. Backend features will be unavailable.');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
);

/** Check if Supabase is properly configured */
export const isSupabaseConfigured = (): boolean => {
    return !!(supabaseUrl && supabaseKey);
};
