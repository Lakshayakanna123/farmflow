import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, ClipboardCheck, AreaChart, User } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { StorageService } from '../../services/storage';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const [role, setRole] = useState<'employee' | 'manager' | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const currentUser = await StorageService.getCurrentUser();
        if (currentUser) {
          setRole(currentUser.role);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRole();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(62, 39, 35, 0.05)',
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 10,
          elevation: 8,
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.2 : 0.03,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklists',
          tabBarIcon: ({ color, size }) => <ClipboardCheck size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manager"
        options={{
          title: 'Analytics',
          href: role === 'manager' ? undefined : null, // Hide tab if employee
          tabBarIcon: ({ color, size }) => <AreaChart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
