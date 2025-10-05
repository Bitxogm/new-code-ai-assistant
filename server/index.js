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
// En server/index.js - ACTUALIZAR el endpoint analyze-code:
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

    const prompt = `Analiza este código ${language} en modo ${mode}:\n\n${code}`;
    
    console.log('🔍 Enviando a Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Respuesta recibida');

    // ✅ MANTENER COMPATIBILIDAD con el frontend
    res.json({
      result: text,  // ⬅️ ESTE CAMPO ES REQUERIDO
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

// ✅ NUEVO: Prompt flexible
function buildFlexiblePrompt(code, inputLanguage, outputLanguage, analysisMode) {
  const modeInstructions = {
    refactor: 'Proporciona el código refactorizado con comentarios explicando los cambios.',
    tests: 'Genera tests unitarios completos con casos de prueba.',
    security: 'Identifica vulnerabilidades y proporciona soluciones de seguridad.',
    performance: 'Analiza rendimiento y sugiere optimizaciones.',
    documentation: 'Genera documentación completa y comentarios.',
    modularization: 'Sugiere estructura modular y separación.'
  };

  return `
Eres un experto en ${analysisMode} para código ${inputLanguage}.

**ANÁLISIS SOLICITADO:**
${modeInstructions[analysisMode]}

**CÓDIGO:**
\`\`\`${inputLanguage}
${code}
\`\`\`

**INSTRUCCIONES:**
- Sé claro y detallado
- Incluye ejemplos de código cuando sea útil
- Explica el razonamiento detrás de los cambios
- Proporciona soluciones prácticas

El sistema extraerá automáticamente las partes relevantes de tu respuesta.
`;
}

// ✅ NUEVO: Parsing inteligente
function parseGeminiTextResponse(text, mode) {
  console.log('🔍 Parseando respuesta de Gemini...');

  const result = {
    refactoredCode: '',
    refactoringSummary: '',
    inlineComments: [],
    unitTests: '',
    securityAnalysis: '',
    performanceAnalysis: '',
    documentation: '',
    architecturalSuggestions: '',
    rawText: text
  };

  try {
    // Extraer bloques de código
    const codeBlocks = extractCodeBlocks(text);
    if (codeBlocks) {
      // Asignar código basado en el modo
      if (mode === 'refactor' || mode === 'security') {
        result.refactoredCode = codeBlocks;
      }
      if (mode === 'tests') {
        result.unitTests = codeBlocks;
      }
    }

    // Extraer análisis específicos por modo
    if (mode === 'security') {
      result.securityAnalysis = extractSection(text, ['vulnerabilidad', 'SQL Injection', 'XSS', 'seguridad', 'riesgo']);
    }

    if (mode === 'performance') {
      result.performanceAnalysis = extractSection(text, ['rendimiento', 'optimización', 'eficiencia', 'O(n']);
    }

    if (mode === 'documentation') {
      result.documentation = extractSection(text, ['documentación', 'comentario', 'docstring']);
    }

    if (mode === 'modularization') {
      result.architecturalSuggestions = extractSection(text, ['módulo', 'arquitectura', 'estructura', 'separación']);
    }

    // Resumen general (primeras líneas)
    result.refactoringSummary = text.split('\n').slice(0, 5).join('\n');

    console.log('✅ Parseo completado para modo:', mode);

  } catch (error) {
    console.error('❌ Error en parseo inteligente:', error);
    // Fallback: texto completo en result
    result.result = text;
  }

  return result;
}

// ✅ Funciones auxiliares de extracción
function extractCodeBlocks(text) {
  const codeMatches = text.match(/```(?:\w+)?\n([\s\S]*?)```/g);
  if (codeMatches) {
    return codeMatches.map(block =>
      block.replace(/```\w?\n?/, '').replace(/```$/, '')
    ).join('\n\n// --- \n\n');
  }
  return '';
}

function extractSection(text, keywords) {
  const lines = text.split('\n');
  const relevantLines = lines.filter(line =>
    keywords.some(keyword => line.toLowerCase().includes(keyword))
  );
  return relevantLines.join('\n');
}

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