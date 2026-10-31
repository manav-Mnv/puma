import { fireEvent, render, screen } from '@testing-library/react-native';

import AdminRolesScreen from '@/app/admin/roles';
import ScanScreen from '@/app/event/[id]/scan';

const mockCheckIn = jest.fn();
let mockIsAdmin = false;

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => false },
  useLocalSearchParams: () => ({ id: 'evt-1' }),
}));

jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: false }, jest.fn()],
}));

jest.mock('@/lib/api/events', () => ({
  useEvent: () => ({ data: { id: 'evt-1', title: 'Swift Workshop' } }),
}));

jest.mock('@/lib/api/tickets', () => ({
  useCheckedInCount: () => ({ data: 4, error: null }),
  useCheckIn: () => ({ mutate: mockCheckIn, isPending: false }),
}));

jest.mock('@/lib/api/admin', () => ({
  useIsAdmin: () => mockIsAdmin,
  useAdminFindProfiles: () => ({ isPending: false, data: [] }),
  useSetRole: () => ({ mutate: jest.fn() }),
}));

beforeEach(() => {
  mockCheckIn.mockReset();
  mockIsAdmin = false;
});

async function typeCode(code: string) {
  await fireEvent.changeText(screen.getByLabelText('Or type the ticket code'), code);
  await fireEvent.press(screen.getByRole('button', { name: 'Check in' }));
}

describe('ScanScreen', () => {
  it('shows the live count and asks for camera permission', async () => {
    await render(<ScanScreen />);
    expect(screen.getByText('4 checked in')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Allow camera' })).toBeTruthy();
  });

  it('confirms a check-in with the student name and Unverified tag', async () => {
    mockCheckIn.mockImplementation((_code, { onSuccess }) =>
      onSuccess({ status: 'ok', full_name: 'Ravi Shah', student_id: '25UG030303', verification_status: 'unverified' })
    );
    await render(<ScanScreen />);
    await typeCode('abc123');
    expect(mockCheckIn).toHaveBeenCalledWith('abc123', expect.anything());
    expect(screen.getByText('✓ Checked in')).toBeTruthy();
    expect(screen.getByText('Ravi Shah')).toBeTruthy();
    expect(screen.getByText('25UG030303 · Unverified')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Scan next' }));
    expect(screen.getByLabelText('Or type the ticket code')).toBeTruthy();
  });

  it('warns on a duplicate scan', async () => {
    mockCheckIn.mockImplementation((_code, { onSuccess }) =>
      onSuccess({ status: 'already', full_name: 'Ravi Shah', student_id: '25UG030303', verification_status: 'verified' })
    );
    await render(<ScanScreen />);
    await typeCode('abc123');
    expect(screen.getByText('⚠ Already checked in')).toBeTruthy();
  });

  it('shows a friendly error for a ticket from another event', async () => {
    mockCheckIn.mockImplementation((_code, { onError }) => onError(new Error('wrong_event')));
    await render(<ScanScreen />);
    await typeCode('abc123');
    expect(screen.getByText('✕ This ticket is for a different event.')).toBeTruthy();
  });
});

describe('AdminRolesScreen', () => {
  it('is closed to non-admins', async () => {
    await render(<AdminRolesScreen />);
    expect(screen.getByText('Only Admins can change roles.')).toBeTruthy();
    expect(screen.queryByLabelText('Search by name, email or student ID')).toBeNull();
  });

  it('lets admins search', async () => {
    mockIsAdmin = true;
    await render(<AdminRolesScreen />);
    expect(screen.getByLabelText('Search by name, email or student ID')).toBeTruthy();
  });
});
