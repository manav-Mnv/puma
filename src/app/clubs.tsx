import { useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { Button } from '@/components/button';
import { Card, Screen, SectionTitle } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { useClubs, useRequestClub, useToggleMembership } from '@/lib/api/portal';
import { errorMessage, strings } from '@/lib/strings';

const t = strings.clubs;

export default function ClubsScreen() {
  const clubs = useClubs();
  const toggle = useToggleMembership();
  const request = useRequestClub();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Screen title={t.title}>
      {clubs.isPending ? <ActivityIndicator /> : null}
      {clubs.error ? <ThemedText>{errorMessage(clubs.error)}</ThemedText> : null}
      {clubs.data && !clubs.data.length ? <ThemedText themeColor="textSecondary">{t.empty}</ThemedText> : null}
      {clubs.data?.map((club) => (
        <Card key={club.id}>
          <ThemedText type="smallBold">
            {club.status === 'approved' ? '✓ ' : ''}
            {club.name}
          </ThemedText>
          {club.description ? <ThemedText type="small">{club.description}</ThemedText> : null}
          {club.status === 'pending' ? <ThemedText type="small" themeColor="textSecondary">{t.statusPending}</ThemedText> : null}
          {club.status === 'rejected' ? (
            <ThemedText type="small">{t.statusRejected(club.remarks ?? '')}</ThemedText>
          ) : null}
          {club.isMine && club.status === 'approved' ? (
            <ThemedText type="small" themeColor="textSecondary">{t.youLead}</ThemedText>
          ) : null}
          {club.status === 'approved' && !club.isMine ? (
            <Button
              label={club.joined ? t.leave : t.join}
              variant={club.joined ? 'secondary' : 'primary'}
              loading={toggle.isPending && toggle.variables?.clubId === club.id}
              onPress={() => toggle.mutate({ clubId: club.id, join: !club.joined })}
            />
          ) : null}
        </Card>
      ))}

      <SectionTitle>{t.requestTitle}</SectionTitle>
      <TextField label={t.name} value={name} onChangeText={setName} maxLength={80} />
      <TextField label={t.description} value={description} onChangeText={setDescription} multiline maxLength={2000} />
      {request.isSuccess ? <ThemedText accessibilityRole="alert">{t.sent}</ThemedText> : null}
      {request.error ? <ThemedText accessibilityRole="alert">{errorMessage(request.error)}</ThemedText> : null}
      <Button
        label={t.submit}
        disabled={name.trim().length < 3}
        loading={request.isPending}
        onPress={() =>
          request.mutate(
            { name, description },
            {
              onSuccess: () => {
                setName('');
                setDescription('');
              },
            }
          )
        }
      />
    </Screen>
  );
}
