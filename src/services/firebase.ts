import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// TODO: カズさん、Firebase Consoleでプロジェクトを作成し、以下の設定を書き換えてください。
// 必要な機能: Authentication (今回は匿名認証またはメール/パスを推奨), Firestore Database, Storage
const firebaseConfig = {
  apiKey: "AIzaSyA23DHHBzp_o_rOMd8GgKznydJrycdwXmk",
  authDomain: "baisokuaffa.firebaseapp.com",
  projectId: "baisokuaffa",
  storageBucket: "baisokuaffa.firebasestorage.app",
  messagingSenderId: "38257747799",
  appId: "1:38257747799:web:0449f3a73d7fbbb1fb8012",
  measurementId: "G-SMSKLP6PGS"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-northeast1');
