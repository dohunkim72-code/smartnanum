import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Wallet, Lightbulb, Info, CheckCircle2, TrendingUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../lib/theme';

const { width } = Dimensions.get('window');

const CalculatorScreen = () => {
  const navigation = useNavigation();
  const [salary, setSalary] = useState('50,000,000');
  const [plannedDonation, setPlannedDonation] = useState('1,000,000');
  const [donationType, setDonationType] = useState('annual'); // 'annual' or 'monthly'
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const status = await AsyncStorage.getItem('isLoggedIn');
    setIsLoggedIn(status === 'true');
  };

  const handleMoneyChange = (value, setter) => {
    const numValue = value.replace(/[^0-9]/g, '');
    if (!numValue) {
      setter('');
      return;
    }
    setter(parseInt(numValue).toLocaleString());
  };

  const getBaseIncome = () => {
    const numSalary = parseInt(salary.replace(/,/g, '')) || 0;
    return donationType === 'annual' ? numSalary : numSalary * 12;
  };

  const calculateLimit = () => {
    const baseIncome = getBaseIncome();
    return Math.floor(baseIncome * 0.3);
  };

  const calculateRecommendLimit = () => {
    const limit = calculateLimit();
    return Math.floor(limit * 0.95);
  };

  const calculateRefund = () => {
    const amount = parseInt(plannedDonation.replace(/,/g, '')) || 0;
    if (amount <= 10000000) {
      return Math.floor(amount * 0.15);
    } else {
      const basicRefund = 10000000 * 0.15;
      const excessRefund = (amount - 10000000) * 0.3;
      return Math.floor(basicRefund + excessRefund);
    }
  };

  const calculateGoodsPayment = () => {
    const refund = calculateRefund();
    return Math.floor(refund * 0.53);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={theme.colors.slate[800]} strokeWidth={3} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>기부 한도 및 환급액 산출</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Toggle Tab */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              onPress={() => setDonationType('annual')}
              style={[styles.tab, donationType === 'annual' && styles.activeTab]}
            >
              <Text style={[styles.tabText, donationType === 'annual' && styles.activeTabText]}>연봉 기준</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDonationType('monthly')}
              style={[styles.tab, donationType === 'monthly' && styles.activeTab]}
            >
              <Text style={[styles.tabText, donationType === 'monthly' && styles.activeTabText]}>월급 기준</Text>
            </TouchableOpacity>
          </View>

          {/* Income Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Wallet size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.cardTitle}>나의 소득 정보 입력</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <View style={styles.pulseDot} />
                <Text style={styles.label}>
                  {donationType === 'annual' ? '연간 총 급여 (비과세 제외)' : '월 평균 실수령액'}
                </Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={salary}
                  onChangeText={(val) => handleMoneyChange(val, setSalary)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.slate[300]}
                />
                <Text style={styles.inputUnit}>원</Text>
              </View>
            </View>
          </View>

          {/* Guide Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#fff7ed' }]}>
                <Lightbulb size={20} color="#f97316" />
              </View>
              <Text style={styles.cardTitle}>입력 가이드</Text>
            </View>

            <View style={styles.guideContent}>
              <View style={styles.imageWrapper}>
                <Image 
                  source={donationType === 'annual' 
                    ? require('../../assets/annual_guide.png') 
                    : require('../../assets/monthly_guide_v2.png')}
                  style={styles.guideImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.guideInfo}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {donationType === 'annual' ? '必' : 'Info'}
                  </Text>
                </View>
                <Text style={styles.guideText}>
                  {donationType === 'annual' 
                    ? '근로소득 원천징수서 영수증의 23. 근로소득금액을 입력하시면 가장 정확합니다.'
                    : '급여계 - 식대 - 교통비 - 육아근로수당을 뺀 순수 급여 금액을 입력해 주세요.'}
                </Text>
              </View>
            </View>
          </View>

          {/* Result Section (Dark Card) */}
          <View style={styles.darkCard}>
            {/* Decoration */}
            <View style={styles.darkCardDecor} />

            <View style={styles.darkCardContent}>
              <View style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <View style={[styles.pulseDot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={[styles.label, { color: 'rgba(255,255,255,0.5)' }]}>기부 예정 금액</Text>
                </View>
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                  <TextInput
                    style={[styles.input, { color: '#fff' }]}
                    value={plannedDonation}
                    onChangeText={(val) => handleMoneyChange(val, setPlannedDonation)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                  <Text style={[styles.inputUnit, { color: 'rgba(255,255,255,0.3)' }]}>원</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Results */}
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>나의 기부 한도</Text>
                <View style={styles.resultValueContainer}>
                  <Text style={styles.resultValue}>{calculateLimit().toLocaleString()}</Text>
                  <Text style={styles.resultUnit}>원</Text>
                </View>
              </View>

              <View style={styles.recommendCard}>
                <Text style={styles.recommendLabel}>추천 기부 한도</Text>
                <View style={styles.resultValueContainer}>
                  <Text style={styles.recommendValue}>{calculateRecommendLimit().toLocaleString()}</Text>
                  <Text style={[styles.resultUnit, { color: theme.colors.primary }]}>원</Text>
                </View>
              </View>

              <View style={styles.refundContainer}>
                <View style={styles.refundHeader}>
                  <View>
                    <Text style={styles.resultLabel}>예상 환급액</Text>
                    <View style={styles.resultValueContainer}>
                      <Text style={[styles.resultValue, { fontSize: 32 }]}>+{calculateRefund().toLocaleString()}</Text>
                      <Text style={styles.resultUnit}>원</Text>
                    </View>
                  </View>
                  <View style={styles.taxRefundBadge}>
                    <Text style={styles.taxRefundText}>Tax Refund</Text>
                  </View>
                </View>

                {isLoggedIn && (
                  <View style={styles.benefitCard}>
                    <View style={styles.benefitHeader}>
                      <View style={styles.benefitTitleRow}>
                        <CheckCircle2 size={12} color="#fbbf24" />
                        <Text style={styles.benefitSubTitle}>Member Reward</Text>
                      </View>
                      <Text style={styles.benefitTitle}>예상 물품 대금</Text>
                    </View>
                    <View style={styles.benefitValueContainer}>
                      <Text style={styles.benefitValue}>{calculateGoodsPayment().toLocaleString()}</Text>
                      <Text style={styles.benefitUnit}>원</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoCard}>
            <Info size={16} color={theme.colors.slate[400]} />
            <Text style={styles.infoText}>
              * 환급액 산출: 1,000만원 이하 15%, 초과분 30% 적용 기준{'\n'}
              * 실제 환급액은 근로소득 및 개인별 공제 항목에 따라 차이가 발생할 수 있습니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.slate[900],
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#fff',
    ...theme.shadows.sm,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.slate[400],
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: '#f8fafc',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: theme.colors.slate[900],
  },
  inputGroup: {
    gap: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.slate[500],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 64,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.slate[900],
  },
  inputUnit: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.slate[400],
    marginLeft: 8,
  },
  guideContent: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guideImage: {
    width: '100%',
    height: '100%',
  },
  guideInfo: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    ...theme.shadows.sm,
  },
  badge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    height: 24,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ef4444',
  },
  guideText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.slate[700],
    lineHeight: 18,
  },
  darkCard: {
    backgroundColor: '#12111E',
    borderRadius: 32,
    padding: 32,
    marginBottom: 20,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  darkCardDecor: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary,
    opacity: 0.1,
  },
  darkCardContent: {
    gap: 24,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    width: '100%',
  },
  resultItem: {
    gap: 4,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  resultValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  resultUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
  },
  recommendCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  recommendLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.primary,
    marginBottom: 4,
    letterSpacing: 1,
  },
  recommendValue: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  refundContainer: {
    gap: 16,
  },
  refundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 20,
  },
  taxRefundBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    ...theme.shadows.sm,
  },
  taxRefundText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  benefitCard: {
    backgroundColor: 'rgba(251,191,36,0.05)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.1)',
  },
  benefitHeader: {
    gap: 2,
  },
  benefitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  benefitSubTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
  },
  benefitValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  benefitValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fbbf24',
  },
  benefitUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.slate[500],
    lineHeight: 18,
  },
});

export default CalculatorScreen;
