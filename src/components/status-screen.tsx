import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from './button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

type StatusScreenProps = {
  message: string;
  /** Shows the message as an error with actions instead of a spinner. */
  actions?: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' }[];
};

/** Full-screen loading / error state, so the app never shows a blank page. */
export function StatusScreen({ message, actions }: StatusScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content} accessibilityLiveRegion="polite">
        {actions ? null : <ActivityIndicator size="large" />}
        <ThemedText themeColor={actions ? 'text' : 'textSecondary'} style={styles.center} accessibilityRole={actions ? 'alert' : undefined}>
          {message}
        </ThemedText>
        {actions?.map((a) => (
          <Button key={a.label} label={a.label} variant={a.variant} onPress={a.onPress} />
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  center: {
    textAlign: 'center',
  },
});
