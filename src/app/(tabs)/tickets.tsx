import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatEntryCode, ticketQrValue, useMyTickets, type Ticket } from '@/lib/api/tickets';
import { formatEventDate, formatEventTimeRange } from '@/lib/datetime';
import { errorMessage, strings } from '@/lib/strings';

function TicketCard({ ticket }: { ticket: Ticket }) {
  const { event } = ticket;
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="default" style={styles.title}>
        {event.title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {formatEventDate(event.starts_at!)} · {formatEventTimeRange(event.starts_at!, event.ends_at!)} ·{' '}
        {event.venue}
      </ThemedText>
      {ticket.checkedInAt ? (
        <ThemedText type="smallBold" accessibilityRole="text">
          {strings.tickets.checkedIn}
        </ThemedText>
      ) : null}
      {/* White quiet zone so scanners read it in dark mode too. */}
      <View style={styles.qr} accessible accessibilityLabel={strings.tickets.qrLabel(event.title ?? '')}>
        <QRCode value={ticketQrValue(ticket.ticketCode)} size={200} backgroundColor="#FFFFFF" color="#000000" />
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {strings.tickets.showAtEntry}
      </ThemedText>
      {/* Fallback when the organizer's camera can't scan: they type this code. */}
      <ThemedText type="small" themeColor="textSecondary">
        {strings.tickets.codeLabel}
      </ThemedText>
      <ThemedText selectable accessibilityLabel={strings.tickets.codeLabel} testID="ticket-code" style={styles.entryCode}>
        {formatEntryCode(ticket.entryCode)}
      </ThemedText>
    </ThemedView>
  );
}

export default function TicketsScreen() {
  const tickets = useMyTickets();

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FlatList
          data={tickets.data?.tickets ?? []}
          keyExtractor={(t) => t.registrationId}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshing={tickets.isRefetching}
          onRefresh={() => tickets.refetch()}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {strings.tabs.tickets}
              </ThemedText>
              {tickets.data?.offline ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {strings.tickets.offline}
                </ThemedText>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            tickets.isPending ? (
              <ActivityIndicator style={styles.empty} />
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.empty}>
                {tickets.error ? errorMessage(tickets.error) : strings.tickets.empty}
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
    maxWidth: MaxContentWidth / 1.5,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingTop: Spacing.six,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  title: {
    fontWeight: 700,
    fontSize: 18,
    textAlign: 'center',
  },
  qr: {
    padding: Spacing.three,
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.two,
  },
  entryCode: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
    letterSpacing: 4,
  },
  center: {
    textAlign: 'center',
  },
  separator: {
    height: Spacing.three,
  },
  empty: {
    marginTop: Spacing.five,
    textAlign: 'center',
  },
});
