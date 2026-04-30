import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { ChevronLeft, CheckCircle2, Gift, Smartphone, Mail, Lock, User } from 'lucide-react-native';
import { auth } from '../lib/firebase';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { COLORS, SPACING, SHADOWS } from '../lib/theme';
import { API_ENDPOINTS } from '../lib/config';
import PremiumAlert from '../components/PremiumAlert';
import axios from 'axios';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    id: '',
    pw: '',
    confirmPw: '',
    name: '',
    email: '',
    hpno: '',
    referral_code: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isSmsSent, setIsSmsSent] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationId, setVerificationId] = useState(null);

  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });

  const showAlert = (title, message, type = 'info') => {
    setModal({ show: true, title, message, type });
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'id') setIsIdChecked(false);
  };

  const handleCheckId = async () => {
    if (!formData.id) {
      showAlert('알림', '아이디를 입력해주세요!', 'info');
      return;
    }
    try {
      const response = await axios.post(`${API_ENDPOINTS.register.replace('/register', '/check-id')}`, { id: formData.id });
      if (response.data.isDuplicate) {
        showAlert('중복 확인', '이미 사용 중인 아이디입니다. 😢', 'error');
      } else {
        showAlert('확인 완료', '사용 가능한 아이디입니다! ✅', 'success');
        setIsIdChecked(true);
      }
    } catch (error) {
      showAlert('오류', '아이디 확인 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSendSMS = async () => {
    if (!formData.hpno) {
      showAlert('알림', '휴대폰 번호를 입력해주세요!', 'info');
      return;
    }

    try {
      setLoading(true);
      // 서버의 SMS API 호출
      const response = await axios.post(API_ENDPOINTS.register.replace('/register', '/send-sms'), {
        hpno: formData.hpno.replace(/-/g, ''),
        category: 'REGISTER'
      });

      showAlert('발송 완료', '인증번호가 발송되었습니다. (테스트용: 123456)', 'success');
      setIsSmsSent(true);
      setVerificationId('mock_id');
    } catch (error) {
      console.error('SMS 발송 에러:', error);
      showAlert('알림', '서버 테스트 모드입니다. 인증번호 123456을 입력해주세요.', 'info');
      setIsSmsSent(true);
      setVerificationId('mock_id');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (inputCode === '123456') {
      showAlert('인증 성공', '휴대폰 인증이 완료되었습니다! ✅', 'success');
      setIsPhoneVerified(true);
    } else {
      showAlert('인증 실패', '인증번호가 일치하지 않습니다. (123456을 입력해보세요!)', 'error');
    }
  };

  const handleRegister = async () => {
    if (!formData.id || !formData.pw || !formData.name || !formData.hpno || !formData.referral_code) {
      showAlert('알림', '필수 정보를 모두 입력해주세요!', 'info');
      return;
    }
    if (formData.pw !== formData.confirmPw) {
      showAlert('알림', '비밀번호가 일치하지 않습니다.', 'error');
      return;
    }
    if (!isIdChecked) {
      showAlert('알림', '아이디 중복 확인을 해주세요!', 'info');
      return;
    }
    if (!isPhoneVerified) {
      showAlert('알림', '휴대폰 인증을 완료해주세요!', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.register, formData);
      showAlert('성공', '회원가입이 완료되었습니다! 로그인해주세요. 😊', 'success');
      setTimeout(() => navigation.navigate('Login'), 2000);
    } catch (error) {
      showAlert('오류', error.response?.data?.message || '회원가입에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#100D1B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>회원가입</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 단계 표시 */}
          <View style={styles.stepContainer}>
            <Text style={styles.stepText}>상세 정보 입력</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressInner, { width: '100%' }]} />
            </View>
          </View>

          {/* 아이디 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>아이디</Text>
            <View style={styles.row}>
              <View style={styles.inputWrapper}>
                <TextInput 
                  style={styles.input}
                  placeholder="5~20자 영문, 숫자"
                  value={formData.id}
                  onChangeText={(val) => handleChange('id', val)}
                  autoCapitalize="none"
                />
                {isIdChecked && <CheckCircle2 size={20} color="#10B981" style={styles.inputIcon} />}
              </View>
              <TouchableOpacity 
                style={[styles.checkBtn, isIdChecked && styles.checkBtnActive]} 
                onPress={handleCheckId}
              >
                <Text style={[styles.checkBtnText, isIdChecked && styles.checkBtnTextActive]}>
                  {isIdChecked ? '확인됨' : '중복확인'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput 
              style={styles.inputBox}
              placeholder="영문, 숫자, 특수문자 조합 8자 이상"
              secureTextEntry
              value={formData.pw}
              onChangeText={(val) => handleChange('pw', val)}
            />
            <Text style={styles.helperText}>8~16자 이내, 영문/숫자/특수문자 조합</Text>
          </View>

          {/* 비밀번호 확인 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput 
              style={[
                styles.inputBox, 
                formData.confirmPw && (formData.pw === formData.confirmPw ? styles.inputSuccess : styles.inputError)
              ]}
              placeholder="비밀번호를 한번 더 입력해주세요"
              secureTextEntry
              value={formData.confirmPw}
              onChangeText={(val) => handleChange('confirmPw', val)}
            />
          </View>

          {/* 이름 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이름</Text>
            <TextInput 
              style={styles.inputBox}
              placeholder="실명 입력"
              value={formData.name}
              onChangeText={(val) => handleChange('name', val)}
            />
          </View>

          {/* 휴대폰 번호 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>휴대폰 번호</Text>
            <View style={styles.row}>
              <TextInput 
                style={[styles.inputBox, { flex: 1, marginBottom: 0 }]}
                placeholder="'-' 제외 숫자만 입력"
                keyboardType="phone-pad"
                value={formData.hpno}
                onChangeText={(val) => handleChange('hpno', val)}
                editable={!isPhoneVerified}
              />
              <TouchableOpacity 
                style={[styles.checkBtn, isPhoneVerified && styles.checkBtnActive]} 
                onPress={handleSendSMS}
                disabled={isPhoneVerified}
              >
                <Text style={[styles.checkBtnText, isPhoneVerified && styles.checkBtnTextActive]}>
                  {isPhoneVerified ? '인증완료' : '번호전송'}
                </Text>
              </TouchableOpacity>
            </View>
            {!isPhoneVerified && isSmsSent && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <TextInput 
                  style={[styles.inputBox, { flex: 1, marginBottom: 0 }]}
                  placeholder="인증번호 6자리"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={inputCode}
                  onChangeText={setInputCode}
                />
                <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyCode}>
                  <Text style={styles.verifyBtnText}>확인</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 추천인 정보 */}
          <View style={styles.referralBox}>
            <View style={styles.referralHeader}>
              <Gift size={18} color={COLORS.primary} />
              <Text style={styles.referralTitle}>추천인 정보 (필수)</Text>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.smallLabel}>추천인 코드</Text>
                <TextInput 
                  style={styles.smallInput}
                  placeholder="4자리 코드"
                  value={formData.referral_code}
                  onChangeText={(val) => handleChange('referral_code', val)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.smallLabel}>소개자 성명</Text>
                <TextInput 
                  style={styles.smallInput}
                  placeholder="소개자 이름"
                  value={formData.note}
                  onChangeText={(val) => handleChange('note', val)}
                />
              </View>
            </View>
          </View>

          {/* 가입 버튼 */}
          <TouchableOpacity 
            style={[styles.registerBtn, loading && { opacity: 0.7 }]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.registerBtnText}>가입하기</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <PremiumAlert 
        visible={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={() => setModal(prev => ({ ...prev, show: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1F2937',
  },
  inputIcon: {
    marginLeft: 8,
  },
  inputBox: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  inputSuccess: {
    borderColor: '#10B981',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  checkBtn: {
    marginLeft: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnActive: {
    backgroundColor: '#DCFCE7',
  },
  checkBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  checkBtnTextActive: {
    color: '#059669',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    paddingLeft: 4,
  },
  verifyBtn: {
    marginLeft: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  referralBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 32,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  referralTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  smallLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    paddingLeft: 4,
  },
  smallInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
  },
  registerBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  registerBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default RegisterScreen;
