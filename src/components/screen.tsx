import { router, type Href } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { strings } from '@/lib/strings';

/** Standard stack screen: back button, title, scrollable centred column. */
export function Screen({ title, backTo = '/profile', children }: PropsWithChildren<{ title: string; backTo?: Href }>) {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Button
              label={`← ${strings.events.back}`}
              variant="secondary"
              style={styles.back}
              onPress={() => (router.canGoBack() ? router.back() : router.replace(backTo))}
            />
            <ThemedText type="subtitle" accessibilityRole="header">
              {title}
            </ThemedText>
            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

export function Card({ children }: PropsWithChildren) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {children}
    </ThemedView>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" accessibilityRole="header" style={styles.section}>
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.four },
  content: { width: '100%', maxWidth: MaxContentWidth / 1.5, alignSelf: 'center', gap: Spacing.three },
  back: { alignSelf: 'flex-start' },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  section: { marginTop: Spacing.two, textTransform: 'uppercase', letterSpacing: 1 },
});
