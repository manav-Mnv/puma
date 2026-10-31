import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useEvent } from '@/lib/api/events';
import { useCheckedInCount, useCheckIn, type ScanResult } from '@/lib/api/tickets';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.scan;
const TICKET_PREFIX = 'edge:ticket:';

type Outcome = { kind: 'result'; result: ScanResult } | { kind: 'error'; message: string };

export default function ScanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEvent(id);
  const count = useCheckedInCount(id);
  const checkIn = useCheckIn(id);
  const [permission, requestPermission] = useCameraPermissions();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [manualCode, setManualCode] = useState('');
  // Camera fires many events per second for the same code; only handle one at a time.
  const busy = useRef(false);

  function submit(code: string) {
    if (busy.current) return;
    busy.current = true;
    checkIn.mutate(code, {
      onSuccess: (result) => setOutcome({ kind: 'result', result }),
      onError: (error) => setOutcome({ kind: 'error', message: errorMessage(error) }),
    });
  }

  function onScanned({ data }: BarcodeScanningResult) {
    if (busy.current || outcome) return;
    if (!data.toLowerCase().startsWith(TICKET_PREFIX)) {
      busy.current = true;
      setOutcome({ kind: 'error', message: t.notTicket });
      return;
    }
    submit(data);
  }

  function next() {
    setOutcome(null);
    setManualCode('');
    busy.current = false;
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Button
              label={`← ${strings.events.back}`}
              variant="secondary"
              style={styles.back}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
            <ThemedText type="subtitle" accessibilityRole="header">
              {t.title}
            </ThemedText>
            <ThemedText themeColor="textSecondary">{event.data?.title}</ThemedText>
            <ThemedText type="smallBold" accessibilityLiveRegion="polite">
              {count.error ? errorMessage(count.error) : t.checkedInCount(count.data ?? 0)}
            </ThemedText>

            {outcome ? (
              <OutcomeCard outcome={outcome} onNext={next} />
            ) : permission?.granted ? (
              <View style={styles.cameraFrame}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={onScanned}
                />
              </View>
            ) : (
              <View style={styles.permission}>
                <ThemedText>{t.permissionNeeded}</ThemedText>
                <Button label={t.grantPermission} onPress={requestPermission} />
              </View>
            )}

            {!outcome ? (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  {permission?.granted ? t.pointCamera : ''}
                </ThemedText>
                <TextField
                  label={t.manualLabel}
                  value={manualCode}
                  onChangeText={setManualCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={() => manualCode.trim() && submit(manualCode.trim())}
                />
                <Button
                  label={t.manualSubmit}
                  variant="secondary"
                  disabled={!manualCode.trim()}
                  loading={checkIn.isPending}
                  onPress={() => submit(manualCode.trim())}
                />
              </>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function OutcomeCard({ outcome, onNext }: { outcome: Outcome; onNext: () => void }) {
  const ok = outcome.kind === 'result' && outcome.result.status === 'ok';
  const title =
    outcome.kind === 'error' ? `✕ ${outcome.message}` : ok ? `✓ ${t.ok}` : `⚠ ${t.already}`;
  const background = ok ? '#E3F1E7' : outcome.kind === 'error' ? '#FDECEA' : '#FFF4E5';

  return (
    <View style={[styles.outcome, { backgroundColor: background }]} accessibilityRole="alert">
      <ThemedText type="subtitle" style={styles.outcomeText}>
        {title}
      </ThemedText>
      {outcome.kind === 'result' ? (
        <>
          <ThemedText type="default" style={styles.outcomeText}>
            {outcome.result.full_name}
          </ThemedText>
          <ThemedText type="small" style={styles.outcomeText}>
            {outcome.result.student_id}
            {outcome.result.verification_status === 'unverified' ? ` · ${t.unverifiedTag}` : ''}
          </ThemedText>
        </>
      ) : null}
      <Button label={t.next} onPress={onNext} />
    </View>
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
  cameraFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  permission: {
    gap: Spacing.two,
  },
  outcome: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  outcomeText: {
    color: '#111111',
  },
});
