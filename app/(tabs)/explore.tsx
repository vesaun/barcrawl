import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useApp } from '@/context/AppContext';
import { Bar } from '@/types';

const { width, height } = Dimensions.get('window');

export default function ExploreBarsScreen() {
  const { currentUser } = useApp();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [visitedBars, setVisitedBars] = useState<Bar[]>([]);
  const [allBars, setAllBars] = useState<Bar[]>([]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Auto-center on user location when component mounts or user location is available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      const region: Region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [userLocation]);

  // Auto-center when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (userLocation && mapRef.current) {
        const region: Region = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        mapRef.current.animateToRegion(region, 1000);
      }
    }, [userLocation])
  );

  useEffect(() => {
    if (currentUser) {
      // Collect all visited bars from user's crawls
      const visited: Bar[] = [];
      currentUser.crawls.forEach((crawl) => {
        crawl.barsHit.forEach((bar) => {
          if (!visited.find((b) => b.id === bar.id)) {
            visited.push(bar);
          }
        });
      });
      setVisitedBars(visited);
    }
  }, [currentUser]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync();
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(newLocation);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const focusOnUserLocation = async () => {
    if (!userLocation) {
      // Try to get location first
      await getCurrentLocation();
      return;
    }

    if (mapRef.current) {
      const region: Region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  // Only show bars that the user has actually visited during crawls
  useEffect(() => {
    setAllBars(visitedBars);
  }, [visitedBars]);

  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 40.7128,
        longitude: -74.0060,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Bars</Text>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="checkmark-circle" size={20} color="#FF6B35" />
            <Text style={styles.statText}>{visitedBars.length} Bars Visited</Text>
          </View>
        </View>
      </View>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        mapType="standard"
        showsUserLocation={false}
        customMapStyle={[
          {
            elementType: 'geometry',
            stylers: [{ color: '#242f3e' }],
          },
          {
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#242f3e' }],
          },
          {
            elementType: 'labels.text.fill',
            stylers: [{ color: '#746855' }],
          },
          {
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [{ color: '#263d3d' }],
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#263d3d' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }],
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca5b3' }],
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }],
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#515c6d' }],
          },
        ]}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            anchor={{ x: 0.5, y: 0.5 }}
            flat={false}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationInner}>
                <Ionicons name="location" size={24} color="#fff" />
              </View>
            </View>
          </Marker>
        )}

        {/* Bars */}
        {allBars.map((bar) => (
          <Marker
            key={bar.id}
            coordinate={{
              latitude: bar.latitude,
              longitude: bar.longitude,
            }}
            title={bar.name}
            description={bar.visited ? 'Visited' : 'Not visited'}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  bar.visited && styles.markerVisited,
                ]}
              >
                <Ionicons
                  name={bar.visited ? 'checkmark-circle' : 'beer-outline'}
                  size={30}
                  color={bar.visited ? '#fff' : '#666'}
                />
              </View>
              {bar.visited && (
                <View style={styles.visitedBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendContent}>
          <View style={styles.legendItem}>
            <View style={[styles.legendMarker, styles.legendMarkerVisited]} />
            <Text style={styles.legendText}>Visited</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendMarker} />
            <Text style={styles.legendText}>Not Visited</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.targetButton}
          onPress={focusOnUserLocation}
        >
          <Ionicons name="locate" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

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
    backgroundColor: '#2C1810',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
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
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3E2723',
    borderWidth: 2,
    borderColor: '#6B5744',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerVisited: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  visitedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF8E7',
  },
  legend: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendContent: {
    backgroundColor: 'rgba(62, 39, 35, 0.95)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#6B5744',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3E2723',
    borderWidth: 2,
    borderColor: '#6B5744',
  },
  legendMarkerVisited: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  legendText: {
    fontSize: 12,
    color: '#D4A574',
  },
  targetButton: {
    backgroundColor: 'rgba(62, 39, 35, 0.95)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  userLocationMarker: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    opacity: 0.3,
  },
  userLocationInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF8E7',
    shadowColor: '#F95700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
});
