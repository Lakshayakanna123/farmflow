import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Image, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react-native';
import { BottomSheet } from '../feedback/BottomSheet';
import { AppButton } from '../ui/AppButton';
import { useTheme } from '../../hooks/useTheme';
import { StorageService } from '../../services/storage';
import { Task, TaskCategory } from '../../types';

interface ReportIssueModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  // Optional task linkage
  task?: Task | null;
  // Optional category if task is not specified
  category?: TaskCategory;
  userName: string;
}

type IssueType = 'equipment' | 'animal_health' | 'supply' | 'other';
type PriorityType = 'low' | 'medium' | 'high';

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  visible,
  onClose,
  onSubmitSuccess,
  task,
  category,
  userName,
}) => {
  const { colors, isDark } = useTheme();

  // Form State
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState<IssueType>('other');
  const [priority, setPriority] = useState<PriorityType>('medium');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Determine actual category
  const resolvedCategory = task ? task.category : (category || 'maintenance');

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    }
    return true;
  };

  const requestLibraryPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to capture photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Unable to access camera.');
    }
  };

  const handleChoosePhoto = async () => {
    const hasPermission = await requestLibraryPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Library permission is required to choose photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      Alert.alert('Error', 'Unable to access photo library.');
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please describe the issue.');
      return;
    }

    setSubmitting(true);
    try {
      await StorageService.reportIssue({
        taskId: task?.id,
        taskTitle: task?.title,
        category: resolvedCategory,
        reportedBy: userName,
        priority,
        type: issueType,
        description: description.trim(),
      }, imageUri || undefined);

      Alert.alert('Issue Filed', 'The issue has been successfully reported to management.');
      
      // Reset form
      setDescription('');
      setIssueType('other');
      setPriority('medium');
      setImageUri(null);
      
      onSubmitSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to report issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const issueTypes: { id: IssueType; label: string; icon: string }[] = [
    { id: 'equipment', label: 'Equipment Malfunction', icon: '⚙️' },
    { id: 'animal_health', label: 'Animal Health Issue', icon: '🩺' },
    { id: 'supply', label: 'Feed/Supply Shortage', icon: '📦' },
    { id: 'other', label: 'Other Issue', icon: '⚠️' },
  ];

  return (
    <BottomSheet 
      visible={visible} 
      onClose={onClose} 
      title={task ? `Report Issue: ${task.title}` : `Report Farm Issue (${resolvedCategory})`}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} className="space-y-4">
        {/* Issue Type Selection */}
        <View className="mb-2">
          <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
            Issue Category
          </Text>
          <View className="flex-row flex-wrap">
            {issueTypes.map((t) => {
              const active = issueType === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setIssueType(t.id)}
                  style={{
                    backgroundColor: active ? colors.primary : colors.background,
                    borderColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'),
                    borderWidth: 1,
                  }}
                  className="px-3 py-2 rounded-xl mr-2 mb-2 flex-row items-center active:scale-95"
                >
                  <Text className="mr-1.5 text-xs">{t.icon}</Text>
                  <Text style={{ color: active ? '#FFFFFF' : colors.text }} className="text-xs font-semibold">
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Priority Selector */}
        <View className="mb-2">
          <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
            Severity / Priority
          </Text>
          <View className="flex-row justify-between">
            {(['low', 'medium', 'high'] as PriorityType[]).map((p) => {
              const active = priority === p;
              let activeColor = colors.primary;
              let activeBg = colors.primary + '18';
              if (p === 'high') { activeColor = colors.danger; activeBg = colors.danger + '18'; }
              if (p === 'medium') { activeColor = colors.warning; activeBg = colors.warning + '18'; }

              return (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
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

        {/* Description Input */}
        <View className="mb-2">
          <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Provide detail on what happened, location, and what is needed..."
            placeholderTextColor={colors.textSecondary + '70'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
              borderWidth: 1,
            }}
            className="p-3.5 rounded-xl text-sm min-h-[90px]"
          />
        </View>

        {/* Image Attachment Section */}
        <View className="mb-4">
          <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
            Attach Photo (Optional)
          </Text>

          {imageUri ? (
            <View className="relative w-full h-44 rounded-2xl overflow-hidden bg-black/10">
              <Image source={{ uri: imageUri }} className="w-full h-full object-cover" />
              <Pressable
                onPress={() => setImageUri(null)}
                style={{ backgroundColor: colors.danger }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center shadow-lg active:scale-90"
              >
                <Trash2 size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <View className="flex-row space-x-3">
              <Pressable
                onPress={handleTakePhoto}
                style={{
                  backgroundColor: colors.background,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                  borderWidth: 1,
                }}
                className="flex-1 py-4 rounded-xl items-center justify-center flex-row active:scale-95"
              >
                <Camera size={16} color={colors.primary} className="mr-2" />
                <Text style={{ color: colors.text }} className="text-xs font-bold">
                  Take Photo
                </Text>
              </Pressable>

              <Pressable
                onPress={handleChoosePhoto}
                style={{
                  backgroundColor: colors.background,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                  borderWidth: 1,
                  marginLeft: 12
                }}
                className="flex-1 py-4 rounded-xl items-center justify-center flex-row active:scale-95"
              >
                <ImageIcon size={16} color={colors.primary} className="mr-2" />
                <Text style={{ color: colors.text }} className="text-xs font-bold">
                  Upload Gallery
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <AppButton
          label={submitting ? 'Submitting Report...' : 'File Issue Report'}
          variant="primary"
          onPress={handleSubmit}
          disabled={submitting || !description.trim()}
          icon={<ShieldAlert size={16} color="#FFFFFF" />}
          className="w-full mt-2"
        />
      </ScrollView>
    </BottomSheet>
  );
};
