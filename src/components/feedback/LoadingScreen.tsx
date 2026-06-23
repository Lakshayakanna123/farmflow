import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading farm data...',
}) => {
  const { colors } = useTheme();

  return (
    <View 
      style={{ backgroundColor: colors.background }} 
      className="flex-1 items-center justify-center"
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text 
          style={{ color: colors.textSecondary }} 
          className="text-sm font-semibold mt-4 tracking-wide"
        >
          {message}
        </Text>
      )}
    </View>
  );
};
