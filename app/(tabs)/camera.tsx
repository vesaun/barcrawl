import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { DrinkType } from '@/types';
import { useRouter } from 'expo-router';

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
        await addUpdate(photo.uri, selectedDrink || undefined);
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
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
          <View style={styles.drinkButtonsContainer}>
            <Text style={styles.drinkingLabel}>Drinking?</Text>
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
                    size={20}
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

        {/* Add to Crawl Button (shown after photo) */}
        {activeCrawl.updates.length > 0 && (
          <View style={styles.updateIndicator}>
            <Text style={styles.updateIndicatorText}>
              {activeCrawl.updates.length} update{activeCrawl.updates.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
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
    backgroundColor: '#FF6B6B',
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
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    minWidth: 200,
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
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 15,
    padding: 10,
  },
  drinkingLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  drinkButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  drinkButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  drinkButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  drinkButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  drinkButtonTextActive: {
    color: '#fff',
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
    backgroundColor: 'rgba(255,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  updateIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  updateIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
