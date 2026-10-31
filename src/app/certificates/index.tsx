import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useMyCertificates } from '@/lib/api/certificates';
import { formatEventDate } from '@/lib/datetime';
import { errorMessage, strings } from '@/lib/strings';

export default function CertificatesScreen() {
  const certificates = useMyCertificates();

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.content}>
            <Button
              label={`← ${strings.events.back}`}
              variant="secondary"
              style={styles.back}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
            />
            <ThemedText type="subtitle" accessibilityRole="header">
              {strings.certificate.myCertificates}
            </ThemedText>
            {certificates.isPending ? <ActivityIndicator /> : null}
            {certificates.error ? <ThemedText>{errorMessage(certificates.error)}</ThemedText> : null}
            {certificates.data && !certificates.data.length ? (
              <ThemedText themeColor="textSecondary">{strings.certificate.none}</ThemedText>
            ) : null}
            {certificates.data?.map((c) => (
              <Link key={c.id} href={{ pathname: '/certificates/[serial]', params: { serial: c.serial } }} asChild>
                <Pressable accessibilityRole="link">
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <ThemedText type="smallBold">{c.snapshot.event_title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatEventDate(c.snapshot.event_starts_at)} · {c.serial}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              </Link>
            ))}
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
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
});
