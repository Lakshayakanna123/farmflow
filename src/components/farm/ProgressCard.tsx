import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { TrendingUp, CheckCircle, Circle as CircleIcon } from 'lucide-react-native';

interface ProgressCardProps {
  completed: number;
  total: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const ProgressCard: React.FC<ProgressCardProps> = ({ completed, total }) => {
  const { colors, isDark } = useTheme();
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const radius        = 38;
  const strokeWidth   = 7;
  const circumference = 2 * Math.PI * radius;

  const animProgress  = useSharedValue(0);
  const barWidth      = useSharedValue(0);

  useEffect(() => {
    animProgress.value = withTiming(total > 0 ? completed / total : 0, { duration: 1000 });
    barWidth.value     = withTiming(total > 0 ? completed / total : 0, { duration: 900 });
  }, [completed, total]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animProgress.value),
  }));

  const barAnimStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%` as any,
  }));

  // Color the ring based on completion
  const ringColor = percentage >= 80 ? colors.primary
    : percentage >= 40 ? colors.accent
    : colors.dangerMid;

  const s = progressStyles(colors, isDark);

  return (
    <View style={s.card}>
      {/* ── Left: Stats ── */}
      <View style={{ flex: 1, paddingRight: 16 }}>
        <View style={s.titleRow}>
          <View style={[s.titleIcon, { backgroundColor: colors.primaryGlow }]}>
            <TrendingUp size={14} color={colors.primary} />
          </View>
          <Text style={[s.title, { color: colors.text }]}>Daily Progress</Text>
        </View>

        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          {completed === total && total > 0
            ? '🎉 All tasks complete!'
            : `${total - completed} task${total - completed !== 1 ? 's' : ''} remaining`}
        </Text>

        {/* ── Mini progress bar ── */}
        <View style={[s.barTrack, { backgroundColor: colors.backgroundAlt }]}>
          <Animated.View style={[s.barFill, barAnimStyle, { backgroundColor: ringColor }]} />
        </View>

        {/* ── Stat Pills ── */}
        <View style={s.pills}>
          <View style={[s.pill, { backgroundColor: colors.primaryGlow }]}>
            <CheckCircle size={11} color={colors.primary} />
            <Text style={[s.pillTxt, { color: colors.primary }]}> {completed} done</Text>
          </View>
          <View style={[s.pill, { backgroundColor: colors.accentLight, marginLeft: 8 }]}>
            <CircleIcon size={11} color={colors.accent} />
            <Text style={[s.pillTxt, { color: colors.accent }]}> {total - completed} left</Text>
          </View>
        </View>
      </View>

      {/* ── Right: SVG Ring ── */}
      <View style={s.ringWrap}>
        <Svg width={90} height={90} viewBox="0 0 90 90">
          <Defs>
            <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={ringColor} stopOpacity={1} />
              <Stop offset="100%" stopColor={ringColor} stopOpacity={0.75} />
            </LinearGradient>
          </Defs>
          {/* Track */}
          <Circle cx="45" cy="45" r={radius} stroke={colors.backgroundAlt} strokeWidth={strokeWidth} fill="none" />
          {/* Progress */}
          <AnimatedCircle
            cx="45" cy="45" r={radius}
            stroke="url(#ringGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            animatedProps={animatedCircleProps}
            strokeLinecap="round"
            fill="none"
            transform="rotate(-90 45 45)"
          />
        </Svg>
        {/* Center Label */}
        <View style={s.ringCenter}>
          <Text style={[s.ringPct, { color: colors.text }]}>{percentage}%</Text>
        </View>
      </View>
    </View>
  );
};

const progressStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  titleIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  barTrack: {
    height: 6,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 12,
  },
  barFill: {
    height: '100%',
    borderRadius: 100,
  },
  pills: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  ringWrap: {
    width: 90,
    height: 90,
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
});

export default React.memo(ProgressCard);
