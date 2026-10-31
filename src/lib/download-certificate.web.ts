import type { Certificate } from '@/lib/api/certificates';
import { certificateHtml } from '@/lib/certificate-html';

/** Web: open the printable certificate in a new tab; "Save as PDF" from the print dialog. */
export async function downloadCertificate(certificate: Certificate) {
  const html = await certificateHtml(certificate);
  const tab = window.open('', '_blank');
  if (!tab) throw new Error('popup_blocked');
  tab.document.write(html);
  tab.document.close();
  tab.focus();
  tab.onload = () => tab.print();
  // Some browsers have already fired load for document.write content.
  setTimeout(() => tab.print(), 400);
}
