import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { 
  ChevronLeft, 
  User, 
  Gift, 
  Info, 
  RefreshCcw, 
  Search, 
  CheckCircle2,
  AlertCircle,
  Check
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Signature from 'react-native-signature-canvas';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { theme } from '../lib/theme';
import { API_BASE_URL } from '../lib/config';
import PremiumAlert from '../components/PremiumAlert';

const { width, height } = Dimensions.get('window');

const DonationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const handleOpenPrivacy = () => {
    Linking.openURL('https://oasis7528.cafe24.com/privacy.html').catch((err) =>
      console.error('An error occurred', err)
    );
  };
  
  const [loading, setLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ show: false, title: '', message: '', type: 'info' });

  // Form State
  const [formData, setFormData] = useState({
    cust_no: '',
    name: '',
    residentIdFront: '',
    residentIdBack: '',
    addressZip: '',
    addressBasic: '',
    addressDetail: '',
    phone: '',
    company: '',
    amount: '',
    cashReceipt: false,
    termsAgreed: false,
    note: '',
    seq_no: null
  });

  const [initData, setInitData] = useState({
    endDate: null,
    details: [],
    totalAmount: 0
  });

  const sigRef = useRef();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // 1. 로컬 저장소에서 기본 정보 로드 (가장 확실한 소스)
      const userJson = await AsyncStorage.getItem('user');
      let localUser = {};
      if (userJson) {
        localUser = JSON.parse(userJson);
        setFormData(prev => ({
          ...prev,
          name: localUser.name || prev.name || '',
          phone: localUser.hpno || prev.phone || '',
        }));
      }

      if (localUser.id) {
        const response = await axios.get(`${API_BASE_URL}/api/donation/init-data?id=${localUser.id}`);
        const data = response.data;

        setInitData({
          endDate: data.endDate,
          details: data.details || [],
          totalAmount: data.master ? data.master.total_dona_amt : 0
        });

        setIsClosed(data.isClosed);

        setFormData(prev => ({
          ...prev,
          cust_no: data.user?.cust_no || prev.cust_no,
          name: data.user?.name || prev.name || localUser.name || '',
          phone: data.user?.hpno || prev.phone || localUser.hpno || '',
          residentIdFront: data.master?.jmin1 || prev.residentIdFront,
          residentIdBack: data.master?.jmin2 || prev.residentIdBack,
          addressZip: data.master?.zipcode || prev.addressZip,
          addressBasic: data.master?.address || prev.addressBasic,
          addressDetail: data.master?.address_detail || prev.addressDetail,
        }));
      }
    } catch (error) {
      console.error('Initial data fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const postcodeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
      </head>
      <body style="margin:0;padding:0;">
        <div id="layer" style="width:100%;height:100vh;"></div>
        <script>
          var element_layer = document.getElementById('layer');
          new daum.Postcode({
            oncomplete: function(data) {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            },
            width : '100%',
            height : '100%'
          }).embed(element_layer);
        </script>
      </body>
    </html>
  `;

  const onAddressSelect = (data) => {
    setFormData(prev => ({
      ...prev,
      addressZip: data.zonecode,
      addressBasic: data.address
    }));
    setShowAddressModal(false);
  };

  const handleSignature = (signature) => {
    setFormData(prev => ({ ...prev, signature }));
    setIsSigned(true);
  };

  const handleClearSignature = () => {
    sigRef.current.clearSignature();
    setIsSigned(false);
    setFormData(prev => ({ ...prev, signature: '' }));
  };

  const formatComma = (val) => {
    const num = val.replace(/[^0-9]/g, '');
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleInputChange = (name, value) => {
    if (name === 'amount') {
      setFormData(prev => ({ ...prev, [name]: formatComma(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (isClosed) {
      showAlert('알림', '신청 기간이 마감되었습니다. 🛑', 'error');
      return;
    }

    if (!formData.residentIdFront || !formData.residentIdBack) {
      showAlert('알림', '주민등록번호를 입력해 주세요! 🪪', 'info');
      return;
    }

    if (!formData.addressBasic || !formData.addressDetail) {
      showAlert('알림', '주소를 정확히 입력해 주세요! 🏠', 'info');
      return;
    }

    if (!formData.amount || formData.amount === '0') {
      showAlert('알림', '기부 금액을 입력해 주세요! 💰', 'info');
      return;
    }

    if (!formData.termsAgreed) {
      showAlert('알림', '약관에 동의해 주세요! ✅', 'info');
      return;
    }

    if (!isSigned) {
      showAlert('알림', '서명을 완료해 주세요! ✍️', 'info');
      return;
    }

    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('user');
      const userData = userJson ? JSON.parse(userJson) : {};
      const userId = userData.id;
      
      const payload = {
        ...formData,
        id: userId,
        amount: formData.amount.replace(/,/g, ''),
        termsAgreed: true, 
        agree1: 'Y', agree2: 'Y', agree3: 'Y', agree4: 'Y', agree5: 'Y',
        agree6: 'Y', agree7: 'Y', agree8: 'Y', agree9: 'Y', agree10: 'Y',
        agree11: 'Y', agree12: 'Y', agree13: 'Y'
      };

      const response = await axios.post(`${API_BASE_URL}/api/donation/apply`, payload);
      
      if (response.status === 200) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigation.navigate('Dashboard');
        }, 2000);
      }
    } catch (error) {
      showAlert('오류', error.response?.data?.message || '신청 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message, type) => {
    setAlertConfig({ show: true, title, message, type });
  };

  const signatureStyle = `
    .m-signature-pad--footer { display: none; margin: 0px; }
    body,html {
      width: 100%; height: 100%;
    }
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.slate[800]} strokeWidth={3} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기부금 신청하기</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isClosed ? (
          <View style={styles.closedBanner}>
            <Text style={styles.bannerTitle}>신청 기간 마감 🛑</Text>
            <Text style={styles.bannerSub}>올해 기부금 신청이 종료되었습니다. ({initData.endDate})</Text>
          </View>
        ) : (
          <View style={styles.activeBanner}>
            <Text style={styles.bannerTitle}>연말정산 기부금{'\n'}간편 발급 서비스</Text>
            <Text style={styles.bannerSub}>
              {initData.endDate ? `마감일: ${initData.endDate} ⏳` : '소득공제를 위한 정보를 입력해 주세요.'}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>기부자 정보</Text>
          </View>
          
          <View style={styles.card}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>기부자 성명</Text>
              <TextInput 
                style={[styles.input, styles.readOnlyInput]} 
                value={formData.name} 
                editable={false} 
              />
            </View>

            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>주민등록번호</Text>
              <View style={styles.row}>
                <TextInput 
                  style={[styles.input, { flex: 1, textAlign: 'center' }]} 
                  value={formData.residentIdFront}
                  onChangeText={(val) => handleInputChange('residentIdFront', val)}
                  maxLength={6}
                  keyboardType="numeric"
                  placeholder="앞 6자리"
                />
                <Text style={styles.dash}>-</Text>
                <TextInput 
                  style={[styles.input, { flex: 1.2, textAlign: 'center' }]} 
                  value={formData.residentIdBack}
                  onChangeText={(val) => handleInputChange('residentIdBack', val)}
                  maxLength={7}
                  keyboardType="numeric"
                  secureTextEntry
                  placeholder="뒤 7자리"
                />
              </View>
            </View>

            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>주소</Text>
              <View style={[styles.row, { marginBottom: 10 }]}>
                <TextInput 
                  style={[styles.input, { width: 100, textAlign: 'center' }, styles.readOnlyInput]} 
                  value={formData.addressZip}
                  editable={false}
                  placeholder="우편번호"
                />
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={() => setShowAddressModal(true)}
                >
                  <Search size={16} color={theme.colors.slate[600]} />
                  <Text style={styles.searchButtonText}>주소 검색</Text>
                </TouchableOpacity>
              </View>
              <TextInput 
                style={[styles.input, styles.readOnlyInput, { marginBottom: 10 }]} 
                value={formData.addressBasic}
                editable={false}
                placeholder="기본 주소"
              />
              <TextInput 
                style={styles.input} 
                value={formData.addressDetail}
                onChangeText={(val) => handleInputChange('addressDetail', val)}
                placeholder="상세 주소 입력"
              />
            </View>

            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>휴대폰 번호</Text>
              <TextInput 
                style={styles.input} 
                value={formData.phone}
                onChangeText={(val) => handleInputChange('phone', val)}
                keyboardType="phone-pad"
                placeholder="010-0000-0000"
              />
            </View>
          </View>
        </View>

        {/* Section: Donation Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gift size={18} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>기부 상세 정보</Text>
          </View>
          
          <View style={styles.card}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>기부 금액</Text>
              <View style={styles.amountInputWrapper}>
                <TextInput 
                  style={styles.amountInput} 
                  value={formData.amount}
                  onChangeText={(val) => handleInputChange('amount', val)}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Text style={styles.amountUnit}>원</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => handleInputChange('cashReceipt', !formData.cashReceipt)}
            >
              <View style={[styles.checkbox, formData.cashReceipt && styles.checkboxActive]}>
                {formData.cashReceipt && <CheckCircle2 size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>현금영수증 신청</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Guidelines */}
        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <Info size={18} color={theme.colors.slate[600]} />
            <Text style={styles.infoTitle}>유의사항</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• 타 기부금이 있으신 경우 제외 후 신청해 주세요.</Text>
            <Text style={styles.infoItem}>• 기부 신청금액이 결정 세액보다 많은 경우 이월될 수 있습니다.</Text>
            <Text style={styles.infoItem}>• 이월된 기부금은 본인 책임으로, 물품대금은 완납하셔야 합니다.</Text>
          </View>
        </View>

        {/* Section: Terms Agreement */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>약관 동의</Text>
          <View style={styles.termsCard}>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              onPress={() => setFormData(prev => ({ ...prev, termsAgreed: !prev.termsAgreed }))}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, formData.termsAgreed && styles.checkboxChecked, { marginRight: 12 }]}>
                {formData.termsAgreed && <Check size={16} color="white" />}
              </View>
              <Text style={styles.termsText}>기부 신청 및 개인정보 처리 방침에 동의합니다 (필수)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenPrivacy} style={{ paddingLeft: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.primary, textDecorationLine: 'underline' }}>[전문 보기]</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section: Signature */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>신청인 서명</Text>
          <View style={styles.signatureContainer}>
            <View style={styles.signatureHeader}>
              <Text style={styles.signatureInfo}>날짜: {new Date().toLocaleDateString('ko-KR')}</Text>
              <Text style={styles.signatureName}>기부자 성명: {formData.name}</Text>
            </View>
            
            <View style={[styles.signaturePadWrapper, isSigned && styles.signedWrapper]}>
              <Signature
                ref={sigRef}
                onOK={handleSignature}
                onEmpty={() => setIsSigned(false)}
                descriptionText=""
                clearText="지우기"
                confirmText="확인"
                webStyle={signatureStyle}
                autoClear={false}
                imageType="image/png"
              />
              {!isSigned && (
                <View style={styles.signaturePlaceholder} pointerEvents="none">
                  <Text style={styles.placeholderText}>여기에 서명해 주세요</Text>
                </View>
              )}
              {isSigned && (
                <View style={styles.signedOverlay} pointerEvents="none">
                  <View style={styles.signedBadge}>
                    <CheckCircle2 size={24} color="#fff" />
                    <Text style={styles.signedText}>서명 완료</Text>
                  </View>
                </View>
              )}
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClearSignature}
              >
                <RefreshCcw size={20} color={theme.colors.slate[400]} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.saveSigButton, isSigned && styles.saveSigButtonActive]}
              onPress={() => sigRef.current.readSignature()}
            >
              <Text style={[styles.saveSigButtonText, isSigned && { color: '#fff' }]}>
                {isSigned ? '서명 수정하기' : '서명 저장하기'}
              </Text>
            </TouchableOpacity>
            
            {!isSigned && (
              <TouchableOpacity 
                style={styles.sigConfirmActionBtn}
                onPress={() => sigRef.current?.readSignature()}
              >
                <Text style={styles.sigConfirmActionBtnText}>서명 저장하기</Text>
              </TouchableOpacity>
            )}
            {isSigned && (
              <View style={styles.sigDoneStatus}>
                <Check size={16} color="#10b981" />
                <Text style={styles.sigDoneStatusText}>서명이 완료되었습니다</Text>
              </View>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isClosed && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isClosed || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isClosed ? '신청 기간 마감' : '기부금 신청하기 🚀'}
            </Text>
          )}
        </TouchableOpacity>

        {/* History List */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>금년도 신청 리스트</Text>
            <View style={styles.totalBadge}>
              <Text style={styles.totalLabel}>총 합계</Text>
              <Text style={styles.totalValue}>{initData.totalAmount.toLocaleString()}원</Text>
            </View>
          </View>

          {initData.details.length > 0 ? (
            initData.details.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.statusDot} />
                  <View>
                    <Text style={styles.itemCompany}>{item.company_name}</Text>
                    <Text style={styles.itemDate}>{new Date(item.reg_date).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemAmount}>{item.dona_amt.toLocaleString()}원</Text>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepText}>
                      {item.step_code === '01' ? '신청완료' : '처리완료'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyHistory}>
              <AlertCircle size={40} color={theme.colors.slate[200]} />
              <Text style={styles.emptyText}>올해 신청 내역이 없습니다.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Address Search Modal */}
      <Modal visible={showAddressModal} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>주소 검색</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
          </View>
          <WebView
            originWhitelist={['*']}
            source={{ html: postcodeHtml }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                onAddressSelect(data);
              } catch (e) {
                console.log('Postcode message error:', e);
              }
            }}
            style={{ flex: 1 }}
          />
        </SafeAreaView>
      </Modal>

      {/* Success Modal */}
      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <CheckCircle2 size={48} color="#fff" />
            </View>
            <Text style={styles.successTitle}>신청 완료!</Text>
            <Text style={styles.successSub}>기부 신청이 정상 접수되었습니다.</Text>
          </View>
        </View>
      )}

      <PremiumAlert 
        visible={alertConfig.show}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, show: false }))}
      />
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
    fontWeight: '800',
    color: theme.colors.slate[900],
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  activeBanner: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...theme.shadows.md,
  },
  closedBanner: {
    backgroundColor: '#ef4444',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 28,
  },
  bannerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.slate[800],
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  inputField: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.slate[500],
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.slate[900],
  },
  readOnlyInput: {
    backgroundColor: '#f1f5f9',
    color: theme.colors.slate[400],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dash: {
    color: theme.colors.slate[300],
    fontWeight: '900',
  },
  searchButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.slate[600],
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.primary,
    textAlign: 'right',
  },
  amountUnit: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.slate[400],
    marginLeft: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.slate[700],
  },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.slate[800],
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 13,
    color: theme.colors.slate[500],
    fontWeight: '600',
    lineHeight: 18,
  },
  signatureContainer: {
    gap: 12,
  },
  signatureHeader: {
    paddingHorizontal: 4,
  },
  signatureInfo: {
    fontSize: 13,
    color: theme.colors.slate[400],
    fontWeight: '600',
  },
  signatureName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.slate[800],
    marginTop: 4,
  },
  termsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  termsText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.slate[600],
    flex: 1,
  },
  sigConfirmActionBtn: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sigConfirmActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  sigDoneStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  sigDoneStatusText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
  },
  signaturePadWrapper: {
    height: 200,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  signedWrapper: {
    borderColor: theme.colors.primary,
    borderStyle: 'solid',
    backgroundColor: theme.colors.primary + '05',
  },
  signaturePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.slate[400],
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
    ...theme.shadows.md,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  historySection: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    ...theme.shadows.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.slate[900],
  },
  totalBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    color: theme.colors.slate[400],
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  itemCompany: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.slate[800],
  },
  itemDate: {
    fontSize: 12,
    color: theme.colors.slate[400],
    fontWeight: '600',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.slate[900],
    marginBottom: 4,
  },
  stepBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369a1',
  },
  emptyHistory: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.slate[400],
  },
  modalHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeText: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successBox: {
    backgroundColor: '#fff',
    borderRadius: 40,
    padding: 40,
    alignItems: 'center',
    width: width * 0.8,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.slate[900],
    marginBottom: 8,
  },
  saveSigButton: {
    backgroundColor: theme.colors.slate[100],
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.slate[200],
  },
  saveSigButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  saveSigButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.slate[600],
  },
  signedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  signedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 8,
  },
  signedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  termsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.slate[600],
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // 하단 탭 바 공간 확보
  },
  successSub: {
    fontSize: 15,
    color: theme.colors.slate[500],
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DonationScreen;
