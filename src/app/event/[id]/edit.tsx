import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useEvent, useUpdateEvent, type FeedEvent } from '@/lib/api/events';
import { istToIso } from '@/lib/datetime';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.create;

/** "2026-11-05T11:30:00Z" → { date: "2026-11-05", time: "17:00" } in IST. */
function toIstParts(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function EditForm({ event }: { event: FeedEvent }) {
  const update = useUpdateEvent(event.id!);
  const start = toIstParts(event.starts_at!);
  const end = toIstParts(event.ends_at!);
  const [title, setTitle] = useState(event.title ?? '');
  const [description, setDescription] = useState(event.description ?? '');
  const [venue, setVenue] = useState(event.venue ?? '');
  const [date, setDate] = useState(start.date);
  const [startTime, setStartTime] = useState(start.time);
  const [endTime, setEndTime] = useState(end.time);

  const startsAt = istToIso(date, startTime);
  const endsAt = istToIso(date, endTime);
  const valid = title.trim().length >= 3 && venue.trim().length >= 2 && !!startsAt && !!endsAt && endsAt > startsAt;

  return (
    <>
      <TextField label={t.eventTitle} value={title} onChangeText={setTitle} maxLength={120} />
      <TextField label={t.description} value={description} onChangeText={setDescription} multiline maxLength={5000} />
      <TextField label={t.venue} value={venue} onChangeText={setVenue} maxLength={200} />
      <TextField label={t.date} value={date} onChangeText={setDate} inputMode="numeric" />
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField label={t.startTime} value={startTime} onChangeText={setStartTime} />
        </View>
        <View style={styles.flex}>
          <TextField label={t.endTime} value={endTime} onChangeText={setEndTime} />
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {t.timezoneNote}
      </ThemedText>
      {update.isSuccess ? <ThemedText accessibilityRole="alert">{strings.organizer.saved}</ThemedText> : null}
      {update.error ? <ThemedText accessibilityRole="alert">{errorMessage(update.error)}</ThemedText> : null}
      <Button
        label={strings.organizer.save}
        disabled={!valid}
        loading={update.isPending}
        onPress={() =>
          update.mutate(
            { title, description, venue, starts_at: startsAt!, ends_at: endsAt! },
            { onSuccess: () => router.back() }
          )
        }
      />
    </>
  );
}

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEvent(id);

  return (
    <Screen title={strings.organizer.edit} backTo="/manage">
      {event.isPending ? <ActivityIndicator /> : null}
      {event.data?.starts_at ? <EditForm event={event.data} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
});
