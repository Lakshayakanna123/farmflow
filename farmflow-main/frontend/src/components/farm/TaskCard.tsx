import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Bird, Fish, Milk, ShieldAlert, Truck, Wrench, Check, Clock, User, Heart, Waves } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  // onToggle is kept for backward compatibility but checkbox no longer toggles status directly.
  onToggle: () => void;
  onPress?: () => void;
  delay?: number;
}


const CATEGORY_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  birds:       { icon: Bird,       color: '#D84315', bg: '#FBE9E7', label: 'Poultry' },
  fish:        { icon: Fish,       color: '#0277BD', bg: '#E1F5FE', label: 'Aquaculture' },
  pond:        { icon: Waves,      color: '#0097A7', bg: '#E0F7FA', label: 'Pond' },
  health:      { icon: Heart,      color: '#00ACC1', bg: '#E0F7FA', label: 'Health' },
  calves:      { icon: Milk,       color: '#6A1B9A', bg: '#F3E5F5', label: 'Calves Pen' },
  cow_shed:    { icon: ShieldAlert, color: '#00695C', bg: '#E0F2F1', label: 'Dairy Shed' },
  vehicles:    { icon: Truck,       color: '#37474F', bg: '#ECEFF1', label: 'Vehicles' },
  maintenance: { icon: Wrench,      color: '#4E342E', bg: '#EFEBE9', label: 'Maintenance' },
};

const PRIORITY_META = {
  high:   { label: 'HIGH',   color: '#9B1C1C', bg: '#FEECEC' },
  medium: { label: 'MEDIUM', color: '#C8860A', bg: '#FFF6E0' },
  low:    { label: 'LOW',    color: '#2D5A27', bg: '#EAF4E8' },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onPress, delay = 0 }) => {
  const { colors, isDark } = useTheme();
  const category = CATEGORY_META[task.category] || CATEGORY_META['maintenance'];
  const priority = PRIORITY_META[task.priority] || PRIORITY_META['low'];
  const IconComponent = category.icon;

  const isCompleted = task.status === 'completed';

  // Checkbox animation
  const checkedProgress = useSharedValue(isCompleted ? 1 : 0);
  const cardOpacity     = useSharedValue(0);
  const cardTranslateY  = useSharedValue(16);

  useEffect(() => {
    checkedProgress.value = withSpring(isCompleted ? 1 : 0, { damping: 14, stiffness: 200 });
  }, [task.status]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      cardOpacity.value    = withTiming(1, { duration: 320 });
      cardTranslateY.value = withSpring(0, { damping: 16 });
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const checkboxBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      checkedProgress.value,
      [0, 1],
      [isDark ? '#1A2B1A' : '#FFFFFF', colors.primary]
    ),
    borderColor: interpolateColor(
      checkedProgress.value,
      [0, 1],
      [isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', colors.primary]
    ),
  }));

  const checkIconStyle = useAnimatedStyle(() => ({
    opacity: checkedProgress.value,
    transform: [{ scale: checkedProgress.value }],
  }));

  const s = cardStyles(colors, isDark, isCompleted, category);

  return (
    <Animated.View style={[cardAnimStyle, { marginBottom: 10 }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          s.card,
          pressed && { opacity: 0.90, transform: [{ scale: 0.99 }] },
        ]}
      >
        {/* Left accent bar — color matches category */}
        <View style={[s.accentBar, { backgroundColor: isCompleted ? colors.primary : category.color }]} />

        <View style={s.inner}>
          {/* ── Checkbox ── */}
          <Pressable
            onPress={() => {
              // Intentionally no-op: completion is handled by tapping the task (onPress)
              // so the user can provide photo + GPS + notes before completing.
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ marginRight: 12 }}
          >
            <Animated.View style={[s.checkbox, checkboxBgStyle]}>
              <Animated.View style={checkIconStyle}>
                <Check size={13} color="#FFFFFF" strokeWidth={3.5} />
              </Animated.View>
            </Animated.View>
          </Pressable>

          {/* ── Task Info ── */}
          <View style={{ flex: 1 }}>
            <Text
              style={[s.title, { textDecorationLine: isCompleted ? 'line-through' : 'none', fontFamily: 'Poppins_600SemiBold' }]}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            <View style={s.meta}>
              {/* Category chip */}
              <View style={[s.chip, { backgroundColor: isCompleted ? colors.primaryGlow : category.bg }]}>
                <IconComponent size={11} color={isCompleted ? colors.primary : category.color} />
                <Text style={[s.chipTxt, { color: isCompleted ? colors.primary : category.color, fontFamily: 'Inter_400Regular' }]}>
                  {' '}{category.label}
                </Text>
              </View>

              {/* Assignee */}
              {task.assignedTo && (
                <View style={s.assignee}>
                  <User size={10} color={colors.textMuted} />
                  <Text style={[s.assigneeTxt, { color: colors.textMuted, fontFamily: 'Inter_400Regular' }]}>
                    {' '}{task.assignedTo.split(' ')[0]}
                  </Text>
                </View>
              )}

              {/* Time Slot */}
              {task.details?.time && (
                <View style={[s.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Clock size={11} color={colors.textSecondary} />
                  <Text style={[s.chipTxt, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    {' '}{task.details.time}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Priority Badge ── */}
          <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 44 }}>
            <View style={[s.priorityBadge, { backgroundColor: isCompleted ? colors.primaryGlow : priority.bg }]}>
              <Text style={[s.priorityTxt, { color: isCompleted ? colors.primary : priority.color, fontFamily: 'Poppins_400Regular' }]}>
                {isCompleted ? '✓ Done' : priority.label}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const cardStyles = (colors: any, isDark: boolean, isCompleted: boolean, category: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: 'hidden',
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: isCompleted ? colors.primary + '25' : colors.cardBorder,
      shadowColor: isCompleted ? colors.primary : '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isCompleted ? 0.08 : isDark ? 0.15 : 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    accentBar: {
      width: 4,
      alignSelf: 'stretch',
    },
    inner: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 8,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: isCompleted ? colors.textSecondary : colors.text,
      lineHeight: 20,
      marginBottom: 6,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    chipTxt: {
      fontSize: 10,
      fontWeight: '700',
    },
    assignee: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    assigneeTxt: {
      fontSize: 10,
      fontWeight: '600',
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    priorityTxt: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
  });
export default React.memo(TaskCard);