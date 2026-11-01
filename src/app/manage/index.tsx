import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card, Screen, SectionTitle } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { formatEventDate } from '@/lib/datetime';
import {
  useDecide,
  useMyEvents,
  usePortalAccess,
  useReviewQueue,
  type QueueItem,
} from '@/lib/api/portal';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.portal;

function QueueCard({ item }: { item: QueueItem }) {
  const decide = useDecide();
  const [remarks, setRemarks] = useState('');

  return (
    <Card>
      <ThemedText type="small" themeColor="textSecondary">
        {item.kind === 'club' ? t.kindClub : t.kindEvent}
        {item.requester_name ? ` · ${t.from(item.requester_name)}` : ''}
        {item.overdue ? ` · ⚠ ${t.overdue}` : ''}
      </ThemedText>
      <ThemedText type="smallBold">{item.title}</ThemedText>
      {item.detail ? <ThemedText type="small">{item.detail}</ThemedText> : null}
      <TextField label={t.remarks} value={remarks} onChangeText={setRemarks} />
      {decide.error ? <ThemedText style={styles.error}>{errorMessage(decide.error)}</ThemedText> : null}
      <View style={styles.row}>
        <Button
          label={t.approve}
          style={styles.flex}
          loading={decide.isPending && decide.variables?.approve}
          onPress={() => decide.mutate({ kind: item.kind, id: item.id, approve: true, remarks })}
        />
        <Button
          label={t.reject}
          variant="secondary"
          style={styles.flex}
          disabled={!remarks.trim()}
          loading={decide.isPending && decide.variables?.approve === false}
          onPress={() => decide.mutate({ kind: item.kind, id: item.id, approve: false, remarks })}
        />
      </View>
    </Card>
  );
}

/** One portal for every non-student role; each section appears only for roles that use it. */
export default function ManagePortal() {
  const access = usePortalAccess();
  const myEvents = useMyEvents();
  const queue = useReviewQueue(access.isReviewer);

  if (!access.isStaff) {
    return (
      <Screen title={t.title}>
        <ThemedText themeColor="textSecondary">{strings.errors.not_reviewer}</ThemedText>
      </Screen>
    );
  }

  return (
    <Screen title={t.title}>
      <ThemedText themeColor="textSecondary">
        {t.subtitle(strings.admin.roles[access.role as keyof typeof strings.admin.roles] ?? '')}
      </ThemedText>

      <View style={styles.actions}>
        <Button label={t.createEvent} onPress={() => router.push('/create')} />
        {access.isClubLead || access.isReviewer ? (
          <Button label={strings.clubs.open} variant="secondary" onPress={() => router.push('/clubs')} />
        ) : null}
        {access.isAdmin ? <Button label={t.roles} variant="secondary" onPress={() => router.push('/admin/roles')} /> : null}
        {access.isSuperAdmin ? (
          <Button label={t.superConsole} variant="secondary" onPress={() => router.push('/super')} />
        ) : null}
      </View>

      {access.isReviewer ? (
        <>
          <SectionTitle>{t.queue}</SectionTitle>
          {queue.isPending ? <ActivityIndicator /> : null}
          {queue.error ? <ThemedText style={styles.error}>{errorMessage(queue.error)}</ThemedText> : null}
          {queue.data && !queue.data.length ? <ThemedText themeColor="textSecondary">{t.queueEmpty}</ThemedText> : null}
          {queue.data?.map((item) => <QueueCard key={`${item.kind}-${item.id}`} item={item} />)}
        </>
      ) : null}

      <SectionTitle>{t.myEvents}</SectionTitle>
      {myEvents.isPending ? <ActivityIndicator /> : null}
      {myEvents.data && !myEvents.data.length ? <ThemedText themeColor="textSecondary">{t.noEvents}</ThemedText> : null}
      {myEvents.data?.map((e) => (
        <Link key={e.id} href={{ pathname: '/event/[id]', params: { id: e.id! } }} asChild>
          <Pressable accessibilityRole="link">
            <Card>
              <ThemedText type="smallBold">{e.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {e.starts_at ? formatEventDate(e.starts_at) : ''} · {t.status[e.status ?? ''] ?? e.status}
              </ThemedText>
              {e.status === 'rejected' && e.remarks ? <ThemedText type="small">{e.remarks}</ThemedText> : null}
            </Card>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  actions: { gap: 8 },
  error: { color: '#C62828' },
});
