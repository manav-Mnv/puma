import { fireEvent, render, screen } from '@testing-library/react-native';

import OnboardingScreen from '@/app/onboarding';

const mockMutate = jest.fn();

jest.mock('@/lib/api/profile', () => ({
  useMyProfile: () => ({
    data: { full_name: 'Ravi Shah', personal_email: 'ravi@gmail.com', verification_status: 'unverified' },
  }),
  useInstitutes: () => ({
    data: [
      { id: 1, name: 'Parul Institute of Technology', is_other: false },
      { id: 6, name: 'Other', is_other: true },
    ],
  }),
  useCompleteOnboarding: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

async function next() {
  await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
}

describe('OnboardingScreen', () => {
  beforeEach(() => mockMutate.mockClear());

  it('blocks step 1 until the student ID is valid', async () => {
    await render(<OnboardingScreen />);
    await fireEvent.changeText(screen.getByLabelText('Enrollment / student ID'), 'UG25');
    expect(screen.getByText(/Enter your enrollment number/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Enrollment / student ID'), '25ug030303');
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('submits a normalised profile after all three steps', async () => {
    await render(<OnboardingScreen />);
    await fireEvent.changeText(screen.getByLabelText('Enrollment / student ID'), ' 25ug030303 ');
    await next();

    await fireEvent.press(screen.getByRole('radio', { name: 'Parul Institute of Technology' }));
    await fireEvent.changeText(screen.getByLabelText('Course / program'), 'B.Tech CSE');
    await fireEvent.press(screen.getAllByRole('radio', { name: '1' })[0]); // year
    await fireEvent.press(screen.getAllByRole('radio', { name: '1' })[1]); // semester
    await fireEvent.press(screen.getByRole('radio', { name: 'Hosteller' }));
    await next();

    // Path B student: personal email already known, Unverified note shown, ID echoed back
    expect(screen.queryByLabelText('Personal email')).toBeNull();
    expect(screen.getByText(/Unverified/)).toBeTruthy();
    expect(screen.getByText(/25UG030303/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'Prefer not to say' }));
    await fireEvent.changeText(screen.getByLabelText('Mobile number'), '+91 98765 43210');
    const finish = screen.getByRole('button', { name: 'Finish' });
    expect(finish).toBeDisabled(); // consent still missing
    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(finish);

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Ravi Shah',
        student_id: '25UG030303',
        institute_id: 1,
        year: 1,
        semester: 1,
        residence: 'hosteller',
        gender: 'prefer_not_to_say',
        consent: true,
        personal_email: undefined,
      })
    );
  });
});
