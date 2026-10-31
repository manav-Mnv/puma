import { fireEvent, render, screen } from '@testing-library/react-native';

import CreateScreen from '@/app/(tabs)/create';
import EventDetailScreen from '@/app/event/[id]/index';

const mockCreate = jest.fn();
const mockRegister = jest.fn();
let mockCanCreate = true;
let mockRegistration: { status: string } | null = null;

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => false },
  useLocalSearchParams: () => ({ id: 'evt-1' }),
}));

jest.mock('@/lib/api/events', () => ({
  useCanCreateEvents: () => mockCanCreate,
  useCreateEvent: () => ({ mutate: mockCreate, isPending: false, error: null }),
  useEvent: () => ({
    isPending: false,
    data: {
      id: 'evt-1',
      title: 'Swift Workshop',
      venue: 'Seminar Hall 2',
      description: 'Intro to SwiftUI',
      organizer_name: 'Prof. Mehta',
      is_verified: true,
      registered_count: 3,
      // Already started, so the organizer can complete it.
      starts_at: '2026-10-01T11:30:00.000Z',
      ends_at: '2026-10-01T13:30:00.000Z',
    },
  }),
  useMyRegistration: () => ({ isPending: false, data: mockRegistration }),
  useRegister: () => ({ mutate: mockRegister, isPending: false, error: null }),
  useCancelRegistration: () => ({ mutate: jest.fn(), isPending: false, error: null }),
}));

let mockIsOrganizer = false;
jest.mock('@/lib/api/tickets', () => ({
  useIsEventOrganizer: () => ({ data: mockIsOrganizer }),
}));

const mockComplete = jest.fn();
jest.mock('@/lib/api/certificates', () => ({
  useCompleteEvent: () => ({ mutate: mockComplete, isPending: false, data: undefined, error: null }),
}));

beforeEach(() => {
  mockComplete.mockClear();
  mockIsOrganizer = false;
  mockCreate.mockClear();
  mockRegister.mockClear();
  mockCanCreate = true;
  mockRegistration = null;
});

describe('CreateScreen', () => {
  it('explains the rule to students instead of showing the form', async () => {
    mockCanCreate = false;
    await render(<CreateScreen />);
    expect(screen.getByText(/only Faculty and ADs can create events/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Publish event' })).toBeNull();
  });

  it('publishes with IST times converted to UTC', async () => {
    await render(<CreateScreen />);
    await fireEvent.changeText(screen.getByLabelText('Title'), 'Swift Workshop');
    await fireEvent.changeText(screen.getByLabelText('Venue'), 'Seminar Hall 2');
    await fireEvent.changeText(screen.getByLabelText('Date (YYYY-MM-DD)'), '2026-11-05');
    await fireEvent.changeText(screen.getByLabelText('Starts (HH:MM, 24h)'), '17:00');
    await fireEvent.changeText(screen.getByLabelText('Ends (HH:MM, 24h)'), '16:00');
    expect(screen.getByRole('button', { name: 'Publish event' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Ends (HH:MM, 24h)'), '19:00');
    await fireEvent.press(screen.getByRole('button', { name: 'Publish event' }));
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Swift Workshop',
        starts_at: '2026-11-05T11:30:00.000Z',
        ends_at: '2026-11-05T13:30:00.000Z',
      }),
      expect.anything()
    );
  });
});

describe('EventDetailScreen', () => {
  it('shows a verified event and registers in one tap', async () => {
    await render(<EventDetailScreen />);
    expect(screen.getByText('Swift Workshop')).toBeTruthy();
    expect(screen.getByLabelText(/Verified/)).toBeTruthy();
    expect(screen.getByText('3 going')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Register' }));
    expect(mockRegister).toHaveBeenCalledWith('evt-1');
  });

  it('shows "Scan tickets" only to the organizer', async () => {
    await render(<EventDetailScreen />);
    expect(screen.queryByRole('button', { name: 'Scan tickets' })).toBeNull();
    mockIsOrganizer = true;
    await render(<EventDetailScreen />);
    expect(screen.getByRole('button', { name: 'Scan tickets' })).toBeTruthy();
  });

  it('asks the organizer to confirm before completing the event', async () => {
    mockIsOrganizer = true;
    await render(<EventDetailScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Mark event complete' }));
    expect(mockComplete).not.toHaveBeenCalled();
    expect(screen.getByText(/Everyone checked in will get a certificate/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Yes, complete and issue certificates' }));
    expect(mockComplete).toHaveBeenCalledTimes(1);
  });

  it('shows the registered state instead of the register button', async () => {
    mockRegistration = { status: 'registered' };
    await render(<EventDetailScreen />);
    expect(screen.getByText('✓ You’re registered')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Register' })).toBeNull();
  });
});
