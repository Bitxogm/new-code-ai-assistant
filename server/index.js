// server/index.js - IMPORTS ES6 COMPLETOS
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import db from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Configurar __dirname para ES6 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env
dotenv.config();

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

app.use(cors());
app.use(express.json());
app.use(express.static('../dist'));

// Verificar API key al iniciar
console.log('🔑 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ CONFIGURADA' : '❌ NO ENCONTRADA');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ==========================================
// AUTH ENDPOINTS
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  db.run(
    `INSERT INTO users (id, email, password, display_name) VALUES (?, ?, ?, ?)`,
    [userId, email, hashedPassword, displayName],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'User registered successfully' });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({ session: { access_token: token, user: userWithoutPassword } });
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get(`SELECT id, email, display_name, created_at FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// ==========================================
// QUERIES ENDPOINTS
// ==========================================

app.get('/api/queries', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM queries WHERE user_id = ? ORDER BY updated_at DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/queries', authenticateToken, (req, res) => {
  const { title, code, language, ai_response } = req.body;
  const id = uuidv4();

  db.run(
    `INSERT INTO queries (id, user_id, title, code, language, ai_response) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, title, code, language, ai_response],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Return the created query
      db.get(`SELECT * FROM queries WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
      });
    }
  );
});

app.put('/api/queries/:id', authenticateToken, (req, res) => {
  const { title, code, language, ai_response, is_favorite } = req.body;
  const { id } = req.params;

  // Build dynamic update query
  const updates = [];
  const values = [];

  if (title !== undefined) { updates.push('title = ?'); values.push(title); }
  if (code !== undefined) { updates.push('code = ?'); values.push(code); }
  if (language !== undefined) { updates.push('language = ?'); values.push(language); }
  if (ai_response !== undefined) { updates.push('ai_response = ?'); values.push(ai_response); }
  if (is_favorite !== undefined) { updates.push('is_favorite = ?'); values.push(is_favorite ? 1 : 0); }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  values.push(req.user.id); // Ensure user owns the query

  const sql = `UPDATE queries SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Query not found or unauthorized' });

    db.get(`SELECT * FROM queries WHERE id = ?`, [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

app.delete('/api/queries/:id', authenticateToken, (req, res) => {
  db.run(`DELETE FROM queries WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Query not found or unauthorized' });
    res.json({ message: 'Query deleted' });
  });
});

// ==========================================
// AI ENDPOINTS (Existing)
// ==========================================

// Analyze-code endpoint
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
      model: 'gemini-2.5-flash' // ¡Modelo actualizado!
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
      model: 'gemini-2.5-flash' // ¡Modelo actualizado!
    });

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

// Catch all handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor con SQLite y Gemini en http://localhost:${PORT}`);
});