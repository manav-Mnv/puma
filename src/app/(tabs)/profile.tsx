import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSignOut } from '@/lib/api/auth';
import { useLinkParulEmail, usePortalAccess } from '@/lib/api/portal';
import { useMyProfile } from '@/lib/api/profile';
import { errorMessage, strings } from '@/lib/strings';

/** T17: unverified (temporary-ID) students link their Parul mailbox here. */
function LinkParulEmail() {
  const link = useLinkParulEmail();
  const [email, setEmail] = useState('');
  const t = strings.link;

  return (
    <Card>
      <ThemedText type="smallBold">{t.title}</ThemedText>
      <ThemedText type="small">{t.body}</ThemedText>
      <TextField
        label={t.email}
        placeholder="2503031461401@paruluniversity.ac.in"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        inputMode="email"
      />
      {link.isSuccess ? <ThemedText accessibilityRole="alert">{t.sent}</ThemedText> : null}
      {link.error ? <ThemedText accessibilityRole="alert">{errorMessage(link.error)}</ThemedText> : null}
      <Button label={t.submit} disabled={!email.trim()} loading={link.isPending} onPress={() => link.mutate(email)} />
    </Card>
  );
}

export default function ProfileScreen() {
  const profile = useMyProfile();
  const signOut = useSignOut();
  const access = usePortalAccess();
  const data = profile.data;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.content}>
            <ThemedText type="subtitle" accessibilityRole="header">
              {data?.full_name ?? strings.tabs.profile}
            </ThemedText>
            {data ? (
              <>
                <ThemedText themeColor="textSecondary">
                  {[data.parul_email ?? data.personal_email, data.student_id].filter(Boolean).join(' · ')}
                </ThemedText>
                <ThemedText type="smallBold">
                  {data.verification_status === 'verified'
                    ? `✓ ${strings.profile.verified}`
                    : `• ${strings.profile.unverified}`}
                </ThemedText>
              </>
            ) : null}
            {profile.error ? <ThemedText>{errorMessage(profile.error)}</ThemedText> : null}

            {access.isStaff ? <Button label={strings.portal.open} onPress={() => router.push('/manage')} /> : null}
            <Button label={strings.certificate.myCertificates} variant="secondary" onPress={() => router.push('/certificates')} />
            <Button label={strings.clubs.open} variant="secondary" onPress={() => router.push('/clubs')} />
            {data?.verification_status === 'unverified' ? <LinkParulEmail /> : null}
            <Button
              label={strings.profile.signOut}
              variant="secondary"
              loading={signOut.isPending}
              onPress={() => signOut.mutate()}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four, paddingTop: Spacing.six, paddingBottom: BottomTabInset + Spacing.four },
  content: { width: '100%', maxWidth: MaxContentWidth / 1.5, alignSelf: 'center', gap: Spacing.three },
});
