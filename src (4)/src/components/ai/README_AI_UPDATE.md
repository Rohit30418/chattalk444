# AI voice component update

Replace your existing files with the files in this zip.

## Updated files

- AiCard.jsx
- AiCharacter.jsx
- AiTextToSpeech.jsx
- analyzeAudio.jsx
- SpeechHud.jsx
- VoiceRecognition.jsx
- Wit.jsx

## Important production notes

1. The old `Wit.jsx` exposed a Wit.ai bearer token in frontend code. That token should be revoked and replaced.
2. Put `VITE_WIT_TOKEN` only for local testing. For production, proxy Wit/OpenAI requests through your backend.
3. `VITE_AI_ACCESS_CODE` is optional. Client-side PINs are not true security; backend/subscription validation is required for paid access.
4. The AI page is now mobile-friendly and uses bottom safe-area spacing.
5. Debug "Mouth Level" text was removed.
6. Speech HUD positioning is fixed. It no longer uses negative `fixed` offsets.
