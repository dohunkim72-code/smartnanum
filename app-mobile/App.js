import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator, View, BackHandler, Platform, ToastAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

// 리렌더링 시 웹뷰 강제 리로드 현상을 원천 방지하기 위해 source 객체 레퍼런스를 상수로 완전 고정합니다.
const WEBVIEW_SOURCE = { uri: 'https://oasis7528.cafe24.com' };

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [lastBackButtonPress, setLastBackButtonPress] = useState(0);

  // 안드로이드 하드웨어 뒤로가기 버튼 연동
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true; // 기본 동작(앱 종료 등) 방지
      } else {
        // 첫 화면에서 뒤로가기 누를 시 "한번 더 누르면 종료" 토스트 제공
        const currentTime = new Date().getTime();
        if (currentTime - lastBackButtonPress < 2000) {
          BackHandler.exitApp();
          return false;
        }
        setLastBackButtonPress(currentTime);
        if (Platform.OS === 'android') {
          ToastAndroid.show('한번 더 누르면 종료됩니다.', ToastAndroid.SHORT);
        }
        return true;
      }
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, [canGoBack, lastBackButtonPress]);

  // 웹뷰로부터의 메시지 수신 (크래시 방지용 귀 역할)
  const handleMessage = (event) => {
    try {
      const data = event.nativeEvent.data;
      if (!data) return;

      console.log('웹뷰로부터 메시지 수신:', data);
      const message = JSON.parse(data);
      
      // 웹뷰 내부에서 이전 화면으로의 뒤로가기를 요청할 때 안전하게 반응
      if (message.type === 'GOBACK') {
        if (webViewRef.current && canGoBack) {
          webViewRef.current.goBack();
        }
      }
    } catch (e) {
      // JSON 파싱 실패 혹은 단순 텍스트 신호인 경우 크래시 없이 안전하게 무시
      console.log('웹뷰 메시지 안전 스킵:', event.nativeEvent.data);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <WebView
        ref={webViewRef}
        source={WEBVIEW_SOURCE} // 고정된 레퍼런스 주입으로 리로드 방지
        style={[styles.webview, { opacity: 0.99 }]} // [안드로이드 치트키] 그래픽 렌더링 크래시 원천 차단 우회 필터
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always" // HTTPS/HTTP 혼합 컨텐츠 로드 시의 예외 종료 방지
        allowsInlineMediaPlayback={true}
        setSupportMultipleWindows={false} // target="_blank" 등의 새 창 생성 시 에러 종료 방지
        androidHardwareAccelerationDisabled={Platform.OS === 'android'} // 안드로이드 특정 하드웨어 그래픽 가속 충돌 방지
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        onMessage={handleMessage} // 크래시 방지 핵심 리스너 탑재
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3713ec" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

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
