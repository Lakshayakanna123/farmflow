import React from 'react';
import { Text, Pressable, View, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  className = '',
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950',
          text: 'text-emerald-800 dark:text-emerald-200 font-semibold',
          border: 'border-0',
        };
      case 'outline':
        return {
          bg: 'bg-transparent',
          text: 'text-emerald-700 dark:text-emerald-300 font-semibold',
          border: 'border border-emerald-600/30 dark:border-emerald-500/30',
        };
      case 'danger':
        return {
          bg: 'bg-orange-700 dark:bg-orange-800',
          text: 'text-white font-semibold',
          border: 'border-0',
        };
      case 'primary':
      default:
        return {
          bg: 'bg-emerald-700 dark:bg-emerald-600',
          text: 'text-white font-semibold',
          border: 'border-0',
        };
    }
  };

  const styles = getStyles();

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1);
    }
  };

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      className={`h-14 rounded-2xl flex-row items-center justify-center px-6 ${styles.bg} ${styles.border} ${disabled ? 'opacity-50' : 'active:opacity-90'} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : '#FFFFFF'} size="small" />
      ) : (
        <View className="flex-row items-center justify-center space-x-2">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`text-base text-center ${styles.text}`}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};
