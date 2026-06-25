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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text numberOfLines={1} style={{ color: colors.textSecondary, textTransform: 'uppercase', fontSize: 12, fontWeight: '700' }}>
          {title}
        </Text>
        {icon && <View style={{ opacity: 0.9 }}>{icon}</View>}
      </View>

      <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '800', marginBottom: 6 }}>
        {value}
      </Text>

      {trend && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: trend.isPositive ? colors.primary : colors.warning }}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>vs yesterday</Text>
        </View>
      )}

      {description && (
        <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: 12 }}>
          {description}
        </Text>
      )}
    </AppCard>
  );
};
