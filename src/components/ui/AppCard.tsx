import React from 'react';
import { View, ViewStyle, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
  onPress?: () => void;
  delay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  className = '',
  onPress,
  delay = 0,
}) => {
  const { colors, isDark } = useTheme();

  const cardStyle = [
    {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: (colors as any).cardBorder || (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(62, 39, 35, 0.05)'),
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.28 : 0.04,
      shadowRadius: 14,
      elevation: 4,
    },
    style,
  ] as ViewStyle[];

  const animation = FadeInDown.delay(delay).duration(400).springify();

  if (onPress) {
    return (
      <AnimatedPressable
        entering={animation}
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
        className={`p-5 overflow-hidden ${className}`}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      entering={animation}
      style={cardStyle}
      className={`p-5 overflow-hidden ${className}`}
    >
      {children}
    </Animated.View>
  );
};
