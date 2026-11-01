import { router, type Href } from 'expo-router';
import { ActivityIndicator, Pressable } from 'react-native';

import { Button } from '@/components/button';
import { Card, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { formatEventDate } from '@/lib/datetime';
import { useMarkAllRead, useNotifications, useUnreadCount } from '@/lib/api/inbox';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.inbox;

export default function InboxScreen() {
  const notifications = useNotifications();
  const unread = useUnreadCount();
  const markRead = useMarkAllRead();

  return (
    <Screen title={t.title}>
      {unread ? <Button label={t.markRead} variant="secondary" loading={markRead.isPending} onPress={() => markRead.mutate()} /> : null}
      {notifications.isPending ? <ActivityIndicator /> : null}
      {notifications.error ? <ThemedText>{errorMessage(notifications.error)}</ThemedText> : null}
      {notifications.data && !notifications.data.length ? <ThemedText themeColor="textSecondary">{t.empty}</ThemedText> : null}
      {notifications.data?.map((n) => (
        <Pressable
          key={n.id}
          accessibilityRole={n.link ? 'link' : undefined}
          disabled={!n.link}
          onPress={() => n.link && router.push(n.link as Href)}>
          <Card>
            <ThemedText type="smallBold">
              {n.read_at ? '' : '● '}
              {n.critical ? `⚠ ${t.important} · ` : ''}
              {n.title}
            </ThemedText>
            {n.body ? <ThemedText type="small">{n.body}</ThemedText> : null}
            <ThemedText type="small" themeColor="textSecondary">
              {formatEventDate(n.created_at)}
            </ThemedText>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
