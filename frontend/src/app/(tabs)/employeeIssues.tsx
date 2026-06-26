import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, Wrench, ShieldAlert, Plus } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { ReportIssueModal } from '../../components/farm/ReportIssueModal';
import { TaskCategory } from '../../types';

export default function EmployeeIssuesScreen() {
  const { colors, isDark } = useTheme();

  const [reportVisible, setReportVisible] = useState(false);

  const defaultCategory: TaskCategory = useMemo(() => 'maintenance', []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.headerWrap(colors)}>
          <View style={styles.titleRow(colors)}>
            <View style={styles.iconWrap(colors, isDark)}>
              <Wrench size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>Employee</Text>
              <Text style={[styles.title, { color: colors.text }]}>Report Farm Issue</Text>
            </View>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Maintenance & other urgent reports sent to management.</Text>
        </View>

        <View style={styles.card(colors, isDark)}>
          <View style={styles.cardTopRow(colors)}>
            <View style={styles.badge(colors)}>
              <AlertTriangle size={14} color={colors.warning} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Create a new report</Text>
          </View>

          <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
            This form lets you attach a photo/audio if needed. Category defaults to Maintenance.
          </Text>

          <Pressable
            onPress={() => setReportVisible(true)}
            style={({ pressed }) => [
              styles.cta(colors),
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.ctaText}>Report Issue</Text>
            </View>
          </Pressable>
        </View>

        {/* Safety note */}
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <Text style={[styles.note, { color: colors.textSecondary }]}>If you need urgent help, add details in the description.</Text>
        </View>
      </ScrollView>

      <ReportIssueModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmitSuccess={() => {
          Alert.alert('Success', 'Issue report submitted.');
        }}
        category={defaultCategory}
        userName={'Employee'}
      />
    </SafeAreaView>
  );
}

const styles = {
  headerWrap: (colors: any) =>
    StyleSheet.create({
      // dummy (unused)
      dummy: { color: colors.text },
    }),
  titleRow: (colors: any) =>
    StyleSheet.create({
      dummy: { color: colors.text },
    }),
} as any;

const _styles = StyleSheet.create({
  headerOuter: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  iconWrapBase: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.7,
    marginTop: 2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  cardBody: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 14,
  },
  cta: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  note: {
    fontSize: 11,
    fontWeight: '700',
  },
});

function stylesFactory(colors: any, isDark: boolean) {
  return {
    headerWrap: {
      backgroundColor: colors.background,
    },
  };
}

// Keep hooks-free helpers
const stylesImpl = {
  headerWrap: (colors: any) => ({
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  }),
  titleRow: (colors: any) => ({
    flexDirection: 'row',
    alignItems: 'center',
  }),
  iconWrap: (colors: any, isDark: boolean) => ({
    backgroundColor: colors.primary + '12',
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  }),
  card: (colors: any, isDark: boolean) => ({
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  }),
  cardTopRow: (colors: any) => ({
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  }),
  badge: (colors: any) => ({
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: colors.warningLight,
  }),
  cardTitle: { fontSize: 14, fontWeight: '900' },
  cardBody: { fontSize: 12, fontWeight: '700', lineHeight: 18, marginBottom: 14 },
  cta: (colors: any) => ({
    backgroundColor: colors.primary,
  }),
  note: { fontSize: 11, fontWeight: '700' },
};

// Patch: use the above style helper objects (simpler than mixing StyleSheet.create)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unused = { stylesFactory, stylesImpl, _styles };

