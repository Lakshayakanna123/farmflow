import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bird, ArrowLeft, Egg, Scale, Info, CheckCircle2, ChevronRight, AlertTriangle, Camera, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
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

export default function BirdsChecklistScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Component state
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [reportIssueVisible, setReportIssueVisible] = useState(false);

  const fetchBirdsData = async () => {
    try {
      const u = await StorageService.getCurrentUser();
      if (!u) {
        router.replace('/login');
        return;
      }
      setUser(u);

      const allTasks = await StorageService.getTasks();
      const birdsTasks = allTasks.filter((t) => t.category === 'birds');
      setTasks(birdsTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirdsData();
  }, []);

  const handleToggleTask = async (task: Task) => {
    if (!user) return;
    
    // If completing a task that requires a form, we open the form instead of toggling directly
    if (task.status === 'pending' && ['Feed', 'Mortality', 'Egg Collection', 'Vaccination', 'Medicine', 'Notes'].includes(task.subcategory)) {
      handleOpenForm(task);
      return;
    }

    try {
      setLoading(true);
      await StorageService.toggleTask(task.id, user.name);
      await fetchBirdsData();
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
      case 'Feed':
        return <FeedForm task={activeTask} user={user} onComplete={onFormSuccess} />;
      case 'Mortality':
        return <MortalityForm task={activeTask} user={user} onComplete={onFormSuccess} />;
      case 'Egg Collection':
        return <EggForm task={activeTask} user={user} onComplete={onFormSuccess} />;
      case 'Vaccination':
        return <VaccineForm task={activeTask} user={user} onComplete={onFormSuccess} />;
      case 'Medicine':
        return <MedicineForm task={activeTask} user={user} onComplete={onFormSuccess} />;
      default:
        return <GenericNotesForm task={activeTask} user={user} onComplete={onFormSuccess} />;
    }
  };

  const onFormSuccess = async () => {
    handleCloseForm();
    setLoading(true);
    await fetchBirdsData();
  };

  if (loading) {
    return <LoadingScreen message="Gathering poultry checklist records..." />;
  }

  // Summary Metrics
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Aggregate stats from completed task details
  const totalEggs = tasks
    .filter((t) => t.status === 'completed' && t.subcategory === 'Egg Collection')
    .reduce((sum, t) => sum + (t.details?.eggsCount || 0), 0);

  const totalFeed = tasks
    .filter((t) => t.status === 'completed' && t.subcategory === 'Feed')
    .reduce((sum, t) => sum + (t.details?.feedPounds || 0), 0);

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
              Poultry & Birds
            </Text>
          </View>
        </View>

        {/* Overview Stats */}
        <AppCard className="p-5 mb-5 flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text style={{ color: colors.text }} className="text-base font-extrabold mb-1">
              Poultry Checklist
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

          <View style={{ backgroundColor: '#FF704315' }} className="w-14 h-14 rounded-2xl items-center justify-center ml-2">
            <Bird size={28} color="#FF7043" />
          </View>
        </AppCard>

        {/* Aggregated Daily Metrics Card */}
        <View className="flex-row space-x-3 mb-6">
          <AppCard className="flex-1 p-4 flex-row items-center">
            <View style={{ backgroundColor: colors.primary + '12' }} className="w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Egg size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 10, textTransform: 'uppercase' }}>
                Eggs Today
              </Text>
              <Text style={{ color: colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 18, marginTop: 4 }}>
                {totalEggs} pcs
              </Text>
            </View>
          </AppCard>

          <AppCard className="flex-1 p-4 flex-row items-center ml-3">
            <View style={{ backgroundColor: colors.primary + '12' }} className="w-10 h-10 rounded-xl items-center justify-center mr-3">
              <Scale size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', fontSize: 10, textTransform: 'uppercase' }}>
                Feed Logged
              </Text>
              <Text style={{ color: colors.primary, fontFamily: 'Poppins_700Bold', fontSize: 18, marginTop: 4 }}>
                {totalFeed} lbs
              </Text>
            </View>
          </AppCard>
        </View>

        {/* Tasks List */}
        <Text style={{ color: colors.text, fontFamily: 'Poppins_700Bold', fontSize: 15, textTransform: 'uppercase', marginBottom: 12 }}>
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
            <Text style={{ color: colors.danger, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
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
          fetchBirdsData();
        }}
        task={activeTask}
        userName={user?.name || 'Worker'}
      />
    </SafeAreaView>
  );
}

// ==========================================
// SUB-FORM COMPONENTS FOR BIRDS
// ==========================================

interface FormProps {
  task: Task;
  user: User | null;
  onComplete: () => void;
}

// 1. FEED FORM
const FeedForm: React.FC<FormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageLocation, setImageLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.birdsFeedSchema),
    defaultValues: { feedPounds: task.details?.feedPounds ? String(task.details.feedPounds) : '' },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    if (!imageUri) {
      Alert.alert('Photo Required', 'Please attach a photo proof before completing the task.');
      return;
    }
    await StorageService.completeTaskWithPhoto(task.id, user.name, { feedPounds: Number(data.feedPounds) }, imageUri, imageLocation || undefined);
    onComplete();
  };

  return (
    <View className="mt-2">
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Feed Dispensed (lbs)
      </Text>
      <Controller
        control={control}
        name="feedPounds"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            keyboardType="numeric"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 120"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.feedPounds ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-1"
          />
        )}
      />
      {errors.feedPounds && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.feedPounds.message as string}
        </Text>
      )}
      <View className="mt-4">
        {imageUri ? (
          <View className="relative w-full h-36 rounded-2xl overflow-hidden mb-3">
            <Image source={{ uri: imageUri }} className="w-full h-full object-cover" />
            <Pressable onPress={() => { setImageUri(null); setImageLocation(null); }} style={{ backgroundColor: colors.danger }} className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center">
              <Trash2 size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row space-x-3 mb-3">
            <Pressable onPress={async () => {
              if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') { Alert.alert('Permission', 'Camera permission required'); return; }
              }
              const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4,3], quality: 0.6 });
              if (!res.canceled && res.assets && res.assets.length>0) {
                const uri = res.assets[0].uri;
                setImageUri(uri);
                try {
                  if (Platform.OS !== 'web') {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                      const loc = await Location.getCurrentPositionAsync({});
                      setImageLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                    }
                  }
                } catch (e) {
                  console.warn('Location capture failed', e);
                }
              }
            }} style={{ backgroundColor: colors.background, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)', borderWidth:1 }} className="flex-1 py-3 rounded-xl items-center justify-center">
              <Camera size={16} color={colors.primary} className="mr-2" />
              <Text style={{ color: colors.text }} className="text-xs font-bold">Take Photo</Text>
            </Pressable>
            <Pressable onPress={async () => {
              if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') { Alert.alert('Permission', 'Photo library permission required'); return; }
              }
              const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing:true, aspect:[4,3], quality:0.6 });
              if (!res.canceled && res.assets && res.assets.length>0) {
                const uri = res.assets[0].uri;
                setImageUri(uri);
                try {
                  if (Platform.OS !== 'web') {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                      const loc = await Location.getCurrentPositionAsync({});
                      setImageLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                    }
                  }
                } catch (e) {
                  console.warn('Location capture failed', e);
                }
              }
            }} style={{ backgroundColor: colors.background, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)', borderWidth:1 }} className="flex-1 py-3 rounded-xl items-center justify-center">
              <Text style={{ color: colors.text }} className="text-xs font-bold">Upload Photo</Text>
            </Pressable>
          </View>
        )}
        <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="w-full" />
      </View>
    </View>
  );
};

// 2. MORTALITY FORM
const MortalityForm: React.FC<FormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageLocation, setImageLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.birdsMortalitySchema),
    defaultValues: { mortalityCount: task.details?.mortalityCount ? String(task.details.mortalityCount) : '0' },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    if (!imageUri) {
      Alert.alert('Photo Required', 'Please attach a photo proof before completing the task.');
      return;
    }
    await StorageService.completeTaskWithPhoto(task.id, user.name, { mortalityCount: Number(data.mortalityCount) }, imageUri, imageLocation || undefined);
    onComplete();
  };

  return (
    <View className="mt-2">
      <View className="flex-row items-center mb-2 bg-orange-500/10 p-2.5 rounded-lg border border-orange-500/20">
        <AlertTriangle size={16} color={colors.warning} className="mr-2" />
        <Text style={{ color: colors.text }} className="text-xs font-semibold flex-1">
          Mortality log tracks flock health index anomalies.
        </Text>
      </View>
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Mortality Count (Birds)
      </Text>
      <Controller
        control={control}
        name="mortalityCount"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            keyboardType="numeric"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.mortalityCount ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-1"
          />
        )}
      />
      {errors.mortalityCount && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.mortalityCount.message as string}
        </Text>
      )}
      <View className="mt-4">
        {imageUri ? (
          <View className="relative w-full h-36 rounded-2xl overflow-hidden mb-3">
            <Image source={{ uri: imageUri }} className="w-full h-full object-cover" />
            <Pressable onPress={() => { setImageUri(null); setImageLocation(null); }} style={{ backgroundColor: colors.danger }} className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center">
              <Trash2 size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row space-x-3 mb-3">
            <Pressable onPress={async () => {
              if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') { Alert.alert('Permission', 'Camera permission required'); return; }
              }
              const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4,3], quality: 0.6 });
              if (!res.canceled && res.assets && res.assets.length>0) {
                const uri = res.assets[0].uri;
                setImageUri(uri);
                try {
                  if (Platform.OS !== 'web') {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                      const loc = await Location.getCurrentPositionAsync({});
                      setImageLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                    }
                  }
                } catch (e) {
                  console.warn('Location capture failed', e);
                }
              }
            }} style={{ backgroundColor: colors.background, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)', borderWidth:1 }} className="flex-1 py-3 rounded-xl items-center justify-center">
              <Camera size={16} color={colors.primary} className="mr-2" />
              <Text style={{ color: colors.text }} className="text-xs font-bold">Take Photo</Text>
            </Pressable>
            <Pressable onPress={async () => {
              if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') { Alert.alert('Permission', 'Photo library permission required'); return; }
              }
              const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing:true, aspect:[4,3], quality:0.6 });
              if (!res.canceled && res.assets && res.assets.length>0) {
                const uri = res.assets[0].uri;
                setImageUri(uri);
                try {
                  if (Platform.OS !== 'web') {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                      const loc = await Location.getCurrentPositionAsync({});
                      setImageLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                    }
                  }
                } catch (e) {
                  console.warn('Location capture failed', e);
                }
              }
            }} style={{ backgroundColor: colors.background, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)', borderWidth:1 }} className="flex-1 py-3 rounded-xl items-center justify-center">
              <Text style={{ color: colors.text }} className="text-xs font-bold">Upload Photo</Text>
            </Pressable>
          </View>
        )}
        <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="w-full" />
      </View>
    </View>
  );
};

// 3. EGG COLLECTION FORM
const EggForm: React.FC<FormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageLocation, setImageLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.birdsEggCollectionSchema),
    defaultValues: { 
      eggsCount: task.details?.eggsCount ? String(task.details.eggsCount) : '',
      crackedCount: task.details?.crackedCount ? String(task.details.crackedCount) : '0' 
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    if (!imageUri) {
      Alert.alert('Photo Required', 'Please attach a photo proof before completing the task.');
      return;
    }
    await StorageService.completeTaskWithPhoto(task.id, user.name, { 
      eggsCount: Number(data.eggsCount),
      crackedCount: Number(data.crackedCount)
    }, imageUri, imageLocation || undefined);
    onComplete();
  };

  return (
    <View className="mt-2">
      {/* Eggs Collected */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Healthy Eggs Collected
      </Text>
      <Controller
        control={control}
        name="eggsCount"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            keyboardType="numeric"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 350"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.eggsCount ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-4"
          />
        )}
      />
      {errors.eggsCount && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.eggsCount.message as string}
        </Text>
      )}

      {/* Cracked Eggs */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Damaged / Cracked Eggs
      </Text>
      <Controller
        control={control}
        name="crackedCount"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            keyboardType="numeric"
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.crackedCount ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-1"
          />
        )}
      />
      {errors.crackedCount && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.crackedCount.message as string}
        </Text>
      )}

      <View className="mt-4">
        {imageUri ? (
          <View className="relative w-full h-36 rounded-2xl overflow-hidden mb-3">
            <Image source={{ uri: imageUri }} className="w-full h-full object-cover" />
            <Pressable onPress={() => { setImageUri(null); setImageLocation(null); }} style={{ backgroundColor: colors.danger }} className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center">
              <Trash2 size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View className="flex-row space-x-3 mb-3">
            <Pressable onPress={async () => {
              if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') { Alert.alert('Permission', 'Camera permission required'); return; }
              }
              const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4,3], quality: 0.6 });
              if (!res.canceled && res.assets && res.assets.length>0) {
                const uri = res.assets[0].uri;
                setImageUri(uri);
                try {
                  if (Platform.OS !== 'web') {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                      const loc = await Location.getCurrentPositionAsync({});
                      setImageLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                    }
                  }
                } catch (e) {
                  console.warn('Location capture failed', e);
                }
              }
            }} style={{ backgroundColor: colors.background, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)', borderWidth:1 }} className="flex-1 py-3 rounded-xl items-center justify-center">
              <Camera size={16} color={colors.primary} className="mr-2" />
              <Text style={{ color: colors.text }} className="text-xs font-bold">Take Photo</Text>
            </Pressable>
            <Pressable onPress={async () => {
              if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') { Alert.alert('Permission', 'Photo library permission required'); return; }
              }
              const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing:true, aspect:[4,3], quality:0.6 });
              if (!res.canceled && res.assets && res.assets.length>0) {
                const uri = res.assets[0].uri;
                setImageUri(uri);
                try {
                  if (Platform.OS !== 'web') {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                      const loc = await Location.getCurrentPositionAsync({});
                      setImageLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                    }
                  }
                } catch (e) {
                  console.warn('Location capture failed', e);
                }
              }
            }} style={{ backgroundColor: colors.background, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)', borderWidth:1 }} className="flex-1 py-3 rounded-xl items-center justify-center">
              <Text style={{ color: colors.text }} className="text-xs font-bold">Upload Photo</Text>
            </Pressable>
          </View>
        )}
        <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="w-full" />
      </View>
    </View>
  );
};

// 4. VACCINATION FORM
const VaccineForm: React.FC<FormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.birdsVaccinationSchema),
    defaultValues: { 
      vaccineName: task.details?.vaccineName || '',
      batchCode: task.details?.batchCode || '',
      notes: task.notes || '' 
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    await StorageService.updateTaskDetails(task.id, { 
      vaccineName: data.vaccineName,
      batchCode: data.batchCode
    }, data.notes);
    if (task.status === 'pending') {
      await StorageService.toggleTask(task.id, user.name);
    }
    onComplete();
  };

  return (
    <View className="mt-2">
      {/* Vaccine Name */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Vaccine Name
      </Text>
      <Controller
        control={control}
        name="vaccineName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. Avian Flu H5N1"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.vaccineName ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-4"
          />
        )}
      />
      {errors.vaccineName && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.vaccineName.message as string}
        </Text>
      )}

      {/* Batch Code */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Vaccine Batch Code
      </Text>
      <Controller
        control={control}
        name="batchCode"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. BF-2026-928"
            placeholderTextColor={colors.textSecondary}
            style={{ 
              color: colors.text, 
              backgroundColor: colors.background,
              borderColor: errors.batchCode ? colors.danger : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.08)'),
              borderWidth: 1 
            }}
            className="h-14 rounded-xl px-4 text-sm font-semibold mb-4"
          />
        )}
      />
      {errors.batchCode && (
        <Text style={{ color: colors.danger }} className="text-xs font-semibold mb-4 ml-1">
          {errors.batchCode.message as string}
        </Text>
      )}

      {/* Notes */}
      <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-2">
        Vaccination Notes
      </Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Any reaction symptoms, number inoculated, etc."
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

// 5. MEDICINE FORM
const MedicineForm: React.FC<FormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.birdsMedicineSchema),
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
        Medicine Name
      </Text>
      <Controller
        control={control}
        name="medicineName"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. Amprolium Soluble"
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
        Dosage / Ratio
      </Text>
      <Controller
        control={control}
        name="dosage"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. 0.024% in drinking water"
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
        Administration Notes
      </Text>
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="e.g. Treated for Coccidiosis in Coop 2 flock"
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

// 6. GENERIC NOTES FORM
const GenericNotesForm: React.FC<FormProps> = ({ task, user, onComplete }) => {
  const { colors, isDark } = useTheme();
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schemas.birdsNotesSchema),
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
      <Text style={{ color: colors.textSecondary, fontFamily: 'Poppins_600SemiBold', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>
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
            placeholder="Type your checklist findings here..."
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
      {errors.notes && (
        <Text style={{ color: colors.danger, fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 16, marginLeft: 4 }}>
          {errors.notes.message as string}
        </Text>
      )}
      <AppButton label="Save & Complete Task" onPress={handleSubmit(onSubmit)} className="mt-4" />
    </View>
  );
};
