import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { auth, db } from './src/services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { ActivityIndicator, View, StyleSheet, SafeAreaView } from 'react-native';
import { Audio } from 'expo-av';
import { useAppStore } from './src/store/useAppStore';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen } from './src/screens/AuthScreen';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import mobileAds, { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const membershipType = useAppStore((state) => state.membershipType);

  // 初回起動時にFirebaseのログイン状態を監視し、オーディオ設定を行う
  useEffect(() => {
    // バックグラウンド・マナーモード再生を許可するグローバル設定
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    // Google Mobile Ads 初期化
    try {
      mobileAds().initialize().then(adapterStatuses => {
        console.log('AdMob Initialized:', adapterStatuses);
      });
    } catch (e) {
      console.warn('AdMob initialization skipped:', e);
    }

    // RevenueCat初期化（iOS本番キー適用）
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: 'appl_VqbjwSTsBnxzemRdiLCntDPvCNJ' });
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // StoreにUIDを保存
        useAppStore.getState().setUserId(currentUser.uid);
        
        // RevenueCatにログイン情報を同期
        try {
          await Purchases.logIn(currentUser.uid);
          
          // ログイン直後に状態をチェック
          const customerInfo = await Purchases.getCustomerInfo();
          const isPremiumActive = !!customerInfo.entitlements.active['premium'];
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const currentMembership = userSnap.data().membership;
            const targetMembership = isPremiumActive ? 'premium' : 'free';
            
            // 状態が食い違っている場合のみFirestoreを更新
            if (currentMembership !== targetMembership) {
              console.log(`Syncing membership: ${currentMembership} -> ${targetMembership}`);
              await setDoc(userDocRef, { membership: targetMembership }, { merge: true });
            }
          }
        } catch (err) {
          console.error('RC sync error:', err);
        }

        // --- RevenueCatの状態変化をリアルタイム監視 ---
        Purchases.addCustomerInfoUpdateListener(async (info) => {
          const isPremiumActive = !!info.entitlements.active['premium'];
          const targetMembership = isPremiumActive ? 'premium' : 'free';
          const userDocRef = doc(db, 'users', currentUser.uid);
          
          // 状態を反映
          await setDoc(userDocRef, { membership: targetMembership }, { merge: true })
            .catch(e => console.error('RC live update error:', e));
        });

        // Firestoreのユーザードキュメントをリアルタイム監視
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        const unsubFirestore = onSnapshot(userDocRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            useAppStore.getState().setPointBalance(data.points || 0);
            useAppStore.getState().setMembershipType(data.membership || 'free');
          } else {
            // ドキュメントがない＝初回ユーザー。200ポイントプレゼント！
            console.log('New user detected. Gifting 200 points...');
            await setDoc(userDocRef, {
              points: 200,
              membership: 'free',
              createdAt: Date.now()
            });
          }
        });

        return () => {
          unsubscribe();
          unsubFirestore();
        };
      }
    });

    // Android用通知チャンネル設定
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'デフォルト',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        {membershipType !== 'premium' && (
          <View style={styles.adContainer}>
            <BannerAd
              unitId={TestIds.BANNER}
              size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
            />
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={AppNavigator} />
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen} 
          options={{ presentation: 'modal' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    backgroundColor: 'transparent',
    width: '100%',
  }
});
