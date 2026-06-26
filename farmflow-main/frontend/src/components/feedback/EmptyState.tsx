import React from 'react';
import { View, Text } from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Tasks Found',
  description = 'Everything looks clean! There are no tasks matching your filters today.',
  icon,
}) => {
  const { colors } = useTheme();

  return (
    <View className="flex-1 items-center justify-center py-12 px-6">
      <View 
        style={{ backgroundColor: colors.primary + '10' }} 
        className="w-16 h-16 rounded-3xl items-center justify-center mb-4"
      >
        {icon || <ClipboardList size={32} color={colors.primary} />}
      </View>
      <Text 
        style={{ color: colors.text }} 
        className="text-lg font-bold text-center mb-1"
      >
        {title}
      </Text>
      <Text 
        style={{ color: colors.textSecondary }} 
        className="text-sm font-normal text-center max-w-[280px]"
      >
        {description}
      </Text>
    </View>
  );
};
