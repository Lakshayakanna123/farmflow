import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SHADOWS } from '../theme';

const StatCard = ({ title, count, countColor }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statCount, { color: countColor }]}>{count}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const CategoryChip = ({ title, active }) => (
  <TouchableOpacity style={[styles.chip, active && styles.chipActive]}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{title}</Text>
  </TouchableOpacity>
);

const ManagerDashboard = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={TYPOGRAPHY.h2}>Hi, Manager</Text>
            <Text style={styles.dateText}>Overview</Text>
          </View>
          <View style={styles.profileAvatar}><Text style={styles.profileInitial}>M</Text></View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard title="Total Tasks" count="32" countColor={COLORS.primary} />
          <StatCard title="Completed" count="18" countColor={COLORS.secondaryGreen} />
          <StatCard title="Pending" count="14" countColor={COLORS.brown} />
          <StatCard title="Issues" count="03" countColor={COLORS.dangerText} />
        </View>

        <Text style={[TYPOGRAPHY.h2, styles.sectionTitle]}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <CategoryChip title="Birds" active={true} />
          <CategoryChip title="Cows" active={false} />
          <CategoryChip title="Fish Tank" active={false} />
          <CategoryChip title="Vehicles" active={false} />
        </ScrollView>

        <Text style={[TYPOGRAPHY.h2, styles.sectionTitle]}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <Text style={TYPOGRAPHY.body}>Clean Bird Shed</Text>
          <Text style={styles.activityStatus}>Pending</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  dateText: {
    color: COLORS.brown,
    marginTop: 4,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  profileInitial: {
    color: COLORS.white,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    width: '48%',
    padding: 18,
    borderRadius: RADIUS.card,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  statCount: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  statTitle: {
    color: COLORS.brown,
    fontSize: 14,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  categoriesScroll: {
    marginBottom: 24,
  },
  chip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.secondaryGreen,
    borderColor: COLORS.secondaryGreen,
  },
  chipText: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.white,
  },
  activityCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: RADIUS.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  activityStatus: {
    color: COLORS.primary,
    backgroundColor: COLORS.cardAccent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '600',
  }
});

export default ManagerDashboard;
