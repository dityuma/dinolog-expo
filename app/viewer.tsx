import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Penampil foto layar penuh dengan geser horizontal antar foto satu entri log. */
export default function PhotoViewerScreen() {
  const { uris = '', index = '0' } = useLocalSearchParams<{ uris?: string; index?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const list = uris.split('|').filter(Boolean);
  const { width, height } = Dimensions.get('window');
  const initialIndex = Number(index) || 0;
  const [current, setCurrent] = useState(initialIndex);
  const scroller = useRef<ScrollView>(null);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        // `contentOffset` hanya berlaku di iOS, jadi posisi awal diatur setelah layout.
        onLayout={() => scroller.current?.scrollTo({ x: initialIndex * width, animated: false })}
        onMomentumScrollEnd={event =>
          setCurrent(Math.round(event.nativeEvent.contentOffset.x / width))
        }>
        {list.map(uri => (
          <Image
            key={uri}
            source={{ uri }}
            style={{ width, height }}
            contentFit="contain"
            transition={120}
          />
        ))}
      </ScrollView>

      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={{ position: 'absolute', top: insets.top + 12, right: 18 }}>
        <Ionicons name="close-circle" size={34} color="#ffffffcc" />
      </Pressable>

      {list.length > 1 ? (
        <Text
          style={{
            position: 'absolute',
            bottom: insets.bottom + 20,
            alignSelf: 'center',
            color: '#ffffffcc',
            fontSize: 13,
            fontWeight: '600',
          }}>
          {current + 1} / {list.length}
        </Text>
      ) : null}
    </View>
  );
}
