import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { verifyUrl } from '@/constants/links';
import type { Certificate } from '@/lib/api/certificates';
import { formatEventDate } from '@/lib/datetime';
import { strings } from '@/lib/strings';

const t = strings.certificate;

/** On-screen certificate. Always light, like paper, regardless of theme. */
export function CertificateView({ certificate }: { certificate: Certificate }) {
  const { snapshot, serial } = certificate;

  return (
    <View style={styles.paper} accessible accessibilityLabel={`${t.title}: ${snapshot.student_name}, ${snapshot.event_title}`}>
      <View style={styles.frame}>
        <ThemedText type="smallBold" style={[styles.ink, styles.brand]}>
          EDGE · PARUL UNIVERSITY
        </ThemedText>
        <ThemedText style={[styles.ink, styles.title]}>{t.title}</ThemedText>
        <ThemedText type="small" style={styles.ink}>
          {t.presentedTo}
        </ThemedText>
        <ThemedText style={[styles.ink, styles.name]}>
          {snapshot.student_name}
          {snapshot.student_id ? ` (${snapshot.student_id})` : ''}
        </ThemedText>
        <ThemedText type="small" style={styles.ink}>
          {t.forAttending}
        </ThemedText>
        <ThemedText style={[styles.ink, styles.event]}>{snapshot.event_title}</ThemedText>
        <ThemedText type="small" style={styles.muted}>
          {formatEventDate(snapshot.event_starts_at)} · {snapshot.venue}
        </ThemedText>
        <View style={styles.footer}>
          <View style={styles.sign}>
            <ThemedText type="small" style={styles.ink}>
              {snapshot.issuer}
            </ThemedText>
            <ThemedText type="small" style={styles.muted}>
              {t.organizer}
            </ThemedText>
          </View>
          <View style={styles.qr}>
            <QRCode value={verifyUrl(serial)} size={72} backgroundColor="#FFFFFF" color="#000000" />
            <ThemedText style={[styles.muted, styles.tiny]}>{serial}</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  frame: {
    borderWidth: 2,
    borderColor: '#111111',
    padding: Spacing.three,
    gap: Spacing.one,
  },
  ink: {
    color: '#111111',
  },
  muted: {
    color: '#555555',
  },
  brand: {
    letterSpacing: 3,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    marginVertical: Spacing.two,
  },
  name: {
    fontSize: 20,
    lineHeight: 28,
    fontStyle: 'italic',
    fontWeight: 700,
  },
  event: {
    fontSize: 17,
    fontWeight: 700,
  },
  footer: {
    marginTop: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sign: {
    borderTopWidth: 1,
    borderTopColor: '#111111',
    paddingTop: Spacing.one,
    minWidth: 120,
  },
  qr: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  tiny: {
    fontSize: 9,
    lineHeight: 12,
  },
});
