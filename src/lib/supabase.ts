import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Auto-detect offline mode: fallback to Mock mode if keys are empty/default or if explicitly asked.
const FORCE_OFFLINE = import.meta.env.VITE_OFFLINE_MODE === 'true';

const isDummy = FORCE_OFFLINE || 
                !supabaseUrl || 
                !supabaseAnonKey || 
                supabaseUrl === 'YOUR_SUPABASE_URL_HERE' || 
                supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY_HERE' ||
                !supabaseUrl.startsWith('http');

let client;

if (isDummy) {
  console.warn('Using offline mock Supabase client to prevent Failed to fetch errors.');
  
  client = {
    auth: {
      getUser: async () => ({ data: { user: { id: 'mock-id', email: 'user@example.com' } }, error: null }),
      onAuthStateChange: (cb: any) => { 
        cb('SIGNED_IN', { user: { id: 'mock-id', email: 'user@example.com' } }); 
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword: async () => ({ data: { user: { id: 'mock-id' } }, error: null }),
      signUp: async () => ({ data: { user: { id: 'mock-id' } }, error: null }),
      signInWithOtp: async () => ({ data: {}, error: null }),
      signInWithOAuth: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null }),
    }
  } as any;
} else {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;
