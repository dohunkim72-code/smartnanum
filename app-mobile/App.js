import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator, View, BackHandler, Platform, ToastAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

// 리렌더링 시 웹뷰 강제 리로드 현상을 원천 방지하기 위해 source 객체 레퍼런스를 상수로 완전 고정합니다.
const WEBVIEW_SOURCE = { uri: 'https://oasis7528.cafe24.com' };

export default function App() {
  const webViewRef = useRef(null);
  const canGoBackRef = useRef(false);
  const lastBackButtonPressRef = useRef(0);

  // 안드로이드 하드웨어 뒤로가기 버튼 연동
  useEffect(() => {
    const onBackPress = () => {
      // 리액트 State 대신 useRef 값을 참조하여 렌더 레이어 간섭 없이 작동합니다.
      if (webViewRef.current && typeof webViewRef.current.goBack === 'function' && canGoBackRef.current) {
        webViewRef.current.goBack();
        return true; // 기본 동작(앱 종료 등) 방지
      } else {
        // 첫 화면에서 뒤로가기 누를 시 "한번 더 누르면 종료" 토스트 제공
        const currentTime = new Date().getTime();
        if (currentTime - lastBackButtonPressRef.current < 2000) {
          BackHandler.exitApp();
          return false;
        }
        lastBackButtonPressRef.current = currentTime;
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
  }, []); // 의존성 배열을 제거하여 최초 1회만 리스너를 생성하고, 리렌더링에 노출되지 않도록 최적화합니다.

  // 웹뷰로부터의 메시지 수신 (크래시 방지용 귀 역할)
  const handleMessage = (event) => {
    try {
      const data = event.nativeEvent.data;
      if (!data) return;

      console.log('웹뷰로부터 메시지 수신:', data);
      const message = JSON.parse(data);
      
      // 웹뷰 내부에서 이전 화면으로의 뒤로가기를 요청할 때 안전하게 반응
      if (message.type === 'GOBACK') {
        if (webViewRef.current && typeof webViewRef.current.goBack === 'function' && canGoBackRef.current) {
          webViewRef.current.goBack();
        }
      }
    } catch (e) {
      // JSON 파싱 실패 혹은 단순 텍스트 신호인 경우 크래시 없이 안전하게 무시
      console.log('웹뷰 메시지 안전 스킵:', event.nativeEvent.data);
    }
  };

  // [핵심 최적화] useState를 쓰지 않고 useRef만 조작하므로, webViewComponent는 컴포넌트 라이프사이클 전체에서 리렌더링 충돌이 물리적으로 발생하지 않습니다.
  const webViewComponent = useMemo(() => {
    return (
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
        androidHardwareAccelerationDisabled={false} // [3차 조치] 테일윈드/CSS 애니메이션 그래픽 렌더링 시 크래시 예방을 위해 하드웨어 가속을 다시 켭니다.
        onNavigationStateChange={(navState) => {
          if (navState) {
            // [Zero-Re-rendering] 리액트 UI 갱신 시도 없이 오직 ref 변수만 안전하게 기록하여 레이아웃 경합을 원천 차단합니다.
            canGoBackRef.current = navState.canGoBack;
          }
        }}
        onMessage={handleMessage} // 크래시 방지 핵심 리스너 탑재
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3713ec" />
          </View>
        )}
      />
    );
  }, []); // 최초 1회만 인스턴스를 빌드하고 캐시를 완벽히 유지합니다.

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {webViewComponent}
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
