import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import axios from "axios";
import FormData from "form-data";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp();

// ---------- ① AIテキスト（アファメーション）生成機能 ---------- //
export const createAffirmation = functions.region('asia-northeast1').https.onCall(async (data, context) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const theme = data.theme;
    if (!theme) {
      throw new functions.https.HttpsError('invalid-argument', 'テーマが指定されていません。');
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたはプロの心理カウンセラーであり、自己肯定感を高める専門家です。ユーザーの「現在の気分や目標」を元に、ポジティブで力強い一人称（私）のアファメーションを2〜3文程度で提案してください。自然な日本語で、過剰な装飾は避けてください。"
        },
        {
          role: "user",
          content: `テーマ: ${theme}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const generatedText = response.choices[0]?.message?.content?.trim();
    return { text: generatedText };
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new functions.https.HttpsError('internal', 'AIからのテキスト生成に失敗しました。');
  }
});


// ---------- ② AIボイスクローン＆音声生成機能 ---------- //
export const createVoiceCloneAndAudio = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 300, memory: '1GB' }) // 音声処理・通信のため長めに設定
  .https.onCall(async (data, context) => {
    try {
      const text = data.text;
      const audioBase64 = data.audioBase64; // (任意) クローン元の音声データ
      
      if (!text) {
        throw new functions.https.HttpsError('invalid-argument', '読み上げるテキストがありません。');
      }

      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
      if (!elevenLabsApiKey) {
        throw new functions.https.HttpsError('internal', 'ElevenLabsのAPIキーが設定されていません。');
      }

      let voiceId = "21m00Tcm4TlvDq8ikWAM"; // デフォルト声 (Rachel)
      let isCustomVoice = false;

      // 音声データがある場合は一時的なクローンを作成
      if (audioBase64) {
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const form = new FormData();
        const cloneName = `TempClone_${uuidv4().substring(0, 8)}`;
        
        form.append('name', cloneName);
        form.append('description', 'Instant clone for affirmation app');
        form.append('files', audioBuffer, { filename: 'sample.m4a', contentType: 'audio/m4a' });

        try {
          console.log(`Creating instant voice clone: ${cloneName}`);
          const addVoiceRes = await axios.post('https://api.elevenlabs.io/v1/voices/add', form, {
            headers: {
              'xi-api-key': elevenLabsApiKey,
              ...form.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
          });
          voiceId = addVoiceRes.data.voice_id;
          isCustomVoice = true;
          console.log(`Voice clone created. ID: ${voiceId}`);
        } catch (cloneError: any) {
          console.error("Voice Clone Error:", cloneError?.response?.data || cloneError);
          console.log("API制限などの理由でクローン作成に失敗したため、デフォルト音声にフォールバックします。");
          // Rachel (デフォルト高音質Voice) のIDを使用
          voiceId = "21m00Tcm4TlvDq8ikWAM"; 
          isCustomVoice = false;
        }
      }

      // ２．TTS (テキストから音声合成) を実行
      console.log(`Starting TTS synthesis for Voice ID: ${voiceId}`);
      let audioDataBuffer: Buffer;
      try {
        const ttsRes = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          text: text,
          model_id: "eleven_multilingual_v2", // 日本語対応の高音質モデル
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          }
        }, {
          headers: {
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer' // 音声バイナリとして受け取る
        });
        audioDataBuffer = Buffer.from(ttsRes.data);
        console.log("TTS synthesis completed.");
      } catch (ttsError: any) {
        console.error("TTS Synthesis Error:", ttsError?.response?.data || ttsError);
        throw new functions.https.HttpsError('internal', '音声の合成に失敗しました。');
      }

      // ３．作ったクローン音声をAPI制限回避のためにすぐ削除する
      if (isCustomVoice) {
        console.log(`Deleting temporary voice clone: ${voiceId}`);
        try {
          await axios.delete(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
            headers: { 'xi-api-key': elevenLabsApiKey }
          });
          console.log("Temporary voice clone deleted successfully.");
        } catch (delError) {
          console.error("Failed to delete voice clone, manual cleanup may be needed:", delError);
          // 削除処理の失敗は全体の失敗にせず警告のみに留め、アプリ側には音声を返す
        }
      }

      // ４．Firebase Storageに合成した音声を保存（キャッシュとして利用）
      const bucket = admin.storage().bucket();
      const filename = `affirmations/ai_${uuidv4()}.mp3`;
      const file = bucket.file(filename);

      await file.save(audioDataBuffer, { 
        contentType: 'audio/mpeg',
        metadata: {
          cacheControl: 'public, max-age=31536000'
        }
      });
      console.log(`Audio saved to Storage: ${filename}`);

      // アプリ側で getDownloadURL を使えるように Storage内のパスを返す
      return { 
        storagePath: filename,
        isFallback: !isCustomVoice && !!data.audioBase64 
      };

    } catch (error: any) {
      console.error("Overall Generate Audio Error:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', `音声生成プロセスでエラーが発生しました: ${error.message || String(error)}`);
    }
  });
