import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import OnboardingNavigator from './OnboardingNavigator';
import TabNavigator from './TabNavigator';
import { useThemeStore } from '../store/themeStore';

export default function RootNavigator() {
  const { session, initialized, initialize } = useAuthStore();
  const { colors } = useThemeStore();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  // Track whether we've done the initial profile check for a returning user
  const [profileChecked, setProfileChecked] = useState(false);
  const inOnboarding = !onboardingComplete;

  // Boot auth listener — with 5s timeout fallback
  useEffect(() => {
    const unsub = initialize();
    const timeout = setTimeout(() => {
      useAuthStore.setState({ initialized: true, loading: false });
    }, 5000);
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  // Only check profile for returning users (session present on cold start).
  // Skip during active onboarding to avoid remounting the flow mid-step.
  useEffect(() => {
    if (!session?.user || profileChecked || inOnboarding === false) return;
    // If we just got a session during onboarding (dev login), don't interrupt
    if (!initialized) return;
    const timeout = setTimeout(() => setProfileChecked(true), 5000);
    supabase
      .from('users')
      .select('id, handle')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        clearTimeout(timeout);
        if (data?.handle) setOnboardingComplete(true);
        setProfileChecked(true);
      });
    return () => clearTimeout(timeout);
  }, [initialized]); // only run once on init, not on every session change

  // Show spinner only on cold start before we know auth state
  if (!initialized || (session && !profileChecked && !inOnboarding)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingNavigator onComplete={() => setOnboardingComplete(true)} />;
  }

  return <TabNavigator />;
}
