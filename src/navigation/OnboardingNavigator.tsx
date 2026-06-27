import React, { useState } from 'react';
import SplashScreen from '../screens/onboarding/SplashScreen';
import AuthScreen from '../screens/onboarding/AuthScreen';
import ModeSelectScreen from '../screens/onboarding/ModeSelectScreen';
import NameHandleScreen from '../screens/onboarding/NameHandleScreen';
import PathSelectScreen from '../screens/onboarding/PathSelectScreen';
import ImportScreen from '../screens/onboarding/ImportScreen';
import TasteSearchScreen from '../screens/onboarding/TasteSearchScreen';
import TrailPickScreen from '../screens/onboarding/TrailPickScreen';
import ReadyScreen from '../screens/onboarding/ReadyScreen';
import { useAuthStore } from '../store/authStore';

type OnboardingStep = 'splash' | 'auth' | 'mode' | 'name' | 'path' | 'import' | 'taste' | 'trails' | 'ready';

interface Props {
  onComplete: () => void;
}

export default function OnboardingNavigator({ onComplete }: Props) {
  const [step, setStep] = useState<OnboardingStep>('splash');
  const [userName, setUserName] = useState('');
  const { user } = useAuthStore();

  switch (step) {
    case 'splash':
      return <SplashScreen onFinish={() => setStep('auth')} />;

    case 'auth':
      return <AuthScreen onAuth={() => setStep('mode')} />;

    case 'mode':
      return <ModeSelectScreen onSelect={() => setStep('name')} />;

    case 'name':
      return (
        <NameHandleScreen
          onNext={(name?: string) => {
            if (name) setUserName(name);
            setStep('path');
          }}
        />
      );

    case 'path':
      return (
        <PathSelectScreen
          onImport={() => setStep('import')}
          onLogFirst={() => setStep('taste')}
          onTaste={() => setStep('taste')}
        />
      );

    case 'import':
      return (
        <ImportScreen
          onNext={() => setStep('taste')}
          onSkip={() => setStep('taste')}
        />
      );

    case 'taste':
      return <TasteSearchScreen onNext={() => setStep('trails')} />;

    case 'trails':
      return <TrailPickScreen onNext={() => setStep('ready')} />;

    case 'ready':
      return (
        <ReadyScreen
          name={userName || user?.email?.split('@')[0] || ''}
          onEnter={onComplete}
        />
      );
  }
}
