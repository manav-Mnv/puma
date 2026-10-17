import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { strings } from '@/lib/strings';

// TODO(T03b/B-lane): replace placeholder icons with the EDGE icon set from Figma.
const homeIcon = require('@/assets/images/tabIcons/home.png');
const exploreIcon = require('@/assets/images/tabIcons/explore.png');

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{strings.tabs.explore}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={exploreIcon} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tickets">
        <NativeTabs.Trigger.Label>{strings.tabs.tickets}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={homeIcon} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create">
        <NativeTabs.Trigger.Label>{strings.tabs.create}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={homeIcon} renderingMode="template" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{strings.tabs.profile}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={homeIcon} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
