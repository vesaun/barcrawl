import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Props = {
  visible: boolean;
  onClose: () => void;
  onPhotoTaken: (uri: string) => void;
};

export default function ProfilePhotoCameraModal({ visible, onClose, onPhotoTaken }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!visible) return;
    if (permission?.granted) return;

    // Request permission when modal opens.
    requestPermission();
  }, [visible, permission?.granted, requestPermission]);

  useEffect(() => {
    if (!visible) return;
    // Default to front camera for profile pictures.
    setFacing('front');
  }, [visible]);

  const canUseCamera = !!permission?.granted;

  const squarePreviewSize = useMemo(() => {
    // Keep a nice centered preview area; actual output is cropped to square on capture.
    const maxWidth = Math.min(screenWidth, 420);
    return Math.floor(maxWidth * 0.9);
  }, []);

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || !canUseCamera) return;
    if (isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
      });

      if (!photo?.uri) {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        return;
      }

      let finalUri = photo.uri;

      // Build actions: flip only for front camera, then crop to square (center-crop) for profile picture.
      const actions: ImageManipulator.Action[] = [];
      if (facing === 'front') {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }

      const w = (photo as any).width as number | undefined;
      const h = (photo as any).height as number | undefined;
      if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
        const size = Math.min(w, h);
        const originX = Math.floor((w - size) / 2);
        const originY = Math.floor((h - size) / 2);
        actions.push({ crop: { originX, originY, width: size, height: size } });
      }

      if (actions.length > 0) {
        const manipulated = await ImageManipulator.manipulateAsync(finalUri, actions, {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        finalUri = manipulated.uri;
      }

      onPhotoTaken(finalUri);
    } catch (e) {
      console.error('Profile photo capture failed:', e);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton} disabled={isCapturing}>
            <Ionicons name="close" size={26} color="#FF6B35" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Photo</Text>
          <TouchableOpacity onPress={toggleFacing} style={styles.headerButton} disabled={!canUseCamera || isCapturing}>
            <Ionicons name="camera-reverse" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator color="#FF6B35" />
            <Text style={styles.helpText}>Checking camera permission…</Text>
          </View>
        ) : !canUseCamera ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle" size={40} color="#E74C3C" />
            <Text style={styles.helpText}>Camera permission is required to take a profile photo.</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraArea}>
            <View style={[styles.previewFrame, { width: squarePreviewSize, height: squarePreviewSize }]}>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                mirror={false}
              />
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                onPress={handleTakePicture}
                disabled={isCapturing}
                style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
              >
                {isCapturing ? (
                  <ActivityIndicator color="#FFF8E7" />
                ) : (
                  <Ionicons name="camera" size={22} color="#FFF8E7" />
                )}
                <Text style={styles.captureText}>{isCapturing ? 'Capturing…' : 'Take Photo'}</Text>
              </TouchableOpacity>
              <Text style={styles.tipText}>
                {facing === 'front' ? 'Front camera: selfie will be un-mirrored.' : 'Back camera.'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C1810',
  },
  header: {
    paddingTop: 55,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3E2723',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFF8E7',
    fontSize: 18,
    fontWeight: '700',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  helpText: {
    color: '#D4A574',
    fontSize: 15,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 6,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFF8E7',
    fontSize: 16,
    fontWeight: '700',
  },
  cameraArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Math.max(28, Math.floor(screenHeight * 0.04)),
    gap: 18,
  },
  previewFrame: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: '#1A1A1A',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: '#F95700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureText: {
    color: '#FFF8E7',
    fontSize: 16,
    fontWeight: '800',
  },
  tipText: {
    color: '#8B7355',
    fontSize: 13,
  },
});
