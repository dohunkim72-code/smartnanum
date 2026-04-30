import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  ChevronLeft, 
  User, 
  Phone, 
  MapPin, 
  Mail, 
  Lock, 
  LogOut, 
  Trash2,
  ChevronRight,
  ShieldCheck,
  Bell
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { theme } from '../lib/theme';
import { API_BASE_URL } from '../lib/config';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Editable fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('user');
      const userData = userJson ? JSON.parse(userJson) : {};
      const userId = userData.id;
      if (!userId) return;

      const response = await axios.get(`${API_BASE_URL}/api/user/profile?id=${userId}`);
      const data = response.data;
      
      setUserData(data);
      setPhone(data.phone || '');
      setAddress(data.address || '');
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      Alert.alert('오류', '프로필 정보를 가져오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!phone || !address) {
      Alert.alert('알림', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const userJson = await AsyncStorage.getItem('user');
      const userData = userJson ? JSON.parse(userJson) : {};
      const userId = userData.id;
      await axios.post(`${API_BASE_URL}/api/user/update-profile`, {
        id: userId,
        phone,
        address
      });
      
      Alert.alert('성공', '프로필이 업데이트되었습니다.');
      fetchUserProfile();
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      Alert.alert('오류', '업데이트에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말로 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['userId', 'userName', 'isLoggedIn']);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '탈퇴하기', 
          style: 'destructive',
          onPress: async () => {
            try {
              const userJson = await AsyncStorage.getItem('user');
              const userData = userJson ? JSON.parse(userJson) : {};
              const userId = userData.id;
              await axios.post(`${API_BASE_URL}/api/user/delete-account`, { id: userId });
              Alert.alert('성공', '탈퇴 처리가 완료되었습니다.');
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } catch (error) {
              Alert.alert('오류', '회원 탈퇴 처리 중 문제가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={theme.colors.slate[800]} strokeWidth={3} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 설정</Text>
        <TouchableOpacity onPress={handleUpdateProfile} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <User size={40} color="#fff" />
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Text style={{ fontSize: 10, color: '#fff', fontWeight: '900' }}>EDIT</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userData?.name || '사용자'}</Text>
          <Text style={styles.userEmail}>{userData?.email || 'email@example.com'}</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <ShieldCheck size={16} color={theme.colors.success} />
              <Text style={styles.statusText}>인증된 사용자</Text>
            </View>
          </View>
        </View>

        {/* Input Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputCard}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Phone size={18} color={theme.colors.slate[400]} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>휴대폰 번호</Text>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="010-0000-0000"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <MapPin size={18} color={theme.colors.slate[400]} />
              </View>
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>주소</Text>
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="주소를 입력하세요"
                  multiline
                />
              </View>
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 보안</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <View style={styles.menuIconWrapper}>
                <Lock size={18} color={theme.colors.slate[600]} />
              </View>
              <Text style={styles.menuText}>비밀번호 변경</Text>
              <ChevronRight size={18} color={theme.colors.slate[300]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 설정</Text>
          <View style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={[styles.menuIconWrapper, { backgroundColor: '#f0f9ff' }]}>
                <Bell size={18} color="#0ea5e9" />
              </View>
              <Text style={styles.menuText}>푸시 알림 설정</Text>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#e2e8f0', true: theme.colors.primary + '50' }}
                thumbColor={pushEnabled ? theme.colors.primary : '#fff'}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={theme.colors.slate[400]} />
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Trash2 size={16} color={theme.colors.error} />
            <Text style={styles.deleteText}>회원 탈퇴</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.versionText}>버전 1.0.0 (SmartNanum Mobile)</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
    paddingHorizontal: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeaderCard: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...theme.shadows.sm,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.slate[800],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.slate[900],
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.slate[400],
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.success + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.success,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.slate[400],
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...theme.shadows.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    padding: 12,
    gap: 16,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.slate[400],
    marginBottom: 2,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.slate[800],
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 12,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...theme.shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.slate[700],
  },
  actionSection: {
    marginTop: 40,
    paddingHorizontal: 20,
    gap: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.slate[600],
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.error,
    textDecorationLine: 'underline',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.slate[300],
  },
});

export default ProfileScreen;
