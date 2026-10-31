import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSignOut } from '@/lib/api/auth';
import { useMyProfile } from '@/lib/api/profile';
import { errorMessage, strings } from '@/lib/strings';

export default function ProfileScreen() {
  const profile = useMyProfile();
  const signOut = useSignOut();
  const data = profile.data;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.container}>
        <ThemedText type="subtitle" accessibilityRole="header">
          {data?.full_name ?? strings.tabs.profile}
        </ThemedText>
        {data ? (
          <>
            <ThemedText themeColor="textSecondary">{data.parul_email ?? data.personal_email}</ThemedText>
            <ThemedText type="smallBold">
              {data.verification_status === 'verified'
                ? `✓ ${strings.profile.verified}`
                : `• ${strings.profile.unverified}`}
            </ThemedText>
          </>
        ) : null}
        {profile.error ? <ThemedText>{errorMessage(profile.error)}</ThemedText> : null}
        <Button
          label={strings.profile.signOut}
          variant="secondary"
          loading={signOut.isPending}
          onPress={() => signOut.mutate()}
        />
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
});
