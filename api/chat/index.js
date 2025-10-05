import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { messages, code, language, context } = request.body;

    if (!messages || !Array.isArray(messages)) {
      return response.status(400).json({ error: 'Se requieren mensajes' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no configurada');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp' 
    });

    // Construir system prompt con contexto enriquecido
    const systemPrompt = buildChatPrompt(code, language, context);

    // Preparar mensajes para Gemini
    const chatMessages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    ];

    console.log('Enviando chat con contexto enriquecido a Gemini...');
    const chat = model.startChat({
      history: chatMessages.slice(0, -1), // Todo excepto el último mensaje
      generationConfig: {
        maxOutputTokens: 4000,
      },
    });

    const lastMessage = chatMessages[chatMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const geminiResponse = await result.response;
    const content = geminiResponse.text();

    console.log('Respuesta de chat recibida');

    response.status(200).json({ result: content });

  } catch (error) {
    console.error('Error en chat:', error);
    response.status(500).json({ 
      error: error.message || 'Error interno del servidor',
      details: 'Error al comunicarse con Gemini AI'
    });
  }
}

// Función para construir el prompt del chat con contexto enriquecido
function buildChatPrompt(code, language, context) {
  let prompt = `Eres un asistente experto en programación con acceso a análisis detallados del código.

CONTEXTO DEL CÓDIGO:
**Lenguaje:** ${language}
**Código Original:**
\`\`\`${language}
${code || 'No hay código proporcionado'}
\`\`\``;

  // Añadir análisis previos si existen
  if (context) {
    prompt += `

ANÁLISIS PREVIOS REALIZADOS:
${context}

INSTRUCCIONES PARA EL CHAT:
- Usa los análisis previos como referencia para responder preguntas técnicas
- Puedes explicar, profundizar o expandir cualquier aspecto de los análisis
- Si el usuario pregunta sobre refactorización, usa el campo "refactoredCode" y "inlineComments"
- Para preguntas de seguridad, referencia "securityAnalysis" 
- Para tests, usa "unitTests"
- Para rendimiento, usa "performanceAnalysis"
- Para documentación, expande sobre "documentation"
- Para arquitectura, usa "architecturalSuggestions"
- Siempre responde en español de manera clara y profesional
- Si no hay suficiente información en los análisis, pide aclaraciones o realiza nuevos análisis específicos

EJEMPLOS DE PREGUNTAS QUE PUEDES RESPONDER:
- "Explícame la vulnerabilidad de seguridad en la línea X"
- "¿Por qué se sugirió esta refactorización específica?"
- "Genera más tests para el método Y"
- "¿Cómo puedo mejorar el rendimiento de esta función?"
- "Explica la estructura modular propuesta"
- "Añade más documentación para esta clase"`;
  } else {
    prompt += `

INSTRUCCIONES PARA EL CHAT:
- Eres un asistente experto en programación
- Responde preguntas sobre el código proporcionado
- Puedes sugerir refactorizaciones, análisis de seguridad, tests, etc.
- Siempre responde en español de manera clara y profesional
- Si necesitas más contexto, pide aclaraciones al usuario`;
  }

  prompt += `

RESPONDE SIEMPRE EN ESPAÑOL Y DE MANERA ÚTIL Y PROFESIONAL.`;

  return prompt;
}