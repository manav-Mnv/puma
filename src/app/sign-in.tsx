import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import {
  useEmailSignIn,
  useEmailSignUp,
  useGoogleSignIn,
} from "@/lib/api/auth";
import { errorMessage, strings } from "@/lib/strings";

// Parul mail is Google Workspace, so students sign in with Google only.
// Email + password stays available for automated tests (EXPO_PUBLIC_ENABLE_EMAIL_LOGIN=true in CI).
const EMAIL_LOGIN = process.env.EXPO_PUBLIC_ENABLE_EMAIL_LOGIN === "true";

export default function SignInScreen() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const google = useGoogleSignIn();
  const signIn = useEmailSignIn();
  const signUp = useEmailSignUp();

  const busy = google.isPending || signIn.isPending || signUp.isPending;
  const error = google.error ?? signIn.error ?? signUp.error;

  function reset() {
    google.reset();
    signIn.reset();
    signUp.reset();
    setNotice(null);
  }

  function submit() {
    reset();
    if (mode === "signIn") {
      signIn.mutate({ email, password });
    } else {
      signUp.mutate(
        { email, password },
        {
          onSuccess: (needsConfirmation) =>
            needsConfirmation && setNotice(strings.signIn.checkEmail),
        },
      );
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <ThemedText type="subtitle" accessibilityRole="header">
                {strings.signIn.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                {strings.signIn.subtitle}
              </ThemedText>

              <Button
                label={strings.signIn.google}
                variant={EMAIL_LOGIN ? "secondary" : "primary"}
                loading={google.isPending}
                disabled={busy}
                onPress={() => {
                  reset();
                  google.mutate();
                }}
              />

              {!EMAIL_LOGIN && error ? (
                <ThemedText accessibilityRole="alert" style={styles.error}>
                  {errorMessage(error)}
                </ThemedText>
              ) : null}

              {EMAIL_LOGIN ? (
                <>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.center}
                  >
                    {strings.signIn.or}
                  </ThemedText>

                  <TextField
                    label={strings.signIn.email}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    inputMode="email"
                  />
                  <TextField
                    label={strings.signIn.password}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete={
                      mode === "signIn" ? "current-password" : "new-password"
                    }
                    onSubmitEditing={submit}
                  />

                  {error ? (
                    <ThemedText accessibilityRole="alert" style={styles.error}>
                      {errorMessage(error)}
                    </ThemedText>
                  ) : null}
                  {notice ? (
                    <ThemedText accessibilityRole="alert">{notice}</ThemedText>
                  ) : null}

                  <Button
                    label={
                      mode === "signIn"
                        ? strings.signIn.submitSignIn
                        : strings.signIn.submitSignUp
                    }
                    loading={signIn.isPending || signUp.isPending}
                    disabled={busy || !email || password.length < 8}
                    onPress={submit}
                  />
                  <Button
                    label={
                      mode === "signIn"
                        ? strings.signIn.toggleToSignUp
                        : strings.signIn.toggleToSignIn
                    }
                    variant="secondary"
                    disabled={busy}
                    onPress={() => {
                      reset();
                      setMode(mode === "signIn" ? "signUp" : "signIn");
                    }}
                  />
                </>
              ) : null}
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
    justifyContent: "center",
    padding: Spacing.four,
  },
  card: {
    width: "100%",
    maxWidth: MaxContentWidth / 2,
    alignSelf: "center",
    gap: Spacing.three,
  },
  center: {
    textAlign: "center",
  },
  error: {
    color: "#C62828",
  },
});
