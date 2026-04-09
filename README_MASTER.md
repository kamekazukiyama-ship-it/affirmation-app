# AI×倍速×アファメーション：プロジェクト・マスターガイド

このドキュメントは、本プロジェクトの構造、設定、および運用方法をすべて網羅した「究極の取扱説明書」です。
カズが将来一人で開発を継続したり、新しい環境を構築したりする際の公式ガイドとして使用してください。

---

## 1. プロジェクト概要
このアプリは、ユーザーが入力したテーマに基づき AI がアファーメーション（自己肯定宣言）を生成し、ユーザー自身の声（またはシステムボイス）で倍速再生する React Native アプリです。

### 主要技術スタック
*   **Frontend**: React Native (Expo) + TypeScript
*   **State Management**: Zustand (App Storage)
*   **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions)
*   **AI Services**: OpenAI (Text), ElevenLabs (Voice)

---

## 2. フォルダ構成
主要なファイルの役割を理解することで、迷わず修正が可能になります。

```text
/
├── app.json            # アプリ名、ビルド番号、権限（マイク等）の設定
├── eas.json            # App Store/Google Play への提出（Submit）設定
├── functions/          # Firebase Cloud Functions (AI通信の裏側)
│   └── src/index.ts    # AI（OpenAI/ElevenLabs）との通信ロジック
└── src/
    ├── components/     # 再利用可能なUIパーツ（ボタン、カード等）
    ├── navigation/     # 画面遷移（AppNavigator.tsx）の定義
    ├── screens/        # 各画面のメインロジック
    │   ├── PlayerScreen.tsx    # プレイヤー画面（背景、再生、カレンダー）
    │   ├── GenerateScreen.tsx  # AI生成画面（同意モーダル、入力）
    │   └── PlaylistScreen.tsx  # ライブラリ画面（共有、削除）
    ├── services/       # 外部連携（Firebase同期、音声処理）
    ├── store/          # データ保存（useAppStore.ts: 全データの中枢）
    └── utils/          # 便利ツール（フォーマッター等）
```

---

## 3. 外部サービスの管理
アプリが正常に動作するために必要な 3 つの鍵です。

### ① Firebase (Google)
*   **Authentication**: ユーザーのログイン管理。
*   **Firestore**: アファメーションのテキスト情報の保存。
*   **Storage**: AI が生成した MP3 ファイルの保存。
*   **Cloud Functions**: AI API キーを隠し、安全に通信するためのプロキシ。

### ② OpenAI
*   **GPT-4o-mini**: ユーザーのテーマからアファメーション文章を作成するために使用。
*   設定場所: Cloud Functions の環境変数 `OPENAI_API_KEY`。

### ③ ElevenLabs
*   **Instant Voice Cloning**: ユーザーの録音から自身の声を作成。
*   **Text-to-Speech**: テキストを音声に変換。
*   設定場所: Cloud Functions の環境変数 `ELEVENLABS_API_KEY`。

---

## 4. 運用・開発コマンド集
これらをターミナルで実行して作業を行います。

### 開発の開始
```bash
npm start
# または
npx expo start
```

### ビルド（審査用バイナリの作成）
```bash
# iOS
eas build -p ios

# Android
eas build -p android
```

### ストアへの提出（Submit）
```bash
# ビルド完了後に実行
eas submit -p ios
```

---

## 5. 自立のための Git ワークフロー
コードの「セーブポイント」を作り、GitHub という金庫に預ける手順です。

1.  **変更をステージする**: `git add .`
2.  **履歴に名前をつけて保存する**: `git commit -m "修正内容のメモ"`
3.  **オンラインに預ける**: `git push origin main`

---

## 6. エラーが起きた時のチェックリスト
*   **AIが動かない**: ElevenLabs の API 残高が切れていないか、API キーが有効かを確認。
*   **画面がおかしい**: `src/screens` 内の対象ファイルをチェック。
*   **データが消えた**: `src/store/useAppStore.ts` がデータの「設計図」なので、ここを確認。

---

カズ、このドキュメントをいつでも見返せるように、大切に保管してください。
あなたのアプリは、この地図があればいつでも復活し、進化し続けることができます。
