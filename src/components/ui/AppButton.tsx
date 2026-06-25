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
          backgroundColor: colors.background,
          borderColor: colors.primaryMid,
          textColor: colors.text,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primaryMid,
          textColor: colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: colors.danger,
          borderColor: colors.danger,
          textColor: '#FFFFFF',
        };
      case 'primary':
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          textColor: '#FFFFFF',
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
      style={[animatedStyle, { backgroundColor: styles.backgroundColor, borderColor: styles.borderColor, borderWidth: 1 }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={styles.textColor} size="small" />
      ) : (
        <View style={{ height: 56, borderRadius: 22, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.55 : 1 }}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={{ color: styles.textColor, fontFamily: undefined, fontSize: 16, fontWeight: '700' }}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};
