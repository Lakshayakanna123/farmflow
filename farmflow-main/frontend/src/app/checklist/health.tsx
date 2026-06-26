import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Heart, ArrowLeft, Activity, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { StorageService } from '../../services/storage';
import { Task, User } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { BottomSheet } from '../../components/feedback/BottomSheet';
import { LoadingScreen } from '../../components/feedback/LoadingScreen';
import { TaskCard } from '../../components/farm/TaskCard';
import { EvidenceUploadSection, GeoPoint } from '../../components/farm/EvidenceUploadSection';

const healthNotesSchema = z.object({
  notes: z.string().optional(),
});

interface FormProps {
  task: Task;
  user: User | null;
  onComplete: () => void;
  imageUri: string | null;
  imageLocation: GeoPoint | null;
}

export default function HealthChecklistScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Component state
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Shared evidence (optional for health tasks but supported)
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageLocation, setImageLocation] = useState<GeoPoint | null>(null);

  const fetchHealthData = async () => {
    try {
      const u = await StorageService.getCurrentUser();
      if (!u) {
        router.replace('/login');
        return;
      }
      setUser(u);

      const allTasks = await StorageService.getTasks();
      const healthTasks = allTasks.filter((t) => t.category === 'health');
      setTasks(healthTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const handleToggleTask = async (task: Task) => {
    if (!user) return;
    
    // Always open form for health tasks so notes or evidence can be logged
    handleOpenForm(task);
  };

  const handleOpenForm = (task: Task) => {
    setActiveTask(task);
    setImageUri(null);
    setImageLocation(null);
    setSheetVisible(true);
  };

  const handleCloseForm = () => {
    setActiveTask(null);
    setSheetVisible(false);
  };

  const onFormSuccess = async () => {
    handleCloseForm();
    setLoading(true);
    await fetchHealthData();
  };

  if (loading) {
    return <LoadingScreen message="Gathering daily health logs..." />;
  }

  // Summary Metrics
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Group metrics
  const dietCount = tasks.filter((t) => t.subcategory === 'Diet' && t.status === 'completed').length;
  const therapyCount = tasks.filter((t) => t.subcategory === 'Therapy' && t.status === 'completed').length;

  // Sorting: Vitals -> Therapy -> Diet -> Activity
  const subcategoryOrder = ['Vitals', 'Therapy', 'Diet', 'Activity'];
  const sortedTasks = [...tasks].sort((a, b) => {
    const aIdx = subcategoryOrder.indexOf(a.subcategory);
    const bIdx = subcategoryOrder.indexOf(b.subcategory);
    if (aIdx !== bIdx) return aIdx - bIdx;
    
    // Within same subcategory, sort by time if possible, otherwise title
    const aTime = a.details?.time || '';
    const bTime = b.details?.time || '';
    return aTime.localeCompare(bTime) || a.title.localeCompare(b.title);
  });

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
              Daily Health & Routine
            </Text>
          </View>
        </View>

        {/* Overview Stats */}
        <AppCard className="p-5 mb-5 flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text style={{ color: colors.text }} className="text-base font-extrabold mb-1">
              Routine Checklist
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

          <View style={{ backgroundColor: '#00ACC115' }} className="w-14 h-14 rounded-2xl items-center justify-center ml-2">
            <Heart size={28} color="#00ACC1" />
          </View>
        </AppCard>

        {/* Aggregated Daily Metrics Card */}
        <View className="flex-row space-x-3 mb-6">
          <AppCard className="flex-1 p-4 flex-row items-center">
            <View style={{ backgroundColor: colors.primary + '12' }} className="w-10 h-10 rounded-xl items-center justify-center mr-3">
              <FileText size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 10, textTransform: 'uppercase' }}>
                Diet Completed
              </Text>
              <Text style={{ color: colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 18, marginTop: 4 }}>
                {dietCount} tasks
              </Text>
            </View>
          </AppCard>

          <AppCard className="flex-1 p-4 flex-row items-center ml-3">
            <View style={{ backgroundColor: colors.primary + '12' }} className="w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Activity size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 10, textTransform: 'uppercase' }}>
                Therapy Done
              </Text>
              <Text style={{ color: colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 18, marginTop: 4 }}>
                {therapyCount} tasks
              </Text>
            </View>
          </AppCard>
        </View>

        {/* Tasks List */}
        <Text style={{ color: colors.text, fontFamily: 'Poppins_700Bold', fontSize: 15, textTransform: 'uppercase', marginBottom: 12 }}>
          Daily Routine Tasks
        </Text>
        <View>
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => handleToggleTask(task)}
              onPress={() => handleToggleTask(task)}
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
          {/* Optional evidence UI for health check completion */}
          <EvidenceUploadSection
            imageUri={imageUri}
            onImageUriChange={setImageUri}
            imageLocation={imageLocation}
            onImageLocationChange={setImageLocation}
          />

          {activeTask && (
            <HealthNotesForm 
              task={activeTask} 
              user={user} 
              onComplete={onFormSuccess} 
              imageUri={imageUri} 
              imageLocation={imageLocation} 
            />
          )}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const HealthNotesForm: React.FC<FormProps> = ({ task, user, onComplete, imageUri, imageLocation }) => {
  const { colors, isDark } = useTheme();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(healthNotesSchema),
    defaultValues: { notes: task.notes || '' },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    
    // Save notes
    await StorageService.updateTaskDetails(task.id, {}, data.notes);
    
    // Mark complete with potential photo proof
    await StorageService.completeTaskWithPhoto(
      task.id, 
      user.name, 
      {}, 
      imageUri || undefined, 
      imageLocation || undefined
    );
    
    onComplete();
  };

  return (
    <View className="mt-2">
      <Text style={{ color: colors.textSecondary, fontFamily: 'Poppins_600SemiBold', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>
        Checklist Notes (Optional)
      </Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Type any findings, measurements, or observation notes..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.notes ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1,
              textAlignVertical: 'top',
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              padding: 16,
              borderRadius: 12,
              height: 112,
              marginBottom: 4
            }}
          />
        )}
      />
      <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="mt-4" />
    </View>
  );
};
