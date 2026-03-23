const admin = require('firebase-admin');
require('dotenv').config();

admin.initializeApp();

async function testStorage() {
  try {
    const bucketName = 'baisokuaffa.firebasestorage.app'; 
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(`affirmations/test_${Date.now()}.txt`);
    console.log("Saving to", bucketName, "...");
    await file.save("test data", { contentType: 'text/plain' });
    console.log("Success!");
  } catch (e) {
    console.error("Storage Error:", e);
  }
}

testStorage();
