import type { ConfigContext, ExpoConfig } from 'expo/config';

// Dynamic layer over app.json:
// - GOOGLE_SERVICES_JSON is an EAS "file" environment variable (secret; the repo is
//   public), giving Android builds the Firebase config for push (FCM).
// - The EAS project ID is fixed here so builds no longer need `eas init`.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  owner: 'mnvdev',
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
  },
  plugins: [
    ...(config.plugins ?? []),
    ['expo-notifications', { color: '#000000', defaultChannel: 'default' }],
  ],
  extra: {
    ...config.extra,
    eas: { projectId: '22f00b61-bd58-48a7-9795-c6e41a038b16' },
  },
});
