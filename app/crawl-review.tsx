import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline } from 'react-native-maps';
import { useApp } from '@/context/AppContext';

const { width } = Dimensions.get('window');

export default function CrawlReviewScreen() {
  const { activeCrawl, uploadCrawl, calculateDistance, currentUser, endCrawl } = useApp();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!activeCrawl) {
      router.back();
      return;
    }

    // Auto-generate title
    const city = 'New York'; // Would be determined from location in production
    setTitle(`${city} Bar Crawl`);

    // Select all updates by default
    setSelectedUpdates(new Set(activeCrawl.updates.map((u) => u.id)));
  }, [activeCrawl, router]);

  if (!activeCrawl) {
    return null;
  }

  const milesWalked = calculateDistance(activeCrawl.route);
  const drinksCount = activeCrawl.drinks.length;
  const barsHit = activeCrawl.barsHit.length;

  const toggleUpdate = (updateId: string) => {
    setSelectedUpdates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(updateId)) {
        newSet.delete(updateId);
      } else {
        newSet.add(updateId);
      }
      return newSet;
    });
  };

  const handleUpload = async () => {
    if (selectedUpdates.size === 0) {
      Alert.alert('Error', 'Please select at least one photo to upload');
      return;
    }

    if (caption.length > 200) {
      Alert.alert('Error', 'Caption must be 200 words or less');
      return;
    }

    try {
      setIsUploading(true);
      await uploadCrawl(title, caption || undefined, Array.from(selectedUpdates));
      router.push('/(tabs)/');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload crawl');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Cancel Crawl',
              'Are you sure you want to cancel? This crawl will be discarded.',
              [
                { text: 'Keep Editing', style: 'cancel' },
                {
                  text: 'Discard',
                  style: 'destructive',
                  onPress: () => {
                    endCrawl();
                    router.back();
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Crawl</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="wine" size={24} color="#FF6B6B" />
            <Text style={styles.statValue}>{drinksCount}</Text>
            <Text style={styles.statLabel}>Drinks</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="beer" size={24} color="#FF6B6B" />
            <Text style={styles.statValue}>{barsHit}</Text>
            <Text style={styles.statLabel}>Bars</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="walk" size={24} color="#FF6B6B" />
            <Text style={styles.statValue}>{milesWalked.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Miles</Text>
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Crawl title"
          />
        </View>

        {/* Caption Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Caption (optional, max 200 words)</Text>
          <TextInput
            style={[styles.input, styles.captionInput]}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption..."
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{caption.length}/200</Text>
        </View>

        {/* Route Map */}
        {activeCrawl.route.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: activeCrawl.route[0].latitude,
                  longitude: activeCrawl.route[0].longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Polyline
                  coordinates={activeCrawl.route.map((point) => ({
                    latitude: point.latitude,
                    longitude: point.longitude,
                  }))}
                  strokeColor="#FF6B6B"
                  strokeWidth={3}
                />
              </MapView>
            </View>
          </View>
        )}

        {/* Media Carousel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos ({selectedUpdates.size} selected)</Text>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.mediaCarousel}
          >
            {activeCrawl.updates.map((update) => {
              const isSelected = selectedUpdates.has(update.id);
              return (
                <TouchableOpacity
                  key={update.id}
                  style={styles.mediaItem}
                  onPress={() => toggleUpdate(update.id)}
                >
                  <Image source={{ uri: update.photoUri }} style={styles.mediaImage} />
                  {!isSelected && (
                    <View style={styles.deselectedOverlay}>
                      <Ionicons name="close-circle" size={40} color="#fff" />
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </View>
                  )}
                  {update.drinkType && (
                    <View style={styles.drinkBadge}>
                      <Ionicons
                        name={
                          update.drinkType === 'beer'
                            ? 'beer'
                            : update.drinkType === 'wine'
                            ? 'wine'
                            : update.drinkType === 'shot'
                            ? 'flask'
                            : 'cafe'
                        }
                        size={16}
                        color="#fff"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={styles.mediaHint}>Tap photos to remove them from the post</Text>
        </View>
      </ScrollView>

      {/* Upload Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={isUploading || selectedUpdates.size === 0}
        >
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Upload Crawl'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  inputContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  captionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mediaCarousel: {
    marginBottom: 10,
  },
  mediaItem: {
    width: width - 40,
    height: 300,
    marginRight: 10,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  deselectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
  },
  drinkBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  mediaHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  uploadButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
