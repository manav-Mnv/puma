import { useMutation } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type Credentials = { email: string; password: string };

async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return;
  }

  const redirectTo = Linking.createURL('/');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return;

  const code = new URL(result.url).searchParams.get('code');
  if (!code) throw new Error('not_authenticated');
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

async function signInWithEmail({ email, password }: Credentials) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

/** Resolves to true when the user must confirm their email before signing in. */
async function signUpWithEmail({ email, password }: Credentials) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: Platform.OS === 'web' ? window.location.origin : Linking.createURL('/') },
  });
  if (error) throw error;
  return data.session === null;
}

export function useGoogleSignIn() {
  return useMutation({ mutationFn: signInWithGoogle });
}

export function useEmailSignIn() {
  return useMutation({ mutationFn: signInWithEmail });
}

export function useEmailSignUp() {
  return useMutation({ mutationFn: signUpWithEmail });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  });
}
