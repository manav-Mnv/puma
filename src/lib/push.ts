import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function registerDevice() {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'EDGE',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await supabase.rpc('register_push_token', { p_token: token });
}

/** Registers this phone for push once the user is signed in, and opens links from tapped notifications. */
export function usePushNotifications(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    registerDevice().catch(() => {
      // Push is best-effort; the in-app inbox always has the notification.
    });
  }, [enabled]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const link = response.notification.request.content.data?.link;
      if (typeof link === 'string' && link.startsWith('/')) router.push(link as Href);
    });
    return () => subscription.remove();
  }, []);
}
