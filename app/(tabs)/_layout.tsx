import { Tabs, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApp } from '@/context/AppContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const {
    activeCrawl,
    autoTapOutPendingReview,
    clearAutoTapOutPendingReview,
    postUploadNavigateToFeed,
    clearPostUploadNavigateToFeed,
  } = useApp();
  const didOpenReviewRef = useRef(false);

  // If a crawl timed out while the app was closed, auto-open the review modal.
  useEffect(() => {
    if (!autoTapOutPendingReview) return;
    if (!activeCrawl) {
      clearAutoTapOutPendingReview();
      return;
    }
    // Guard: don't open multiple review modals or re-open if already on it.
    if (pathname === '/crawl-review') {
      clearAutoTapOutPendingReview();
      return;
    }
    if (didOpenReviewRef.current) {
      clearAutoTapOutPendingReview();
      return;
    }
    didOpenReviewRef.current = true;
    router.push('/crawl-review');
    clearAutoTapOutPendingReview();
  }, [activeCrawl, autoTapOutPendingReview, clearAutoTapOutPendingReview, pathname, router]);

  // Reset guard once crawl ends.
  useEffect(() => {
    if (!activeCrawl) {
      didOpenReviewRef.current = false;
    }
  }, [activeCrawl]);

  // After uploading (from tap-out or timeout), ensure we land on Feed tab.
  useEffect(() => {
    if (!postUploadNavigateToFeed) return;
    // If we're currently showing the review modal, this will run after it dismisses.
    if (pathname !== '/(tabs)/index') {
      router.replace('/(tabs)/index');
    }
    clearPostUploadNavigateToFeed();
  }, [clearPostUploadNavigateToFeed, pathname, postUploadNavigateToFeed, router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#8B7355',
        tabBarStyle: {
          backgroundColor: '#2C1810',
          borderTopColor: '#3E2723',
          borderTopWidth: 1,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore Bars',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => <Ionicons name="camera" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
