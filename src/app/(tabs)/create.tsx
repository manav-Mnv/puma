import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCanCreateEvents, useCreateEvent } from '@/lib/api/events';
import { istToIso } from '@/lib/datetime';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.create;

export default function CreateScreen() {
  const canCreate = useCanCreateEvents();
  const create = useCreateEvent();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const startsAt = istToIso(date, startTime);
  const endsAt = istToIso(date, endTime);
  const timesValid = !!startsAt && !!endsAt && endsAt > startsAt;
  const timesTouched = !!date && !!startTime && !!endTime;
  const valid = title.trim().length >= 3 && venue.trim().length >= 2 && timesValid;

  function submit() {
    create.mutate(
      { title, description, venue, starts_at: startsAt!, ends_at: endsAt! },
      { onSuccess: (event) => router.push({ pathname: '/event/[id]', params: { id: event.id } }) }
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {t.title}
              </ThemedText>

              {!canCreate ? (
                <ThemedText themeColor="textSecondary">{t.notAllowed}</ThemedText>
              ) : (
                <>
                  <TextField label={t.eventTitle} value={title} onChangeText={setTitle} maxLength={120} />
                  <TextField
                    label={t.description}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    style={styles.multiline}
                    maxLength={5000}
                  />
                  <TextField label={t.venue} value={venue} onChangeText={setVenue} maxLength={200} />
                  <TextField
                    label={t.date}
                    placeholder="2026-11-05"
                    value={date}
                    onChangeText={setDate}
                    inputMode="numeric"
                  />
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <TextField
                        label={t.startTime}
                        placeholder="17:00"
                        value={startTime}
                        onChangeText={setStartTime}
                      />
                    </View>
                    <View style={styles.flex}>
                      <TextField label={t.endTime} placeholder="19:00" value={endTime} onChangeText={setEndTime} />
                    </View>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t.timezoneNote}
                  </ThemedText>
                  {timesTouched && !timesValid ? <ThemedText style={styles.error}>{t.invalidTime}</ThemedText> : null}
                  {create.error ? (
                    <ThemedText accessibilityRole="alert" style={styles.error}>
                      {errorMessage(create.error)}
                    </ThemedText>
                  ) : null}
                  <Button label={t.submit} disabled={!valid} loading={create.isPending} onPress={submit} />
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth / 1.5,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  multiline: {
    minHeight: 96,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  error: {
    color: '#C62828',
  },
});
