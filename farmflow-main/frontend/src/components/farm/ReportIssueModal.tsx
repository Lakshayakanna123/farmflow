import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Image, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
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
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
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

  const requestAudioPermission = async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
      return false;
    }
    return true;
  };

  const handleStartRecording = async () => {
    const hasPermission = await requestAudioPermission();
    if (!hasPermission) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      // Use proper recording options object instead of preset
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: 1,
          audioEncoder: 1,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: 'mpegadts',
          audioQuality: 'high',
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          audioBitsPerSecond: 128000,
        },
      };
      await recording.prepareToRecordAsync(recordingOptions as any);
      await recording.startAsync();
      setRecording(recording);
    } catch (error) {
      console.error('Recording start failed', error);
      Alert.alert('Error', 'Unable to start audio recording.');
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
    } catch (error) {
      console.error('Recording stop failed', error);
      Alert.alert('Error', 'Unable to stop audio recording.');
    }
  };

  const handlePlayAudio = async () => {
    if (!audioUri) return;

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Audio playback failed', error);
      Alert.alert('Error', 'Unable to play the recording.');
      setIsPlaying(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please describe the issue.');
      return;
    }

    // If this report is linked to a task, require a photo proof
    if (task && !imageUri) {
      Alert.alert('Photo Required', 'Please attach a photo as proof when reporting from a checklist task.');
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
      }, imageUri || undefined, audioUri || undefined);

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 140 }}
          className="space-y-4"
        >
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
            Attach Photo {task ? '(Required for checklist proof)' : '(Optional)'}
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

        {/* Audio Recording Section */}
        <View className="mb-4">
          <Text style={{ color: colors.text }} className="text-xs font-bold uppercase tracking-wider mb-2">
            Record Audio (Optional)
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={recording ? handleStopRecording : handleStartRecording}
              style={{
                backgroundColor: recording ? colors.danger : colors.background,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                borderWidth: 1,
              }}
              className="flex-1 py-4 rounded-xl items-center justify-center active:scale-95"
            >
              <Text style={{ color: recording ? '#FFFFFF' : colors.text }} className="text-xs font-bold">
                {recording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handlePlayAudio}
              disabled={!audioUri || isPlaying}
              style={{
                backgroundColor: colors.background,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                borderWidth: 1,
              }}
              className="flex-1 py-4 rounded-xl items-center justify-center active:scale-95"
            >
              <Text style={{ color: !audioUri ? colors.textSecondary : colors.text }} className="text-xs font-bold">
                {audioUri ? (isPlaying ? 'Playing...' : 'Play Recording') : 'No Recording'}
              </Text>
            </Pressable>
          </View>
          {audioUri ? (
            <Text style={{ color: colors.textSecondary, marginTop: 10 }} className="text-xs">
              Audio attached. You can play or re-record before submitting.
            </Text>
          ) : null}
        </View>

        {/* Submit Button */}
        <AppButton
          label={submitting ? 'Submitting Report...' : 'File Issue Report'}
          variant="primary"
          onPress={handleSubmit}
          disabled={submitting || !description.trim() || (task ? !imageUri : false)}
          icon={<ShieldAlert size={16} color="#FFFFFF" />}
          className="w-full mt-2"
        />
      </ScrollView>
    </KeyboardAvoidingView>
    </BottomSheet>
  );
};
