import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, Image, Platform, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, Trash2, MapPin } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export type GeoPoint = { latitude: number; longitude: number };

export interface EvidenceUploadSectionProps {
  imageUri: string | null;
  onImageUriChange: (uri: string | null) => void;
  imageLocation?: GeoPoint | null;
  onImageLocationChange?: (loc: GeoPoint | null) => void;
  required?: boolean;
  compact?: boolean;
}

export function EvidenceUploadSection({
  imageUri,
  onImageUriChange,
  imageLocation = null,
  onImageLocationChange,
  required = true,
  compact = false,
}: EvidenceUploadSectionProps) {
  const { colors, isDark } = useTheme();
  const [busy, setBusy] = useState(false);

  const title = useMemo(
    () => (required ? 'Upload Evidence (Photo & GPS)' : 'Upload Evidence (Photo, optional GPS)'),
    [required]
  );

  const requestCameraPermission = async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const requestLibraryPermission = async () => {
    if (Platform.OS === 'web') return true;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const trySetLocation = async () => {
    if (!onImageLocationChange) return;

    if (Platform.OS === 'web') {
      onImageLocationChange(null);
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        onImageLocationChange(null);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      onImageLocationChange({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      onImageLocationChange(null);
    }
  };

  const handleTakePhoto = async () => {
    setBusy(true);
    try {
      const ok = await requestCameraPermission();
      if (!ok) {
        Alert.alert('Permission Required', 'Camera permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        onImageUriChange(uri);
        await trySetLocation();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to capture photo.');
    } finally {
      setBusy(false);
    }
  };

  const handleChoosePhoto = async () => {
    setBusy(true);
    try {
      const ok = await requestLibraryPermission();
      if (!ok) {
        Alert.alert('Permission Required', 'Photo library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        onImageUriChange(uri);
        await trySetLocation();
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to pick photo.');
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    onImageUriChange(null);
    onImageLocationChange?.(null);
  };

  return (
    <View style={{ marginBottom: compact ? 10 : 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.primary + '12', borderColor: colors.primary + '33' },
            compact && { width: 34, height: 34 },
          ]}
        >
          <Camera size={16} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>

      {imageUri ? (
        <View
          style={[
            styles.previewWrap,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Image source={{ uri: imageUri }} style={styles.previewImage} />

          <Pressable
            onPress={clear}
            disabled={busy}
            style={[styles.clearBtn, { backgroundColor: colors.danger, opacity: busy ? 0.7 : 1 }]}
          >
            <Trash2 size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={handleTakePhoto}
            disabled={busy}
            style={[
              styles.pickBtn,
              {
                backgroundColor: colors.background,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
              },
            ]}
            className="flex-1"
          >
            <Camera size={16} color={colors.primary} />
            <Text style={[styles.pickText, { color: colors.text }]}>Take Photo</Text>
          </Pressable>

          <Pressable
            onPress={handleChoosePhoto}
            disabled={busy}
            style={[
              styles.pickBtn,
              {
                backgroundColor: colors.background,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(62,39,35,0.05)',
              },
            ]}
            className="flex-1"
          >
            <Text style={[styles.pickText, { color: colors.text }]}>Upload</Text>
          </Pressable>
        </View>
      )}

      {onImageLocationChange && (
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
          <MapPin size={12} color={colors.textMuted} />
          <Text style={[styles.locText, { color: colors.textSecondary }]}>
            {imageLocation
              ? `GPS attached (${imageLocation.latitude.toFixed(2)}, ${imageLocation.longitude.toFixed(2)})`
              : 'GPS will be attached when available.'}
          </Text>
        </View>
      )}

      {required && !imageUri && (
        <Text style={[styles.helper, { color: colors.warning }]}>Photo is required to complete this task.</Text>
      )}

      {required && imageUri && !imageLocation && (
        <Text style={[styles.helper, { color: colors.warning }]}>Location is required to complete this task.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 10,
    flex: 1,
  },
  previewWrap: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    height: 160,
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  clearBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  pickBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pickText: {
    fontSize: 12,
    fontWeight: '900',
  },
  helper: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '800',
  },
  locText: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '700',
  },
});

