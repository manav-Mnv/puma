import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EventCard } from '@/components/event-card';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useEvents } from '@/lib/api/events';
import { errorMessage, strings } from '@/lib/strings';

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const events = useEvents(search);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FlatList
          data={events.data ?? []}
          keyExtractor={(e) => e.id ?? ''}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={events.isRefetching}
          onRefresh={() => events.refetch()}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {strings.tabs.explore}
              </ThemedText>
              <TextField
                label={strings.events.searchPlaceholder}
                placeholder={strings.events.searchPlaceholder}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>
          }
          ListEmptyComponent={
            events.isPending ? (
              <ActivityIndicator style={styles.empty} />
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                {events.error
                  ? errorMessage(events.error)
                  : search
                    ? strings.events.emptySearch
                    : strings.events.empty}
              </ThemedText>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  separator: {
    height: Spacing.three,
  },
  empty: {
    marginTop: Spacing.five,
    textAlign: 'center',
  },
});
