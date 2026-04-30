import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { COLORS, SPACING } from '../lib/theme';
import { Heart } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  { id: '0', image: require('../../assets/guide0.png') },
  { id: '1', image: require('../../assets/guide1.png') },
  { id: '2', image: require('../../assets/guide2.png') },
];

const HomeScreen = ({ navigation }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef(null);

  // 자동 로그인 확인
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        if (user) {
          navigation.replace('Main');
        }
      } catch (error) {
        console.error('Login check failed:', error);
      }
    };
    checkLogin();
  }, []);

  // 자동 슬라이드 타이머
  useEffect(() => {
    if (!SLIDES || SLIDES.length === 0) return;

    const timer = setInterval(() => {
      let nextSlide = (currentSlide + 1) % SLIDES.length;
      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({ 
            index: nextSlide, 
            animated: true,
            viewPosition: 0.5 
          });
          setCurrentSlide(nextSlide);
        } catch (e) {
          // 리스트가 아직 준비되지 않았을 때의 에러 방지
          console.log('Scroll pending...');
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    if (!slideSize) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== currentSlide && index >= 0 && index < SLIDES.length) {
      setCurrentSlide(index);
    }
  };

  const getItemLayout = (_, index) => ({
    length: width,
    offset: width * index,
    index,
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.logoText}>스마트나눔</Text>
      </View>

      <View style={styles.content}>
        {/* 캐러셀 영역 */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={flatListRef}
            data={SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item) => item.id}
            getItemLayout={getItemLayout}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <View style={styles.imageWrapper}>
                  <Image source={item.image} style={styles.image} resizeMode="contain" />
                </View>
              </View>
            )}
          />

          {/* 인디케이터 */}
          <View style={styles.indicatorContainer}>
            {SLIDES.map((_, i) => (
              <View 
                key={i}
                style={[
                  styles.indicator,
                  currentSlide === i ? styles.indicatorActive : styles.indicatorInactive
                ]}
              />
            ))}
          </View>
        </View>

        {/* 텍스트 영역 */}
        <View style={styles.textSection}>
          <View style={styles.iconCircle}>
            <Heart size={32} color={COLORS.primary} fill={COLORS.primary} />
          </View>
          <Text style={styles.headline}>세상을 바꾸는 스마트한 습관</Text>
          <Text style={styles.subline}>지금 바로 스마트나눔과 함께{"\n"}따뜻한 변화를 시작해보세요.</Text>
        </View>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>로그인</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.calcButton}
          onPress={() => navigation.navigate('Calculator')}
        >
          <Text style={styles.calcButtonText}>기부 한도 계산하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  content: {
    flex: 1,
    paddingTop: SPACING.lg,
  },
  carouselContainer: {
    height: 350,
  },
  slide: {
    width: width,
    paddingHorizontal: SPACING.lg,
  },
  imageWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: 8,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  indicatorInactive: {
    width: 6,
    backgroundColor: '#e2e8f0',
  },
  textSection: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f5f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subline: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: 30,
    gap: 12,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  calcButton: {
    backgroundColor: '#f5f3ff',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  calcButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default HomeScreen;
