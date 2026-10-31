import QRCode from 'qrcode';

import { verifyUrl } from '@/constants/links';
import type { Certificate } from '@/lib/api/certificates';
import { formatEventDate } from '@/lib/datetime';
import { strings } from '@/lib/strings';

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Printable A4-landscape certificate (PRD §11: name, ID, event, date, issuer,
 * signature line, verification QR). Used for "Download PDF" on web and native.
 */
export async function certificateHtml(certificate: Certificate): Promise<string> {
  const { snapshot, serial } = certificate;
  const t = strings.certificate;
  const qrSvg = await QRCode.toString(verifyUrl(serial), { type: 'svg', margin: 0, width: 120 });
  const name = escapeHtml(snapshot.student_name ?? '');
  const studentId = snapshot.student_id ? ` (${escapeHtml(snapshot.student_id)})` : '';

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(t.title)} – ${escapeHtml(snapshot.event_title)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #111; }
  .page { width: 297mm; height: 210mm; padding: 18mm; }
  .frame { height: 100%; border: 3px solid #111; padding: 14mm; display: flex; flex-direction: column; }
  .brand { font-family: Helvetica, Arial, sans-serif; letter-spacing: 6px; font-weight: 700; font-size: 14pt; }
  h1 { font-size: 34pt; margin: 10mm 0 4mm; font-weight: normal; }
  .lead { font-size: 13pt; margin: 0; }
  .name { font-size: 28pt; margin: 6mm 0; font-style: italic; }
  .event { font-size: 16pt; margin: 0 0 2mm; }
  .meta { font-size: 11pt; color: #444; margin: 0; }
  .footer { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; }
  .sign { border-top: 1px solid #111; width: 70mm; padding-top: 2mm; font-size: 11pt; }
  .verify { text-align: center; font-family: Helvetica, Arial, sans-serif; font-size: 8pt; color: #444; }
</style></head>
<body><div class="page"><div class="frame">
  <div class="brand">EDGE · PARUL UNIVERSITY</div>
  <h1>${escapeHtml(t.title)}</h1>
  <p class="lead">${escapeHtml(t.presentedTo)}</p>
  <p class="name">${name}${studentId}</p>
  <p class="lead">${escapeHtml(t.forAttending)}</p>
  <p class="event">${escapeHtml(snapshot.event_title)}</p>
  <p class="meta">${escapeHtml(formatEventDate(snapshot.event_starts_at))} · ${escapeHtml(snapshot.venue)}</p>
  <div class="footer">
    <div class="sign">${escapeHtml(snapshot.issuer)}<br>${escapeHtml(t.organizer)}</div>
    <div class="verify">${qrSvg}<br>${escapeHtml(t.verifyAt)}<br>${escapeHtml(serial)}</div>
  </div>
</div></div></body></html>`;
}
