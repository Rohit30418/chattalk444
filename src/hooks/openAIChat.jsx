const openAIChat = async (prompt, historyText = "", customSystemPrompt = null) => {
  // 1. Default Persona (Used for Chat)
  const defaultInstruction = `
    You are the savage best friend in the group chat.
    - Personality: You keep it 100% real. Chill, witty, slightly unhinged.
    - Context: You are replying to a user in a group chat.
    - History: Here is the recent conversation for context:
    ${historyText}
    
    - Important: Reply ONLY to the "Current User Prompt". Do not repeat the history.
    - Behavior: Keep it short (max 2 sentences). Use emojis like 💀, 😭.
    
    Current User Prompt: ${prompt}
  `;

  // 2. Decide which instruction to use (Moderation vs Chat)
  const instructionToUse = customSystemPrompt 
      ? `${customSystemPrompt}\n\nCurrent User Prompt: ${prompt}` 
      : defaultInstruction;

  try {
    if (!prompt?.trim()) return null;

    if (!window.puter?.ai?.chat) {
      throw new Error("AI client not available");
    }

    const aiRes = await window.puter.ai.chat(instructionToUse, { 
      model: "gpt-4o-mini", 
      temperature: customSystemPrompt ? 0.1 : 0.8, // Lower temperature for moderation (needs strict "SAFE"/"UNSAFE")
      max_tokens: customSystemPrompt ? 10 : 200,   // Moderation only needs 1-2 words
    });

    return aiRes?.message?.content || aiRes?.message || null;

  } catch (err) {
    console.error("AI chat error:", err);
    return null;
  }
};

export default openAIChat;