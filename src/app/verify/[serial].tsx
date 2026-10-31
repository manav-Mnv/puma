import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useVerifyCertificate } from '@/lib/api/certificates';
import { formatEventDate } from '@/lib/datetime';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.certificate;

/** Public page (no sign-in): opened by scanning the QR printed on a certificate. */
export default function VerifyScreen() {
  const { serial } = useLocalSearchParams<{ serial: string }>();
  const verification = useVerifyCertificate(serial);
  const data = verification.data;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            EDGE · {t.verifyTitle}
          </ThemedText>
          {verification.isPending ? <ActivityIndicator /> : null}
          {verification.error ? <ThemedText>{errorMessage(verification.error)}</ThemedText> : null}
          {data ? (
            <View
              accessibilityRole="alert"
              style={[styles.result, { backgroundColor: data.valid ? '#E3F1E7' : '#FDECEA' }]}>
              <ThemedText type="subtitle" style={styles.ink}>
                {data.valid ? t.valid : t.invalid}
              </ThemedText>
              {data.valid ? (
                <>
                  <ThemedText type="default" style={[styles.ink, styles.bold]}>
                    {data.student_name}
                  </ThemedText>
                  <ThemedText style={styles.ink}>
                    {t.forAttending} {data.event_title}
                  </ThemedText>
                  <ThemedText type="small" style={styles.ink}>
                    {formatEventDate(data.event_starts_at)} · {data.issuer}
                  </ThemedText>
                  <ThemedText type="small" style={styles.ink}>
                    {t.issuedOn(formatEventDate(data.issued_at))} · {data.serial}
                  </ThemedText>
                </>
              ) : (
                <ThemedText type="small" style={styles.ink}>
                  {serial}
                </ThemedText>
              )}
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth / 1.5,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  result: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  ink: {
    color: '#111111',
  },
  bold: {
    fontWeight: 700,
  },
});
