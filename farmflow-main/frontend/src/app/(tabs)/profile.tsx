import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Sun, Moon, Database, LogOut, Shield, ChevronRight, AlertTriangle, X } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { StorageService } from '../../services/storage';
import { AppCard } from '../../components/ui/AppCard';
import { User as UserType } from '../../types';

// ── Cross-platform confirmation dialog ─────────────────────────────────────
function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmDanger = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        className="flex-1 items-center justify-center px-6"
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            width: '100%',
            maxWidth: 360,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.35,
            shadowRadius: 40,
            elevation: 20,
          }}
        >
          {/* Icon */}
          <View className="pt-8 pb-4 items-center">
            <View
              style={{
                backgroundColor: confirmDanger ? '#B71C1C18' : colors.primaryGlow + '33',
                width: 64,
                height: 64,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {confirmDanger ? (
                <AlertTriangle size={30} color="#B71C1C" />
              ) : (
                <Shield size={30} color={colors.primary} />
              )}
            </View>
          </View>

          {/* Text */}
          <View className="px-6 pb-6 items-center">
            <Text
              style={{ color: colors.text }}
              className="text-lg font-black text-center mb-2"
            >
              {title}
            </Text>
            <Text
              style={{ color: colors.textSecondary }}
              className="text-sm text-center leading-relaxed"
            >
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View
            style={{ borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderTopWidth: 1 }}
            className="flex-row"
          >
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
                borderBottomLeftRadius: 24,
              })}
            >
              <Text style={{ color: colors.textSecondary }} className="text-base font-semibold">
                Cancel
              </Text>
            </Pressable>

            <View
              style={{
                width: 1,
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              }}
            />

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 16,
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
                borderBottomRightRadius: 24,
              })}
            >
              <Text
                style={{ color: confirmDanger ? '#B71C1C' : colors.primary }}
                className="text-base font-black"
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { theme, isDark, colors, setThemeMode } = useTheme();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const u = await StorageService.getCurrentUser();
      if (!u) {
        router.replace('/login');
      } else {
        setUser(u);
      }
    };
    loadUser();
  }, []);

  // ── Sign Out ────────────────────────────────────────────────────────────
  const handleLogOut = async () => {
    setIsLoggingOut(true);
    try {
      await StorageService.logout();
    } catch (_) { /* ignore */ }
    setShowLogoutDialog(false);
    // Small delay to allow the modal to close cleanly before navigation
    setTimeout(() => {
      router.replace('/login');
    }, 120);
  };

  // ── Reset Data ──────────────────────────────────────────────────────────
  const handleResetData = async () => {
    await StorageService.resetAllData();
    setShowResetDialog(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  const themeOptions: { mode: 'light' | 'dark'; label: string; icon: any }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
  ];

  const roleColor = user?.role === 'manager' ? colors.warning : colors.primary;
  const roleBg = user?.role === 'manager' ? colors.warningLight : colors.successLight;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background }} className="flex-1">
      
      {/* ── Confirmation Dialogs ── */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title="Sign Out?"
        message="You will be returned to the login screen. Any unsaved changes will be lost."
        confirmLabel={isLoggingOut ? 'Signing out…' : 'Sign Out'}
        confirmDanger
        onConfirm={handleLogOut}
        onCancel={() => setShowLogoutDialog(false)}
      />
      <ConfirmDialog
        visible={showResetDialog}
        title="Reset All Data?"
        message="This will wipe all task progress and return the checklist to its initial seed state. This cannot be undone."
        confirmLabel="Reset Data"
        confirmDanger
        onConfirm={handleResetData}
        onCancel={() => setShowResetDialog(false)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        className="px-5"
      >

        {/* ── Page Header ── */}
        <View className="mt-6 mb-6">
          <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase tracking-wider">
            Your Account
          </Text>
          <Text style={{ color: colors.text }} className="text-3xl font-black tracking-tight mt-1">
            Profile & Settings
          </Text>
        </View>

        {/* ── User Identity Card ── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
            marginBottom: 20,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            {/* Avatar */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: roleBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <User size={34} color={roleColor} strokeWidth={2} />
            </View>

            {/* Info */}
            <View className="flex-1">
              <Text style={{ color: colors.text }} className="text-xl font-black tracking-tight">
                {user?.name ?? '—'}
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm mt-0.5">
                @{user?.username}
              </Text>

              {/* Role Badge */}
              <View
                style={{
                  backgroundColor: roleBg,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  alignSelf: 'flex-start',
                  marginTop: 8,
                }}
              >
                <Text style={{ color: roleColor }} className="text-xs font-black uppercase tracking-wider">
                  {user?.role} {user?.department ? `· ${user.department}` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Toast Banner ── */}
        {resetDone && (
          <View
            style={{
              backgroundColor: colors.successLight,
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Shield size={16} color={colors.success} style={{ marginRight: 10 }} />
            <Text style={{ color: colors.success }} className="text-sm font-bold flex-1">
              Checklist data has been reset successfully.
            </Text>
          </View>
        )}

        {/* ── Theme Preferences ── */}
        <Text style={{ color: colors.text }} className="text-xs font-black uppercase tracking-widest mb-3 mt-2 ml-1">
          Display
        </Text>
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 16,
            marginBottom: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-4">
            Application Theme
          </Text>
          <View className="flex-row gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  onPress={() => setThemeMode(opt.mode)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: active
                      ? colors.primary
                      : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    borderWidth: active ? 0 : 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <Icon size={20} color={active ? '#FFFFFF' : colors.textSecondary} />
                  <Text
                    style={{ color: active ? '#FFFFFF' : colors.text }}
                    className="text-xs font-bold mt-2"
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Maintenance Actions ── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 28,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Pressable
            onPress={() => setShowResetDialog(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : 'transparent',
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
            })}
          >
            <View className="flex-row items-center flex-1">
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: colors.warningLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Database size={18} color={colors.warning} />
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-sm font-bold">
                  Reset Local Checklist State
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs mt-0.5">
                  Re-seed AsyncStorage tasks & activities
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* ── Sign Out Button ── */}
        {/* 🔴 Red used purposefully here — destructive session-ending action */}
        <Pressable
          onPress={() => setShowLogoutDialog(true)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#7F1010' : '#B71C1C',
            borderRadius: 18,
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.9 : 1,
            shadowColor: '#B71C1C',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 14,
            elevation: 6,
          })}
        >
          <LogOut size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
            Sign Out
          </Text>
        </Pressable>

        <Text style={{ color: colors.textMuted }} className="text-xs text-center mt-4">
          FarmFlow · v1.0.0
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}
