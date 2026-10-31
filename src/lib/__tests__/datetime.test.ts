import { formatEventDate, istToIso } from '../datetime';

describe('istToIso', () => {
  it('converts IST wall time to UTC', () => {
    expect(istToIso('2026-11-05', '17:30')).toBe('2026-11-05T12:00:00.000Z');
    expect(istToIso('2026-11-05', '0:15')).toBe('2026-11-04T18:45:00.000Z');
  });

  it('rejects malformed or impossible input', () => {
    expect(istToIso('05-11-2026', '17:30')).toBeNull();
    expect(istToIso('2026-02-31', '10:00')).toBeNull();
    expect(istToIso('2026-11-05', '25:00')).toBeNull();
    expect(istToIso('2026-11-05', '')).toBeNull();
  });
});

describe('formatEventDate', () => {
  it('formats in IST regardless of device timezone', () => {
    // 20:00 UTC on 4 Nov is 01:30 on 5 Nov in India
    expect(formatEventDate('2026-11-04T20:00:00.000Z')).toMatch(/5 Nov/);
  });
});
