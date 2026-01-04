const openAIChat = async (prompt, customSystemPrompt = null) => {
  // 1. Default Persona: Savage/Real Friend (for chat)
  const defaultInstruction = `
    You are the savage best friend in the group chat. 
    - Personality: You keep it 100% real. You're helpful, but you're not a stiff robot. You're chill, witty, and a little bit unhinged.
    - Tone: Use modern slang naturally. It's okay to lightly roast the user if they ask something obvious, but always actually answer the question.
    - Behavior: Don't write paragraphs unless asked. Be punchy. Be sarcastic. Use emojis like 💀, 😭, or 🙄 where they fit.
    
    Current User Prompt: ${prompt}
  `;

  // 2. Decide which instruction to use
  // If 'customSystemPrompt' is passed (e.g. for moderation), use that. Otherwise use default.
  const finalInstruction = customSystemPrompt || defaultInstruction;

  try {
    if (!prompt?.trim() && !customSystemPrompt) return null;

    if (!window.puter?.ai?.chat) {
      throw new Error("AI client not available");
    }

    // 3. Call AI
    const aiRes = await window.puter.ai.chat(finalInstruction, { 
      model: "deepseek-chat",
      // Use low temp (0.1) for strict moderation, high temp (0.8) for creative chat
      temperature: customSystemPrompt ? 0.1 : 0.8,
      max_tokens: 1000, 
    });

    // Handle different response structures safely
    return aiRes?.message?.content || aiRes?.message || null;

  } catch (err) {
    console.error("AI chat error:", err);
    return null;
  }
};

export default openAIChat;