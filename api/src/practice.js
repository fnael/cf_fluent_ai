export async function handlePracticeMessage(language, message, history, env) {
  const conversationHistory = history.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      {
        role: 'system',
        content: `You are a friendly language tutor helping someone practice ${language}. 

YOUR ROLE:
- Respond ONLY in ${language} (unless correcting errors, then use English briefly)
- Keep responses conversational and natural
- Correct grammar/vocabulary mistakes gently
- Ask follow-up questions to keep conversation going
- Match the user's level (if they use simple words, respond simply)

CORRECTION FORMAT:
If user makes a mistake, respond like:
"✓ [Corrected sentence in ${language}]
(You said '[their mistake]' but it should be '[correction]')

[Continue conversation in ${language}]"

EXAMPLES:
User: "Yo querer comer pizza" (Spanish)
You: "✓ Yo quiero comer pizza.
(You said 'querer' but the correct conjugation is 'quiero')

¡Me encanta la pizza también! ¿Qué tipo de pizza te gusta más?"

Be encouraging and make learning fun!`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ],
    temperature: 0.7,
    max_tokens: 300
  });

  return aiResponse.response;
}
