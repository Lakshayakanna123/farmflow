import React from 'react';
import { View, Text } from 'react-native';
import { AppCard } from './AppCard';
import { useTheme } from '../../hooks/useTheme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  delay = 0,
}) => {
  const { colors } = useTheme();

  return (
    <AppCard delay={delay} className="flex-1 min-w-[140px] p-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text 
          numberOfLines={1}
          style={{ color: colors.textSecondary }} 
          className="text-xs font-medium uppercase tracking-wider"
        >
          {title}
        </Text>
        {icon && <View className="opacity-80">{icon}</View>}
      </View>
      
      <Text 
        style={{ color: colors.text }} 
        className="text-2xl font-bold tracking-tight mb-1"
      >
        {value}
      </Text>
      
      {trend && (
        <View className="flex-row items-center space-x-1 mb-1">
          <Text 
            className={`text-xs font-semibold ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </Text>
          <Text 
            style={{ color: colors.textSecondary }} 
            className="text-[10px]"
          >
            vs yesterday
          </Text>
        </View>
      )}
      
      {description && (
        <Text 
          numberOfLines={2}
          style={{ color: colors.textSecondary }} 
          className="text-xs font-normal"
        >
          {description}
        </Text>
      )}
    </AppCard>
  );
};
