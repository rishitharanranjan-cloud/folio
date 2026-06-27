import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import WrappedScreen from './WrappedScreen';
import ImportScreen from './onboarding/ImportScreen';
import SocialScreen from './SocialScreen';
import { enrichCovers } from '../lib/enrichCovers';
import * as Notifications from 'expo-notifications';
import { scheduleWeeklyNudge, cancelWeeklyNudge } from '../lib/habitNudge';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useLogs } from '../hooks/useLogs';
import { useTasteSeeds } from '../hooks/useTasteSeeds';
import Constellation from '../components/Constellation';
import GoalRing from '../components/GoalRing';
import { fonts, THEME_NAMES, dark as darkTheme, light as lightTheme, type ThemeMode } from '../theme/tokens';
import { W } from './wrapped/palette';
import { computeStreaks } from '../lib/streaks';
import FolioCodeMark from '../components/FolioCodeMark';

const { width: SCREEN_W } = Dimensions.get('window');

interface UserProfile {
  name: string;
  handle: string;
  bio: string;
}

const MEDIA_LABELS: Record<string, string> = {
  book: 'BOOKS', film: 'FILMS', tv: 'TV', album: 'ALBUMS', podcast: 'PODS', game: 'GAMES',
};

export default function ProfileScreen() {
  const { colors, mode, setMode } = useThemeStore();
  const { user, signOut } = useAuthStore();

  const { logs: allLogs, loading: logsLoading } = useLogs(undefined, 'date', 'all', true);
  const { seeds } = useTasteSeeds();

  const [profile, setProfile] = useState<UserProfile>({ name: '', handle: '', bio: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState('');
  const [nudgesOn, setNudgesOn] = useState(false);

  // Initialise nudge toggle from scheduled notifications
  useEffect(() => {
    if (Platform.OS === 'web') return;
    Notifications.getAllScheduledNotificationsAsync().then(
      (pending) => setNudgesOn(pending.length > 0),
    );
  }, []);
  const [feedOpen, setFeedOpen] = useState(false);
  const [annualGoal, setAnnualGoal] = useState<number | null>(null);
  const [goalInput, setGoalInput] = useState('');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  const toggleNudge = async () => {
    if (nudgesOn) {
      await cancelWeeklyNudge();
      setNudgesOn(false);
    } else {
      await scheduleWeeklyNudge();
      setNudgesOn(true);
    }
  };

  // Fetch profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from('users')
      .select('name, handle, bio, annual_goal')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({ name: data.name ?? '', handle: data.handle ?? '', bio: data.bio ?? '' });
          setAnnualGoal(data.annual_goal ?? null);
        }
        setProfileLoading(false);
      });
  }, [user]);

  // Compute stats
  const totalLogs = allLogs.length;
  const statsByType = Object.entries(MEDIA_LABELS).map(([key, label]) => ({
    key, label,
    count: allLogs.filter((l) => l.media_type === key).length,
  })).filter((s) => s.count > 0);

  const avgRating = allLogs.filter((l) => l.rating).length > 0
    ? (allLogs.reduce((sum, l) => sum + (l.rating ?? 0), 0) / allLogs.filter((l) => l.rating).length).toFixed(1)
    : null;

  const { currentStreak, longestStreak, thisYearCount } = computeStreaks(
    allLogs.map((l) => l.logged_at)
  );

  const handleSaveGoal = async () => {
    if (!user) return;
    const val = parseInt(goalInput, 10);
    if (isNaN(val) || val < 1) return;
    setAnnualGoal(val);
    setGoalDialogOpen(false);
    await supabase.from('users').upsert({ id: user.id, annual_goal: val });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        name: profile.name,
        handle: profile.handle.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: profile.bio,
        mode,
      });
      if (error) throw error;
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  if (profileLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Watermark */}
        <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>FOLIO</Text>

        {/* Header row */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            {/* Avatar placeholder */}
            <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
              <Text style={[styles.avatarInitial, { color: colors.accentt, fontFamily: fonts.display }]}>
                {profile.name ? profile.name[0].toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.nameBlock}>
              {editing ? (
                <>
                  <TextInput
                    style={[styles.editInput, { color: colors.ink, borderColor: colors.border2, fontFamily: fonts.display, fontSize: 20 }]}
                    value={profile.name}
                    onChangeText={(t) => setProfile((p) => ({ ...p, name: t }))}
                    placeholder="Your name"
                    placeholderTextColor={colors.ink3}
                  />
                  <TextInput
                    style={[styles.editInput, { color: colors.ink3, borderColor: colors.border2, fontFamily: fonts.mono, fontSize: 12 }]}
                    value={profile.handle}
                    onChangeText={(t) => setProfile((p) => ({ ...p, handle: t }))}
                    placeholder="handle"
                    placeholderTextColor={colors.ink3}
                    autoCapitalize="none"
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.name, { color: colors.ink, fontFamily: fonts.display }]}>
                    {profile.name || 'Your Name'}
                  </Text>
                  <Text style={[styles.handle, { color: colors.ink3, fontFamily: fonts.mono }]}>
                    @{profile.handle || 'handle'}
                  </Text>
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { borderColor: colors.border2 }]}
            onPress={editing ? handleSaveProfile : () => setEditing(true)}
            activeOpacity={0.7}
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Text style={[styles.editBtnText, { color: colors.accent, fontFamily: fonts.mono }]}>
                  {editing ? 'SAVE' : 'EDIT'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* Bio */}
        <View style={[styles.bioSection, { borderBottomColor: colors.border }]}>
          {editing ? (
            <TextInput
              style={[styles.bioInput, { color: colors.ink, borderColor: colors.border2, fontFamily: fonts.ui }]}
              value={profile.bio}
              onChangeText={(t) => setProfile((p) => ({ ...p, bio: t }))}
              placeholder="A short bio…"
              placeholderTextColor={colors.ink3}
              multiline
              numberOfLines={3}
            />
          ) : (
            <Text style={[styles.bio, { color: colors.ink2, fontFamily: fonts.bodyRoman }]}>
              {profile.bio || 'No bio yet.'}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsSection, { borderBottomColor: colors.border }]}>
          <View style={styles.statMain}>
            <Text style={[styles.statNumber, { color: colors.ink, fontFamily: fonts.display }]}>
              {totalLogs}
            </Text>
            <Text style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>LOGGED</Text>
          </View>
          {avgRating && (
            <View style={styles.statMain}>
              <Text style={[styles.statNumber, { color: colors.accent, fontFamily: fonts.display }]}>
                {avgRating}
              </Text>
              <Text style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>AVG RATING</Text>
            </View>
          )}
          <View style={styles.statMain}>
            <Text style={[styles.statNumber, { color: colors.editorial, fontFamily: fonts.display }]}>
              {seeds.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>TASTE SEEDS</Text>
          </View>
        </View>

        {/* Goals + Streaks */}
        <View style={[styles.goalSection, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.ink3, fontFamily: fonts.mono, marginBottom: 16 }]}>
            GOALS &amp; STREAKS
          </Text>
          <View style={styles.goalRow}>
            <GoalRing
              logged={thisYearCount}
              goal={annualGoal}
              color={colors.accent}
              dimColor={colors.border2}
              inkColor={colors.ink}
              ink3Color={colors.ink3}
              size={110}
              onPress={() => { setGoalInput(annualGoal?.toString() ?? ''); setGoalDialogOpen(true); }}
            />
            <View style={styles.streakBlock}>
              <View style={styles.streakItem}>
                <Text style={[styles.streakNumber, { color: currentStreak > 0 ? colors.streak : colors.ink, fontFamily: fonts.display }]}>
                  {currentStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
                  {currentStreak === 1 ? 'WEEK STREAK' : 'WEEKS STREAK'}
                </Text>
                {currentStreak > 0 && (
                  <Text style={[styles.streakSub, { color: colors.streak, fontFamily: fonts.mono }]}>ACTIVE</Text>
                )}
              </View>
              <View style={[styles.streakDivider, { backgroundColor: colors.border }]} />
              <View style={styles.streakItem}>
                <Text style={[styles.streakNumber, { color: colors.ink, fontFamily: fonts.display }]}>
                  {longestStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>BEST STREAK</Text>
              </View>
            </View>
          </View>

          {/* Goal dialog */}
          {goalDialogOpen && (
            <View style={[styles.goalDialog, { backgroundColor: colors.bg2, borderColor: colors.border2 }]}>
              <Text style={[styles.goalDialogLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
                HOW MANY THINGS THIS YEAR?
              </Text>
              <View style={styles.goalDialogRow}>
                <TextInput
                  style={[styles.goalInput, { color: colors.ink, borderColor: colors.border2, fontFamily: fonts.display }]}
                  value={goalInput}
                  onChangeText={setGoalInput}
                  keyboardType="number-pad"
                  placeholder="52"
                  placeholderTextColor={colors.ink3}
                  maxLength={4}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.goalSaveBtn, { backgroundColor: colors.accent }]}
                  onPress={handleSaveGoal}
                >
                  <Text style={[styles.goalSaveBtnText, { fontFamily: fonts.mono, color: colors.bg }]}>SET</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setGoalDialogOpen(false)}>
                  <Text style={[styles.goalCancelText, { color: colors.ink3, fontFamily: fonts.mono }]}>CANCEL</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Media breakdown */}
        {statsByType.length > 0 && (
          <View style={[styles.breakdownSection, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sectionHeading, { color: colors.ink3, fontFamily: fonts.mono }]}>BY MEDIUM</Text>
            <View style={styles.breakdown}>
              {statsByType.map((s) => (
                <View key={s.key} style={styles.breakdownItem}>
                  <Text style={[styles.breakdownCount, { color: colors.ink, fontFamily: fonts.display }]}>
                    {s.count}
                  </Text>
                  <Text style={[styles.breakdownLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Constellation ── */}
        <View style={[styles.constellationSection, { borderBottomColor: colors.border }]}>
          <View style={styles.constellationHeader}>
            <Text style={[styles.sectionHeading, { color: colors.ink3, fontFamily: fonts.mono }]}>
              TASTE CONSTELLATION
            </Text>
            <Text style={[styles.constellationSub, { color: colors.ink3, fontFamily: fonts.body }]}>
              {totalLogs === 0
                ? 'Log things to build your star map'
                : `${totalLogs} star${totalLogs !== 1 ? 's' : ''} · ${seeds.length} taste seed${seeds.length !== 1 ? 's' : ''}`}
            </Text>
          </View>

          {logsLoading ? (
            <View style={styles.constellationLoader}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <Constellation
              logs={allLogs}
              tasteSeeds={seeds}
              width={SCREEN_W - 48}
              height={(SCREEN_W - 48) * 0.7}
              showLabels={totalLogs < 40}
            />
          )}

        </View>

        {/* Year in Culture */}
        <View style={[styles.wrappedSection, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.wrappedBtn, { backgroundColor: W.terracotta }]}
            onPress={() => setWrappedOpen(true)}
            activeOpacity={0.85}
          >
            <View>
              <Text style={[styles.wrappedBtnLabel, { fontFamily: fonts.mono, color: `${W.cream}99` }]}>
                {new Date().getFullYear()} · YEAR IN CULTURE
              </Text>
              <Text style={[styles.wrappedBtnTitle, { fontFamily: fonts.display, color: W.cream }]}>
                WRAPPED
              </Text>
            </View>
            <Text style={{ color: `${W.cream}99`, fontSize: 24 }}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionHeading, { color: colors.ink3, fontFamily: fonts.mono }]}>SETTINGS</Text>

          <TouchableOpacity
            style={[styles.settingsRow, { borderColor: colors.border }]}
            onPress={() => setFeedOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.settingsLabel, { color: colors.ink, fontFamily: fonts.ui }]}>
              Social feed
            </Text>
            <Text style={[styles.settingsValue, { color: colors.accent, fontFamily: fonts.mono }]}>
              FEED →
            </Text>
          </TouchableOpacity>

          {/* Appearance selector */}
          <View style={[styles.appearanceSection, { borderColor: colors.border }]}>
            <Text style={[styles.appearanceLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
              APPEARANCE
            </Text>
            <View style={styles.themeCards}>
              {(['dark', 'light'] as ThemeMode[]).map((m) => {
                const t = m === 'dark' ? darkTheme : lightTheme;
                const active = mode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.themeCard, {
                      backgroundColor: t.bg2,
                      borderColor: active ? t.accent : t.border2,
                      borderWidth: active ? 2 : 1,
                    }]}
                    onPress={() => setMode(m)}
                    activeOpacity={0.8}
                  >
                    <FolioCodeMark size={16} color={t.accent} />
                    <Text style={[styles.themeCardName, { color: t.ink, fontFamily: fonts.mono }]}>
                      {THEME_NAMES[m].toUpperCase()}
                    </Text>
                    {active && (
                      <View style={[styles.themeCardActive, { backgroundColor: t.accent }]}>
                        <Text style={[styles.themeCardActiveText, { color: t.bg, fontFamily: fonts.mono }]}>
                          ✓
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.settingsRow, { borderColor: colors.border }]}
              onPress={toggleNudge}
              activeOpacity={0.7}
            >
              <Text style={[styles.settingsLabel, { color: colors.ink, fontFamily: fonts.ui }]}>
                Weekly log nudge
              </Text>
              <Text style={[styles.settingsValue, { color: nudgesOn ? colors.streak : colors.ink3, fontFamily: fonts.mono }]}>
                {nudgesOn ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.settingsRow, { borderColor: colors.border }]}
            onPress={async () => {
              if (enriching || !user) return;
              setEnriching(true);
              setEnrichProgress('Starting…');
              const { enriched } = await enrichCovers(user.id, (done, total) => {
                setEnrichProgress(`${done} / ${total}`);
              });
              setEnriching(false);
              setEnrichProgress('');
              Alert.alert('Done', `${enriched} covers refreshed.`);
            }}
            activeOpacity={0.7}
            disabled={enriching}
          >
            <Text style={[styles.settingsLabel, { color: colors.ink, fontFamily: fonts.ui }]}>
              Refresh cover art
            </Text>
            <Text style={[styles.settingsValue, { color: colors.ink3, fontFamily: fonts.mono }]}>
              {enriching ? enrichProgress : '→'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsRow, { borderColor: colors.border }]}
            onPress={() => setImportOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.settingsLabel, { color: colors.ink, fontFamily: fonts.ui }]}>
              Import library
            </Text>
            <Text style={[styles.settingsValue, { color: colors.ink3, fontFamily: fonts.mono }]}>
              GOODREADS / LETTERBOXD
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsRow, { borderColor: colors.border }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Text style={[styles.settingsLabel, { color: colors.terra, fontFamily: fonts.ui }]}>
              Sign out
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Wrapped modal */}
      <Modal visible={wrappedOpen} animationType="slide" onRequestClose={() => setWrappedOpen(false)}>
        <WrappedScreen onClose={() => setWrappedOpen(false)} />
      </Modal>

      {/* Feed modal */}
      <Modal visible={feedOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFeedOpen(false)}>
        <SocialScreen />
      </Modal>

      {/* Import modal */}
      <Modal visible={importOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setImportOpen(false)}>
        <ImportScreen onNext={() => setImportOpen(false)} onSkip={() => setImportOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  watermark: {
    position: 'absolute',
    fontSize: 160,
    opacity: 0.03,
    top: 0,
    right: -10,
    letterSpacing: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 28, letterSpacing: 0 },
  nameBlock: { flex: 1, gap: 2 },
  name: { fontSize: 24, letterSpacing: 2 },
  handle: { fontSize: 11, letterSpacing: 1 },
  editInput: {
    borderBottomWidth: 1,
    paddingVertical: 2,
    marginBottom: 4,
  },
  editBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editBtnText: { fontSize: 10, letterSpacing: 2 },

  bioSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  bio: { fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  bioInput: {
    borderWidth: 1,
    padding: 10,
    fontSize: 15,
    fontStyle: 'italic',
    minHeight: 64,
  },

  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    gap: 32,
  },
  statMain: { alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 36, letterSpacing: 2, lineHeight: 38 },
  statLabel: { fontSize: 9, letterSpacing: 2 },

  goalSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  streakBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakItem: { flex: 1, alignItems: 'center', gap: 2 },
  streakNumber: { fontSize: 36, letterSpacing: 2, lineHeight: 40 },
  streakLabel: { fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
  streakSub: { fontSize: 8, letterSpacing: 1, marginTop: 2 },
  streakDivider: { width: 1, height: 48 },

  goalDialog: {
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  goalDialogLabel: { fontSize: 9, letterSpacing: 2 },
  goalDialogRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalInput: {
    flex: 1,
    fontSize: 28,
    letterSpacing: 2,
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  goalSaveBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  goalSaveBtnText: { fontSize: 11, letterSpacing: 2 },
  goalCancelText: { fontSize: 10, letterSpacing: 1 },

  breakdownSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  breakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  breakdownItem: { alignItems: 'center', gap: 2 },
  breakdownCount: { fontSize: 24, letterSpacing: 2 },
  breakdownLabel: { fontSize: 8, letterSpacing: 1.5 },

  constellationSection: {
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  constellationHeader: {
    paddingHorizontal: 24,
    gap: 4,
  },
  constellationSub: { fontSize: 12, fontStyle: 'italic' },
  constellationLoader: { height: 200, alignItems: 'center', justifyContent: 'center' },
  sectionHeading: { fontSize: 10, letterSpacing: 2 },

  wrappedSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  wrappedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  wrappedBtnLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  wrappedBtnTitle: { fontSize: 36, letterSpacing: 6, lineHeight: 36 },

  settingsSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 0,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingsLabel: { fontSize: 15, fontStyle: 'italic' },
  settingsValue: { fontSize: 10, letterSpacing: 2 },

  appearanceSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  appearanceLabel: { fontSize: 10, letterSpacing: 2 },
  themeCards: { flexDirection: 'row', gap: 12 },
  themeCard: {
    flex: 1,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
    position: 'relative',
    minHeight: 72,
    justifyContent: 'center',
  },
  themeCardName: { fontSize: 8, letterSpacing: 1.5 },
  themeCardActive: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardActiveText: { fontSize: 9 },
});
