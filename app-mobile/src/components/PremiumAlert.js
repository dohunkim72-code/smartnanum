import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Animated,
  Dimensions
} from 'react-native';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../lib/theme';

const { width } = Dimensions.get('window');

const PremiumAlert = ({ visible, title, message, type = 'info', onClose }) => {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={40} color="white" />;
      case 'error':
        return <AlertCircle size={40} color="white" />;
      default:
        return <Info size={40} color="white" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'success':
        return ['#4ADE80', '#16A34A'];
      case 'error':
        return ['#F87171', '#DC2626'];
      default:
        return [COLORS.primary, '#4F46E5'];
    }
  };

  const colors = getGradient();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.backdrop} 
          onPress={onClose} 
        />
        
        <View style={styles.modalContent}>
          {/* 아이콘 영역 */}
          <View style={styles.iconWrapper}>
            <View style={[styles.iconBlur, { backgroundColor: colors[0] + '33' }]} />
            <View style={[styles.iconCircle, { backgroundColor: colors[0] }]}>
              {getIcon()}
            </View>
          </View>

          {/* 텍스트 영역 */}
          <View style={styles.textSection}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* 버튼 */}
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: COLORS.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 40,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconWrapper: {
    marginBottom: 24,
    position: 'relative',
  },
  iconBlur: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 100,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default PremiumAlert;
