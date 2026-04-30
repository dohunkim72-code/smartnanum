import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { COLORS, SPACING } from '../lib/theme';
import { Eye, EyeOff, ChevronLeft, HeartHandshake } from 'lucide-react-native';
import { API_ENDPOINTS } from '../lib/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!id || !pw) {
      Alert.alert('알림', '아이디와 비밀번호를 입력해주세요!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, pw }),
      });

      const data = await response.json();

      if (response.ok) {
        // 로그인 성공: 토큰과 사용자 정보 저장
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        
        Alert.alert('환영합니다!', `${data.user.name}님, 반갑습니다.`);
        navigation.replace('Main');
      } else {
        Alert.alert('로그인 실패', data.message || '아이디 또는 비밀번호를 확인해주세요.');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      Alert.alert('오류', '서버와 통신 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
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
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* 뒤로가기 */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={28} color={COLORS.primary} />
          </TouchableOpacity>

          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <HeartHandshake size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>기부금 환급의 시작</Text>
          </View>

          {/* 폼 */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>아이디</Text>
              <TextInput 
                style={styles.input}
                placeholder="아이디를 입력하세요"
                placeholderTextColor="#94a3b8"
                value={id}
                onChangeText={setId}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <View style={styles.passwordWrapper}>
                <TextInput 
                  style={styles.passwordInput}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor="#94a3b8"
                  value={pw}
                  onChangeText={setPw}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? <EyeOff size={24} color="#64748b" /> : <Eye size={24} color="#64748b" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={() => Alert.alert('안내', '준비 중인 기능입니다.')}>
                <Text style={styles.linkText}>아이디 찾기</Text>
              </TouchableOpacity>
              <Text style={styles.divider}>|</Text>
              <TouchableOpacity onPress={() => Alert.alert('안내', '준비 중인 기능입니다.')}>
                <Text style={styles.linkText}>비밀번호 재설정</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          {/* 회원가입 버튼 */}
          <View style={styles.registerContainer}>
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerButtonText}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    marginTop: SPACING.md,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  linkText: {
    color: '#64748b',
    fontSize: 14,
  },
  divider: {
    color: '#cbd5e1',
  },
  registerContainer: {
    paddingBottom: 40,
    marginTop: 40,
  },
  registerButton: {
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  registerButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default LoginScreen;
