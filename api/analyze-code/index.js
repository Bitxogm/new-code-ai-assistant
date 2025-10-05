// En api/analyze-code/index.js
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
    const { code, language, outputLanguage, mode } = request.body;

    if (!code || !language || !mode) {
      return response.status(400).json({ error: 'Faltan parámetros requeridos' });
    }

    // Aquí va la lógica de Gemini (la añadiremos en el siguiente paso)
    const result = "Resultado de prueba - Lógica de Gemini por añadir";
    
    response.status(200).json({
      result,
      language,
      outputLanguage: outputLanguage || language,
      mode,
      isTranslation: outputLanguage && outputLanguage !== language
    });

  } catch (error) {
    console.error('Error:', error);
    response.status(500).json({ error: error.message });
  }
}