import { render, screen } from '@testing-library/react-native';

import SelfCheckIn from '@/app/checkin/[id]';

const mockMutate = jest.fn();
let mockState: Record<string, unknown> = {};

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), canGoBack: () => false },
  useLocalSearchParams: () => ({ id: 'evt-1', c: 'screencode' }),
}));
jest.mock('@/lib/api/tickets', () => ({
  useSelfCheckIn: () => ({ mutate: mockMutate, ...mockState }),
}));

it('checks in automatically from the screen QR link', async () => {
  mockState = { isPending: false, data: { status: 'ok', event_title: 'Swift Workshop' }, error: null };
  await render(<SelfCheckIn />);
  expect(mockMutate).toHaveBeenCalledWith({ eventId: 'evt-1', code: 'screencode' });
  expect(screen.getByText('✓ You’re checked in to Swift Workshop')).toBeTruthy();
});

it('explains an old or wrong code', async () => {
  mockState = { isPending: false, data: undefined, error: new Error('invalid_checkin_code') };
  await render(<SelfCheckIn />);
  expect(screen.getByText(/This check-in QR is old or wrong/)).toBeTruthy();
});
