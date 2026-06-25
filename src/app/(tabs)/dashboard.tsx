import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert,
  Animated as RNAnimated, StyleSheet, Modal,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sun, Wind, Droplets, LogOut, AlertTriangle,
  Bird, Fish, Milk, ShieldAlert, Truck, Wrench,
  Bell, CheckCircle, Clock, MapPin, ChevronRight, X,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { StorageService } from '../../services/storage';
import { Task, User, ActivityLog, TaskCategory } from '../../types';
import { SearchBar } from '../../components/ui/SearchBar';
import { TaskCard } from '../../components/farm/TaskCard';
import { ProgressCard } from '../../components/farm/ProgressCard';
import { CalendarStrip } from '../../components/feedback/CalendarStrip';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingScreen } from '../../components/feedback/LoadingScreen';
import { TaskDetailModal } from '../../components/farm/TaskDetailModal';
import { ReportIssueModal } from '../../components/farm/ReportIssueModal';

// ── Quick action categories ────────────────────────────────────────────────
const QUICK_ACTIONS: { id: TaskCategory; label: string; icon: any; color: string; bg: string }[] = [
  { id: 'birds',       label: 'Birds',       icon: Bird,       color: '#D84315', bg: '#FBE9E7' },
  { id: 'fish',        label: 'Fish',        icon: Fish,       color: '#0277BD', bg: '#E1F5FE' },
  { id: 'calves',      label: 'Calves',      icon: Milk,       color: '#6A1B9A', bg: '#F3E5F5' },
  { id: 'cow_shed',    label: 'Cow Shed',    icon: ShieldAlert, color: '#00695C', bg: '#E0F2F1' },
  { id: 'vehicles',    label: 'Vehicles',    icon: Truck,       color: '#37474F', bg: '#ECEFF1' },
  { id: 'maintenance', label: 'Repairs',     icon: Wrench,      color: '#4E342E', bg: '#EFEBE9' },
];

// ── Sign Out Confirmation Dialog (web-safe) ───────────────────────────────
function LogoutDialog({
  visible,
  onConfirm,
  onCancel,
  colors,
  isDark,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  colors: any;
  isDark: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        <View style={{
          backgroundColor: colors.card, borderRadius: 24, width: '100%', maxWidth: 340,
          shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.30, shadowRadius: 40, elevation: 20,
          borderWidth: 1, borderColor: colors.cardBorder,
        }}>
          <View style={{ alignItems: 'center', paddingTop: 28, paddingBottom: 16 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: colors.dangerLight, alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={26} color={colors.dangerMid} />
            </View>
          </View>
          <View style={{ paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: 8 }}>Sign Out?</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              You'll be returned to the login screen. Unsaved changes will be lost.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.divider }}>
            <Pressable onPress={onCancel} style={({ pressed }) => ({ flex: 1, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 15 }}>Cancel</Text>
            </Pressable>
            <View style={{ width: 1, backgroundColor: colors.divider }} />
            <Pressable onPress={onConfirm} style={({ pressed }) => ({ flex: 1, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ color: colors.dangerMid, fontWeight: '900', fontSize: 15 }}>Sign Out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [user, setUser]           = useState<User | null>(null);
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [query, setQuery]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [taskDetailVisible, setTaskDetailVisible]   = useState(false);
  const [reportIssueVisible, setReportIssueVisible] = useState(false);
  const [reportedIssueTask, setReportedIssueTask]   = useState<Task | null>(null);
  const [logoutVisible, setLogoutVisible]           = useState(false);
  const [currentTime, setCurrentTime]               = useState(new Date());
  const [locationLabel, setLocationLabel]           = useState('Sunnybrook Farm');

  const headerAnim = useRef(new RNAnimated.Value(0)).current;

  const params = useLocalSearchParams<{ filterCategory?: TaskCategory }>();

  const fetchData = async () => {
    try {
      const currentUser = await StorageService.getCurrentUser();
      if (!currentUser) { router.replace('/login'); return; }
      setUser(currentUser);
      const [allTasks, recentActivities] = await Promise.all([
        StorageService.getTasks(),
        StorageService.getActivities(),
      ]);
      setTasks(allTasks);
      setActivities(recentActivities);
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    RNAnimated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          if (!isActive) return;
          setLocationLabel(`${loc.coords.latitude.toFixed(2)}, ${loc.coords.longitude.toFixed(2)}`);
        }
      } catch (error) {
        console.warn('Location capture failed', error);
      }
    })();
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    if (params.filterCategory) setSelectedCategory(params.filterCategory);
  }, [params.filterCategory]);

  const handleToggleTask = useCallback(async (taskInput: Task | string) => {
    if (!user) return;
    const task = typeof taskInput === 'string' ? tasks.find((item) => item.id === taskInput) : taskInput;
    if (!task) return;

    const requiresChecklist = task.status === 'pending' && ['birds', 'fish'].includes(task.category);
    if (requiresChecklist) {
      Alert.alert(
        'Photo Proof Required',
        'This task requires photo proof. Please complete it from the checklist screen.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Checklist', onPress: () => router.push(task.category === 'birds' ? '/checklist/birds' : '/checklist/fish') },
        ]
      );
      return;
    }

    const updatedTasks = await StorageService.toggleTask(task.id, user.name);
    setTasks(updatedTasks);
    const recentActivities = await StorageService.getActivities();
    setActivities(recentActivities);
  }, [user, tasks]);

  const handleLogOutConfirm = useCallback(async () => {
    await StorageService.logout();
    setLogoutVisible(false);
    setTimeout(() => router.replace('/login'), 100);
  }, []);

  const handlePressTask = useCallback((task: Task) => {
    if (task.status === 'pending' && (task.category === 'birds' || task.category === 'fish')) {
      router.push(task.category === 'birds' ? '/checklist/birds' : '/checklist/fish');
      return;
    }
    setSelectedTaskDetail(task);
    setTaskDetailVisible(true);
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch   = task.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = selectedCategory ? task.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [tasks, query, selectedCategory]);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount     = tasks.length;

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const s = dashStyles(colors, isDark);

  if (loading) return <LoadingScreen message="Assembling your schedule…" />;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <LogoutDialog
        visible={logoutVisible}
        onConfirm={handleLogOutConfirm}
        onCancel={() => setLogoutVisible(false)}
        colors={colors}
        isDark={isDark}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── HEADER ── */}
        <RNAnimated.View style={[s.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>{greeting},</Text>
            <Text style={s.name}>{user?.name?.split(' ')[0]} 👋</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {/* Report Issue */}
            <Pressable
              onPress={() => { setReportedIssueTask(null); setReportIssueVisible(true); }}
              style={({ pressed }) => [s.headerBtn, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={[s.headerBtnBadge, { backgroundColor: colors.warningLight }]}>
                <AlertTriangle size={18} color={colors.warning} />
              </View>
            </Pressable>
            {/* Sign Out */}
            <Pressable
              onPress={() => setLogoutVisible(true)}
              style={({ pressed }) => [s.headerBtn, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={[s.headerBtnBadge, { backgroundColor: colors.dangerLight }]}>
                <LogOut size={18} color={colors.dangerMid} />
              </View>
            </Pressable>
          </View>
        </RNAnimated.View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* ── Calendar ── */}
          <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

          {/* ── Weather Banner ── */}
          <View style={s.weatherCard}>
            <View style={s.weatherLeft}>
              <View style={[s.weatherIconWrap, { backgroundColor: '#FFF9C4' }]}>
                <Sun size={26} color="#F9A825" strokeWidth={1.8} />
              </View>
              <View>
                <Text style={[s.weatherTemp, { color: colors.text }]}>24°C · Sunny</Text>
                <View style={s.weatherMeta}>
                  <MapPin size={12} color={colors.textMuted} />
                  <Text style={[s.weatherMetaText, { color: colors.textSecondary }]}> {locationLabel}</Text>
                  <Text style={[s.weatherMetaText, { color: colors.textSecondary }]}> · {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            </View>
            <View style={s.weatherRight}>
              <View style={s.weatherStat}>
                <Droplets size={13} color={colors.textMuted} />
                <Text style={[s.weatherStatTxt, { color: colors.textSecondary }]}>65%</Text>
              </View>
              <View style={[s.weatherStat, { marginLeft: 12 }]}>
                <Wind size={13} color={colors.textMuted} />
                <Text style={[s.weatherStatTxt, { color: colors.textSecondary }]}>12 km/h</Text>
              </View>
            </View>
          </View>

          {/* ── Progress Card ── */}
          <ProgressCard completed={completedCount} total={totalCount} />

          {/* ── Quick Actions ── */}
          <Text style={[s.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={s.quickGrid}>
            {QUICK_ACTIONS.map((act) => {
              const Icon = act.icon;
              const isActive = selectedCategory === act.id;
              return (
                <Pressable
                  key={act.id}
                  onPress={() => setSelectedCategory(isActive ? null : act.id)}
                  style={({ pressed }) => [
                    s.quickBtn,
                    {
                      backgroundColor: isActive ? act.color : colors.card,
                      borderColor: isActive ? act.color : colors.cardBorder,
                      opacity: pressed ? 0.82 : 1,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                >
                  <View style={[
                    s.quickIconWrap,
                    { backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : act.bg },
                  ]}>
                    <Icon size={22} color={isActive ? '#FFFFFF' : act.color} />
                  </View>
                  <Text style={[
                    s.quickLabel,
                    { color: isActive ? '#FFFFFF' : colors.text },
                  ]} numberOfLines={1}>
                    {act.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Task List ── */}
          <View style={s.taskListHeader}>
            <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              Today's Checklist
            </Text>
            {selectedCategory && (
              <Pressable onPress={() => setSelectedCategory(null)} style={[s.resetPill, { backgroundColor: colors.primaryGlow }]}>
                <X size={10} color={colors.primary} />
                <Text style={[s.resetPillTxt, { color: colors.primary }]}> Reset</Text>
              </Pressable>
            )}
          </View>

          {/* Search */}
          <View style={{ marginBottom: 12 }}>
            <SearchBar
              query={query}
              onQueryChange={setQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </View>

          {filteredTasks.length === 0 ? (
            <EmptyState />
          ) : (
            filteredTasks.map((item, idx) => (
              <TaskCard
                key={item.id}
                task={item}
                onToggle={() => handleToggleTask(item)}
                onPress={() => handlePressTask(item)}
                delay={idx * 40}
              />
            ))
          )}

          {/* ── Activity Feed ── */}
          <Text style={[s.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <View style={[s.activityCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {activities.slice(0, 5).map((log, idx) => {
              const isLast = idx === Math.min(4, activities.length - 1);
              return (
                <View
                  key={log.id}
                  style={[
                    s.activityRow,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                  ]}
                >
                  {/* Dot */}
                  <View style={[s.activityDot, { backgroundColor: colors.primaryGlow, borderColor: colors.primary + '40' }]}>
                    <CheckCircle size={10} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.activityUser, { color: colors.text }]}>{log.userName}</Text>
                    <Text style={[s.activityAction, { color: colors.textSecondary }]} numberOfLines={1}>
                      {log.action}
                    </Text>
                  </View>
                  <View style={s.activityTime}>
                    <Clock size={10} color={colors.textMuted} />
                    <Text style={[s.activityTimeTxt, { color: colors.textMuted }]}>
                      {' '}{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

        </View>
      </ScrollView>

      {/* ── Task Detail ── */}
      <TaskDetailModal
        visible={taskDetailVisible}
        onClose={() => setTaskDetailVisible(false)}
        task={selectedTaskDetail}
        onToggleStatus={() => {
          if (selectedTaskDetail) {
            handleToggleTask(selectedTaskDetail.id);
            setTaskDetailVisible(false);
          }
        }}
        onReportIssue={() => {
          setReportedIssueTask(selectedTaskDetail);
          setTaskDetailVisible(false);
          setReportIssueVisible(true);
        }}
        onNotesSaved={fetchData}
      />

      {/* ── Report Issue ── */}
      <ReportIssueModal
        visible={reportIssueVisible}
        onClose={() => { setReportIssueVisible(false); setReportedIssueTask(null); }}
        onSubmitSuccess={fetchData}
        task={reportedIssueTask}
        userName={user?.name || 'Worker'}
      />
    </SafeAreaView>
  );
}

const dashStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  headerBtn: {
    borderRadius: 16,
  },
  headerBtnBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Weather
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  weatherLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weatherIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherTemp: { fontSize: 15, fontWeight: '800' },
  weatherSub: { fontSize: 12, marginTop: 2 },
  weatherRight: { flexDirection: 'row', alignItems: 'center' },
  weatherMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  weatherMetaText: { fontSize: 11, fontWeight: '600' },
  weatherStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weatherStatTxt: { fontSize: 12, fontWeight: '600' },

  // Sections
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 12,
    marginTop: 20,
  },

  // Quick Actions
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickBtn: {
    flexBasis: '48%',
    maxWidth: '48%',
    minWidth: 140,
    aspectRatio: 0.95,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Task list header
  taskListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  resetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  resetPillTxt: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Activity
  activityCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  activityDot: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  activityUser: {
    fontSize: 12,
    fontWeight: '800',
  },
  activityAction: {
    fontSize: 11,
    marginTop: 1,
  },
  activityTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTimeTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
});
