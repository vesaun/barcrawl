import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { ActiveCrawl, Crawl, User, Post, RoutePoint, Bar, Drink, CrawlUpdate, DrinkType } from '@/types';

interface SignUpData {
  username: string;
  name: string;
  age: number;
  email: string;
  phone: string;
  profilePicture?: string;
  description?: string;
}

interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
}

interface AppContextType {
  currentUser: User | null;
  activeCrawl: ActiveCrawl | null;
  feedPosts: Post[];
  signUp: (data: SignUpData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => void;
  startCrawl: () => Promise<void>;
  endCrawl: () => Promise<void>;
  addUpdate: (photoUri: string, drinkType?: DrinkType) => Promise<void>;
  tapOut: () => Promise<void>;
  uploadCrawl: (title: string, caption?: string, selectedUpdates?: string[]) => Promise<void>;
  addCheers: (postId: string) => void;
  addComment: (postId: string, text: string) => void;
  getDrinksCount: (period: 'day' | 'week' | 'month' | 'year' | 'lifetime') => number;
  calculateDistance: (route: RoutePoint[]) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeCrawl, setActiveCrawl] = useState<ActiveCrawl | null>(null);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [autoTerminateTimer, setAutoTerminateTimer] = useState<NodeJS.Timeout | null>(null);

  // Load user from storage on mount (for MVP, we'll use in-memory state)
  useEffect(() => {
    // In production, load from AsyncStorage or similar
    // For MVP, start with no user (will show welcome screen)
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      username: data.username,
      name: data.name,
      age: data.age,
      email: data.email,
      phone: data.phone,
      profilePicture: data.profilePicture,
      description: data.description,
      followersCount: 0,
      friendsCount: 0,
      crawls: [],
    };
    
    setCurrentUser(newUser);
    // In production, save to AsyncStorage or backend
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setActiveCrawl(null);
    setFeedPosts([]);
    // In production, clear AsyncStorage
  }, []);

  const updateProfile = useCallback((data: UpdateProfileData) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.profilePicture !== undefined && { profilePicture: data.profilePicture }),
      };
    });
  }, []);

  // Calculate distance in miles from route points
  const calculateDistance = useCallback((route: RoutePoint[]): number => {
    if (route.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1];
      const curr = route[i];
      
      // Haversine formula
      const R = 3959; // Earth's radius in miles
      const dLat = (curr.latitude - prev.latitude) * Math.PI / 180;
      const dLon = (curr.longitude - prev.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(prev.latitude * Math.PI / 180) * Math.cos(curr.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    
    return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
  }, []);

  // Detect nearby bars (simplified for MVP - would use actual API in production)
  const detectNearbyBars = useCallback(async (latitude: number, longitude: number): Promise<Bar[]> => {
    // For MVP, we'll use a simple distance check
    // In production, this would call a bars/restaurants API
    const mockBars: Bar[] = [
      { id: 'bar1', name: 'The Local Pub', latitude: 40.7128, longitude: -74.0060, visited: false },
      { id: 'bar2', name: 'Cocktail Lounge', latitude: 40.7138, longitude: -74.0070, visited: false },
      { id: 'bar3', name: 'Beer Garden', latitude: 40.7148, longitude: -74.0080, visited: false },
    ];

    const detectedBars: Bar[] = [];
    for (const bar of mockBars) {
      const distance = Math.sqrt(
        Math.pow(latitude - bar.latitude, 2) + Math.pow(longitude - bar.longitude, 2)
      ) * 69; // Rough conversion to miles
      
      if (distance < 0.05) { // Within 0.05 miles (~264 feet)
        detectedBars.push(bar);
      }
    }

    return detectedBars;
  }, []);

  const startCrawl = useCallback(async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const startTime = Date.now();
      const crawlId = `crawl_${startTime}`;

      // Start location tracking
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          setActiveCrawl((prev) => {
            if (!prev) return null;
            
            const newPoint: RoutePoint = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: Date.now(),
            };

            // Check for nearby bars
            detectNearbyBars(location.coords.latitude, location.coords.longitude).then((bars) => {
              setActiveCrawl((current) => {
                if (!current) return null;
                const newBars = [...current.barsHit];
                bars.forEach((bar) => {
                  const existingIndex = newBars.findIndex((b) => b.id === bar.id);
                  if (existingIndex === -1) {
                    newBars.push({ ...bar, visited: true, visitTimestamp: Date.now() });
                  }
                });
                return { ...current, barsHit: newBars };
              });
            });

            return {
              ...prev,
              route: [...prev.route, newPoint],
              lastActivityTime: Date.now(),
            };
          });
        }
      );

      setLocationSubscription(subscription);

      const newCrawl: ActiveCrawl = {
        id: crawlId,
        startTime,
        route: [],
        updates: [],
        drinks: [],
        barsHit: [],
        lastActivityTime: startTime,
      };

      setActiveCrawl(newCrawl);

      // Set auto-terminate timer (2 hours)
      const timer = setTimeout(() => {
        if (activeCrawl) {
          tapOut();
        }
      }, 2 * 60 * 60 * 1000); // 2 hours

      setAutoTerminateTimer(timer);
    } catch (error) {
      console.error('Error starting crawl:', error);
      throw error;
    }
  }, [detectNearbyBars]);

  const endCrawl = useCallback(async () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    if (autoTerminateTimer) {
      clearTimeout(autoTerminateTimer);
      setAutoTerminateTimer(null);
    }
    setActiveCrawl(null);
  }, [locationSubscription, autoTerminateTimer]);

  const addUpdate = useCallback(async (photoUri: string, drinkType?: DrinkType) => {
    if (!activeCrawl) return;

    try {
      const location = await Location.getCurrentPositionAsync();
      
      const update: CrawlUpdate = {
        id: `update_${Date.now()}`,
        photoUri,
        drinkType,
        timestamp: Date.now(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };

      const drinks = drinkType
        ? [...activeCrawl.drinks, { type: drinkType, timestamp: Date.now() }]
        : activeCrawl.drinks;

      setActiveCrawl({
        ...activeCrawl,
        updates: [...activeCrawl.updates, update],
        drinks,
        lastActivityTime: Date.now(),
      });

      // Reset auto-terminate timer
      if (autoTerminateTimer) {
        clearTimeout(autoTerminateTimer);
      }
      const timer = setTimeout(() => {
        if (activeCrawl) {
          tapOut();
        }
      }, 2 * 60 * 60 * 1000);
      setAutoTerminateTimer(timer);
    } catch (error) {
      console.error('Error adding update:', error);
    }
  }, [activeCrawl, autoTerminateTimer]);

  const tapOut = useCallback(async () => {
    if (!activeCrawl) return;
    // Stop location tracking but keep crawl data for review
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    if (autoTerminateTimer) {
      clearTimeout(autoTerminateTimer);
      setAutoTerminateTimer(null);
    }
    // Keep activeCrawl so review screen can access it
  }, [activeCrawl, locationSubscription, autoTerminateTimer]);

  const uploadCrawl = useCallback(async (title: string, caption?: string, selectedUpdates?: string[]) => {
    if (!activeCrawl || !currentUser) return;

    // If selectedUpdates is provided and not empty, filter updates
    // Otherwise, include all updates (or empty array if no updates exist)
    const updatesToInclude = selectedUpdates && selectedUpdates.length > 0
      ? activeCrawl.updates.filter((u) => selectedUpdates.includes(u.id))
      : activeCrawl.updates;

    const milesWalked = calculateDistance(activeCrawl.route);

    // Best-effort: determine city from last known location
    let city: string | undefined = undefined;
    try {
      const lastPoint = activeCrawl.route[activeCrawl.route.length - 1];
      const coords = lastPoint
        ? { latitude: lastPoint.latitude, longitude: lastPoint.longitude }
        : (await Location.getCurrentPositionAsync()).coords;

      const places = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      const place = places?.[0];
      city = place?.city || place?.subregion || place?.region || undefined;
    } catch (e) {
      console.error('Failed to determine city for crawl:', e);
    }

    const crawl: Crawl = {
      id: activeCrawl.id,
      userId: currentUser.id,
      title,
      caption,
      city,
      startTime: activeCrawl.startTime,
      endTime: Date.now(),
      route: activeCrawl.route,
      updates: updatesToInclude,
      drinks: activeCrawl.drinks,
      barsHit: activeCrawl.barsHit,
      milesWalked,
      drinksCount: activeCrawl.drinks.length,
      createdAt: Date.now(),
    };

    // Add to user's crawls
    setCurrentUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        crawls: [crawl, ...prev.crawls],
      };
    });

    // Add to feed
    const post: Post = {
      id: `post_${Date.now()}`,
      crawl,
      user: currentUser,
      cheersCount: 0,
      cheeredBy: [],
      comments: [],
      createdAt: Date.now(),
    };

    setFeedPosts((prev) => [post, ...prev]);
    
    // End crawl after upload
    endCrawl();
  }, [activeCrawl, currentUser, calculateDistance, endCrawl]);

  const addCheers = useCallback((postId: string) => {
    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isCheered = post.cheeredBy.includes(currentUser?.id || '');
          return {
            ...post,
            cheersCount: isCheered ? post.cheersCount - 1 : post.cheersCount + 1,
            cheeredBy: isCheered
              ? post.cheeredBy.filter((id) => id !== currentUser?.id)
              : [...post.cheeredBy, currentUser?.id || ''],
          };
        }
        return post;
      })
    );
  }, [currentUser]);

  const addComment = useCallback((postId: string, text: string) => {
    if (!currentUser) return;

    const comment = {
      id: `comment_${Date.now()}`,
      userId: currentUser.id,
      username: currentUser.username,
      profilePicture: currentUser.profilePicture,
      text,
      timestamp: Date.now(),
    };

    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, comment],
          };
        }
        return post;
      })
    );
  }, [currentUser]);

  const getDrinksCount = useCallback((period: 'day' | 'week' | 'month' | 'year' | 'lifetime'): number => {
    if (!currentUser) return 0;

    const now = Date.now();
    let startTime = 0;

    switch (period) {
      case 'day':
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case 'week':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case 'year':
        startTime = now - 365 * 24 * 60 * 60 * 1000;
        break;
      case 'lifetime':
        startTime = 0;
        break;
    }

    return currentUser.crawls.reduce((count, crawl) => {
      if (crawl.startTime >= startTime) {
        return count + crawl.drinksCount;
      }
      return count;
    }, 0);
  }, [currentUser]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeCrawl,
        feedPosts,
        signUp,
        logout,
        updateProfile,
        startCrawl,
        endCrawl,
        addUpdate,
        tapOut,
        uploadCrawl,
        addCheers,
        addComment,
        getDrinksCount,
        calculateDistance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
