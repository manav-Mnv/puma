import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { WEB_URL } from '@/constants/links';
import { useEvent } from '@/lib/api/events';
import { useCheckedInCount, useCheckinCode } from '@/lib/api/tickets';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.display;

/** Mode B: put this on the projector; students scan it with their own phones. */
export default function CheckinDisplay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEvent(id);
  const { query: code, rotate } = useCheckinCode(id);
  const count = useCheckedInCount(id);
  const url = code.data ? `${WEB_URL}/checkin/${id}?c=${code.data}` : null;

  return (
    <Screen title={t.title} backTo="/manage">
      <ThemedText type="default">{event.data?.title}</ThemedText>
      {code.isPending ? <ActivityIndicator /> : null}
      {code.error ? <ThemedText>{errorMessage(code.error)}</ThemedText> : null}
      {url ? (
        <View style={styles.qr} accessible accessibilityLabel={t.title}>
          <QRCode value={url} size={280} backgroundColor="#FFFFFF" color="#000000" />
        </View>
      ) : null}
      <ThemedText type="subtitle" accessibilityLiveRegion="polite">
        {strings.scan.checkedInCount(count.data ?? 0)}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{t.hint}</ThemedText>
      <Button label={t.rotate} variant="secondary" loading={rotate.isPending} onPress={() => rotate.mutate()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  qr: { alignSelf: 'center', padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12 },
});
