import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VerifiedBadge } from '@/components/verified-badge';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCancelRegistration, useEvent, useMyRegistration, useRegister } from '@/lib/api/events';
import { useCompleteEvent } from '@/lib/api/certificates';
import { useIsEventOrganizer } from '@/lib/api/tickets';
import { formatEventDate, formatEventTimeRange } from '@/lib/datetime';
import { errorMessage, strings } from '@/lib/strings';

function OrganizerPanel({ eventId, startsAt, completed }: { eventId: string; startsAt: string; completed: boolean }) {
  const complete = useCompleteEvent(eventId);
  const [confirming, setConfirming] = useState(false);
  // Read once on mount (render must stay pure); the DB re-checks the start time anyway.
  const [started] = useState(() => new Date(startsAt).getTime() <= Date.now());

  return (
    <View style={styles.panel}>
      <Button
        label={strings.scan.open}
        variant="secondary"
        onPress={() => router.push({ pathname: '/event/[id]/scan', params: { id: eventId } })}
      />
      {/* Re-running complete issues certificates for late (post-complete) check-ins. */}
      {started ? (
        confirming ? (
          <>
            <ThemedText type="small">{strings.complete.confirm}</ThemedText>
            <Button
              label={strings.complete.confirmButton}
              loading={complete.isPending}
              onPress={() => complete.mutate(undefined, { onSettled: () => setConfirming(false) })}
            />
          </>
        ) : (
          <Button label={strings.complete.button} variant={completed ? 'secondary' : 'primary'} onPress={() => setConfirming(true)} />
        )
      ) : null}
      {complete.data ? (
        <ThemedText type="small" accessibilityRole="alert">
          {strings.complete.done(complete.data.issued, complete.data.total)}
        </ThemedText>
      ) : null}
      {complete.error ? (
        <ThemedText type="small" accessibilityRole="alert" style={styles.error}>
          {errorMessage(complete.error)}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEvent(id);
  const registration = useMyRegistration(id);
  const register = useRegister();
  const cancel = useCancelRegistration();
  const isOrganizer = useIsEventOrganizer(id).data === true;

  const isRegistered = registration.data?.status === 'registered';
  const data = event.data;
  const mutationError = register.error ?? cancel.error;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.content}>
            <Button
              label={`← ${strings.events.back}`}
              variant="secondary"
              style={styles.back}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />

            {event.isPending ? <ActivityIndicator /> : null}
            {!event.isPending && !data ? (
              <ThemedText themeColor="textSecondary">
                {event.error ? errorMessage(event.error) : strings.events.notFound}
              </ThemedText>
            ) : null}

            {data?.starts_at && data.ends_at ? (
              <>
                {data.is_verified ? <VerifiedBadge /> : null}
                <ThemedText type="subtitle" accessibilityRole="header">
                  {data.title}
                </ThemedText>
                <ThemedText type="smallBold">
                  {formatEventDate(data.starts_at)} · {formatEventTimeRange(data.starts_at, data.ends_at)} IST
                </ThemedText>
                <ThemedText themeColor="textSecondary">{data.venue}</ThemedText>
                {data.organizer_name ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {strings.events.by(data.organizer_name)}
                  </ThemedText>
                ) : null}
                <ThemedText type="small" themeColor="textSecondary">
                  {strings.events.going(data.registered_count ?? 0)}
                </ThemedText>
                {data.description ? <ThemedText>{data.description}</ThemedText> : null}

                {isOrganizer ? (
                  <OrganizerPanel
                    eventId={data.id!}
                    startsAt={data.starts_at}
                    completed={data.status === 'completed'}
                  />
                ) : null}
                {data.status === 'completed' ? (
                  <ThemedText type="smallBold">{strings.complete.completed}</ThemedText>
                ) : null}

                {mutationError ? (
                  <ThemedText accessibilityRole="alert" style={styles.error}>
                    {errorMessage(mutationError)}
                  </ThemedText>
                ) : null}

                {isRegistered ? (
                  <>
                    <ThemedText type="smallBold" accessibilityRole="alert">
                      {strings.events.registered}
                    </ThemedText>
                    <Button
                      label={strings.events.cancel}
                      variant="secondary"
                      loading={cancel.isPending}
                      onPress={() => cancel.mutate(data.id!)}
                    />
                  </>
                ) : data.status === 'completed' ? null : (
                  <Button
                    label={register.isPending ? strings.events.registering : strings.events.register}
                    loading={register.isPending}
                    disabled={registration.isPending}
                    onPress={() => register.mutate(data.id!)}
                  />
                )}
              </>
            ) : null}
          </View>
        </ScrollView>
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
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth / 1.5,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  back: {
    alignSelf: 'flex-start',
  },
  panel: {
    gap: Spacing.two,
  },
  error: {
    color: '#C62828',
  },
});
