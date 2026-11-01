import { Platform, Share } from 'react-native';

/** RFC 4180 CSV: quotes every field, doubles embedded quotes. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.map(cell).join(','), ...rows.map((r) => headers.map((h) => cell(r[h])).join(','))].join('\r\n');
}

/** Web: download a .csv file. Native: open the share sheet (WhatsApp, Mail, Drive…). */
export async function shareCsv(filename: string, csv: string) {
  if (Platform.OS === 'web') {
    // BOM so Excel opens UTF-8 names correctly.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: filename, message: csv });
}
