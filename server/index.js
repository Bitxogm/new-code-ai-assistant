import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('../dist'));

// Mock API - analyze-code
app.post('/api/analyze-code', (req, res) => {
  console.log('📥 Analyze code called with:', { 
    language: req.body.language,
    mode: req.body.mode,
    codeLength: req.body.code?.length 
  });
  
  res.json({ 
    result: '## ✅ Análisis de prueba exitoso\\n\\n**¡Las APIs están funcionando correctamente!**\\n\\nEste es un resultado de prueba. Cuando añadamos la integración con Gemini, aquí aparecerá el análisis real del código.\\n\\n**Parámetros recibidos:**\\n- Lenguaje: ' + req.body.language + '\\n- Modo: ' + req.body.mode + '\\n- Longitud del código: ' + (req.body.code?.length || 0) + ' caracteres',
    language: req.body.language,
    outputLanguage: req.body.outputLanguage || req.body.language,
    mode: req.body.mode,
    isTranslation: !!(req.body.outputLanguage && req.body.outputLanguage !== req.body.language)
  });
});

// Mock API - chat
app.post('/api/chat', (req, res) => {
  console.log('📥 Chat called with:', { 
    messagesCount: req.body.messages?.length,
    language: req.body.language 
  });
  
  res.json({ 
    result: '¡Hola! 👋 Soy tu asistente de IA. Esta es una respuesta de prueba que confirma que las APIs de chat están funcionando correctamente. Cuando integremos Gemini, podré ayudarte con análisis de código, refactorizaciones, y mucho más.\\n\\n**Estado del sistema:** ✅ APIs operativas\\n**Próximo paso:** Integración con Gemini'
  });
});

// Catch all handler para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de desarrollo ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API Analyze: POST http://localhost:${PORT}/api/analyze-code`);
  console.log(`💬 API Chat: POST http://localhost:${PORT}/api/chat`);
});