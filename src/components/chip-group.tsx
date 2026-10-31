import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Option<T> = { value: T; label: string };

type ChipGroupProps<T> = {
  label: string;
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

/** Single-select list of pills. Works the same on web and native, no extra deps. */
export function ChipGroup<T extends string | number>({ label, options, value, onChange }: ChipGroupProps<T>) {
  const theme = useTheme();

  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? theme.text : theme.backgroundElement,
                  borderColor: selected ? theme.text : theme.backgroundSelected,
                },
              ]}>
              <ThemedText type="small" style={{ color: selected ? theme.background : theme.text }}>
                {selected ? `✓ ${option.label}` : option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    borderWidth: 1,
  },
});
