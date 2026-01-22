import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline } from 'react-native-maps';
import { useApp } from '@/context/AppContext';
import { Crawl, Post } from '@/types';

const { width } = Dimensions.get('window');

export default function UserProfileScreen() {
  const { userId: userIdParam } = useLocalSearchParams<{ userId: string }>();
  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
  const { currentUser, feedPosts, addCheers, addComment } = useApp();
  const router = useRouter();
  const [recapCrawl, setRecapCrawl] = useState<Crawl | null>(null);
  const [recapImageIndex, setRecapImageIndex] = useState(0);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});

  // For MVP, we'll show the current user's profile or find user from feed
  // In production, this would fetch user data by userId
  const user = userId === currentUser?.id
    ? currentUser
    : feedPosts.find((p) => p.user.id === userId)?.user || currentUser;

  // Get posts by this user
  const userPosts = feedPosts.filter((p) => p.user.id === userId);

  const handleUserPress = (targetUserId: string) => {
    if (!targetUserId) return;
    
    // Always allow navigation - even if it's the same user, it will just refresh the view
    // This ensures the chain never breaks
    router.push(`/user/${targetUserId}`);
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleMediaScroll = (postId: string, event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const itemWidth = width - 60;
    const imageIndex = Math.round(contentOffsetX / itemWidth);
    setCurrentImageIndex((prev) => ({ ...prev, [postId]: imageIndex }));
  };

  const submitComment = (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (text) {
      addComment(postId, text);
      setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
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
          <Ionicons name="arrow-back" size={24} color="#FF6B35" />
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
              <Ionicons name="person" size={50} color="#8B7355" />
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

        {/* Posts Section */}
        {userPosts.length > 0 && (
          <View style={styles.postsSection}>
            <Text style={styles.sectionTitle}>Posts</Text>
            {userPosts.map((post) => {
              const showComments = expandedComments.has(post.id);
              const currentIndex = currentImageIndex[post.id] ?? 0;
              const totalImages = post.crawl.updates.length;
              
              return (
                <View key={post.id} style={styles.postCard}>
                  {/* Post Title */}
                  <Text style={styles.postTitle}>
                    {post.crawl.title || `${post.crawl.city || 'Unknown'} Bar Crawl`}
                  </Text>

                  {/* Stats */}
                  <View style={styles.postStats}>
                    <View style={styles.postStat}>
                      <Ionicons name="wine" size={16} color="#FF6B35" />
                      <Text style={styles.postStatText}>{post.crawl.drinksCount} drinks</Text>
                    </View>
                    <View style={styles.postStat}>
                      <Ionicons name="beer" size={16} color="#FF6B35" />
                      <Text style={styles.postStatText}>{post.crawl.barsHit.length} bars</Text>
                    </View>
                    <View style={styles.postStat}>
                      <Ionicons name="walk" size={16} color="#FF6B35" />
                      <Text style={styles.postStatText}>{post.crawl.milesWalked.toFixed(2)} mi</Text>
                    </View>
                  </View>

                  {/* Media Carousel */}
                  {post.crawl.updates.length > 0 && (
                    <View style={styles.mediaCarouselContainer}>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.mediaCarousel}
                        onMomentumScrollEnd={(event) => handleMediaScroll(post.id, event)}
                        onScroll={(event) => handleMediaScroll(post.id, event)}
                        scrollEventThrottle={16}
                      >
                        {post.crawl.updates.map((update) => (
                          <View key={update.id} style={styles.mediaItem}>
                            <Image source={{ uri: update.photoUri }} style={styles.mediaImage} />
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
                          </View>
                        ))}
                      </ScrollView>
                      {/* Image Counter Indicator */}
                      {totalImages > 1 && (
                        <View style={styles.imageCounter}>
                          <Text style={styles.imageCounterText}>
                            {currentIndex + 1}/{totalImages}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Caption */}
                  {post.crawl.caption && (
                    <Text style={styles.postCaption}>{post.crawl.caption}</Text>
                  )}

                  {/* Actions */}
                  <View style={styles.postActions}>
                    <TouchableOpacity
                      style={styles.postAction}
                      onPress={() => addCheers(post.id)}
                    >
                      <Ionicons 
                        name={post.cheeredBy.includes(currentUser?.id || '') ? 'heart' : 'heart-outline'} 
                        size={20} 
                        color={post.cheeredBy.includes(currentUser?.id || '') ? '#FF6B35' : '#8B7355'} 
                      />
                      <Text style={[
                        styles.postActionText,
                        post.cheeredBy.includes(currentUser?.id || '') && styles.postActionTextActive
                      ]}>
                        {post.cheersCount} Cheers
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.postAction}
                      onPress={() => toggleComments(post.id)}
                    >
                      <Ionicons name="chatbubble-outline" size={20} color="#8B7355" />
                      <Text style={styles.postActionText}>Comment ({post.comments.length})</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Comments Section */}
                  {showComments && (
                    <View style={styles.commentsSection}>
                      {post.comments.map((comment) => (
                        <View key={comment.id} style={styles.comment}>
                          <Pressable 
                            onPress={() => {
                              if (comment.userId) {
                                handleUserPress(comment.userId);
                              }
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={({ pressed }) => [
                              styles.commentUsernameContainer,
                              pressed && styles.commentUsernamePressed
                            ]}
                            disabled={!comment.userId}
                          >
                            <Text style={styles.commentUsername}>{comment.username}</Text>
                            <Text style={styles.commentColon}>: </Text>
                          </Pressable>
                          <Text style={styles.commentText}>{comment.text}</Text>
                        </View>
                      ))}
                      <View style={styles.commentInputContainer}>
                        <TextInput
                          style={styles.commentInput}
                          placeholder="Add a comment..."
                          placeholderTextColor="#8B7355"
                          value={commentTexts[post.id] || ''}
                          onChangeText={(text) =>
                            setCommentTexts((prev) => ({ ...prev, [post.id]: text }))
                          }
                          onSubmitEditing={() => submitComment(post.id)}
                        />
                        <TouchableOpacity onPress={() => submitComment(post.id)}>
                          <Ionicons name="send" size={20} color="#FF6B35" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Crawls List */}
        <View style={styles.crawlsSection}>
          <Text style={styles.sectionTitle}>Crawls</Text>
          {userCrawls.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="beer-outline" size={48} color="#8B7355" />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF8E7',
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
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FFF8E7',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FFF8E7',
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
  errorText: {
    color: '#FFF8E7',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  postsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3E2723',
  },
  postCard: {
    backgroundColor: '#3E2723',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#6B5744',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF8E7',
    marginBottom: 10,
  },
  postStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postStatText: {
    fontSize: 14,
    color: '#D4A574',
  },
  mediaCarouselContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  mediaCarousel: {
    marginBottom: 0,
  },
  mediaItem: {
    width: width - 60,
    height: 300,
    marginRight: 10,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 10,
    left: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  imageCounterText: {
    color: '#FFF8E7',
    fontSize: 12,
    fontWeight: '600',
  },
  drinkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.8)',
    padding: 8,
    borderRadius: 20,
  },
  postCaption: {
    fontSize: 14,
    color: '#D4A574',
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postActionText: {
    fontSize: 14,
    color: '#D4A574',
  },
  commentsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#6B5744',
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  commentUsernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginRight: 4,
  },
  commentUsernamePressed: {
    opacity: 0.6,
  },
  commentUsername: {
    fontWeight: '600',
    fontSize: 14,
    color: '#FF6B35',
  },
  commentColon: {
    fontSize: 14,
    color: '#D4A574',
  },
  commentText: {
    fontSize: 14,
    color: '#D4A574',
    flex: 1,
    flexShrink: 1,
    paddingTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#6B5744',
  },
  commentInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#6B5744',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#1A1A1A',
    color: '#FFF8E7',
  },
  postActionTextActive: {
    color: '#FF6B35',
  },
});
