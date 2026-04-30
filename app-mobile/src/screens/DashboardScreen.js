import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  LogOut, 
  Heart, 
  Calculator, 
  History, 
  UserRound, 
  LockKeyhole, 
  ChevronRight,
  BadgeDollarSign
} from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../lib/theme';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState({});

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      navigation.replace('Home');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const userName = user.name || "고객";

  const menuItems = [
    { 
      icon: <Calculator size={24} color={COLORS.primary} />, 
      label: '기부 한도 조회', 
      subLabel: '최대 금액 계산', 
      bgColor: '#EEF2FF', 
      path: 'Calculator' 
    },
    { 
      icon: <History size={24} color="#9333EA" />, 
      label: '기부 내역 확인', 
      subLabel: '내 활동 보기', 
      bgColor: '#FAF5FF', 
      path: 'DonationHistory' 
    },
    { 
      icon: <UserRound size={24} color="#EA580C" />, 
      label: '회원정보 수정', 
      subLabel: '개인정보 관리', 
      bgColor: '#FFF7ED', 
      path: 'Profile' 
    },
    { 
      icon: <LockKeyhole size={24} color="#0D9488" />, 
      label: '비밀번호 변경', 
      subLabel: '보안 설정 강화', 
      bgColor: '#F0FDFA', 
      path: 'ChangePassword' 
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>스마트나눔</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} color="#64748B" />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 환영 섹션 */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            <Text style={styles.userNameText}>{userName}</Text>님, 안녕하세요 👋
          </Text>
          <Text style={styles.welcomeSub}>따뜻한 나눔으로 세상을 더 밝게 만들어주세요.</Text>
        </View>

        {/* 메인 기부 카드 */}
        <TouchableOpacity 
          style={styles.donationCard}
          onPress={() => navigation.navigate('Donation')}
          activeOpacity={0.9}
        >
          <View style={styles.donationCardContent}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>READY TO HELP</Text>
            </View>
            <Text style={styles.donationTitle}>기부 신청하기</Text>
            <Text style={styles.donationSub}>당신의 따뜻한 마음을 지금 전하세요</Text>
          </View>
          <View style={styles.iconContainer}>
            <Heart size={36} color="white" fill="white" />
          </View>
          
          {/* 배경 데코레이션 */}
          <View style={styles.decoCircle1} />
          <View style={styles.decoCircle2} />
        </TouchableOpacity>

        {/* 메뉴 그리드 */}
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.menuItem}
              onPress={() => item.path && navigation.navigate(item.path)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: item.bgColor }]}>
                {item.icon}
              </View>
              <View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSubLabel}>{item.subLabel}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 가이드 배너 */}
        <TouchableOpacity 
          style={styles.guideBanner}
          activeOpacity={0.8}
        >
          <View style={styles.guideContent}>
            <View style={styles.guideBadge}>
              <Text style={styles.guideBadgeText}>GUIDE</Text>
            </View>
            <Text style={styles.guideTitle}>세금 환급 가이드</Text>
            <Text style={styles.guideSub}>기부금 공제 혜택 놓치지 마세요</Text>
          </View>
          <BadgeDollarSign size={48} color="rgba(255,255,255,0.2)" style={styles.guideIcon} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  welcomeSection: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: '#1F2937',
  },
  userNameText: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.primary,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  donationCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    padding: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.medium,
  },
  donationCardContent: {
    zIndex: 10,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    marginRight: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  donationTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  donationSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  iconContainer: {
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 20,
  },
  decoCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decoCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  menuItem: {
    width: (width - SPACING.lg * 2 - 16) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...SHADOWS.small,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
  },
  menuSubLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  guideBanner: {
    height: 128,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  guideContent: {
    flex: 1,
    zIndex: 10,
  },
  guideBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  guideBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  guideTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  guideSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  guideIcon: {
    position: 'absolute',
    right: 16,
  },
});

export default DashboardScreen;
