import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card, Screen, SectionTitle } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { usePlatformStats, usePortalAccess, type PlatformStats } from '@/lib/api/portal';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.superAdmin;

/** Separate console for the Super Admin: platform-wide numbers and controls. */
export default function SuperAdminConsole() {
  const { isSuperAdmin } = usePortalAccess();
  const stats = usePlatformStats(isSuperAdmin);

  return (
    <Screen title={t.title} backTo="/manage">
      {!isSuperAdmin ? (
        <ThemedText themeColor="textSecondary">{strings.errors.not_super_admin}</ThemedText>
      ) : (
        <>
          {stats.isPending ? <ActivityIndicator /> : null}
          {stats.error ? <ThemedText>{errorMessage(stats.error)}</ThemedText> : null}
          {stats.data ? (
            <View style={styles.grid}>
              {(Object.keys(t.stats) as (keyof PlatformStats)[]).map((key) => (
                <View key={key} style={styles.cell}>
                  <Card>
                    <ThemedText type="subtitle">{stats.data[key]}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t.stats[key]}
                    </ThemedText>
                  </Card>
                </View>
              ))}
            </View>
          ) : null}
          <SectionTitle>{strings.portal.title}</SectionTitle>
          <Button label={strings.portal.roles} onPress={() => router.push('/admin/roles')} />
          <Button label={strings.portal.queue} variant="secondary" onPress={() => router.push('/manage')} />
          <ThemedText type="small" themeColor="textSecondary">
            {t.domains}
          </ThemedText>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: { width: '50%', padding: 4 },
});
