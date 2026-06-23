import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bird, Fish, Milk, ShieldAlert, Truck, Wrench, ChevronRight, ClipboardList } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { StorageService } from '../../services/storage';
import { LoadingScreen } from '../../components/feedback/LoadingScreen';
import { TaskCategory } from '../../types';

// ── Department config ─────────────────────────────────────────────────────
const SECTIONS: {
  id: TaskCategory;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  bg: string;
}[] = [
  { id: 'birds',       title: 'Poultry & Birds',       subtitle: 'Feed, Water, Eggs, Vaccination',         icon: Bird,        color: '#D84315', bg: '#FBE9E7' },
  { id: 'fish',        title: 'Aquaculture & Fish',     subtitle: 'Oxygen, pH, Feeding, Tank cleaning',     icon: Fish,        color: '#0277BD', bg: '#E1F5FE' },
  { id: 'calves',      title: 'Calves Pen',             subtitle: 'Milk feeding, Vaccines, Weight tracker', icon: Milk,        color: '#6A1B9A', bg: '#F3E5F5' },
  { id: 'cow_shed',    title: 'Dairy Cow Shed',         subtitle: 'Milking, Feed check, Sanitation logs',   icon: ShieldAlert, color: '#00695C', bg: '#E0F2F1' },
  { id: 'vehicles',    title: 'Farm Vehicles',          subtitle: 'Tractors, Trucks, Fuel, Driver logs',    icon: Truck,       color: '#37474F', bg: '#ECEFF1' },
  { id: 'maintenance', title: 'Utility & Maintenance',  subtitle: 'Generators, Pumps, Daily repairs',       icon: Wrench,      color: '#4E342E', bg: '#EFEBE9' },
];

// ── Animated department card ──────────────────────────────────────────────
function DeptCard({
  section,
  stats,
  index,
  onPress,
  colors,
  isDark,
}: {
  section: typeof SECTIONS[0];
  stats: { completed: number; total: number };
  index: number;
  onPress: () => void;
  colors: any;
  isDark: boolean;
}) {
  const anim = useRef(new RNAnimated.Value(0)).current;
  const completion = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  useEffect(() => {
    const timeout = setTimeout(() => {
      RNAnimated.spring(anim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, index * 80);
    return () => clearTimeout(timeout);
  }, []);

  const Icon = section.icon;

  const progressColor = completion === 100
    ? colors.primary
    : completion >= 50
    ? colors.accent
    : section.color;

  return (
    <RNAnimated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
      marginBottom: 12,
    }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles(colors, isDark).deptCard,
          pressed && { transform: [{ scale: 0.985 }], opacity: 0.90 },
        ]}
      >
        {/* Left accent */}
        <View style={[styles(colors, isDark).accentBar, { backgroundColor: completion === 100 ? colors.primary : section.color }]} />

        {/* Icon */}
        <View style={[styles(colors, isDark).iconWrap, { backgroundColor: completion === 100 ? colors.primaryGlow : section.bg }]}>
          <Icon size={26} color={completion === 100 ? colors.primary : section.color} strokeWidth={1.8} />
        </View>

        {/* Text & Progress */}
        <View style={{ flex: 1 }}>
          <Text style={[styles(colors, isDark).deptTitle, { color: colors.text }]} numberOfLines={1}>
            {section.title}
          </Text>
          <Text style={[styles(colors, isDark).deptSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {section.subtitle}
          </Text>

          {/* Progress bar */}
          <View style={[styles(colors, isDark).barTrack, { backgroundColor: colors.backgroundAlt }]}>
            <View style={[styles(colors, isDark).barFill, {
              width: `${completion}%`,
              backgroundColor: progressColor,
            }]} />
          </View>

          {/* Progress label */}
          <Text style={[styles(colors, isDark).progressLabel, { color: progressColor }]}>
            {stats.completed}/{stats.total} tasks · {completion}%
            {completion === 100 ? ' ✓' : ''}
          </Text>
        </View>

        {/* Chevron */}
        <ChevronRight size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
      </Pressable>
    </RNAnimated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────
export default function ChecklistScreen() {
  const { colors, isDark } = useTheme();
  const router   = useRouter();
  const [statsMap, setStatsMap] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const headerAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const load = async () => {
      try {
        const summary = await StorageService.getSummary();
        setStatsMap(summary.byCategory);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        RNAnimated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      }
    };
    load();
  }, []);

  if (loading) return <LoadingScreen message="Loading department checklists…" />;

  const totalCompleted = SECTIONS.reduce((acc, s) => acc + (statsMap?.[s.id]?.completed || 0), 0);
  const totalTasks     = SECTIONS.reduce((acc, s) => acc + (statsMap?.[s.id]?.total     || 0), 0);
  const overallPct     = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ backgroundColor: colors.background, flex: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Header ── */}
        <RNAnimated.View style={{
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 8,
        }}>
          <Text style={[styles(colors, isDark).eyebrow, { color: colors.textSecondary }]}>
            Operations Hub
          </Text>
          <Text style={[styles(colors, isDark).pageTitle, { color: colors.text }]}>
            Departments
          </Text>
        </RNAnimated.View>

        {/* ── Summary Banner ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={[styles(colors, isDark).summaryCard, {
            backgroundColor: overallPct === 100 ? colors.primaryGlow : colors.card,
            borderColor: overallPct === 100 ? colors.primary + '40' : colors.cardBorder,
          }]}>
            <View style={[styles(colors, isDark).summaryIcon, {
              backgroundColor: overallPct === 100 ? colors.primary : colors.primaryGlow,
            }]}>
              <ClipboardList size={20} color={overallPct === 100 ? '#FFFFFF' : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles(colors, isDark).summaryTitle, { color: colors.text }]}>
                {overallPct === 100 ? '🎉 Farm Complete!' : `${overallPct}% Farm Progress`}
              </Text>
              <Text style={[styles(colors, isDark).summarySub, { color: colors.textSecondary }]}>
                {totalCompleted} of {totalTasks} tasks across all departments
              </Text>
            </View>
            <Text style={[styles(colors, isDark).summaryPct, { color: overallPct === 100 ? colors.primary : colors.accent }]}>
              {overallPct}%
            </Text>
          </View>
        </View>

        {/* ── Department Cards ── */}
        <View style={{ paddingHorizontal: 20 }}>
          {SECTIONS.map((section, index) => {
            const stats = statsMap?.[section.id] || { completed: 0, total: 0 };
            return (
              <DeptCard
                key={section.id}
                section={section}
                stats={stats}
                index={index}
                colors={colors}
                isDark={isDark}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/dashboard',
                    params: { filterCategory: section.id },
                  })
                }
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    pageTitle: {
      fontSize: 30,
      fontWeight: '900',
      letterSpacing: -0.8,
      marginTop: 4,
    },
    // Summary
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 18,
      borderRadius: 18,
      borderWidth: 1,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 3,
    },
    summaryIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryTitle: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    summarySub: {
      fontSize: 12,
      marginTop: 2,
    },
    summaryPct: {
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    // Department card
    deptCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.15 : 0.05,
      shadowRadius: 8,
      elevation: 3,
      paddingVertical: 16,
      paddingRight: 16,
      gap: 14,
    },
    accentBar: {
      width: 5,
      alignSelf: 'stretch',
      borderTopRightRadius: 3,
      borderBottomRightRadius: 3,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deptTitle: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    deptSub: {
      fontSize: 11,
      marginTop: 2,
      marginBottom: 10,
    },
    barTrack: {
      height: 5,
      borderRadius: 100,
      overflow: 'hidden',
      marginBottom: 5,
    },
    barFill: {
      height: '100%',
      borderRadius: 100,
    },
    progressLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
