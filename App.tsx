import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { Fraunces_400Regular_Italic, Fraunces_400Regular } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import RootNavigator from './src/navigation/RootNavigator';
import { useThemeStore } from './src/store/themeStore';
import ErrorBoundary from './src/components/ErrorBoundary';

function AppInner() {
  const { mode } = useThemeStore();
  return (
    <NavigationContainer>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    SpaceMono_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_400Regular,
    Inter_400Regular,
    Inter_500Medium,
  });
  const { loadSavedMode } = useThemeStore();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    loadSavedMode().finally(() => setThemeReady(true));
  }, []);

  if (!fontsLoaded || !themeReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#040c18', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#4a90d4" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}
