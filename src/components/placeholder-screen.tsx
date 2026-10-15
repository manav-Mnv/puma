import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { strings } from '@/lib/strings';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.container}>
        <ThemedText type="subtitle" accessibilityRole="header">
          {title}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{strings.placeholder.comingSoon}</ThemedText>
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
    gap: Spacing.two,
    padding: Spacing.four,
  },
});
