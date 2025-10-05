// backend/db.ts

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

export const query = (text: string, params: any[] = []) => {
    console.log('QUERY: ', text);
    return pool.query(text, params);
};

export const testConnection = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Conexión exitosa a PostgreSQL');
    } catch (err) {
        console.error('❌ Error de conexión a PostgreSQL:', err);
    }
};

export default pool;