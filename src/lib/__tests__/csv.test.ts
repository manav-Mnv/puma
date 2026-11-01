import { toCsv } from '../csv';

describe('toCsv', () => {
  it('quotes fields and escapes quotes and commas', () => {
    expect(toCsv([{ name: 'Ravi "R" Shah', id: '25UG024310', course: 'B.Tech, CSE' }])).toBe(
      '"name","id","course"\r\n"Ravi ""R"" Shah","25UG024310","B.Tech, CSE"'
    );
  });

  it('renders empty values for null', () => {
    expect(toCsv([{ a: null, b: undefined }])).toBe('"a","b"\r\n"",""');
  });

  it('returns nothing for no rows', () => {
    expect(toCsv([])).toBe('');
  });
});
