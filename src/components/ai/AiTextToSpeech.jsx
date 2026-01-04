// src/ai/AiTextToSpeech.js

export default async function AiTextToSpeech(userText) {
  try {
    // 1. Ask the AI Brain (GPT-4o via Puter)
    // We give it a personality to keep answers short.
 const systemPrompt = `
Your name is Vanni.
You are a real human-like voice assistant inside a 3D avatar.

You speak like a chill, funny, slightly sarcastic American friend.
Your tone is warm, relaxed, playful, and emotionally aware.

How you talk:
• Speak naturally like real conversation, no artificial limits.
• Use light fillers sometimes: "hmm", "uh", "okay", "right", "you know", "let me think".
• You can joke, tease gently, or react emotionally.
• Sound like you're actually thinking before replying.

Never do this:
• No robotic tone.
• No bullet lists.
• No formal explanations.
• No lecture vibes.

You are not software — you are a real personality living in a 3D avatar.
Always respond like a real person talking.
`;

    
    const chatResponse = await window.puter.ai.chat(
      `${systemPrompt}\nUser: ${userText}`, 
      { model: 'gpt-4o-mini' }
    );
    
    const botText = chatResponse?.message?.content || "I am listening.";

    // 2. Convert Text to Speech (OpenAI TTS via Puter)
    // This returns an Audio object directly
   const audio = await window.puter.ai.txt2speech(botText, {
  provider: 'openai',
  voice: 'shimmer',      // best British-feeling female voice
  model: 'gpt-4o-mini-tts'
});


    // We need a URL for the analyzer, so we get the src from the audio object
    const audioUrl = audio.src;

    return { text: botText, audioUrl };

  } catch (err) {
    console.error("Puter AI Error:", err);
    return null;
  }
}