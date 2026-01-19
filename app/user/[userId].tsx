import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline } from 'react-native-maps';
import { useApp } from '@/context/AppContext';
import { Crawl } from '@/types';

const { width } = Dimensions.get('window');

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { currentUser, feedPosts } = useApp();
  const router = useRouter();
  const [recapCrawl, setRecapCrawl] = useState<Crawl | null>(null);
  const [recapImageIndex, setRecapImageIndex] = useState(0);

  // For MVP, we'll show the current user's profile or find user from feed
  // In production, this would fetch user data by userId
  const user = userId === currentUser?.id
    ? currentUser
    : feedPosts.find((p) => p.user.id === userId)?.user || currentUser;

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>User not found</Text>
      </View>
    );
  }

  const userCrawls = user.crawls || [];

  const handleNightRecap = (crawl: Crawl) => {
    setRecapCrawl(crawl);
    setRecapImageIndex(0);
  };

  const closeRecap = () => {
    setRecapCrawl(null);
    setRecapImageIndex(0);
  };

  const nextImage = () => {
    if (recapCrawl && recapImageIndex < recapCrawl.updates.length - 1) {
      setRecapImageIndex(recapImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (recapImageIndex > 0) {
      setRecapImageIndex(recapImageIndex - 1);
    }
  };

  const generateCaption = (crawl: Crawl, updateIndex: number) => {
    const update = crawl.updates[updateIndex];
    if (!update) return '';
    
    const date = new Date(update.timestamp);
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const location = crawl.city || 'New York';
    const drink = update.drinkType || 'drinks';
    
    return `${location} at ${time} drinking ${drink}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons name="person" size={50} color="#666" />
            </View>
          )}
          <Text style={styles.username}>{user.username}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.friendsCount}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
        </View>

        {/* Crawls List */}
        <View style={styles.crawlsSection}>
          <Text style={styles.sectionTitle}>Crawls</Text>
          {userCrawls.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="beer-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No crawls yet</Text>
            </View>
          ) : (
            userCrawls.map((crawl) => (
              <View key={crawl.id} style={styles.crawlCard}>
                <View style={styles.crawlHeader}>
                  <Text style={styles.crawlTitle}>
                    {crawl.title || `${crawl.city || 'Unknown'} Bar Crawl`}
                  </Text>
                  <Text style={styles.crawlDate}>
                    {new Date(crawl.startTime).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.crawlStats}>
                  <View style={styles.crawlStat}>
                    <Ionicons name="wine" size={16} color="#666" />
                    <Text style={styles.crawlStatText}>{crawl.drinksCount} drinks</Text>
                  </View>
                  <View style={styles.crawlStat}>
                    <Ionicons name="beer" size={16} color="#666" />
                    <Text style={styles.crawlStatText}>{crawl.barsHit.length} bars</Text>
                  </View>
                  <View style={styles.crawlStat}>
                    <Ionicons name="walk" size={16} color="#666" />
                    <Text style={styles.crawlStatText}>{crawl.milesWalked.toFixed(2)} mi</Text>
                  </View>
                </View>

                {/* Route Map */}
                {crawl.route.length > 0 && (
                  <View style={styles.crawlMapContainer}>
                    <MapView
                      style={styles.crawlMap}
                      initialRegion={{
                        latitude: crawl.route[0].latitude,
                        longitude: crawl.route[0].longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                    >
                      <Polyline
                        coordinates={crawl.route.map((point) => ({
                          latitude: point.latitude,
                          longitude: point.longitude,
                        }))}
                        strokeColor="#FF6B6B"
                        strokeWidth={3}
                      />
                    </MapView>
                  </View>
                )}

                {/* Media Preview */}
                {crawl.updates.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.crawlMediaPreview}
                  >
                    {crawl.updates.slice(0, 5).map((update) => (
                      <Image
                        key={update.id}
                        source={{ uri: update.photoUri }}
                        style={styles.crawlMediaThumbnail}
                      />
                    ))}
                    {crawl.updates.length > 5 && (
                      <View style={styles.moreMediaIndicator}>
                        <Text style={styles.moreMediaText}>+{crawl.updates.length - 5}</Text>
                      </View>
                    )}
                  </ScrollView>
                )}

                <TouchableOpacity
                  style={styles.recapButton}
                  onPress={() => handleNightRecap(crawl)}
                >
                  <Ionicons name="images" size={20} color="#FF6B6B" />
                  <Text style={styles.recapButtonText}>Night Recap</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Night Recap Modal */}
      <Modal
        visible={recapCrawl !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={closeRecap}
      >
        {recapCrawl && (
          <View style={styles.recapModal}>
            <View style={styles.recapHeader}>
              <TouchableOpacity onPress={closeRecap}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.recapTitle}>Night Recap</Text>
              <View style={{ width: 28 }} />
            </View>

            {recapCrawl.updates.length > 0 && (
              <>
                <View style={styles.recapImageContainer}>
                  <Image
                    source={{ uri: recapCrawl.updates[recapImageIndex].photoUri }}
                    style={styles.recapImage}
                  />
                  {recapImageIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.recapNavButton, styles.recapNavButtonLeft]}
                      onPress={prevImage}
                    >
                      <Ionicons name="chevron-back" size={30} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {recapImageIndex < recapCrawl.updates.length - 1 && (
                    <TouchableOpacity
                      style={[styles.recapNavButton, styles.recapNavButtonRight]}
                      onPress={nextImage}
                    >
                      <Ionicons name="chevron-forward" size={30} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.recapCaptionContainer}>
                  <Text style={styles.recapCaption}>
                    {generateCaption(recapCrawl, recapImageIndex)}
                  </Text>
                  <Text style={styles.recapImageCount}>
                    {recapImageIndex + 1} / {recapCrawl.updates.length}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}
      </Modal>
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
  profileSection: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  crawlsSection: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  crawlCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  crawlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  crawlTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  crawlDate: {
    fontSize: 12,
    color: '#666',
  },
  crawlStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  crawlStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  crawlStatText: {
    fontSize: 14,
    color: '#666',
  },
  crawlMapContainer: {
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  crawlMap: {
    flex: 1,
  },
  crawlMediaPreview: {
    marginBottom: 15,
  },
  crawlMediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  moreMediaIndicator: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMediaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  recapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  recapButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  recapModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  recapImageContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recapImage: {
    width: width,
    height: '100%',
    resizeMode: 'cover',
  },
  recapNavButton: {
    position: 'absolute',
    top: '50%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 30,
  },
  recapNavButtonLeft: {
    left: 20,
  },
  recapNavButtonRight: {
    right: 20,
  },
  recapCaptionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  recapCaption: {
    fontSize: 16,
    color: '#000',
    marginBottom: 10,
  },
  recapImageCount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
