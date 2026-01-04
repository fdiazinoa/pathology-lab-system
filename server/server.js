import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const { Client } = pg;

app.post('/api/test-db-connection', async (req, res) => {
    const { host, port, user, password, database } = req.body;

    if (!host || !user || !database) {
        return res.status(400).json({ success: false, message: 'Faltan datos de conexión requeridos.' });
    }

    const client = new Client({
        host,
        port: port || 5432,
        user,
        password,
        database,
        connectionTimeoutMillis: 5000, // 5s timeout
    });

    try {
        await client.connect();
        const result = await client.query('SELECT version()');
        await client.end();

        res.json({
            success: true,
            message: `Conexión exitosa: ${result.rows[0].version}`
        });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({
            success: false,
            message: `Error de conexión: ${err.message}`
        });
    }
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
