import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ChipGroup } from '@/components/chip-group';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAdminFindProfiles, useIsAdmin, useSetRole, type AdminProfile, type AppRole } from '@/lib/api/admin';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.admin;
// super_admin is never granted from the app (seeded by SQL only).
const ASSIGNABLE: AppRole[] = ['student', 'faculty', 'club_lead', 'ad', 'admin'];
const ROLE_OPTIONS = ASSIGNABLE.map((value) => ({ value, label: t.roles[value] }));

function PersonRow({ person }: { person: AdminProfile }) {
  const setRole = useSetRole();
  const name = person.full_name ?? person.parul_email ?? person.personal_email ?? '—';

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">{name}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {[person.parul_email ?? person.personal_email, person.student_id].filter(Boolean).join(' · ')}
        {person.verification_status === 'verified' ? ` · ✓ ${strings.profile.verified}` : ` · ${strings.profile.unverified}`}
      </ThemedText>
      {person.role === 'super_admin' ? (
        <ThemedText type="small">{t.roles.super_admin}</ThemedText>
      ) : (
        <ChipGroup
          label={t.roleLabel}
          options={ROLE_OPTIONS}
          value={setRole.variables?.role ?? person.role}
          onChange={(role) => setRole.mutate({ userId: person.id, role })}
        />
      )}
      {setRole.isPending ? <ActivityIndicator /> : null}
      {setRole.isSuccess ? (
        <ThemedText type="small" accessibilityRole="alert">
          {t.saved(name, t.roles[setRole.data.role])}
        </ThemedText>
      ) : null}
      {setRole.error ? (
        <ThemedText type="small" accessibilityRole="alert" style={styles.error}>
          {errorMessage(setRole.error)}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

export default function AdminRolesScreen() {
  const isAdmin = useIsAdmin();
  const [query, setQuery] = useState('');
  const results = useAdminFindProfiles(query);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Button
              label={`← ${strings.events.back}`}
              variant="secondary"
              style={styles.back}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
            />
            <ThemedText type="subtitle" accessibilityRole="header">
              {t.title}
            </ThemedText>
            {!isAdmin ? (
              <ThemedText themeColor="textSecondary">{strings.errors.not_allowed_to_set_role}</ThemedText>
            ) : (
              <>
                <TextField
                  label={t.searchLabel}
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {query.trim().length < 3 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {t.hint}
                  </ThemedText>
                ) : results.isPending ? (
                  <ActivityIndicator />
                ) : results.error ? (
                  <ThemedText style={styles.error}>{errorMessage(results.error)}</ThemedText>
                ) : results.data?.length ? (
                  results.data.map((person) => <PersonRow key={person.id} person={person} />)
                ) : (
                  <ThemedText themeColor="textSecondary">{t.noResults}</ThemedText>
                )}
              </>
            )}
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
    gap: Spacing.two,
  },
  error: {
    color: '#C62828',
  },
});
