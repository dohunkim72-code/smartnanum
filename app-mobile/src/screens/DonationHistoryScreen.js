import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  ChevronLeft, 
  Plus, 
  History, 
  Calendar, 
  TrendingUp, 
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { theme } from '../lib/theme';
import { API_BASE_URL } from '../lib/config';

const { width } = Dimensions.get('window');

const DonationHistoryScreen = () => {
  const navigation = useNavigation();
  const [historyByYear, setHistoryByYear] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return;
      const user = JSON.parse(userData);
      const userId = user.id;

      const response = await axios.get(`${API_BASE_URL}/api/donation/history?id=${userId}`);
      const data = response.data;

      if (data && data.length > 0) {
        setHistoryByYear(data);
        setSelectedYear(data[0].dona_yy);
      }
    } catch (error) {
      console.error('내역 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedData = (Array.isArray(historyByYear) && historyByYear.find(h => h.dona_yy === selectedYear)) || {
    total_dona_amt: 0,
    details: []
  };

  const estimatedRefund = Math.floor((selectedData.total_dona_amt || 0) * 0.15);

  const getStatusInfo = (code) => {
    switch (code) {
      case '01': return { text: '기부요청', color: '#0ea5e9', bg: '#f0f9ff' };
      case '02': return { text: '승인완료', color: '#10b981', bg: '#f0fdf4' };
      case '03': return { text: '반려됨', color: '#ef4444', bg: '#fef2f2' };
      default: return { text: '처리 중', color: '#64748b', bg: '#f8fafc' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.slate[800]} strokeWidth={3} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>신청 내역 조회</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Year Selector Tabs */}
        {Array.isArray(historyByYear) && historyByYear.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.yearTabs}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {historyByYear.map((item) => (
              <TouchableOpacity
                key={item.dona_yy}
                onPress={() => setSelectedYear(item.dona_yy)}
                style={[
                  styles.yearTab,
                  selectedYear === item.dona_yy && styles.activeYearTab
                ]}
              >
                <Text style={[
                  styles.yearTabText,
                  selectedYear === item.dona_yy && styles.activeYearTabText
                ]}>
                  {item.dona_yy}년
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryGradient}>
            <View style={styles.summaryDecor} />
            <View style={styles.summaryTop}>
              <View style={styles.summaryBadge}>
                <Calendar size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.summaryBadgeText}>{selectedYear || '0000'}년 기부 현황</Text>
              </View>
              <TouchableOpacity style={styles.detailButton}>
                <Text style={styles.detailButtonText}>합산 상세 보기</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.totalValue}>{(selectedData.total_dona_amt || 0).toLocaleString()}</Text>
              <Text style={styles.totalUnit}>원</Text>
            </View>
          </View>
          
          <View style={styles.summaryBottom}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>세액공제 예상액</Text>
              <Text style={styles.summaryValue}>약 {estimatedRefund.toLocaleString()}원</Text>
            </View>
            <View style={styles.vDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>신청 건수</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.slate[900] }]}>
                {(selectedData.details || []).length}건
              </Text>
            </View>
          </View>
        </View>

        {/* List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{selectedYear || '0000'}년 상세 내역</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{(selectedData.details || []).length}건</Text>
          </View>
        </View>

        {/* List Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={styles.loadingText}>내역을 불러오는 중...</Text>
          </View>
        ) : (selectedData.details || []).length > 0 ? (
          <View style={styles.listContainer}>
            {selectedData.details.map((item, index) => {
              const status = getStatusInfo(item.step_code);
              return (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemIconWrapper}>
                      <Wallet size={20} color={theme.colors.slate[400]} />
                    </View>
                    <View style={styles.itemTitleGroup}>
                      <Text style={styles.itemCompany}>{item.company_name || '기부 신청'}</Text>
                      <View style={styles.itemSubRow}>
                        <Clock size={12} color={theme.colors.slate[300]} />
                        <Text style={styles.itemDate}>
                          {item.reg_date ? new Date(item.reg_date).toLocaleDateString() : ''}
                        </Text>
                        <Text style={styles.itemReceipt}>
                          · {item.receipt_yn === 'Y' ? '영수증O' : '영수증X'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.itemDivider} />
                  
                  <View style={styles.itemFooter}>
                    <View>
                      <Text style={styles.itemAmountLabel}>기부 금액</Text>
                      <Text style={styles.itemAmount}>{(item.dona_amt || 0).toLocaleString()}원</Text>
                    </View>
                    <Text style={styles.itemNo}>No.{item.seq_no}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <History size={40} color={theme.colors.slate[200]} />
            </View>
            <Text style={styles.emptyTitle}>신청 내역이 없습니다</Text>
            <Text style={styles.emptySub}>아직 신청하신 기부 내역이 없네요.{'\n'}첫 번째 기부를 시작해 보세요!</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Donation')}
      >
        <Plus size={30} color="#fff" strokeWidth={3} />
      </TouchableOpacity>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.slate[900],
  },
  scrollContent: {
    paddingBottom: 120, // 하단 탭 바 공간 확보
  },
  yearTabs: {
    paddingVertical: 16,
    paddingLeft: 20,
  },
  yearTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...theme.shadows.sm,
  },
  activeYearTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  yearTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.slate[400],
  },
  activeYearTabText: {
    color: '#fff',
  },
  summaryCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 32,
    overflow: 'hidden',
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryGradient: {
    backgroundColor: theme.colors.primary,
    padding: 24,
    minHeight: 160,
    justifyContent: 'center',
  },
  summaryDecor: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  detailButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
  },
  totalUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  summaryBottom: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.slate[400],
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  vDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.slate[900],
  },
  countBadge: {
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...theme.shadows.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitleGroup: {
    flex: 1,
  },
  itemCompany: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.slate[800],
    marginBottom: 2,
  },
  itemSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemDate: {
    fontSize: 12,
    color: theme.colors.slate[400],
    fontWeight: '600',
  },
  itemReceipt: {
    fontSize: 12,
    color: theme.colors.slate[300],
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginVertical: 16,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemAmountLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.slate[300],
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  itemAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.slate[900],
  },
  itemNo: {
    fontSize: 10,
    color: theme.colors.slate[300],
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.slate[900],
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: theme.colors.slate[400],
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.slate[400],
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
    elevation: 8,
  },
});

export default DonationHistoryScreen;
