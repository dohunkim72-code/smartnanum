import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { theme } from '../lib/theme';
import { API_BASE_URL } from '../lib/config';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('알림', '모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('알림', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('알림', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        Alert.alert('오류', '사용자 정보를 찾을 수 없습니다.');
        return;
      }
      const user = JSON.parse(userData);
      const userId = user.id;
      
      const response = await axios.post(`${API_BASE_URL}/api/user/change-password`, {
        id: userId,
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        Alert.alert('성공', '비밀번호가 변경되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('실패', response.data.message || '현재 비밀번호가 틀렸거나 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      Alert.alert('오류', '서버 통신 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.slate[800]} strokeWidth={3} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>비밀번호 변경</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoBox}>
            <View style={styles.infoIconCircle}>
              <ShieldCheck size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.infoTitle}>보안을 위해 비밀번호를{'\n'}정기적으로 변경해 주세요</Text>
            <Text style={styles.infoSub}>새 비밀번호는 6자 이상의 영문, 숫자를 권장합니다.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>현재 비밀번호</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={theme.colors.slate[400]} />
                <TextInput
                  style={styles.input}
                  placeholder="현재 비밀번호 입력"
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff size={18} color={theme.colors.slate[400]} /> : <Eye size={18} color={theme.colors.slate[400]} />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>새 비밀번호</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={theme.colors.slate[400]} />
                <TextInput
                  style={styles.input}
                  placeholder="새 비밀번호 입력"
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff size={18} color={theme.colors.slate[400]} /> : <Eye size={18} color={theme.colors.slate[400]} />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>새 비밀번호 확인</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={theme.colors.slate[400]} />
                <TextInput
                  style={styles.input}
                  placeholder="새 비밀번호 다시 입력"
                  secureTextEntry={!showNew}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.disabledButton]} 
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>비밀번호 변경하기</Text>
              )}
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
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
    padding: 24,
  },
  infoBox: {
    alignItems: 'center',
    marginBottom: 40,
  },
  infoIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.slate[900],
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  infoSub: {
    fontSize: 14,
    color: theme.colors.slate[400],
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.slate[700],
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.slate[900],
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.md,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
});

export default ChangePasswordScreen;
