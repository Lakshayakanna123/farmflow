import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const CalendarStrip: React.FC<CalendarStripProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const { colors, isDark } = useTheme();

  // Helper to generate the current week (Monday to Sunday)
  const getWeekDays = () => {
    const current = new Date();
    const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
    
    // Adjust to Monday start
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getWeekDays();

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const getDayName = (date: Date) => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return names[date.getDay()];
  };

  return (
    <View className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
        className="flex-row"
      >
        <View className="flex-row justify-between w-full space-x-2">
          {days.map((day, idx) => {
            const active = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <Pressable
                key={idx}
                onPress={() => onSelectDate(day)}
                style={{
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active 
                    ? colors.primary 
                    : isToday 
                      ? colors.primary + '40'
                      : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(62, 39, 35, 0.05)',
                  borderWidth: 1,
                  width: 48,
                  height: 64,
                }}
                className="rounded-2xl items-center justify-center shadow-xs"
              >
                <Text
                  style={{
                    color: active 
                      ? '#FFFFFF' 
                      : colors.textSecondary,
                  }}
                  className="text-[10px] uppercase font-bold tracking-wider mb-1"
                >
                  {getDayName(day)}
                </Text>
                <Text
                  style={{
                    color: active ? '#FFFFFF' : colors.text,
                  }}
                  className="text-base font-extrabold"
                >
                  {day.getDate()}
                </Text>
                {isToday && !active && (
                  <View 
                    style={{ backgroundColor: colors.primary }} 
                    className="w-1.5 h-1.5 rounded-full absolute bottom-1.5"
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};
