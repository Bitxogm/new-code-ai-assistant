// server/index.js - IMPORTS ES6 COMPLETOS
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Configurar __dirname para ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env
dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('../dist'));

// Verificar API key al iniciar
console.log('🔑 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ CONFIGURADA' : '❌ NO ENCONTRADA');

// Analyze-code endpoint
// En server/index.js - CORREGIR analyze-code endpoint:
app.post('/api/analyze-code', async (req, res) => {
  try {
    const { code, language, outputLanguage, mode } = req.body;
    
    console.log('📥 Recibiendo análisis:', { language, mode, codeLength: code?.length });
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp' 
    });

    // Prompt mejorado para análisis
    const prompt = `Eres un experto en ${language}. Analiza este código en modo ${mode} y proporciona un análisis detallado:

CÓDIGO:
\`\`\`${language}
${code}
\`\`\`

MODO: ${mode}

Proporciona un análisis estructurado y útil.`;

    console.log('🔍 Enviando a Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Respuesta recibida de Gemini');

    res.json({
      result: text,
      language,
      mode,
      status: 'success'
    });

  } catch (error) {
    console.error('❌ Error en analyze-code:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Error al comunicarse con Gemini AI'
    });
  }
});
// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, code, language, context } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Se requieren mensajes' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp' 
    });

    const systemPrompt = buildChatPrompt(code, language, context);
    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      generationConfig: { maxOutputTokens: 4000 },
    });

    console.log('💬 Enviando chat a Gemini...');
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const content = response.text();

    res.json({ result: content });

  } catch (error) {
    console.error('Error en chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Funciones auxiliares (las mismas que antes)
function buildAnalysisPrompt(code, inputLanguage, outputLanguage, analysisMode) {
  // ... (pegar aquí la función completa que ya tenemos)
}

function buildChatPrompt(code, language, context) {
  // ... (pegar aquí la función completa que ya tenemos)
}

// Catch all handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor con Gemini REAL en http://localhost:${PORT}`);
});