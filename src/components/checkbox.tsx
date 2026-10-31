import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CheckboxProps = { label: string; checked: boolean; onChange: (checked: boolean) => void };

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={styles.row}>
      <View
        style={[
          styles.box,
          { borderColor: theme.text, backgroundColor: checked ? theme.text : 'transparent' },
        ]}>
        {checked ? <ThemedText style={{ color: theme.background }}>✓</ThemedText> : null}
      </View>
      <ThemedText type="small" style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: Spacing.one,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});
