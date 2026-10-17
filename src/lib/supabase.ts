import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import type { Database } from '@/lib/api/database.types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.'
  );
}

// Static web rendering runs in Node, where there is no window or storage.
const isServer = typeof window === 'undefined';

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    storage: isServer ? undefined : AsyncStorage,
    persistSession: !isServer,
    autoRefreshToken: !isServer,
    detectSessionInUrl: Platform.OS === 'web' && !isServer,
    flowType: 'pkce',
  },
});
