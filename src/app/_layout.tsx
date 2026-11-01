import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { Observe, ObserveRoot, useObserve } from 'expo-observe';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { StatusScreen } from '@/components/status-screen';
import { useSignOut } from '@/lib/api/auth';
import { useMyProfile } from '@/lib/api/profile';
import { SessionProvider, useSession } from '@/lib/api/session';
import { usePendingLink } from '@/lib/pending-link';
import { usePushNotifications } from '@/lib/push';
import { errorMessage, strings } from '@/lib/strings';

SplashScreen.preventAutoHideAsync();

// EAS Observe: startup + per-route timings. Never export the secret projector
// check-in code (?c=) or certificate serials in route params.
Observe.configure({ integrations: { 'expo-router': { filteredParams: ['c', 'serial'] } } });

function RootNavigator() {
  const { session, isLoading } = useSession();
  const profile = useMyProfile();
  const signOut = useSignOut();
  const profileLoading = !!session && profile.isPending;
  const { markInteractive } = useObserve();
  const onboarded = !!profile.data?.onboarded_at;
  usePendingLink(!isLoading && !profileLoading && !!session && onboarded, !!session);
  usePushNotifications(!!session && onboarded);

  useEffect(() => {
    if (isLoading || profileLoading) return;
    SplashScreen.hideAsync();
    // Session + profile resolved: the first real screen (sign-in, onboarding or tabs) is usable.
    markInteractive();
  }, [isLoading, profileLoading, markInteractive]);

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
        <Stack.Screen name="manage/index" />
        <Stack.Screen name="super" />
        <Stack.Screen name="clubs" />
        <Stack.Screen name="inbox" />
        <Stack.Screen name="event/[id]/display" />
        <Stack.Screen name="checkin/[id]" />
        <Stack.Screen name="event/[id]/edit" />
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

function RootLayout() {
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

export default ObserveRoot.wrap(RootLayout);
