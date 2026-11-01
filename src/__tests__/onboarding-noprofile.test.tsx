import { render, screen } from '@testing-library/react-native';

import OnboardingScreen from '@/app/onboarding';

jest.mock('@/lib/api/profile', () => ({
  useMyProfile: () => ({ data: undefined, error: new Error('JSON object requested, multiple (or no) rows returned') }),
  useInstitutes: () => ({ data: [{ id: 1, name: 'Parul Institute of Technology', is_other: false }] }),
  useCompleteOnboarding: () => ({ mutate: jest.fn(), isPending: false, error: null }),
}));

it('still renders the form when the profile row is missing', async () => {
  await render(<OnboardingScreen />);
  expect(screen.getByText('Step 1 of 3')).toBeTruthy();
});
