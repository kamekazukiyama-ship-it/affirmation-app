require('dotenv').config();
const axios = require('axios');

async function checkElevenLabs() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env");
    return;
  }
  try {
    const res = await axios.get('https://api.elevenlabs.io/v1/user/subscription', {
      headers: { 'xi-api-key': apiKey }
    });
    console.log("Subscription Info:");
    console.log(JSON.stringify(res.data, null, 2));

    const voicesRes = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey }
    });
    console.log("\nVoices available:", voicesRes.data.voices.length);
    console.log("Custom voices:", voicesRes.data.voices.filter(v => v.category === 'cloned').length);
    
  } catch (e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  }
}

checkElevenLabs();
