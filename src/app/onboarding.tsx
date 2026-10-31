import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Checkbox } from '@/components/checkbox';
import { ChipGroup } from '@/components/chip-group';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  useCompleteOnboarding,
  useInstitutes,
  useMyProfile,
  type OnboardingInput,
} from '@/lib/api/profile';
import { errorMessage, strings } from '@/lib/strings';
import { isValidPhone, normalizeStudentId, validateStudentId } from '@/lib/validation/student-id';

const t = strings.onboarding;
const TOTAL_STEPS = 3;
const YEARS = [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }));
const SEMESTERS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
const RESIDENCES = [
  { value: 'hosteller', label: t.hosteller },
  { value: 'day_scholar', label: t.dayScholar },
] as const;
const GENDERS = [
  { value: 'female', label: t.female },
  { value: 'male', label: t.male },
  { value: 'non_binary', label: t.nonBinary },
  { value: 'prefer_not_to_say', label: t.preferNot },
] as const;

type Form = {
  full_name: string;
  student_id: string;
  institute_id: number | null;
  institute_other: string;
  course: string;
  year: number | null;
  semester: number | null;
  residence: OnboardingInput['residence'] | null;
  gender: OnboardingInput['gender'] | null;
  phone: string;
  personal_email: string;
  consent: boolean;
};

export default function OnboardingScreen() {
  const profile = useMyProfile();
  const institutes = useInstitutes();
  const complete = useCompleteOnboarding();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({
    full_name: '',
    student_id: '',
    institute_id: null,
    institute_other: '',
    course: '',
    year: null,
    semester: null,
    residence: null,
    gender: null,
    phone: '',
    personal_email: '',
    consent: false,
  });

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const fullName = form.full_name || profile.data?.full_name || '';
  const needsPersonalEmail = !profile.data?.personal_email;
  const isUnverified = profile.data?.verification_status === 'unverified';
  const selectedInstitute = institutes.data?.find((i) => i.id === form.institute_id);

  const idError = form.student_id ? validateStudentId(form.student_id) : null;
  const stepValid =
    step === 1
      ? fullName.trim().length > 1 && !!form.student_id && !idError
      : step === 2
        ? !!form.institute_id &&
          (!selectedInstitute?.is_other || !!form.institute_other.trim()) &&
          !!form.course.trim() &&
          !!form.year &&
          !!form.semester &&
          !!form.residence
        : !!form.gender &&
          isValidPhone(form.phone) &&
          (!needsPersonalEmail || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.personal_email.trim())) &&
          form.consent;

  function submit() {
    complete.mutate({
      full_name: fullName.trim(),
      student_id: normalizeStudentId(form.student_id),
      institute_id: form.institute_id!,
      institute_other: selectedInstitute?.is_other ? form.institute_other.trim() : undefined,
      course: form.course.trim(),
      year: form.year!,
      semester: form.semester!,
      residence: form.residence!,
      gender: form.gender!,
      phone: form.phone,
      personal_email: needsPersonalEmail ? form.personal_email.trim() : undefined,
      consent: form.consent,
    });
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <ThemedText type="small" themeColor="textSecondary">
                {t.stepOf(step, TOTAL_STEPS)}
              </ThemedText>

              {step === 1 ? (
                <>
                  <ThemedText type="subtitle" accessibilityRole="header">
                    {t.basicsTitle}
                  </ThemedText>
                  <TextField
                    label={t.fullName}
                    value={fullName}
                    onChangeText={(v) => set('full_name', v)}
                    autoComplete="name"
                  />
                  <TextField
                    label={t.studentId}
                    placeholder={t.studentIdHint}
                    value={form.student_id}
                    onChangeText={(v) => set('student_id', v)}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  {idError ? <ThemedText style={styles.error}>{strings.errors[idError]}</ThemedText> : null}
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <ThemedText type="subtitle" accessibilityRole="header">
                    {t.academicTitle}
                  </ThemedText>
                  <ChipGroup
                    label={t.institute}
                    options={(institutes.data ?? []).map((i) => ({ value: i.id, label: i.name }))}
                    value={form.institute_id}
                    onChange={(v) => set('institute_id', v)}
                  />
                  {selectedInstitute?.is_other ? (
                    <TextField
                      label={t.instituteOther}
                      value={form.institute_other}
                      onChangeText={(v) => set('institute_other', v)}
                    />
                  ) : null}
                  <TextField
                    label={t.course}
                    placeholder={t.coursePlaceholder}
                    value={form.course}
                    onChangeText={(v) => set('course', v)}
                  />
                  <ChipGroup label={t.year} options={YEARS} value={form.year} onChange={(v) => set('year', v)} />
                  <ChipGroup
                    label={t.semester}
                    options={SEMESTERS}
                    value={form.semester}
                    onChange={(v) => set('semester', v)}
                  />
                  <ChipGroup
                    label={t.residence}
                    options={RESIDENCES}
                    value={form.residence}
                    onChange={(v) => set('residence', v)}
                  />
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <ThemedText type="subtitle" accessibilityRole="header">
                    {t.contactTitle}
                  </ThemedText>
                  <ChipGroup label={t.gender} options={GENDERS} value={form.gender} onChange={(v) => set('gender', v)} />
                  <TextField
                    label={t.phone}
                    value={form.phone}
                    onChangeText={(v) => set('phone', v)}
                    keyboardType="phone-pad"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  {needsPersonalEmail ? (
                    <TextField
                      label={t.personalEmail}
                      value={form.personal_email}
                      onChangeText={(v) => set('personal_email', v)}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      inputMode="email"
                    />
                  ) : null}
                  <ThemedText type="small">{t.confirmId(normalizeStudentId(form.student_id))}</ThemedText>
                  {isUnverified ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t.unverifiedNote}
                    </ThemedText>
                  ) : null}
                  <Checkbox label={t.consent} checked={form.consent} onChange={(v) => set('consent', v)} />
                </>
              ) : null}

              {complete.error ? (
                <ThemedText accessibilityRole="alert" style={styles.error}>
                  {errorMessage(complete.error)}
                </ThemedText>
              ) : null}

              <View style={styles.actions}>
                {step > 1 ? (
                  <Button
                    label={t.back}
                    variant="secondary"
                    style={styles.flex}
                    disabled={complete.isPending}
                    onPress={() => setStep(step - 1)}
                  />
                ) : null}
                <Button
                  label={step < TOTAL_STEPS ? t.next : t.finish}
                  style={styles.flex}
                  disabled={!stepValid}
                  loading={complete.isPending}
                  onPress={() => (step < TOTAL_STEPS ? setStep(step + 1) : submit())}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth / 1.5,
    alignSelf: 'center',
    gap: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  error: {
    color: '#C62828',
  },
});
