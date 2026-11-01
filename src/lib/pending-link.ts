import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useGlobalSearchParams, usePathname, type Href } from 'expo-router';
import { useEffect } from 'react';

const KEY = 'edge.pendingLink';

/**
 * A signed-out student who scans the projector QR (/checkin/<id>?c=…) is sent to
 * sign-in. Remember the link and reopen it once they are signed in and onboarded,
 * so the check-in isn't lost.
 */
export function usePendingLink(ready: boolean, signedIn: boolean) {
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ c?: string }>();

  useEffect(() => {
    if (!signedIn && pathname.startsWith('/checkin/') && params.c) {
      AsyncStorage.setItem(KEY, `${pathname}?c=${encodeURIComponent(params.c)}`).catch(() => {});
    }
  }, [signedIn, pathname, params.c]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.getItem(KEY)
      .then((link) => {
        if (!link) return;
        AsyncStorage.removeItem(KEY).catch(() => {});
        router.replace(link as Href);
      })
      .catch(() => {});
  }, [ready]);
}
