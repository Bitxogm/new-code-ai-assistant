// backend/server.ts

import express from 'express';
import cors from 'cors';
import { testConnection } from './db'; 

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(express.json());
app.use(cors()); 

// Rutas (Endpoints)
app.get('/', (req, res) => {
    res.status(200).send('Backend del Agente de Refactorización Activo. 🚀');
});

// Aquí pondremos la ruta /api/analyze-code

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en http://localhost:${PORT}`);

    // Probar la conexión a la base de datos al inicio
    testConnection();
});