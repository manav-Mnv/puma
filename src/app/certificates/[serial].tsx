import { router, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CertificateView } from '@/components/certificate-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useMyCertificate } from '@/lib/api/certificates';
import { downloadCertificate } from '@/lib/download-certificate';
import { errorMessage, strings } from '@/lib/strings';

export default function CertificateScreen() {
  const { serial } = useLocalSearchParams<{ serial: string }>();
  const certificate = useMyCertificate(serial);
  const download = useMutation({ mutationFn: downloadCertificate });

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.content}>
            <Button
              label={`← ${strings.events.back}`}
              variant="secondary"
              style={styles.back}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/certificates'))}
            />
            {certificate.isPending ? <ActivityIndicator /> : null}
            {!certificate.isPending && !certificate.data ? (
              <ThemedText themeColor="textSecondary">
                {certificate.error ? errorMessage(certificate.error) : strings.certificate.notFound}
              </ThemedText>
            ) : null}
            {certificate.data ? (
              <>
                <CertificateView certificate={certificate.data} />
                <Button
                  label={strings.certificate.download}
                  loading={download.isPending}
                  onPress={() => download.mutate(certificate.data!)}
                />
                {download.error ? (
                  <ThemedText accessibilityRole="alert">{errorMessage(download.error)}</ThemedText>
                ) : null}
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
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  back: {
    alignSelf: 'flex-start',
  },
});
