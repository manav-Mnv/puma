import { render, screen } from '@testing-library/react-native';

import VerifyScreen from '@/app/verify/[serial]';
import { certificateHtml } from '@/lib/certificate-html';

let mockVerification: unknown = null;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ serial: 'EDGE-ABCDEF1234' }),
}));

jest.mock('@/lib/api/certificates', () => ({
  useVerifyCertificate: () => ({ isPending: false, error: null, data: mockVerification }),
}));

const certificate = {
  id: 'c1',
  serial: 'EDGE-ABCDEF1234',
  issued_at: '2026-11-05T14:00:00.000Z',
  snapshot: {
    student_name: 'Asha <script>alert(1)</script> Patel',
    student_id: '25UG000001',
    verification_status: 'verified' as const,
    event_title: 'Swift Workshop',
    event_starts_at: '2026-11-05T11:30:00.000Z',
    venue: 'Seminar Hall 2',
    issuer: 'Prof. Mehta',
  },
};

describe('certificateHtml', () => {
  it('prints every required field plus a verify QR, with names escaped', async () => {
    const html = await certificateHtml(certificate);
    expect(html).toContain('Certificate of Participation');
    expect(html).toContain('Asha &lt;script&gt;alert(1)&lt;/script&gt; Patel (25UG000001)');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Swift Workshop');
    expect(html).toContain('Prof. Mehta');
    expect(html).toContain('EDGE-ABCDEF1234');
    expect(html).toContain('<svg');
  });
});

describe('VerifyScreen (public)', () => {
  it('confirms a genuine certificate', async () => {
    mockVerification = {
      valid: true,
      serial: 'EDGE-ABCDEF1234',
      student_name: 'Asha Patel',
      event_title: 'Swift Workshop',
      event_starts_at: '2026-11-05T11:30:00.000Z',
      issuer: 'Prof. Mehta',
      issued_at: '2026-11-05T14:00:00.000Z',
    };
    await render(<VerifyScreen />);
    expect(screen.getByText('✓ Genuine EDGE certificate')).toBeTruthy();
    expect(screen.getByText('Asha Patel')).toBeTruthy();
  });

  it('rejects an unknown serial', async () => {
    mockVerification = { valid: false };
    await render(<VerifyScreen />);
    expect(screen.getByText('✕ No certificate with this ID')).toBeTruthy();
  });
});
