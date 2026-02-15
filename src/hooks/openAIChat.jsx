const openAIChat = async (prompt, historyText = "") => {
  // 1. Default Persona
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

  try {
    if (!prompt?.trim()) return null;

    if (!window.puter?.ai?.chat) {
      throw new Error("AI client not available");
    }

    const aiRes = await window.puter.ai.chat(defaultInstruction, { 
      model: "gpt-4o-mini", // Switched to GPT-4o-mini for better reasoning/memory
      temperature: 0.8,
      max_tokens: 200, 
    });

    return aiRes?.message?.content || aiRes?.message || null;

  } catch (err) {
    console.error("AI chat error:", err);
    return null;
  }
};

export default openAIChat;