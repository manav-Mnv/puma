import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { Certificate } from '@/lib/api/certificates';
import { certificateHtml } from '@/lib/certificate-html';

/** Native: render the certificate to a PDF file and open the share sheet. */
export async function downloadCertificate(certificate: Certificate) {
  const html = await certificateHtml(certificate);
  const { uri } = await Print.printToFileAsync({ html, width: 842, height: 595 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: certificate.serial,
    });
  }
}
