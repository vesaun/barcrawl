import { useApp } from '@/context/AppContext';
import { DrinkType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const DRINK_TYPES: { type: DrinkType; label: string; icon: string }[] = [
  { type: 'shot', label: 'Shot', icon: 'flask' },
  { type: 'beer', label: 'Beer', icon: 'beer' },
  { type: 'cocktail', label: 'Cocktail', icon: 'wine' },
  { type: 'wine', label: 'Wine', icon: 'wine' },
  { type: 'seltzer', label: 'Seltzer', icon: 'water' },
];

export default function CameraScreen() {
  const { activeCrawl, startCrawl, addUpdate, tapOut } = useApp();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedDrink, setSelectedDrink] = useState<DrinkType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const handleStartCrawl = async () => {
    try {
      setIsLoading(true);
      await startCrawl();
    } catch (error) {
      Alert.alert('Error', 'Failed to start crawl. Please check location permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || !activeCrawl) return;

    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        let finalPhotoUri = photo.uri;
        
        // If using front camera, flip the image horizontally to correct mirroring
        if (facing === 'front') {
          const manipulated = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          finalPhotoUri = manipulated.uri;
        }

        await addUpdate(finalPhotoUri, selectedDrink || undefined);
        setSelectedDrink(null); // Reset drink selection after taking photo
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTapOut = async () => {
    Alert.alert(
      'End Crawl',
      'Are you sure you want to end this crawl?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Crawl',
          style: 'destructive',
          onPress: async () => {
            await tapOut();
            router.push('/crawl-review');
          },
        },
      ]
    );
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Start Crawl Screen
  if (!activeCrawl) {
    return (
      <View style={styles.container}>
        <View style={styles.startContainer}>
          <Ionicons name="camera" size={80} color="#FF6B6B" />
          <Text style={styles.startTitle}>Start Your Bar Crawl</Text>
          <Text style={styles.startSubtitle}>
            Track your route, count your drinks, and capture the night
          </Text>
          <TouchableOpacity
            style={[styles.startButton, isLoading && styles.startButtonDisabled]}
            onPress={handleStartCrawl}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.startButtonText}>Start Crawl</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Active Crawl - Dual Camera View
  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mirror={false}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <View style={styles.drinkButtonsContainer}>
            <Text style={styles.drinkingLabel}>Select a drink</Text>
            <View style={styles.drinkButtons}>
              {DRINK_TYPES.map((drink) => (
                <TouchableOpacity
                  key={drink.type}
                  style={[
                    styles.drinkButton,
                    selectedDrink === drink.type && styles.drinkButtonActive,
                  ]}
                  onPress={() =>
                    setSelectedDrink(selectedDrink === drink.type ? null : drink.type)
                  }
                >
                  <Ionicons
                    name={drink.icon as any}
                    size={18}
                    color={selectedDrink === drink.type ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.drinkButtonText,
                      selectedDrink === drink.type && styles.drinkButtonTextActive,
                    ]}
                  >
                    {drink.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Counts (under drink selection) */}
            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="wine" size={14} color="#FF6B35" />
                <Text style={styles.metaText}>
                  {activeCrawl.drinks.length} drink{activeCrawl.drinks.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="images" size={14} color="#D4A574" />
                <Text style={styles.metaText}>
                  {activeCrawl.updates.length} update{activeCrawl.updates.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={styles.tapOutButton}
            onPress={handleTapOut}
          >
            <Ionicons name="stop-circle" size={24} color="#fff" />
            <Text style={styles.tapOutText}>Tap Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
            onPress={handleTakePicture}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF6B35',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  startTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center',
  },
  startSubtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    minWidth: 200,
    shadowColor: '#F95700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
  },
  drinkButtonsContainer: {
    backgroundColor: 'rgba(62, 39, 35, 0.9)',
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#6B5744',
  },
  drinkingLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  drinkButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  drinkButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#6B5744',
  },
  drinkButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  drinkButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  drinkButtonTextActive: {
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(107, 87, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaText: {
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tapOutButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  tapOutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 25,
  },
});
