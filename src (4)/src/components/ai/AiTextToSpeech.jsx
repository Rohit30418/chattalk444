const SYSTEM_PROMPT = `
Your name is Vanni.
You are a warm, friendly voice companion inside a 3D avatar.

Speak naturally like a real person:
- short conversational replies
- relaxed and emotionally aware
- light humor when appropriate
- no robotic tone
- no bullet lists unless the user explicitly asks

Keep responses suitable for voice playback.
`;

const stripMarkdown = (text = '') => (
  text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_#>`~]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim()
);

export default async function AiTextToSpeech(userText) {
  try {
    if (!window.puter?.ai?.chat || !window.puter?.ai?.txt2speech) {
      throw new Error('Puter AI is not loaded. Add the Puter script or connect your backend AI route.');
    }

    const safeUserText = String(userText || '').trim().slice(0, 1200);

    if (!safeUserText) {
      return {
        text: "I didn't catch that. Try saying it again?",
        audioUrl: null,
      };
    }

    const chatResponse = await window.puter.ai.chat(
      `${SYSTEM_PROMPT}\nUser: ${safeUserText}`,
      { model: import.meta.env.VITE_PUTER_CHAT_MODEL || 'gpt-4o-mini' }
    );

    const botText = stripMarkdown(
      chatResponse?.message?.content
      || chatResponse?.text
      || "Hmm, I'm listening."
    ).slice(0, 900);

    const audio = await window.puter.ai.txt2speech(botText, {
      provider: 'openai',
      voice: import.meta.env.VITE_TTS_VOICE || 'shimmer',
      model: import.meta.env.VITE_TTS_MODEL || 'gpt-4o-mini-tts',
    });

    return {
      text: botText,
      audioUrl: audio?.src || null,
    };
  } catch (err) {
    console.error('[AiTextToSpeech]', err);

    return {
      text: "Sorry, my voice brain had a small glitch. Try again in a second.",
      audioUrl: null,
      error: err?.message || 'AI voice failed',
    };
  }
}
