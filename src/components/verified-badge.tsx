import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { strings } from '@/lib/strings';

// Shape + text, never colour alone (NFR-3).
export function VerifiedBadge() {
  return (
    <View
      style={styles.badge}
      accessible
      accessibilityLabel={`${strings.events.verified}. ${strings.events.verifiedHint}`}>
      <ThemedText type="smallBold" style={styles.text}>
        ✓ {strings.events.verified}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#E3F1E7',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  text: {
    color: '#1B5E20',
  },
});
