import React, { useState, useEffect, useRef } from 'react';
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
  const [showUserLocation, setShowUserLocation] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    loadBars();
  }, []);

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
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      mapRef.current.animateToRegion(region, 1000);
      setShowUserLocation(true);
      
      // Hide the indicator after 3 seconds
      setTimeout(() => {
        setShowUserLocation(false);
      }, 3000);
    }
  };

  const loadBars = async () => {
    // For MVP, using mock data
    // In production, this would call a bars/restaurants API
    const mockBars: Bar[] = [
      {
        id: 'bar1',
        name: 'The Local Pub',
        latitude: 40.7128,
        longitude: -74.0060,
        visited: false,
      },
      {
        id: 'bar2',
        name: 'Cocktail Lounge',
        latitude: 40.7138,
        longitude: -74.0070,
        visited: false,
      },
      {
        id: 'bar3',
        name: 'Beer Garden',
        latitude: 40.7148,
        longitude: -74.0080,
        visited: false,
      },
      {
        id: 'bar4',
        name: 'Wine Bar',
        latitude: 40.7158,
        longitude: -74.0090,
        visited: false,
      },
      {
        id: 'bar5',
        name: 'Sports Bar',
        latitude: 40.7168,
        longitude: -74.0100,
        visited: false,
      },
    ];

    // Mark visited bars
    const barsWithVisited = mockBars.map((bar) => ({
      ...bar,
      visited: visitedBars.some((vb) => vb.id === bar.id),
    }));

    setAllBars(barsWithVisited);
  };

  useEffect(() => {
    if (visitedBars.length > 0) {
      loadBars();
    }
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
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.statText}>{visitedBars.length} Visited</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.statText}>{allBars.length} Total</Text>
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
          <Ionicons name="locate" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* User Location Indicator Overlay - Shows when target button is pressed */}
      {showUserLocation && userLocation && (
        <View style={styles.userLocationIndicator} pointerEvents="none">
          <View style={styles.userLocationIndicatorPulse} />
          <View style={styles.userLocationIndicatorInner}>
            <Ionicons name="location" size={32} color="#FF6B6B" />
          </View>
        </View>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
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
    color: '#666',
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
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerVisited: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  visitedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#666',
  },
  legendMarkerVisited: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  targetButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    backgroundColor: '#FF6B6B',
    opacity: 0.3,
  },
  userLocationInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userLocationIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  userLocationIndicatorPulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    opacity: 0.2,
  },
  userLocationIndicatorInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
});
