import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import {
  AlertTriangle,
  Wrench,
  Camera,
  Image as ImageIcon,
  Play,
  Trash2,
  ShieldAlert,
} from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';
import { StorageService } from '../../services/storage';
import { TaskCategory } from '../../types';

type IssueType = 'equipment' | 'animal_health' | 'supply' | 'other';
type PriorityType = 'low' | 'medium' | 'high';

export default function EmployeeIssuesScreen() {
  const { colors, isDark } = useTheme();

  const defaultCategory: TaskCategory = useMemo(() => 'maintenance', []);

  // Form state
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState<IssueType>('other');
  const [priority, setPriority] = useState<PriorityType>('medium');

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
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

      const rec = new Audio.Recording();
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

      await rec.prepareToRecordAsync(recordingOptions as any);
      await rec.startAsync();
      setRecording(rec);
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
      setAudioUri(uri || null);
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
        if ((status as any).isLoaded && (status as any).didJustFinish) {
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

    setSubmitting(true);
    try {
      const user = await StorageService.getCurrentUser();

      await StorageService.reportIssue(
        {
          taskId: undefined,
          taskTitle: undefined,
          category: defaultCategory,
          reportedBy: user?.name || 'Employee',
          priority,
          type: issueType,
          description: description.trim(),
        },
        imageUri || undefined,
        audioUri || undefined
      );

      Alert.alert('Issue Filed', 'The issue has been successfully reported to management.');
      setDescription('');
      setIssueType('other');
      setPriority('medium');
      setImageUri(null);
      setAudioUri(null);
      setRecording(null);
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

  const priorityTypes: PriorityType[] = ['low', 'medium', 'high'];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '12' }]}>
              <Wrench size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>Employee</Text>
              <Text style={[styles.title, { color: colors.text }]}>Report Farm Issue</Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>File an issue and attach evidence (photos/audio).</Text>
        </View>

        <View style={[styles.formCard, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={[styles.badge, { backgroundColor: colors.warningLight }]}>
              <AlertTriangle size={14} color={colors.warning} />
            </View>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>Issue & Evidence</Text>
          </View>

          {/* Issue Category (fixed as maintenance) */}
          <View style={{ marginBottom: 14 }}>
            <Text style={[styles.label, { color: colors.text }]}>Issue Category</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '12' }]}>
                <ShieldAlert size={14} color={colors.primary} />
              </View>
              <Text style={{ marginLeft: 10, color: colors.textSecondary, fontSize: 13, fontWeight: '900' }}>Maintenance</Text>
            </View>
          </View>

          {/* Issue Type */}
          <Text style={[styles.label, { color: colors.text }]}>Issue Type</Text>
          <View style={styles.pillWrap}>
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
                    marginRight: 10,
                    marginBottom: 10,
                    borderRadius: 14,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ marginRight: 8 }}>{t.icon}</Text>
                  <Text style={{ color: active ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '800' }}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Priority */}
          <Text style={[styles.label, { color: colors.text, marginTop: 8 }]}>Severity / Priority</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {priorityTypes.map((p) => {
              const active = priority === p;
              let activeColor = colors.primary;
              let activeBg = colors.primary + '18';
              if (p === 'high') {
                activeColor = colors.danger;
                activeBg = colors.danger + '18';
              }
              if (p === 'medium') {
                activeColor = colors.warning;
                activeBg = colors.warning + '18';
              }

              return (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={{
                    width: '31%',
                    backgroundColor: active ? activeBg : colors.background,
                    borderColor: active ? activeColor : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)'),
                    borderWidth: 1,
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: active ? activeColor : colors.textSecondary, fontSize: 12, fontWeight: '900' }}>{p}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Description */}
          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Provide detail on what happened, location, and what is needed..."
            placeholderTextColor={colors.textSecondary + '70'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              marginTop: 8,
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
              minHeight: 90,
            }}
          />

          {/* Photo */}
          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Attach Photo (Optional)</Text>
          <View style={{ marginTop: 8 }}>
            {imageUri ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
                <Pressable
                  onPress={() => setImageUri(null)}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: colors.danger,
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: 'row' }}>
                <Pressable
                  onPress={handleTakePhoto}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    marginRight: 10,
                  }}
                >
                  <Camera size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>Take Photo</Text>
                </Pressable>

                <Pressable
                  onPress={handleChoosePhoto}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    marginLeft: 10,
                  }}
                >
                  <ImageIcon size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>Upload Gallery</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Audio */}
          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Record Audio (Optional)</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Pressable
              onPress={recording ? handleStopRecording : handleStartRecording}
              style={{
                flex: 1,
                backgroundColor: recording ? colors.danger : colors.background,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                borderWidth: 1,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: recording ? '#FFFFFF' : colors.text, fontSize: 12, fontWeight: '900' }}>
                {recording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePlayAudio}
              disabled={!audioUri || isPlaying}
              style={{
                flex: 1,
                backgroundColor: colors.background,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
                borderWidth: 1,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !audioUri ? 0.6 : 1,
              }}
            >
              <Text style={{ color: audioUri ? colors.text : colors.textSecondary, fontSize: 12, fontWeight: '900' }}>
                {audioUri ? (isPlaying ? 'Playing...' : 'Play Recording') : 'No Recording'}
              </Text>
            </Pressable>
          </View>

          {/* Submit */}
          <View style={{ marginTop: 14 }}>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: submitting || pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={16} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'File Issue Report'}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
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
  formCard: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    marginBottom: 0,
  },
  categoryBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  photoPreview: {
    width: '100%',
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#00000010',
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});

