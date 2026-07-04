const openAIChat = async (prompt, historyText = "", customSystemPrompt = null) => {
  const defaultInstruction = `
    You are the savage best friend in the group chat. Keep it 100% real.
    Context: ${historyText}
    Current Prompt: ${prompt}
  `;

  const instructionToUse = customSystemPrompt 
      ? `${customSystemPrompt}\n\nCurrent User Prompt: ${prompt}` 
      : defaultInstruction;

  try {
    if (!prompt?.trim()) return null;

    // 1. Instantly bypass if Puter is completely blocked or missing
    if (!window.puter || !window.puter.ai || !window.puter.ai.chat) {
      console.warn("Puter AI missing. Bypassing check.");
      return null; 
    }

    // 2. The 3-Second Timeout Bomb
    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => {
        console.warn("AI Request Timed Out (3s). Bypassing check.");
        resolve(null); // Resolve to null to skip cleanly
      }, 3000)
    );

    // 3. The actual AI Request
    const aiPromise = window.puter.ai.chat(instructionToUse, { 
      model: "gpt-4o-mini", 
      temperature: customSystemPrompt ? 0.1 : 0.8,
      max_tokens: customSystemPrompt ? 10 : 200,   
    }).then(res => res?.message?.content || res?.message || null);

    // 4. RACE! Whichever finishes first wins.
    const result = await Promise.race([aiPromise, timeoutPromise]);
    
    return result;

  } catch (err) {
    console.warn("AI check failed, bypassing:", err.message);
    return null; // Return null so the room creation doesn't crash
  }
};

export default openAIChat;