import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Fish, ArrowLeft, Waves, Droplet, Activity, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { StorageService } from '../../services/storage';
import { Task, User } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { BottomSheet } from '../../components/feedback/BottomSheet';
import { LoadingScreen } from '../../components/feedback/LoadingScreen';
import { TaskCard } from '../../components/farm/TaskCard';
import * as schemas from '../../types/schemas';
import { ReportIssueModal } from '../../components/farm/ReportIssueModal';

export default function FishChecklistScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Component state
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [reportIssueVisible, setReportIssueVisible] = useState(false);

  const fetchFishData = async () => {
    try {
      const u = await StorageService.getCurrentUser();
      if (!u) {
        router.replace('/login');
        return;
      }
      setUser(u);

      const allTasks = await StorageService.getTasks();
      const fishTasks = allTasks.filter((t) => t.category === 'fish');
      setTasks(fishTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFishData();
  }, []);

  const handleToggleTask = async (task: Task) => {
    if (!user) return;
    
    // If completing a task that requires a form, we open the form instead of toggling directly
    if (task.status === 'pending' && ['Feeding', 'Water Quality', 'Oxygen', 'Medicine', 'Harvest', 'Notes'].includes(task.subcategory)) {
      handleOpenForm(task);
      return;
    }

    try {
      setLoading(true);
      await StorageService.toggleTask(task.id, user.name);
      await fetchFishData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (task: Task) => {
    setActiveTask(task);
    setSheetVisible(true);
  };

  const handleCloseForm = () => {
    setActiveTask(null);
    setSheetVisible(false);
  };

  // Dynamic Form Renderer based on Task Subcategory
  const renderChecklistForm = () => {
    if (!activeTask) return null;

    switch (activeTask.subcategory) {
      case 'Feeding':
        return <FeedingForm task={activeTask} user={user} onComplete={onFormSuccess} />;
      case 'Water Quality':
        return <WaterQualityForm task={activeTask} user={user} onComplete={onFormSuccess} />;
      case 'Oxygen':
        return <OxygenForm task={activeTask} user={user} onComplete={onFormSuccess} />;
      case 'Medicine':
        return <MedicineForm task={activeTask} user={user} onComplete={onFormSuccess} />;
      case 'Harvest':
        return <HarvestForm task={activeTask} user={user} onComplete={onFormSuccess} />;
      default:
        return <GenericNotesForm task={activeTask} user={user} onComplete={onFormSuccess} />;
    }
  };

  const onFormSuccess = async () => {
    handleCloseForm();
    setLoading(true);
    await fetchFishData();
  };

  if (loading) {
    return <LoadingScreen message="Gathering aquaculture checklist records..." />;
  }

  // Summary Metrics
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Aggregate stats from completed task details
  const averageOxygen = tasks
    .filter((t) => t.status === 'completed' && t.subcategory === 'Oxygen' && t.details?.dissolvedOxygen)
    .reduce((avg, t, _, arr) => avg + (t.details?.dissolvedOxygen || 0) / arr.length, 0);

  const averagePH = tasks
    .filter((t) => t.status === 'completed' && t.subcategory === 'Water Quality' && t.details?.pH)
    .reduce((avg, t, _, arr) => avg + (t.details?.pH || 0) / arr.length, 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background }} className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} className="px-5">
        
        {/* Navigation Header */}
        <View className="flex-row items-center mt-6 mb-6">
          <Pressable 
            onPress={() => router.back()}
            style={{ backgroundColor: colors.card }}
            className="w-10 h-10 rounded-2xl items-center justify-center shadow-xs border border-brown-200/5 active:scale-95 mr-4"
          >
            <ArrowLeft size={18} color={colors.text} />
          </Pressable>
          <View>
            <Text style={{ color: colors.textSecondary }} className="text-xs font-bold uppercase tracking-wider">
              Checklist Detail
            </Text>
            <Text style={{ color: colors.text }} className="text-xl font-black tracking-tight">
              Aquaculture & Fish
            </Text>
          </View>
        </View>

        {/* Overview Stats */}
        <AppCard className="p-5 mb-5 flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text style={{ color: colors.text }} className="text-base font-extrabold mb-1">
              Aquaculture Checklist
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-xs mb-3">
              Daily status: {completedCount} of {totalCount} completed ({completionPercent}%)
            </Text>
            <View className="w-full h-2 rounded-full bg-emerald-500/10 overflow-hidden">
              <View 
                style={{ 
                  width: `${completionPercent}%`, 
                  backgroundColor: completionPercent === 100 ? colors.success : colors.primary 
                }} 
                className="h-full rounded-full" 
              />
            </View>
          </View>

          <View style={{ backgroundColor: '#29B6F615' }} className="w-14 h-14 rounded-2xl items-center justify-center ml-2">
            <Fish size={28} color="#29B6F6" />
          </View>
        </AppCard>

        {/* Aggregated Daily Metrics Card */}
        <View className="flex-row space-x-3 mb-6">
          <AppCard className="flex-1 p-4 flex-row items-center">
            <View style={{ backgroundColor: colors.primary + '12' }} className="w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Activity size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.textSecondary }} className="text-[10px] font-bold uppercase">
                Avg Oxygen
              </Text>
              <Text style={{ color: colors.text }} className="text-lg font-black mt-0.5">
                {averageOxygen > 0 ? `${averageOxygen.toFixed(1)} ppm` : '--'}
              </Text>
            </View>
          </AppCard>

          <AppCard className="flex-1 p-4 flex-row items-center ml-3">
            <View style={{ backgroundColor: colors.primary + '12' }} className="w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Droplet size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.textSecondary }} className="text-[10px] font-bold uppercase">
                Avg pH
              </Text>
              <Text style={{ color: colors.text }} className="text-lg font-black mt-0.5">
                {averagePH > 0 ? averagePH.toFixed(1) : '--'}
              </Text>
            </View>
          </AppCard>
        </View>

        {/* Tasks List */}
        <Text style={{ color: colors.text }} className="text-sm font-bold uppercase tracking-wider mb-3">
          Daily Checklist Tasks
        </Text>
        <View>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => handleToggleTask(task)}
              onPress={() => handleOpenForm(task)}
            />
          ))}
        </View>

      </ScrollView>

      {/* Dynamic Bottom Sheet Form */}
      <BottomSheet 
        visible={sheetVisible} 
        onClose={handleCloseForm}
        title={activeTask ? `${activeTask.title}` : ''}
      >
        <View className="space-y-4">
          {renderChecklistForm()}
          
          <View className="h-[1px] bg-brown-200/5 dark:bg-white/5 my-1" />
          <Pressable
            onPress={() => {
              setReportIssueVisible(true);
            }}
            style={{ borderColor: colors.danger, borderWidth: 1 }}
            className="py-3 rounded-xl flex-row items-center justify-center active:scale-95"
          >
            <AlertTriangle size={14} color={colors.danger} className="mr-1.5" />
            <Text style={{ color: colors.danger }} className="text-xs font-bold">
              Report Issue for this Task
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Report issue modal */}
      <ReportIssueModal
        visible={reportIssueVisible}
        onClose={() => {
          setReportIssueVisible(false);
        }}
        onSubmitSuccess={() => {
          setSheetVisible(false);
          fetchFishData();
        }}
        task={activeTask}
        userName={user?.name || 'Worker'}
      />
    </SafeAreaView>
  );
}

// ==========================================
// SUB-FORM COMPONENTS FOR FISH
// ==========================================

interface FishFormProps {
  task: Task;
  user: User | null;
  onComplete: () => void;
}

// 1. FEEDING FORM
const FeedingForm: React.FC<FishFormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.fishFeedingSchema),
    defaultValues: { 
      feedKg: task.details?.feedKg ? String(task.details.feedKg) : '',
      feedType: task.details?.feedType || 'Floating Pellets'
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    await StorageService.updateTaskDetails(task.id, { 
      feedKg: Number(data.feedKg),
      feedType: data.feedType
    });
    if (task.status === 'pending') {
      await StorageService.toggleTask(task.id, user.name);
    }
    onComplete();
  };

  return (
    <View className="mt-2">
      {/* Feed Amount (Kg) */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Feed Amount (kg)
      </Text>
      <Controller
        control={control}
        name="feedKg"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            keyboardType="numeric"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 45"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.feedKg ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-4"
          />
        )}
      />
      {errors.feedKg && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.feedKg.message as string}
        </Text>
      )}

      {/* Feed Type */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Feed Type
      </Text>
      <Controller
        control={control}
        name="feedType"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. Floating Pellets"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.feedType ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-1"
          />
        )}
      />
      {errors.feedType && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.feedType.message as string}
        </Text>
      )}

      <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="mt-4" />
    </View>
  );
};

// 2. WATER QUALITY FORM
const WaterQualityForm: React.FC<FishFormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.fishWaterQualitySchema),
    defaultValues: { 
      pH: task.details?.pH ? String(task.details.pH) : '',
      ammonia: task.details?.ammonia ? String(task.details.ammonia) : '0'
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    await StorageService.updateTaskDetails(task.id, { 
      pH: Number(data.pH),
      ammonia: Number(data.ammonia)
    });
    if (task.status === 'pending') {
      await StorageService.toggleTask(task.id, user.name);
    }
    onComplete();
  };

  return (
    <View className="mt-2">
      {/* pH Level */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        pH Level (0.0 - 14.0)
      </Text>
      <Controller
        control={control}
        name="pH"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            keyboardType="numeric"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 7.2"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.pH ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-4"
          />
        )}
      />
      {errors.pH && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.pH.message as string}
        </Text>
      )}

      {/* Ammonia Level */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Ammonia Level (ppm)
      </Text>
      <Controller
        control={control}
        name="ammonia"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            keyboardType="numeric"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 0.05"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.ammonia ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-1"
          />
        )}
      />
      {errors.ammonia && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.ammonia.message as string}
        </Text>
      )}

      <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="mt-4" />
    </View>
  );
};

// 3. OXYGEN FORM
const OxygenForm: React.FC<FishFormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.fishOxygenSchema),
    defaultValues: { dissolvedOxygen: task.details?.dissolvedOxygen ? String(task.details.dissolvedOxygen) : '' },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    await StorageService.updateTaskDetails(task.id, { dissolvedOxygen: Number(data.dissolvedOxygen) });
    if (task.status === 'pending') {
      await StorageService.toggleTask(task.id, user.name);
    }
    onComplete();
  };

  return (
    <View className="mt-2">
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Dissolved Oxygen (ppm / mg/L)
      </Text>
      <Controller
        control={control}
        name="dissolvedOxygen"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            keyboardType="numeric"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 6.5"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.dissolvedOxygen ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-1"
          />
        )}
      />
      {errors.dissolvedOxygen && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.dissolvedOxygen.message as string}
        </Text>
      )}
      <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="mt-4" />
    </View>
  );
};

// 4. MEDICINE FORM (same structure but fits fish schema)
const MedicineForm: React.FC<FishFormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.fishMedicineSchema),
    defaultValues: { 
      medicineName: task.details?.medicineName || '',
      dosage: task.details?.dosage || '',
      notes: task.notes || '' 
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    await StorageService.updateTaskDetails(task.id, { 
      medicineName: data.medicineName,
      dosage: data.dosage
    }, data.notes);
    if (task.status === 'pending') {
      await StorageService.toggleTask(task.id, user.name);
    }
    onComplete();
  };

  return (
    <View className="mt-2">
      {/* Medicine Name */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Treatment Agent / Chemical Name
      </Text>
      <Controller
        control={control}
        name="medicineName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. Formalin / Salt treatment"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.medicineName ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-4"
          />
        )}
      />
      {errors.medicineName && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.medicineName.message as string}
        </Text>
      )}

      {/* Dosage */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Dosage / Concentration
      </Text>
      <Controller
        control={control}
        name="dosage"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 15-25 mg/L in pond"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.dosage ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-4"
          />
        )}
      />
      {errors.dosage && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.dosage.message as string}
        </Text>
      )}

      {/* Notes */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Treatment Details
      </Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Describe parasitic/fungal observations..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)',
              borderWidth: 1,
              textAlignVertical: 'top'
            }}
            className="h-24 rounded-xl p-4 text-sm font-semibold mb-1"
          />
        )}
      />

      <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="mt-4" />
    </View>
  );
};

// 5. HARVEST FORM
const HarvestForm: React.FC<FishFormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.fishHarvestSchema),
    defaultValues: { 
      fishCount: task.details?.fishCount ? String(task.details.fishCount) : '',
      totalWeightKg: task.details?.totalWeightKg ? String(task.details.totalWeightKg) : ''
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    await StorageService.updateTaskDetails(task.id, { 
      fishCount: Number(data.fishCount),
      totalWeightKg: Number(data.totalWeightKg)
    });
    if (task.status === 'pending') {
      await StorageService.toggleTask(task.id, user.name);
    }
    onComplete();
  };

  return (
    <View className="mt-2">
      {/* Fish Count */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Harvested Fish Count
      </Text>
      <Controller
        control={control}
        name="fishCount"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            keyboardType="numeric"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 150"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.fishCount ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-4"
          />
        )}
      />
      {errors.fishCount && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.fishCount.message as string}
        </Text>
      )}

      {/* Total Weight */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Total Harvest Weight (kg)
      </Text>
      <Controller
        control={control}
        name="totalWeightKg"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            keyboardType="numeric"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 320"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.totalWeightKg ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-1"
          />
        )}
      />
      {errors.totalWeightKg && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.totalWeightKg.message as string}
        </Text>
      )}

      <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="mt-4" />
    </View>
  );
};

// 6. GENERIC NOTES FORM
const GenericNotesForm: React.FC<FishFormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.fishNotesSchema),
    defaultValues: { notes: task.notes || '' },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    await StorageService.updateTaskDetails(task.id, {}, data.notes);
    if (task.status === 'pending') {
      await StorageService.toggleTask(task.id, user.name);
    }
    onComplete();
  };

  return (
    <View className="mt-2">
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Checklist Notes
      </Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Type your aquaculture check notes..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.notes ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1,
              textAlignVertical: 'top'
            }}
            className="h-28 rounded-xl p-4 text-sm font-semibold mb-1"
          />
        )}
      />
      {errors.notes && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.notes.message as string}
        </Text>
      )}
      <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="mt-4" />
    </View>
  );
};
