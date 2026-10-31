// Public website, used for links that must open anywhere (e.g. the certificate QR).
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? 'https://edge-parul.manavbarad978.workers.dev').replace(
  /\/$/,
  ''
);

export function verifyUrl(serial: string) {
  return `${WEB_URL}/verify/${encodeURIComponent(serial)}`;
}
