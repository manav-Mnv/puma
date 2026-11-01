import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useSelfCheckIn } from '@/lib/api/tickets';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.selfCheckIn;

/** Opened by scanning the Mode B screen QR: checks the student in straight away. */
export default function SelfCheckIn() {
  const { id, c } = useLocalSearchParams<{ id: string; c?: string }>();
  const checkIn = useSelfCheckIn();
  const { mutate } = checkIn;

  useEffect(() => {
    if (id && c) mutate({ eventId: id, code: c });
  }, [id, c, mutate]);

  const result = checkIn.data;

  return (
    <Screen title={t.title} backTo="/tickets">
      {checkIn.isPending ? (
        <>
          <ActivityIndicator size="large" />
          <ThemedText themeColor="textSecondary">{t.working}</ThemedText>
        </>
      ) : null}
      {result ? (
        <ThemedText type="subtitle" accessibilityRole="alert">
          {result.status === 'ok' ? t.ok(result.event_title) : t.already(result.event_title)}
        </ThemedText>
      ) : null}
      {checkIn.error ? (
        <ThemedText accessibilityRole="alert" style={{ color: '#C62828' }}>
          {errorMessage(checkIn.error)}
        </ThemedText>
      ) : null}
      {!c ? <ThemedText>{strings.errors.invalid_checkin_code}</ThemedText> : null}
      <Button label={t.toTickets} variant="secondary" onPress={() => router.replace('/tickets')} />
    </Screen>
  );
}
