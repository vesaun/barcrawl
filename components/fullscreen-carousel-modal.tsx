import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Props = {
  visible: boolean;
  imageUris: string[];
  initialIndex: number;
  onClose: () => void;
};

export default function FullscreenCarouselModal({ visible, imageUris, initialIndex, onClose }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const safeInitialIndex = useMemo(() => {
    if (!imageUris.length) return 0;
    return Math.min(Math.max(initialIndex, 0), imageUris.length - 1);
  }, [imageUris.length, initialIndex]);

  useEffect(() => {
    if (!visible) return;
    setIndex(safeInitialIndex);

    // Wait a tick for modal layout, then jump to the right page.
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: safeInitialIndex * screenWidth, y: 0, animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, [visible, safeInitialIndex]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const next = Math.round(x / screenWidth);
    setIndex(next);
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={28} color="#FFF8E7" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {imageUris.length ? `${index + 1} / ${imageUris.length}` : ''}
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          style={styles.carousel}
        >
          {imageUris.map((uri, i) => (
            <View key={`${uri}_${i}`} style={styles.page}>
              <Image source={{ uri }} style={styles.image} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  header: {
    paddingTop: 55,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF8E7',
    fontSize: 16,
    fontWeight: '700',
  },
  carousel: {
    flex: 1,
  },
  page: {
    width: screenWidth,
    height: screenHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80, // keep below header area visually
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

