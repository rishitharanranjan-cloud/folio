import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ShelfScreen from '../screens/ShelfScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LogModal from '../screens/log/LogModal';
import ConfirmationScreen from '../screens/log/ConfirmationScreen';
import TrailCompleteModal from '../components/TrailCompleteModal';
import MilestoneModal, { MilestoneType } from '../components/MilestoneModal';
import { useThemeStore } from '../store/themeStore';
import { fonts } from '../theme/tokens';
import type { SearchResult } from '../lib/mediaSearch';
import { checkLogMilestone, checkStreakMilestone, computeStreaks } from '../lib/streaks';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const Tab = createBottomTabNavigator();

// Thin wrapper so the + button opens the modal rather than navigating to a tab
function TabBar({ state, descriptors, navigation, onLogPress }: BottomTabBarProps & { onLogPress: () => void }) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.bg2, borderTopColor: colors.border }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel as string ?? route.name;
        const isFocused = state.index === index;

        if (route.name === 'Log') {
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.logButton}
              onPress={onLogPress}
              activeOpacity={0.8}
            >
              <View style={[styles.logCircle, { backgroundColor: colors.accent }]}>
                <Text style={[styles.logPlus, { color: colors.accentt }]}>+</Text>
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? colors.accent : colors.ink3,
                  fontFamily: fonts.mono,
                },
              ]}
            >
              {label.toUpperCase()}
            </Text>
            {isFocused && (
              <View style={[styles.activeBar, { backgroundColor: colors.accent }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Empty screen behind the Log tab slot — never actually shown
function LogSpacer() {
  return <View style={{ flex: 1 }} />;
}

export default function TabNavigator() {
  const { user } = useAuthStore();
  const [logOpen, setLogOpen] = useState(false);
  const [logInitialItem, setLogInitialItem] = useState<SearchResult | undefined>(undefined);
  const [confirmed, setConfirmed] = useState<{ item: SearchResult; rating: number; review?: string } | null>(null);
  const [completedTrail, setCompletedTrail] = useState<{ id: string; title: string } | null>(null);
  const [milestone, setMilestone] = useState<MilestoneType | null>(null);

  const handleLogged = async (item: SearchResult, rating: number, review?: string, trail?: { id: string; title: string }) => {
    setLogOpen(false);
    setConfirmed({ item, rating, review });
    if (trail) setCompletedTrail(trail);

    // Check for milestones
    if (user) {
      const { data: logs } = await supabase
        .from('logs')
        .select('logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (logs) {
        const dates = logs.map((l: any) => l.logged_at);
        const prevCount = dates.length - 1;
        const newCount = dates.length;
        const { currentStreak: prevStreak } = computeStreaks(dates.slice(1));
        const { currentStreak: newStreak } = computeStreaks(dates);

        const logHit = checkLogMilestone(prevCount, newCount);
        const streakHit = checkStreakMilestone(prevStreak, newStreak);

        if (logHit) {
          setTimeout(() => setMilestone({ kind: 'logs', count: logHit }), 1500);
        } else if (streakHit) {
          setTimeout(() => setMilestone({ kind: 'streak', weeks: streakHit }), 1500);
        }
      }
    }
  };

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => (
          <TabBar {...props} onLogPress={() => setLogOpen(true)} />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home"    component={HomeScreen}    options={{ tabBarLabel: 'Home'   }} />
        <Tab.Screen name="Shelf" options={{ tabBarLabel: 'Shelf' }}>
          {() => <ShelfScreen onOpenLog={() => setLogOpen(true)} />}
        </Tab.Screen>
        <Tab.Screen name="Log"     component={LogSpacer}     options={{ tabBarLabel: 'Log'    }} />
        <Tab.Screen name="Discover" options={{ tabBarLabel: 'Search' }}>
          {() => <DiscoverScreen onLogItem={(item) => { setLogInitialItem(item); setLogOpen(true); }} />}
        </Tab.Screen>
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile'}} />
      </Tab.Navigator>

      {/* Log modal */}
      <Modal visible={logOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setLogOpen(false); setLogInitialItem(undefined); }}>
        <LogModal
          onClose={() => { setLogOpen(false); setLogInitialItem(undefined); }}
          onLogged={(item, rating, review, trail) => handleLogged(item, rating, review, trail)}
          initialItem={logInitialItem}
        />
      </Modal>

      {/* Confirmation full-screen */}
      <Modal visible={!!confirmed} animationType="fade" onRequestClose={() => setConfirmed(null)}>
        {confirmed && (
          <ConfirmationScreen
            item={confirmed.item}
            rating={confirmed.rating}
            review={confirmed.review}
            onDone={() => setConfirmed(null)}
          />
        )}
      </Modal>

      {/* Trail completion celebration */}
      {completedTrail && (
        <TrailCompleteModal
          trailTitle={completedTrail.title}
          onClose={() => setCompletedTrail(null)}
        />
      )}

      {/* Milestone toast */}
      <MilestoneModal
        milestone={milestone}
        onDismiss={() => setMilestone(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2,
  },
  logButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logPlus: {
    fontSize: 28,
    lineHeight: 32,
  },
});
