import { render, screen } from '@testing-library/react-native';

import ManagePortal from '@/app/manage/index';
import SuperAdminConsole from '@/app/super';

let mockAccess: Record<string, unknown> = {};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => false },
  Link: ({ children }: { children: unknown }) => children,
}));

jest.mock('@/lib/api/portal', () => ({
  usePortalAccess: () => mockAccess,
  useMyEvents: () => ({ isPending: false, data: [] }),
  useReviewQueue: () => ({
    isPending: false,
    data: [{ kind: 'club', id: 'c1', title: 'Swift Coding Club', detail: 'iOS', requester_name: 'Ravi', created_at: '', overdue: true }],
  }),
  useDecide: () => ({ mutate: jest.fn(), isPending: false, error: null }),
  usePlatformStats: () => ({ isPending: false, data: { users: 12, verified: 7, onboarded: 10, staff: 3, clubs: 1, pending: 2, events: 4, registrations: 30, checkins: 20, certificates: 18 } }),
}));

describe('Manage portal', () => {
  it('is closed to students', async () => {
    mockAccess = { isStaff: false };
    await render(<ManagePortal />);
    expect(screen.queryByText('Approval queue')).toBeNull();
  });

  it('shows the approval queue to ADs but not faculty', async () => {
    mockAccess = { isStaff: true, role: 'faculty', isReviewer: false };
    await render(<ManagePortal />);
    expect(screen.queryByText('Approval queue')).toBeNull();

    mockAccess = { isStaff: true, role: 'ad', isReviewer: true };
    await render(<ManagePortal />);
    expect(screen.getByText('Swift Coding Club')).toBeTruthy();
    expect(screen.getByText(/Overdue/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled(); // needs remarks
  });
});

describe('Super Admin console', () => {
  it('only opens for Super Admin', async () => {
    mockAccess = { isSuperAdmin: false };
    await render(<SuperAdminConsole />);
    expect(screen.getByText('Super Admin only.')).toBeTruthy();

    mockAccess = { isSuperAdmin: true };
    await render(<SuperAdminConsole />);
    expect(screen.getByText('Certificates')).toBeTruthy();
    expect(screen.getByText('18')).toBeTruthy();
  });
});
