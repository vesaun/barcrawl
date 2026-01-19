import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline } from 'react-native-maps';
import { useApp } from '@/context/AppContext';
import { Post } from '@/types';

const { width } = Dimensions.get('window');

export default function FeedScreen() {
  const { feedPosts, addCheers, addComment, currentUser } = useApp();
  const router = useRouter();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

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

  const renderPost = (post: Post) => {
    const { crawl, user } = post;
    const isCheered = post.cheeredBy.includes(currentUser?.id || '');
    const showComments = expandedComments.has(post.id);

    return (
      <View key={post.id} style={styles.postContainer}>
        {/* User Header */}
        <TouchableOpacity
          style={styles.userHeader}
          onPress={() => handleUserPress(user.id)}
        >
          {user.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Ionicons name="person" size={20} color="#666" />
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
            <Ionicons name="wine" size={16} color="#666" />
            <Text style={styles.statText}>{crawl.drinksCount} drinks</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="beer" size={16} color="#666" />
            <Text style={styles.statText}>{crawl.barsHit.length} bars</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="walk" size={16} color="#666" />
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
                strokeColor="#FF6B6B"
                strokeWidth={3}
              />
            </MapView>
          </View>
        )}

        {/* Media Carousel */}
        {crawl.updates.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.mediaCarousel}
          >
            {crawl.updates.map((update) => (
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
              color={isCheered ? '#FF6B6B' : '#666'}
            />
            <Text style={[styles.actionText, isCheered && styles.actionTextActive]}>
              Cheers ({post.cheersCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleComments(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#666" />
            <Text style={styles.actionText}>Comment ({post.comments.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {showComments && (
          <View style={styles.commentsSection}>
            {post.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentUsername}>{comment.username}: </Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={commentTexts[post.id] || ''}
                onChangeText={(text) =>
                  setCommentTexts((prev) => ({ ...prev, [post.id]: text }))
                }
                onSubmitEditing={() => submitComment(post.id)}
              />
              <TouchableOpacity onPress={() => submitComment(post.id)}>
                <Ionicons name="send" size={20} color="#FF6B6B" />
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
            <Ionicons name="beer-outline" size={64} color="#ccc" />
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
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
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
  },
  profilePicturePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  postTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    marginBottom: 10,
    color: '#000',
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
    color: '#666',
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mediaCarousel: {
    marginBottom: 15,
  },
  mediaItem: {
    width: width - 30,
    height: 300,
    marginHorizontal: 15,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  drinkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  caption: {
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 14,
    color: '#666',
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
    color: '#666',
  },
  actionTextActive: {
    color: '#FF6B6B',
  },
  commentsSection: {
    paddingHorizontal: 15,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  comment: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  commentUsername: {
    fontWeight: '600',
    fontSize: 14,
    color: '#000',
  },
  commentText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
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
    color: '#666',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
});
