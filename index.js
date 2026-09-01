const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());


app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query(
            'SELECT u.id, u.full_name, u.email, u.role, u.university_id, un.name AS university_name FROM users u LEFT JOIN universities un ON u.university_id = un.id WHERE u.email = ? AND u.password = ?',
            [email, password]
        );
        if (users.length === 0) return res.status(401).json({ error: 'Неверный логин или пароль' });
        res.json({ user: users[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/university/:id/programs', async (req, res) => {
    try {
        const query = `
            SELECT ep.id, ep.title, ep.ege_requirements, ep.passing_score, ep.employment_rate, ep.profession_id,
                   p.title AS profession_title, p.required_competencies, p.average_salary
            FROM educational_programs ep
                     JOIN professions p ON ep.profession_id = p.id
            WHERE ep.university_id = ?
            ORDER BY ep.id DESC
        `;
        const [rows] = await db.query(query, [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/programs', async (req, res) => {
    const { university_id, profession_id, title, ege_requirements, passing_score, employment_rate } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO educational_programs (university_id, profession_id, title, ege_requirements, passing_score, employment_rate) VALUES (?, ?, ?, ?, ?, ?)',
            [university_id, profession_id, title, ege_requirements, passing_score, employment_rate || 85]
        );
        res.status(201).json({ id: result.insertId, message: 'Программа добавлена' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/programs/:id', async (req, res) => {
    const { profession_id, title, ege_requirements, passing_score, employment_rate } = req.body;
    try {
        await db.query(
            'UPDATE educational_programs SET profession_id = ?, title = ?, ege_requirements = ?, passing_score = ?, employment_rate = ? WHERE id = ?',
            [profession_id, title, ege_requirements, passing_score, employment_rate, req.params.id]
        );
        res.json({ message: 'Программа обновлена' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/programs/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM educational_programs WHERE id = ?', [req.params.id]);
        res.json({ message: 'Программа удалена' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/professions', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM professions');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});