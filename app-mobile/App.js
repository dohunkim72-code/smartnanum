import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator, View, BackHandler, Platform, ToastAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://oasis7528.cafe24.com' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
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
