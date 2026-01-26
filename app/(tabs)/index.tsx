import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline } from 'react-native-maps';
import { useApp } from '@/context/AppContext';
import { Post } from '@/types';
import FullscreenCarouselModal from '@/components/fullscreen-carousel-modal';

const { width } = Dimensions.get('window');

export default function FeedScreen() {
  const { feedPosts, addCheers, addComment, currentUser } = useApp();
  const router = useRouter();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  const [fullscreenPostId, setFullscreenPostId] = useState<string | null>(null);

  const handleUserPress = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  const handlePostPress = (crawlId: string, userId: string) => {
    router.push(`/user/${userId}`);
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

  const submitComment = (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (text) {
      addComment(postId, text);
      setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
    }
  };

  const handleMediaScroll = (postId: string, event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const itemWidth = width - 30;
    const imageIndex = Math.round(contentOffsetX / itemWidth);
    setCurrentImageIndex((prev) => ({ ...prev, [postId]: imageIndex }));
  };

  const renderPost = (post: Post) => {
    const { crawl, user } = post;
    const isCheered = post.cheeredBy.includes(currentUser?.id || '');
    const showComments = expandedComments.has(post.id);
    const currentIndex = currentImageIndex[post.id] ?? 0;
    const totalImages = crawl.updates.length;
    const imageUris = crawl.updates.map((u) => u.photoUri);
    const isFullscreenOpen = fullscreenPostId === post.id;

    return (
      <View key={post.id} style={styles.postContainer}>
        <FullscreenCarouselModal
          visible={isFullscreenOpen}
          imageUris={imageUris}
          initialIndex={currentIndex}
          onClose={() => setFullscreenPostId(null)}
        />
        {/* User Header */}
        <TouchableOpacity
          style={styles.userHeader}
          onPress={() => handleUserPress(user.id)}
        >
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons name="person" size={20} color="#8B7355" />
            </View>
          )}
          <Text style={styles.username}>{user.username}</Text>
        </TouchableOpacity>

        {/* Title */}
        <TouchableOpacity onPress={() => handlePostPress(crawl.id, user.id)}>
          <Text style={styles.postTitle}>{crawl.title || `${crawl.city || 'Unknown'} Bar Crawl`}</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="wine" size={16} color="#FF6B35" />
            <Text style={styles.statText}>{crawl.drinksCount} drinks</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="beer" size={16} color="#FF6B35" />
            <Text style={styles.statText}>{crawl.barsHit.length} bars</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="walk" size={16} color="#FF6B35" />
            <Text style={styles.statText}>{crawl.milesWalked.toFixed(2)} mi</Text>
          </View>
        </View>

        {/* Route Map */}
        {crawl.route.length > 0 && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
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

        {/* Media Carousel */}
        {crawl.updates.length > 0 && (
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
              {crawl.updates.map((update) => (
                <View key={update.id} style={styles.mediaItem}>
                  <View style={styles.mediaFrame}>
                    <Image source={{ uri: update.photoUri }} style={styles.mediaImage} resizeMode="contain" />
                  </View>
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
            {/* Fullscreen */}
            <TouchableOpacity
              style={styles.fullscreenButton}
              onPress={() => setFullscreenPostId(post.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="expand-outline" size={18} color="#FFF8E7" />
            </TouchableOpacity>
          </View>
        )}

        {/* Caption */}
        {crawl.caption && (
          <Text style={styles.caption}>{crawl.caption}</Text>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => addCheers(post.id)}
          >
            <Ionicons
              name={isCheered ? 'heart' : 'heart-outline'}
              size={24}
              color={isCheered ? '#FF6B35' : '#8B7355'}
            />
            <Text style={[styles.actionText, isCheered && styles.actionTextActive]}>
              Cheers ({post.cheersCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleComments(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#8B7355" />
            <Text style={styles.actionText}>Comment ({post.comments.length})</Text>
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BarCrawl</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {feedPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="beer-outline" size={64} color="#8B7355" />
            <Text style={styles.emptyStateText}>No crawls yet</Text>
            <Text style={styles.emptyStateSubtext}>Start a crawl to see posts here!</Text>
          </View>
        ) : (
          feedPosts.map(renderPost)
        )}
      </ScrollView>
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
    backgroundColor: '#2C1810',
    borderBottomWidth: 1,
    borderBottomColor: '#3E2723',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#3E2723',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C1810',
    paddingBottom: 15,
    borderRadius: 12,
    marginHorizontal: 10,
    marginTop: 10,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  profilePicturePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#6B5744',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF8E7',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    marginBottom: 10,
    color: '#FFF8E7',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 14,
    color: '#D4A574',
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#6B5744',
  },
  map: {
    flex: 1,
  },
  mediaCarouselContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  mediaCarousel: {
    marginBottom: 0,
  },
  mediaItem: {
    width: width - 30,
    height: 300,
    marginHorizontal: 15,
    position: 'relative',
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
  mediaFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 10,
    right: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  drinkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.8)',
    padding: 8,
    borderRadius: 20,
  },
  caption: {
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 14,
    color: '#D4A574',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 14,
    color: '#D4A574',
  },
  actionTextActive: {
    color: '#FF6B35',
  },
  commentsSection: {
    paddingHorizontal: 15,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#6B5744',
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 10,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D4A574',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 10,
  },
});
