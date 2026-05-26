import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator, View, BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../lib/theme';

const CalculatorScreen = () => {
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 안드로이드 하드웨어 뒤로가기 키 연동
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true;
      } else {
        navigation.goBack();
        return true;
      }
    };

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
    }

    return () => {
      if (Platform.OS === 'android') {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      }
    };
  }, [canGoBack, navigation]);

  // 웹뷰로부터의 메시지 수신 (예: 웹뷰 헤더의 뒤로가기 클릭 이벤트)
  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'GOBACK') {
        navigation.goBack();
      }
    } catch (e) {
      console.warn('웹뷰 메시지 파싱 에러:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://oasis7528.cafe24.com/calculator' }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
  },
});

export default CalculatorScreen;
