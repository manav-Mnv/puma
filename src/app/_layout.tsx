import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { StatusScreen } from '@/components/status-screen';
import { useSignOut } from '@/lib/api/auth';
import { useMyProfile } from '@/lib/api/profile';
import { SessionProvider, useSession } from '@/lib/api/session';
import { errorMessage, strings } from '@/lib/strings';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, isLoading } = useSession();
  const profile = useMyProfile();
  const signOut = useSignOut();
  const profileLoading = !!session && profile.isPending;
  const onboarded = !!profile.data?.onboarded_at;

  useEffect(() => {
    if (!isLoading && !profileLoading) SplashScreen.hideAsync();
  }, [isLoading, profileLoading]);

  if (isLoading || profileLoading) return <StatusScreen message={strings.signIn.loading} />;
  if (session && profile.error) {
    return (
      <StatusScreen
        message={errorMessage(profile.error)}
        actions={[
          { label: strings.common.retry, onPress: () => profile.refetch() },
          { label: strings.profile.signOut, variant: 'secondary', onPress: () => signOut.mutate() },
        ]}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session && onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[id]/index" />
        <Stack.Screen name="event/[id]/scan" />
        <Stack.Screen name="admin/roles" />
        <Stack.Screen name="certificates/index" />
        <Stack.Screen name="certificates/[serial]" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      {/* Public: anyone can verify a certificate from its QR, signed in or not. */}
      <Stack.Screen name="verify/[serial]" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootNavigator />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
