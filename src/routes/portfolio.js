const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Portfolio landing page
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const userId = req.session.user.user_id;
    const query = 'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC';

    db.query(query, [userId], (err, results) => {
        if (err) throw err;

        const projectsFromDb = results.map((row) => ({
            title: row.title,
            is_completed: !!row.is_completed,
            created_at: row.created_at ? new Date(row.created_at) : null
        }));

        const fallbackProjects = [
            { title: '길맛 (2025.09~)', is_completed: false, created_at: null },
            { title: 'UI 실험 스터디', is_completed: true, created_at: null },
            { title: '포트폴리오 리디자인', is_completed: false, created_at: null }
        ];

        res.render('portfolio', {
            title: 'Portfolio',
            user: req.session.user,
            projects: projectsFromDb.length ? projectsFromDb : fallbackProjects,
            skills: ['React', 'UI Design', 'JavaScript', 'GitHub', 'Node.js'],
            contactLinks: {
                github: 'https://github.com/choejeonghui',
                blog: 'https://example.com'
            }
        });
    });
});

// Add project (stored in todos table)
router.post('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const userId = req.session.user.user_id;
    const { title } = req.body;
    const query = 'INSERT INTO todos (user_id, title) VALUES (?, ?)';
    db.query(query, [userId, title], (err, results) => {
        if (err) throw err;
        res.redirect('/portfolio');
    });
});

// Update project
router.post('/update/:id', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const { id } = req.params;
    const { is_completed } = req.body;
    const query = 'UPDATE todos SET is_completed = ? WHERE todo_id = ? AND user_id = ?';
    db.query(query, [is_completed === 'true', id, req.session.user.user_id], (err, results) => {
        if (err) throw err;
        res.redirect('/portfolio');
    });
});

// Delete project
router.get('/delete/:id', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const { id } = req.params;
    const query = 'DELETE FROM todos WHERE todo_id = ? AND user_id = ?';
    db.query(query, [id, req.session.user.user_id], (err, results) => {
        if (err) throw err;
        res.redirect('/portfolio');
    });
});

module.exports = router;
