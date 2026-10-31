import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { VerifiedBadge } from './verified-badge';

import { Spacing } from '@/constants/theme';
import type { FeedEvent } from '@/lib/api/events';
import { formatEventDate, formatEventTimeRange } from '@/lib/datetime';
import { strings } from '@/lib/strings';

export function EventCard({ event }: { event: FeedEvent }) {
  if (!event.id || !event.starts_at || !event.ends_at) return null;

  return (
    <Link href={{ pathname: '/event/[id]', params: { id: event.id } }} asChild>
      <Pressable accessibilityRole="link" style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.row}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {formatEventDate(event.starts_at)} · {formatEventTimeRange(event.starts_at, event.ends_at)}
            </ThemedText>
            {event.is_verified ? <VerifiedBadge /> : null}
          </View>
          <ThemedText type="default" style={styles.title}>
            {event.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {event.venue}
            {event.organizer_name ? ` · ${strings.events.by(event.organizer_name)}` : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {strings.events.going(event.registered_count ?? 0)}
          </ThemedText>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    fontWeight: 700,
    fontSize: 18,
  },
  pressed: {
    opacity: 0.7,
  },
});
