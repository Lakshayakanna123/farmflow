import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, TextInput, Image, ImageBackground, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, G, Text as SvgText, Line, Circle as SvgCircle } from 'react-native-svg';
import { 
  ShieldCheck, BarChart4, Users, ClipboardCheck, ArrowUpRight, 
  Bird, Fish, Milk, ShieldAlert, Truck, Wrench, Heart,
  Bell, AlertTriangle, Calendar, Check, CheckCircle2, ChevronRight, X, HelpCircle, Play,
  Image as ImageIcon
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { StorageService } from '../../services/storage';
import { AppCard } from '../../components/ui/AppCard';
import { StatCard } from '../../components/ui/StatCard';
import { AppButton } from '../../components/ui/AppButton';
import { BottomSheet } from '../../components/feedback/BottomSheet';
import { LoadingScreen } from '../../components/feedback/LoadingScreen';
import { FarmSummary, TaskCategory, Issue, Notification, Task, User } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES_INFO: Record<TaskCategory, { label: string; icon: any; color: string }> = {
  birds: { label: 'Birds', icon: Bird, color: '#FF7043' },
  fish: { label: 'Fish', icon: Fish, color: '#29B6F6' },
  pond: { label: 'Pond', icon: Fish, color: '#26C6DA' },
  calves: { label: 'Calves', icon: Milk, color: '#AB47BC' },
  cow_shed: { label: 'Cow Shed', icon: ShieldAlert, color: '#26A69A' },
  vehicles: { label: 'Vehicles', icon: Truck, color: '#78909C' },
  maintenance: { label: 'Maintenance', icon: Wrench, color: '#8D6E63' },
  health: { label: 'Health Check', icon: Heart, color: '#00ACC1' },
};

const WORKERS = ['Silas Green', 'John Carver', 'Clara Fields'];

export default function ManagerDashboardScreen() {
  const { colors, isDark } = useTheme();

  // Navigation Portal Tab State
  const [activeTab, setActiveTab] = useState<'analytics' | 'notifications' | 'issues' | 'scheduler' | 'gallery'>('analytics');
  
  // Data State
  const [summary, setSummary] = useState<FarmSummary | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [photos, setPhotos] = useState<Array<{ id: string; taskId?: string; category?: TaskCategory; uri: string; reportedBy: string; timestamp: string }>>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [galleryFilter, setGalleryFilter] = useState<'all' | TaskCategory>('all');

  // Modals / Action Sheets State
  const [selectedRescheduleTask, setSelectedRescheduleTask] = useState<Task | null>(null);
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueDetailVisible, setIssueDetailVisible] = useState(false);
  const [addEmployeeVisible, setAddEmployeeVisible] = useState(false);

  // Form Fields State
  const [rescheduleDateOption, setRescheduleDateOption] = useState<'today' | 'tomorrow' | '2days' | '3days' | 'nextweek'>('tomorrow');
  const [rescheduleAssignee, setRescheduleAssignee] = useState('');
  const [reschedulePriority, setReschedulePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeUsername, setNewEmployeeUsername] = useState('');
  const [newEmployeePassword, setNewEmployeePassword] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeeDepartment, setNewEmployeeDepartment] = useState<TaskCategory>('birds');
  const [newEmployeeLoading, setNewEmployeeLoading] = useState(false);
  
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolvingIssue, setResolvingIssue] = useState(false);
  const [savingReschedule, setSavingReschedule] = useState(false);

  const loadData = async () => {
    try {
      const sum = await StorageService.getSummary();
      setSummary(sum);

      const nots = await StorageService.getNotifications();
      setNotifications(nots);

      const iss = await StorageService.getIssues();
      setIssues(iss);

      const tks = await StorageService.getTasks();
      setTasks(tks);

      const ph = await StorageService.getPhotos();
      setPhotos(ph);

      const users = await StorageService.getUsers();
      setEmployees(users.filter((user) => user.role === 'employee'));
    } catch (e) {
      console.error('Failed to load manager portal data:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshGallery = async () => {
    try {
      const ph = await StorageService.getPhotos();
      setPhotos(ph);
      Alert.alert('Gallery refreshed', `${ph.length} photos loaded.`);
    } catch (e) {
      console.error('Failed to refresh gallery', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEmployee = async () => {
    if (!newEmployeeName.trim() || !newEmployeeUsername.trim() || !newEmployeePassword.trim()) {
      Alert.alert('Validation Error', 'Name, username, and password are required.');
      return;
    }
    setNewEmployeeLoading(true);
    try {
      const newEmployee = await StorageService.registerEmployee({
        name: newEmployeeName.trim(),
        username: newEmployeeUsername.trim(),
        password: newEmployeePassword,
        email: newEmployeeEmail.trim() || undefined,
        department: newEmployeeDepartment,
      });
      setEmployees((prev) => [newEmployee, ...prev]);
      setAddEmployeeVisible(false);
      setNewEmployeeName('');
      setNewEmployeeUsername('');
      setNewEmployeePassword('');
      setNewEmployeeEmail('');
      setNewEmployeeDepartment('birds');
      Alert.alert('Success', 'New employee account registered successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Registration Error', error instanceof Error ? error.message : 'Unable to register employee.');
    } finally {
      setNewEmployeeLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleMarkRead = async (id: string) => {
    const updated = await StorageService.markNotificationRead(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = async () => {
    const updated = await StorageService.markAllNotificationsRead();
    setNotifications(updated);
  };

  const handleOpenReschedule = (task: Task) => {
    setSelectedRescheduleTask(task);
    setRescheduleAssignee(task.assignedTo);
    setReschedulePriority(task.priority);
    setRescheduleReason('');
    setRescheduleVisible(true);
  };

  const handleSaveReschedule = async () => {
    if (!selectedRescheduleTask) return;
    if (!rescheduleReason.trim()) {
      Alert.alert('Validation Error', 'Please enter a reason for rescheduling.');
      return;
    }

    setSavingReschedule(true);
    try {
      // Calculate target date
      const targetDate = new Date();
      if (rescheduleDateOption === 'tomorrow') targetDate.setDate(targetDate.getDate() + 1);
      else if (rescheduleDateOption === '2days') targetDate.setDate(targetDate.getDate() + 2);
      else if (rescheduleDateOption === '3days') targetDate.setDate(targetDate.getDate() + 3);
      else if (rescheduleDateOption === 'nextweek') targetDate.setDate(targetDate.getDate() + 7);

      await StorageService.rescheduleTask(
        selectedRescheduleTask.id,
        targetDate.toISOString(),
        rescheduleAssignee,
        reschedulePriority,
        rescheduleReason.trim()
      );

      Alert.alert('Success', 'Task has been rescheduled and reassigned successfully.');
      setRescheduleVisible(false);
      loadData();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to reschedule task.');
    } finally {
      setSavingReschedule(false);
    }
  };

  const handleOpenIssueDetail = (issue: Issue) => {
    setSelectedIssue(issue);
    setResolutionNotes(issue.resolutionNotes || '');
    setIssueDetailVisible(true);
  };

  const handleResolveIssueSubmit = async () => {
    if (!selectedIssue) return;
    setResolvingIssue(true);
    try {
      await StorageService.resolveIssue(selectedIssue.id, resolutionNotes.trim());
      Alert.alert('Resolved', 'Issue marked as resolved.');
      setIssueDetailVisible(false);
      loadData();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to resolve issue.');
    } finally {
      setResolvingIssue(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Aggregating farm analytics..." />;
  }

  // --- CALCULATION FOR CHARTS ---
  const chartHeight = 150;
  const chartWidth = SCREEN_WIDTH - 80;
  const padding = 20;

  const categories = Object.keys(summary?.byCategory || {}) as TaskCategory[];
  const barWidth = 22;
  const barSpacing = (chartWidth - padding * 2 - barWidth * categories.length) / (categories.length - 1);

  // Issues category counts for SVG Pie chart
  const pendingIssues = issues.filter(i => i.status === 'pending');
  const resolvedIssues = issues.filter(i => i.status === 'resolved');
  const equipmentIssues = issues.filter(i => i.type === 'equipment').length;
  const healthIssues = issues.filter(i => i.type === 'animal_health').length;
  const supplyIssues = issues.filter(i => i.type === 'supply').length;
  const otherIssues = issues.filter(i => i.type === 'other').length;
  const totalIssuesCount = issues.length;

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background }} className="flex-1">
      
      {/* Top Header */}
      <View className="px-5 mt-6 mb-4 flex-row items-center justify-between">
        <View>
          <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase tracking-wider">
            Management Portal
          </Text>
          <Text style={{ color: colors.text }} className="text-2xl font-black tracking-tight mt-0.5">
            Farm Operations Control
          </Text>
        </View>
        <View className="flex-row items-center space-x-3">
          <View style={{ backgroundColor: colors.primary + '18' }} className="px-3 py-1.5 rounded-full flex-row items-center">
            <ShieldCheck size={14} color={colors.primary} className="mr-1" />
            <Text style={{ color: colors.primary }} className="text-[10px] font-extrabold uppercase">
              Manager
            </Text>
          </View>
          <AppButton
            label="Add Team Member"
            variant="secondary"
            onPress={() => setAddEmployeeVisible(true)}
            className="py-2 px-3"
          />
        </View>
      </View>

      {/* Tabs Menu Navigation Bar */}
      <View className="px-5 flex-row justify-between border-b border-brown-200/5 dark:border-white/5 pb-2 mb-4">
        {[
          { id: 'analytics', label: 'Analytics', icon: BarChart4 },
          { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadNotificationsCount },
          { id: 'issues', label: 'Issues', icon: AlertTriangle, badge: pendingIssues.length },
          { id: 'gallery', label: 'Gallery', icon: ImageIcon, badge: photos.length },
          { id: 'scheduler', label: 'Scheduler', icon: Calendar },
        ].map((tab) => {
          const active = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              className="pb-2 relative flex-row items-center px-1"
            >
              <TabIcon size={14} color={active ? colors.primary : colors.textSecondary} className="mr-1" />
              <Text 
                style={{ color: active ? colors.primary : colors.textSecondary }} 
                className={`text-xs font-bold ${active ? 'opacity-100' : 'opacity-70'}`}
              >
                {tab.label}
              </Text>
              {tab.badge !== undefined && tab.badge > 0 ? (
                <View 
                  style={{ backgroundColor: colors.danger }} 
                  className="ml-1 px-1.5 py-0.5 rounded-full items-center justify-center min-w-[16px]"
                >
                  <Text className="text-[8px] text-white font-black">{tab.badge}</Text>
                </View>
              ) : null}
              {active && (
                <View 
                  style={{ backgroundColor: colors.primary }} 
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-full" 
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Main Content Areas */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} className="px-5">
        
        {/* --- ANALYTICS TAB --- */}
        {activeTab === 'analytics' && (
          <View className="space-y-4">
            {/* Stats Overview */}
            <View className="flex-row space-x-3 mb-4">
              <StatCard
                title="Total Active Tasks"
                value={summary?.totalTasks || 0}
                icon={<ClipboardCheck size={18} color={colors.primary} />}
                description="Assigned checklist tasks"
                delay={0}
              />
              <StatCard
                title="Completion Rate"
                value={`${summary?.completionRate || 0}%`}
                icon={<BarChart4 size={18} color={colors.success} />}
                trend={{ value: '12%', isPositive: true }}
                delay={100}
              />
            </View>

            {/* Department Chart Card */}
            <AppCard delay={150} className="mb-4 p-5">
              <Text style={{ color: colors.text }} className="text-base font-extrabold mb-1">
                Department Performance
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-xs font-normal mb-5">
                Daily task completion rate by department
              </Text>

              <View className="items-center justify-center">
                <Svg width={chartWidth} height={chartHeight + 20}>
                  {[0, 25, 50, 75, 100].map((level) => {
                    const y = chartHeight - (level / 100) * (chartHeight - padding);
                    return (
                      <G key={level}>
                        <Line
                          x1={padding}
                          y1={y}
                          x2={chartWidth - padding}
                          y2={y}
                          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(62,39,35,0.04)'}
                          strokeWidth={1}
                        />
                        <SvgText
                          x={padding - 5}
                          y={y + 4}
                          fill={colors.textSecondary}
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="end"
                        >
                          {level}%
                        </SvgText>
                      </G>
                    );
                  })}

                  {categories.map((cat, index) => {
                    const catStats = summary?.byCategory[cat] || { total: 0, completed: 0 };
                    const rate = catStats.total > 0 ? (catStats.completed / catStats.total) * 100 : 0;
                    
                    const x = padding + index * (barWidth + barSpacing) + 6;
                    const barValHeight = ((chartHeight - padding) * rate) / 100;
                    const y = chartHeight - barValHeight;
                    const catInfo = CATEGORIES_INFO[cat];

                    return (
                      <G key={cat}>
                        <Rect
                          x={x}
                          y={padding}
                          width={barWidth}
                          height={chartHeight - padding}
                          fill={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(62,39,35,0.03)'}
                          rx={5}
                        />
                        <Rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barValHeight}
                          fill={catInfo.color}
                          rx={5}
                        />
                        <SvgText
                          x={x + barWidth / 2}
                          y={chartHeight + 15}
                          fill={colors.textSecondary}
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {catInfo.label.substring(0, 3)}
                        </SvgText>
                      </G>
                    );
                  })}
                </Svg>
              </View>
            </AppCard>

            {/* Issue Breakdown Summary Chart (Premium Design Addition) */}
            <AppCard delay={200} className="mb-4 p-5">
              <Text style={{ color: colors.text }} className="text-base font-extrabold mb-1">
                Security & Issues Breakdown
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-xs mb-4">
                Distribution of issues reported by type
              </Text>
              
              {totalIssuesCount === 0 ? (
                <Text style={{ color: colors.textSecondary }} className="text-xs italic text-center py-4">
                  No issues filed to display analytics.
                </Text>
              ) : (
                <View className="flex-row items-center justify-between">
                  {/* SVG Donut / Pie Representation */}
                  <View className="items-center justify-center mr-4">
                    <Svg width={110} height={110}>
                      {/* Placeholder circles simulating pie parts */}
                      <SvgCircle cx={55} cy={55} r={40} fill="none" stroke="#FF7043" strokeWidth={15} strokeDasharray={[equipmentIssues * 25, 250]} />
                      <SvgCircle cx={55} cy={55} r={40} fill="none" stroke="#29B6F6" strokeWidth={15} strokeDasharray={[healthIssues * 25, 250]} strokeDashoffset={-40} />
                      <SvgCircle cx={55} cy={55} r={40} fill="none" stroke="#AB47BC" strokeWidth={15} strokeDasharray={[supplyIssues * 25, 250]} strokeDashoffset={-80} />
                      <SvgCircle cx={55} cy={55} r={40} fill="none" stroke="#8D6E63" strokeWidth={15} strokeDasharray={[otherIssues * 25, 250]} strokeDashoffset={-120} />
                      <SvgCircle cx={55} cy={55} r={32} fill={colors.card} />
                    </Svg>
                  </View>
                  
                  {/* Legend list */}
                  <View className="flex-1 space-y-2">
                    {[
                      { label: 'Equipment Malfunction', count: equipmentIssues, color: '#FF7043' },
                      { label: 'Animal Health', count: healthIssues, color: '#29B6F6' },
                      { label: 'Supply Shortages', count: supplyIssues, color: '#AB47BC' },
                      { label: 'Other Warnings', count: otherIssues, color: '#8D6E63' },
                    ].map((item) => (
                      <View key={item.label} className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View style={{ backgroundColor: item.color }} className="w-2.5 h-2.5 rounded-full mr-2" />
                          <Text style={{ color: colors.textSecondary }} className="text-[10px] font-semibold">{item.label}</Text>
                        </View>
                        <Text style={{ color: colors.text }} className="text-xs font-bold">{item.count}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </AppCard>

            {/* Workers list */}
            <View className="mt-2">
              <Text style={{ color: colors.text }} className="text-sm font-bold uppercase tracking-wider mb-3">
                Employee Performance
              </Text>
              <AppCard className="p-0 overflow-hidden">
              {employees.length === 0 ? (
                <View className="p-5 items-center justify-center">
                  <Text style={{ color: colors.textSecondary }} className="text-xs text-center">
                    No employees registered yet. Add a new team member to assign tasks and manage checklists.
                  </Text>
                </View>
              ) : (
                employees.map((employee, index) => {
                  const categoryKey = employee.department || 'birds';
                  const catInfo = CATEGORIES_INFO[categoryKey as TaskCategory] || CATEGORIES_INFO.birds;
                  const Icon = catInfo.icon;
                  const completionRate = `${80 + (index * 5)}%`;

                  return (
                    <View key={employee.id} className={`p-4 flex-row items-center justify-between ${index < employees.length - 1 ? 'border-b border-brown-200/5 dark:border-white/5' : ''}`}>
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-xl bg-slate-500/10 items-center justify-center mr-3">
                          <Icon size={20} color={catInfo.color} />
                        </View>
                        <View>
                          <Text style={{ color: colors.text }} className="text-sm font-bold">{employee.name}</Text>
                          <Text style={{ color: colors.textSecondary }} className="text-[10px]">
                            {catInfo.label} Department • Active
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: colors.success }} className="text-xs font-extrabold">
                        {completionRate}
                      </Text>
                    </View>
                  );
                })
              )}
            </AppCard>
            </View>
          </View>
        )}

        {/* --- ALERTS & NOTIFICATIONS TAB --- */}
        {activeTab === 'notifications' && (
          <View className="space-y-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase">
                Recent updates ({notifications.length})
              </Text>
              {unreadNotificationsCount > 0 && (
                <Pressable onPress={handleMarkAllRead} className="py-1 px-3 bg-emerald-500/10 rounded-full">
                  <Text style={{ color: colors.primary }} className="text-[10px] font-black uppercase">
                    Mark all read
                  </Text>
                </Pressable>
              )}
            </View>

            {notifications.length === 0 ? (
              <AppCard className="p-8 items-center justify-center">
                <Bell size={32} color={colors.textSecondary} className="opacity-40 mb-2" />
                <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">No notifications filed yet.</Text>
              </AppCard>
            ) : (
              notifications.map((not) => {
                const isUnread = !not.read;
                let IconComp = Bell;
                let iconColor = colors.primary;
                if (not.type === 'issue_reported') { IconComp = AlertTriangle; iconColor = colors.danger; }
                if (not.type === 'task_completed') { IconComp = CheckCircle2; iconColor = colors.success; }
                if (not.type === 'task_rescheduled') { IconComp = Calendar; iconColor = colors.warning; }

                return (
                  <Pressable
                    key={not.id}
                    onPress={() => handleMarkRead(not.id)}
                    className="mb-2"
                  >
                    <AppCard 
                      style={{ 
                        borderLeftWidth: 4, 
                        borderLeftColor: isUnread ? colors.primary : 'transparent',
                        opacity: isUnread ? 1 : 0.65
                      }} 
                      className="p-4 flex-row items-start justify-between"
                    >
                      <View className="flex-row flex-1 mr-3">
                        <View 
                          style={{ backgroundColor: iconColor + '12' }} 
                          className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5"
                        >
                          <IconComp size={16} color={iconColor} />
                        </View>
                        <View className="flex-1">
                          <Text style={{ color: colors.text }} className="text-xs font-bold leading-snug">
                            {not.title}
                          </Text>
                          <Text style={{ color: colors.textSecondary }} className="text-[11px] mt-0.5 leading-relaxed">
                            {not.message}
                          </Text>
                          <Text style={{ color: colors.textSecondary }} className="text-[9px] font-semibold opacity-60 mt-1 uppercase">
                            {new Date(not.timestamp).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      {isUnread && (
                        <View style={{ backgroundColor: colors.primary }} className="w-2.5 h-2.5 rounded-full mt-1.5" />
                      )}
                    </AppCard>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {/* --- ISSUES TRACKER TAB --- */}
        {activeTab === 'issues' && (
          <View className="space-y-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase">
                Filed issues ({pendingIssues.length} active, {resolvedIssues.length} resolved)
              </Text>
            </View>

            {issues.length === 0 ? (
              <AppCard className="p-8 items-center justify-center">
                <ShieldAlert size={32} color={colors.textSecondary} className="opacity-40 mb-2" />
                <Text style={{ color: colors.textSecondary }} className="text-xs font-bold">No issues filed on farm.</Text>
              </AppCard>
            ) : (
              issues.map((iss) => {
                const isPending = iss.status === 'pending';
                let typeEmoji = '⚠️';
                if (iss.type === 'equipment') typeEmoji = '⚙️';
                else if (iss.type === 'animal_health') typeEmoji = '🩺';
                else if (iss.type === 'supply') typeEmoji = '📦';

                let priorityColor = colors.primary;
                let priorityBg = colors.primary + '12';
                if (iss.priority === 'high') { priorityColor = colors.danger; priorityBg = colors.danger + '12'; }
                if (iss.priority === 'medium') { priorityColor = colors.warning; priorityBg = colors.warning + '12'; }

                return (
                  <AppCard 
                    key={iss.id} 
                    className="p-4 mb-3"
                    onPress={() => handleOpenIssueDetail(iss)}
                  >
                    <View className="flex-row justify-between items-start mb-2.5">
                      <View className="flex-1 mr-3">
                        <Text style={{ color: colors.text }} className="text-xs font-bold leading-snug">
                          {typeEmoji} {iss.description.substring(0, 48)}...
                        </Text>
                        <Text style={{ color: colors.textSecondary }} className="text-[10px] font-medium mt-1">
                          By: {iss.reportedBy} • Dept: {iss.category.replace('_', ' ')}
                        </Text>
                      </View>

                      <View className="flex-row space-x-2">
                        {/* Priority Badge */}
                        <View style={{ backgroundColor: priorityBg }} className="px-2 py-0.5 rounded-full mr-2">
                          <Text style={{ color: priorityColor }} className="text-[8px] font-black uppercase">
                            {iss.priority}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View 
                          style={{ backgroundColor: isPending ? colors.danger + '12' : colors.success + '12' }} 
                          className="px-2 py-0.5 rounded-full"
                        >
                          <Text style={{ color: isPending ? colors.danger : colors.success }} className="text-[8px] font-black uppercase">
                            {iss.status}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <Text style={{ color: colors.textSecondary }} className="text-[9px] opacity-60">
                        {new Date(iss.reportedAt).toLocaleDateString()}
                      </Text>

                      {iss.imageUri && (
                        <View className="flex-row items-center">
                          <ImageIcon size={10} color={colors.primary} className="mr-1" />
                          <Text style={{ color: colors.primary }} className="text-[9px] font-bold">
                            Photo Attached
                          </Text>
                        </View>
                      )}
                    </View>
                  </AppCard>
                );
              })
            )}
          </View>
        )}

        {/* --- SCHEDULER TAB (RESCHEDULING) --- */}
        {activeTab === 'scheduler' && (
          <View className="space-y-4">
            <View className="mb-3">
              <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase mb-2">
                Operational Task Checklist (Rescheduling Portal)
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-[11px] leading-relaxed">
                Reassign employees, reschedule dates, and set priority.
              </Text>
            </View>

            {tasks.map((t) => {
              const isComp = t.status === 'completed';
              let priorityColor = colors.primary;
              let priorityBg = colors.primary + '12';
              if (t.priority === 'high') { priorityColor = colors.danger; priorityBg = colors.danger + '12'; }
              if (t.priority === 'medium') { priorityColor = colors.warning; priorityBg = colors.warning + '12'; }

              return (
                <AppCard key={t.id} className="p-4 mb-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-3">
                      <Text 
                        style={{ 
                          color: isComp ? colors.textSecondary : colors.text,
                          textDecorationLine: isComp ? 'line-through' : 'none' 
                        }} 
                        className="text-xs font-bold"
                      >
                        {t.title}
                      </Text>
                      <Text style={{ color: colors.textSecondary }} className="text-[10px] mt-1">
                        Assignee: {t.assignedTo} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Today'}
                      </Text>
                      {t.rescheduledAt && (
                        <Text style={{ color: colors.warning }} className="text-[9px] font-bold mt-1 uppercase">
                          ⚠️ Rescheduled Task
                        </Text>
                      )}
                    </View>

                    <View className="flex-row items-center space-x-2">
                      <View style={{ backgroundColor: priorityBg }} className="px-2 py-0.5 rounded-full mr-2">
                        <Text style={{ color: priorityColor }} className="text-[8px] font-black uppercase">
                          {t.priority}
                        </Text>
                      </View>
                      
                      {!isComp && (
                        <Pressable
                          onPress={() => handleOpenReschedule(t)}
                          style={{ backgroundColor: colors.primary + '18' }}
                          className="px-2.5 py-1.5 rounded-lg active:scale-95"
                        >
                          <Text style={{ color: colors.primary }} className="text-[10px] font-extrabold uppercase">
                            Reschedule
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </AppCard>
              );
            })}
          </View>
        )}

        {/* --- GALLERY TAB --- */}
        {activeTab === 'gallery' && (
          <View className="space-y-4">
            <ImageBackground
              source={require('../../../assets/images/tutorial-web.png')}
              style={{ width: '100%', height: 120, borderRadius: 12, overflow: 'hidden' }}
              imageStyle={{ borderRadius: 12, opacity: 0.95 }}
            >
              <View style={{ flex: 1, padding: 14, justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF' }} className="text-sm font-extrabold">Photo Gallery</Text>
                <Text style={{ color: '#FFFFFFAA' }} className="text-[11px] mt-1">Task proof and issue photos — organized by category.</Text>
              </View>
            </ImageBackground>

            <View className="flex-row items-center justify-between">
              <View className="flex-row flex-wrap">
                {(['all', 'birds', 'fish', 'pond', 'calves', 'cow_shed', 'vehicles', 'maintenance'] as Array<'all' | TaskCategory>).map((c) => {
                  const active = galleryFilter === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setGalleryFilter(c)}
                      style={{
                        backgroundColor: active ? colors.primary : colors.background,
                        borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'),
                        borderWidth: 1,
                        marginRight: 8,
                        marginBottom: 8,
                      }}
                      className="py-2 px-3 rounded-xl"
                    >
                      <Text style={{ color: active ? '#FFFFFF' : colors.text }} className="text-xs font-bold capitalize">
                        {c === 'all' ? 'All' : c.replace('_', ' ')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={refreshGallery} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
                <Text style={{ color: colors.primary }} className="text-xs font-extrabold">Refresh</Text>
              </Pressable>
            </View>

            {/* Grid of photos */}
            <View className="flex-row flex-wrap -mx-1">
              {(photos.filter(p => galleryFilter === 'all' ? true : p.category === galleryFilter)).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedPhotoUri(p.uri)}
                  style={{ width: (SCREEN_WIDTH - 40) / 3, padding: 6 }}
                >
                  <Image source={{ uri: p.uri }} style={{ width: '100%', height: 96, borderRadius: 10, backgroundColor: colors.card }} />
                  <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 6 }} numberOfLines={1}>
                    {p.reportedBy} • {new Date(p.timestamp).toLocaleDateString()}
                  </Text>
                </Pressable>
              ))}
              {photos.length === 0 && (
                <View className="p-8 items-center justify-center w-full">
                  <Image source={require('../../../assets/images/tutorial-web.png')} style={{ width: 140, height: 80, opacity: 0.9, marginBottom: 12 }} />
                  <Text style={{ color: colors.textSecondary }} className="text-sm font-bold mb-2">No photos yet</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs text-center mb-4">Employees will upload proof photos when completing tasks or reporting issues.</Text>
                  <AppButton label="Refresh Gallery" onPress={refreshGallery} className="w-48" />
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Full screen photo preview overlay */}
      {selectedPhotoUri && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)' }} className="items-center justify-center p-4">
          <Pressable onPress={() => setSelectedPhotoUri(null)} style={{ position: 'absolute', top: 36, right: 18, zIndex: 60 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800' }}>Close</Text>
          </Pressable>
          <Image source={{ uri: selectedPhotoUri }} style={{ width: '94%', height: '76%', borderRadius: 12 }} resizeMode="contain" />
        </View>
      )}

      {/* --- RESCHEDULE TASK BOTTOM SHEET --- */}
      <BottomSheet 
        visible={rescheduleVisible} 
        onClose={() => setRescheduleVisible(false)} 
        title={selectedRescheduleTask ? `Reschedule: ${selectedRescheduleTask.title}` : ''}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} className="space-y-4">
          
          {/* Target Date Picker (Pills) */}
          <View className="mb-2">
            <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
              New Date Settings
            </Text>
            <View className="flex-row flex-wrap">
              {[
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: '2days', label: '2 Days' },
                { id: '3days', label: '3 Days' },
                { id: 'nextweek', label: '1 Week' },
              ].map((opt) => {
                const active = rescheduleDateOption === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setRescheduleDateOption(opt.id as any)}
                    style={{
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'),
                      borderWidth: 1,
                    }}
                    className="px-3 py-2 rounded-xl mr-2 mb-2 active:scale-95"
                  >
                    <Text style={{ color: active ? '#FFFFFF' : colors.text }} className="text-xs font-bold">
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Reassignment Dropdown Selector */}
          <View className="mb-2">
            <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
              Reassign Employee
            </Text>
            <View className="flex-row flex-wrap">
              {(employees.length > 0 ? employees.map((worker) => worker.name) : WORKERS).map((worker) => {
                const active = rescheduleAssignee === worker;
                return (
                  <Pressable
                    key={worker}
                    onPress={() => setRescheduleAssignee(worker)}
                    style={{
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'),
                      borderWidth: 1,
                      flex: 1,
                      marginRight: 8,
                      marginBottom: 8
                    }}
                    className="py-2.5 rounded-xl items-center active:scale-95"
                  >
                    <Text style={{ color: active ? '#FFFFFF' : colors.text }} className="text-xs font-bold text-center">
                      {worker.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Priority selector */}
          <View className="mb-2">
            <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
              Update Priority
            </Text>
            <View className="flex-row justify-between">
              {(['low', 'medium', 'high'] as const).map((p) => {
                const active = reschedulePriority === p;
                let activeColor = colors.primary;
                let activeBg = colors.primary + '18';
                if (p === 'high') { activeColor = colors.danger; activeBg = colors.danger + '18'; }
                if (p === 'medium') { activeColor = colors.warning; activeBg = colors.warning + '18'; }

                return (
                  <Pressable
                    key={p}
                    onPress={() => setReschedulePriority(p)}
                    style={{
                      backgroundColor: active ? activeBg : colors.background,
                      borderColor: active ? activeColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'),
                      borderWidth: 1,
                      width: '31%',
                    }}
                    className="py-2.5 rounded-xl items-center active:scale-95"
                  >
                    <Text
                      style={{ color: active ? activeColor : colors.textSecondary }}
                      className="text-xs font-extrabold capitalize"
                    >
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Reason notes */}
          <View className="mb-2">
            <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
              Rescheduling Reason
            </Text>
            <TextInput
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              placeholder="e.g. Silas called sick, generator repairs delayed..."
              placeholderTextColor={colors.textSecondary + '70'}
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                borderWidth: 1,
              }}
              className="p-3.5 rounded-xl text-sm min-h-[50px]"
            />
          </View>

          {/* Submit reschedule */}
          <AppButton
            label={savingReschedule ? 'Saving schedules...' : 'Commit reschedule changes'}
            variant="primary"
            onPress={handleSaveReschedule}
            disabled={savingReschedule || !rescheduleReason.trim()}
            className="w-full mt-2"
          />
        </ScrollView>
      </BottomSheet>

      {/* --- ADD EMPLOYEE BOTTOM SHEET --- */}
      <BottomSheet
        visible={addEmployeeVisible}
        onClose={() => setAddEmployeeVisible(false)}
        title="Add Farm Crew Member"
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} className="space-y-4">
          <View className="space-y-2">
            <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase tracking-wider">
              Employee credentials
            </Text>
            <Text style={{ color: colors.text }} className="text-sm font-bold">
              Create a secure access account for a new farm worker.
            </Text>
          </View>

          <View className="space-y-3">
            <TextInput
              value={newEmployeeName}
              onChangeText={setNewEmployeeName}
              placeholder="Full name"
              placeholderTextColor={colors.textSecondary + '80'}
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'
              }}
              className="p-3 rounded-2xl text-sm"
            />
            <TextInput
              value={newEmployeeUsername}
              onChangeText={setNewEmployeeUsername}
              placeholder="Username"
              placeholderTextColor={colors.textSecondary + '80'}
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'
              }}
              className="p-3 rounded-2xl text-sm"
            />
            <TextInput
              value={newEmployeePassword}
              onChangeText={setNewEmployeePassword}
              placeholder="Password"
              secureTextEntry
              placeholderTextColor={colors.textSecondary + '80'}
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'
              }}
              className="p-3 rounded-2xl text-sm"
            />
            <TextInput
              value={newEmployeeEmail}
              onChangeText={setNewEmployeeEmail}
              placeholder="Email (optional)"
              keyboardType="email-address"
              placeholderTextColor={colors.textSecondary + '80'}
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'
              }}
              className="p-3 rounded-2xl text-sm"
            />

            <View>
              <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase tracking-wider mb-2">
                Department
              </Text>
              <View className="flex-row flex-wrap">
                {Object.entries(CATEGORIES_INFO).map(([key, info]) => {
                  const active = newEmployeeDepartment === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setNewEmployeeDepartment(key as TaskCategory)}
                      style={{
                        backgroundColor: active ? info.color : colors.background,
                        borderColor: active ? info.color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'),
                        borderWidth: 1,
                      }}
                      className="px-3 py-2 rounded-2xl mr-2 mb-2"
                    >
                      <Text style={{ color: active ? '#FFFFFF' : colors.text }} className="text-[10px] font-bold">
                        {info.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <AppButton
            label={newEmployeeLoading ? 'Registering...' : 'Create Employee Account'}
            variant="primary"
            onPress={handleCreateEmployee}
            disabled={newEmployeeLoading}
            className="w-full"
          />
        </ScrollView>
      </BottomSheet>

      {/* --- ISSUE DETAIL BOTTOM SHEET --- */}
      <BottomSheet
        visible={issueDetailVisible}
        onClose={() => setIssueDetailVisible(false)}
        title="Issue Report Specification"
      >
        {selectedIssue && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} className="space-y-4">
            
            {/* Status and title info */}
            <View className="mb-2">
              <View className="flex-row justify-between items-center">
                <Text style={{ color: colors.text }} className="text-base font-black flex-1 mr-3">
                  Reported by {selectedIssue.reportedBy}
                </Text>
                <View 
                  style={{ backgroundColor: selectedIssue.status === 'pending' ? colors.danger + '12' : colors.success + '12' }} 
                  className="px-2.5 py-1 rounded-full"
                >
                  <Text style={{ color: selectedIssue.status === 'pending' ? colors.danger : colors.success }} className="text-[10px] font-black uppercase">
                    {selectedIssue.status}
                  </Text>
                </View>
              </View>
              <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold mt-1">
                Dept: {selectedIssue.category.replace('_', ' ')} • Filed: {new Date(selectedIssue.reportedAt).toLocaleString()}
              </Text>
            </View>

            {/* Description Text */}
            <View style={{ backgroundColor: colors.background }} className="rounded-2xl p-4 mb-2 border border-brown-200/5 dark:border-white/5">
              <Text style={{ color: colors.text }} className="text-xs leading-relaxed font-medium">
                "{selectedIssue.description}"
              </Text>
              {selectedIssue.taskTitle && (
                <Text style={{ color: colors.primary }} className="text-[10px] font-bold mt-2 uppercase">
                  Linked Task: {selectedIssue.taskTitle}
                </Text>
              )}
            </View>

            {/* Photo Attached */}
            {selectedIssue.imageUri && (
              <View className="mb-2">
                <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
                  Uploaded Photo Attachment
                </Text>
                <View className="w-full h-44 rounded-2xl overflow-hidden bg-black/10">
                  <Image source={{ uri: selectedIssue.imageUri }} className="w-full h-full object-cover" />
                </View>
              </View>
            )}

            {selectedIssue.audioUri && (
              <View className="mb-2">
                <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
                  Attached Voice Note
                </Text>
                <Pressable
                  onPress={async () => {
                    try {
                      const sound = await Audio.Sound.createAsync({ uri: selectedIssue.audioUri! });
                      await sound.sound.playAsync();
                    } catch (error) {
                      console.error('Play issue audio failed', error);
                    }
                  }}
                  style={{
                    backgroundColor: colors.background,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                    borderWidth: 1,
                  }}
                  className="py-4 rounded-2xl px-4 flex-row items-center"
                >
                  <Play size={16} color={colors.primary} className="mr-3" />
                  <Text style={{ color: colors.text, fontWeight: '700' }} className="text-sm">
                    Play Voice Note
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Resolution Input */}
            <View className="mb-2">
              <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
                Resolution Records / Action Taken
              </Text>
              <TextInput
                value={resolutionNotes}
                onChangeText={setResolutionNotes}
                placeholder="Log details on repair status, supply order, etc..."
                placeholderTextColor={colors.textSecondary + '70'}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={selectedIssue.status === 'pending'}
                style={{
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                  borderWidth: 1,
                }}
                className="p-3 rounded-xl text-xs min-h-[70px]"
              />
            </View>

            {/* Action buttons */}
            {selectedIssue.status === 'pending' && (
              <AppButton
                label={resolvingIssue ? 'Saving...' : 'Resolve & Close Issue'}
                variant="primary"
                disabled={resolvingIssue || !resolutionNotes.trim()}
                onPress={handleResolveIssueSubmit}
                className="w-full mt-2"
              />
            )}
          </ScrollView>
        )}
      </BottomSheet>

    </SafeAreaView>
  );
}
