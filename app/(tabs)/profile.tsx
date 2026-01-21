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
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline } from 'react-native-maps';
import { useApp } from '@/context/AppContext';
import { Crawl } from '@/types';

const { width } = Dimensions.get('window');

const PERIODS: Array<'day' | 'week' | 'month' | 'year' | 'lifetime'> = [
  'day',
  'week',
  'month',
  'year',
  'lifetime',
];

export default function ProfileScreen() {
  const { currentUser, getDrinksCount, logout } = useApp();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'lifetime'>('lifetime');
  const [recapCrawl, setRecapCrawl] = useState<Crawl | null>(null);
  const [recapImageIndex, setRecapImageIndex] = useState(0);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const drinksCount = getDrinksCount(selectedPeriod);

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
    const location = 'New York'; // Would be determined from location in production
    const drink = update.drinkType || 'drinks';
    
    return `${location} at ${time} drinking ${drink}`;
  };

  const handleLogout = () => {
    logout();
    router.replace('/welcome');
  };

  const handleEditProfile = () => {
    setShowSettingsMenu(false);
    router.push('/edit-profile');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettingsMenu(!showSettingsMenu)}
        >
          <Ionicons name="settings-outline" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Settings Menu */}
      {showSettingsMenu && (
        <>
          <TouchableWithoutFeedback onPress={() => setShowSettingsMenu(false)}>
            <View style={styles.settingsMenuOverlay} />
          </TouchableWithoutFeedback>
          <View style={styles.settingsMenu}>
            <TouchableOpacity
              style={styles.settingsMenuItem}
              onPress={handleEditProfile}
            >
              <Ionicons name="create-outline" size={20} color="#FFF8E7" />
              <Text style={styles.settingsMenuText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsMenuItem}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FF6B35" />
              <Text style={[styles.settingsMenuText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          {currentUser.profilePicture ? (
            <Image source={{ uri: currentUser.profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons name="person" size={50} color="#8B7355" />
            </View>
          )}
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>
          {currentUser.description && (
            <Text style={styles.description}>{currentUser.description}</Text>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentUser.friendsCount}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
        </View>

        {/* Drinks Counter */}
        <View style={styles.drinksSection}>
          <Text style={styles.sectionTitle}>Drinks</Text>
          <View style={styles.periodSelector}>
            {PERIODS.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.drinksCountContainer}>
              <Ionicons name="wine" size={40} color="#FF6B35" />
            <Text style={styles.drinksCount}>{drinksCount}</Text>
          </View>
        </View>

        {/* Crawls List */}
        <View style={styles.crawlsSection}>
          <Text style={styles.sectionTitle}>My Crawls</Text>
          {currentUser.crawls.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="beer-outline" size={48} color="#8B7355" />
              <Text style={styles.emptyStateText}>No crawls yet</Text>
              <Text style={styles.emptyStateSubtext}>Start your first crawl!</Text>
            </View>
          ) : (
            currentUser.crawls.map((crawl) => (
              <View key={crawl.id} style={styles.crawlCard}>
                <View style={styles.crawlHeader}>
                  <Text style={styles.crawlTitle}>{crawl.title || `${crawl.city || 'Unknown'} Bar Crawl`}</Text>
                  <Text style={styles.crawlDate}>
                    {new Date(crawl.startTime).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.crawlStats}>
                  <View style={styles.crawlStat}>
                <Ionicons name="wine" size={16} color="#FF6B35" />
                <Text style={styles.crawlStatText}>{crawl.drinksCount} drinks</Text>
              </View>
              <View style={styles.crawlStat}>
                <Ionicons name="beer" size={16} color="#FF6B35" />
                <Text style={styles.crawlStatText}>{crawl.barsHit.length} bars</Text>
              </View>
              <View style={styles.crawlStat}>
                <Ionicons name="walk" size={16} color="#FF6B35" />
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
                        strokeColor="#FF6B35"
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
                  <Ionicons name="images" size={20} color="#FF6B35" />
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
    backgroundColor: '#2C1810',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3E2723',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C1810',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  settingsButton: {
    padding: 5,
  },
  settingsMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  settingsMenu: {
    position: 'absolute',
    top: 90,
    right: 20,
    backgroundColor: '#3E2723',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    minWidth: 180,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#6B5744',
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  settingsMenuText: {
    fontSize: 16,
    color: '#FFF8E7',
  },
  logoutText: {
    color: '#FF6B35',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#3E2723',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#6B5744',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#FFF8E7',
  },
  username: {
    fontSize: 16,
    color: '#D4A574',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#D4A574',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 15,
    lineHeight: 20,
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
    color: '#FFF8E7',
  },
  statLabel: {
    fontSize: 14,
    color: '#D4A574',
    marginTop: 5,
  },
  drinksSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3E2723',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FFF8E7',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  periodButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#6B5744',
  },
  periodButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#D4A574',
  },
  periodButtonTextActive: {
    color: '#FFF8E7',
    fontWeight: '600',
  },
  drinksCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  drinksCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
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
    color: '#D4A574',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 5,
  },
  crawlCard: {
    backgroundColor: '#3E2723',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#6B5744',
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
    color: '#FFF8E7',
  },
  crawlDate: {
    fontSize: 12,
    color: '#D4A574',
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
    color: '#D4A574',
  },
  crawlMapContainer: {
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#6B5744',
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
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6B5744',
  },
  moreMediaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D4A574',
  },
  recapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  recapButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  recapModal: {
    flex: 1,
    backgroundColor: '#2C1810',
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3E2723',
    backgroundColor: '#2C1810',
  },
  recapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF8E7',
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
    backgroundColor: 'rgba(255, 107, 53, 0.7)',
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
    borderTopColor: '#3E2723',
    backgroundColor: '#2C1810',
  },
  recapCaption: {
    fontSize: 16,
    color: '#FFF8E7',
    marginBottom: 10,
  },
  recapImageCount: {
    fontSize: 14,
    color: '#D4A574',
    textAlign: 'center',
  },
  loadingText: {
    color: '#FFF8E7',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});
