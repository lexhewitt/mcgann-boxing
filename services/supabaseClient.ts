import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getRuntimeEnvValue = (key: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { __ENV__?: Record<string, string> }).__ENV__?.[key];
};

const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || getRuntimeEnvValue('VITE_SUPABASE_URL');
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || getRuntimeEnvValue('VITE_SUPABASE_ANON_KEY');
  return { url, key };
};

// Initialize at module load (for build-time env vars)
const buildConfig = getSupabaseConfig();
let supabase: SupabaseClient | null = null;

if (buildConfig.url && buildConfig.key) {
  supabase = createClient(buildConfig.url, buildConfig.key, {
    auth: { persistSession: false },
  });
}

// Function to get or reinitialize Supabase client (for runtime env vars)
export const getSupabase = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  
  if (!config.url || !config.key) {
    console.warn('Supabase not configured. URL:', config.url ? 'Set' : 'Missing', 'Key:', config.key ? 'Set' : 'Missing');
    return null;
  }
  
  // If client exists and config matches, return it
  if (supabase && config.url === buildConfig.url && config.key === buildConfig.key) {
    return supabase;
  }
  
  // Reinitialize if runtime config is different
  if (config.url !== buildConfig.url || config.key !== buildConfig.key) {
    console.log('Reinitializing Supabase client with runtime config');
    supabase = createClient(config.url, config.key, {
        auth: { persistSession: false },
    });
  }
  
  return supabase;
};

// Export the client (for backward compatibility)
export { supabase };

export const ensureSupabase = () => {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  return client;
};
