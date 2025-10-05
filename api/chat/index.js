// En api/chat/index.js
export default async function handler(request, response) {
  // Manejar CORS
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

    // Aquí va la lógica de Gemini para chat (la añadiremos después)
    const result = "Respuesta de chat de prueba - Lógica de Gemini por añadir";
    
    response.status(200).json({ result });

  } catch (error) {
    console.error('Error:', error);
    response.status(500).json({ error: error.message });
  }
}