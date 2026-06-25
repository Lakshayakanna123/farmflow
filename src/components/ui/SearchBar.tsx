import React, { useCallback } from 'react';
import { View, TextInput, ScrollView, Pressable, Text } from 'react-native';
import { Search, X, Bird, Fish, Milk, ShieldAlert, Truck, Wrench } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { TaskCategory } from '../../types';

interface SearchBarProps {
  query: string;
  onQueryChange: (text: string) => void;
  selectedCategory: TaskCategory | null;
  onCategoryChange: (category: TaskCategory | null) => void;
  placeholder?: string;
}

const CATEGORIES: { id: TaskCategory; label: string; icon: any }[] = [
  { id: 'birds', label: 'Birds', icon: Bird },
  { id: 'fish', label: 'Fish', icon: Fish },
  { id: 'calves', label: 'Calves', icon: Milk },
  { id: 'cow_shed', label: 'Cow Shed', icon: ShieldAlert },
  { id: 'vehicles', label: 'Vehicles', icon: Truck },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
];

const SearchBarComponent: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  selectedCategory,
  onCategoryChange,
  placeholder = 'Search tasks...',
}) => {
  const { colors, isDark } = useTheme();
  const handleClearQuery = useCallback(() => onQueryChange(''), [onQueryChange]);

  return (
    <View className="mb-4">
      {/* Search Input Box */}
      <View 
        style={{ 
          backgroundColor: colors.card,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(62, 39, 35, 0.05)',
          borderWidth: 1
        }}
        className="flex-row items-center h-12 rounded-2xl px-4 shadow-sm"
      >
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={{ color: colors.text }}
          className="flex-1 ml-3 text-sm font-medium h-full"
        />
        {query.length > 0 && (
          <Pressable onPress={handleClearQuery} className="p-1">
            <X size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Categories ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3 flex-row"
        contentContainerStyle={{ paddingRight: 20 }}
      >
        <Pressable
          onPress={() => onCategoryChange(null)}
          style={{
            backgroundColor: selectedCategory === null 
              ? colors.primary 
              : colors.card,
            borderColor: selectedCategory === null 
              ? colors.primary
              : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(62, 39, 35, 0.05)',
            borderWidth: 1
          }}
          className="px-4 py-2 rounded-xl mr-2 flex-row items-center shadow-xs"
        >
          <Text
            style={{
              color: selectedCategory === null 
                ? '#FFFFFF' 
                : colors.text
            }}
            className="text-xs font-semibold"
          >
            All Areas
          </Text>
        </Pressable>

        {CATEGORIES.map((cat) => {
          const IconComponent = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onCategoryChange(cat.id)}
              style={{
                backgroundColor: isSelected ? colors.primary : colors.card,
                borderColor: isSelected 
                  ? colors.primary
                  : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(62, 39, 35, 0.05)',
                borderWidth: 1
              }}
              className="px-4 py-2 rounded-xl mr-2 flex-row items-center shadow-xs"
            >
              <IconComponent 
                size={14} 
                color={isSelected ? '#FFFFFF' : colors.textSecondary} 
                className="mr-1.5"
              />
              <Text
                style={{
                  color: isSelected ? '#FFFFFF' : colors.text
                }}
                className="text-xs font-semibold"
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export const SearchBar = React.memo(SearchBarComponent);
