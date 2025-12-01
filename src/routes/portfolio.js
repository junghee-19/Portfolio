const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Portfolio landing page
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const userId = req.session.user.user_id;

    const projectsQuery = 'SELECT project_id, title, status, created_at FROM projects WHERE user_id = ? ORDER BY created_at DESC';
    const educationQuery = 'SELECT institution, detail, period FROM education WHERE user_id = ? ORDER BY sort_order DESC, created_at DESC';
    const skillsQuery = 'SELECT name FROM skills WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC';
    const contactsQuery = 'SELECT label, value, url FROM contacts WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC';

    db.query(projectsQuery, [userId], (err, projectRows) => {
        if (err) throw err;

        db.query(educationQuery, [userId], (eduErr, eduRows) => {
            if (eduErr) throw eduErr;

            db.query(skillsQuery, [userId], (skillErr, skillRows) => {
                if (skillErr) throw skillErr;

                db.query(contactsQuery, [userId], (contactErr, contactRows) => {
                    if (contactErr) throw contactErr;

                    const projects = projectRows.map((row) => ({
                        id: row.project_id,
                        title: row.title,
                        is_completed: row.status === 'completed',
                        created_at: row.created_at ? new Date(row.created_at) : null
                    }));

                    const education = eduRows.map((row) => ({
                        institution: row.institution,
                        detail: row.detail,
                        period: row.period
                    }));

                    const skills = skillRows.map((row) => row.name);

                    const contacts = contactRows.map((row) => ({
                        label: row.label,
                        value: row.value,
                        url: row.url
                    }));

                    res.render('portfolio', {
                        title: 'Portfolio',
                        user: req.session.user,
                        projects,
                        education,
                        skills,
                        contacts
                    });
                });
            });
        });
    });
});

// Add project
router.post('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const userId = req.session.user.user_id;
    const { title, status } = req.body;
    const query = 'INSERT INTO projects (user_id, title, status) VALUES (?, ?, ?)';
    db.query(query, [userId, title, status || 'in_progress'], (err) => {
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
    const query = 'UPDATE projects SET status = ? WHERE project_id = ? AND user_id = ?';
    db.query(query, [is_completed === 'true' ? 'completed' : 'in_progress', id, req.session.user.user_id], (err) => {
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
    const query = 'DELETE FROM projects WHERE project_id = ? AND user_id = ?';
    db.query(query, [id, req.session.user.user_id], (err) => {
        if (err) throw err;
        res.redirect('/portfolio');
    });
});

module.exports = router;
