const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 🔒 항상 이 유저의 포트폴리오를 보여줄 사용자 ID (예: 6번 유저)
const FIXED_USER_ID = 6;

// Portfolio landing page
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    // ✅ 로그인한 사람이 누구든 간에, 조회는 무조건 6번 유저 기준
    const userId = FIXED_USER_ID;

    const projectsQuery =
        'SELECT project_id, title, status, created_at FROM projects WHERE user_id = ? ORDER BY created_at DESC';
    const educationQuery =
        'SELECT institution, detail, period FROM education WHERE user_id = ? ORDER BY sort_order DESC, created_at DESC';
    const skillsQuery =
        'SELECT name FROM skills WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC';
    const contactsQuery =
        'SELECT label, value, url FROM contacts WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC';

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
                        created_at: row.created_at ? new Date(row.created_at) : null,
                    }));

                    const education = eduRows.map((row) => ({
                        institution: row.institution,
                        detail: row.detail,
                        period: row.period,
                    }));

                    const skills = skillRows.map((row) => row.name);

                    const contacts = contactRows.map((row) => ({
                        label: row.label,
                        value: row.value,
                        url: row.url,
                    }));

                    res.render('portfolio', {
                        title: 'Portfolio',
                        user: req.session.user,   // 로그인한 사람 정보는 그대로 뷰에 전달
                        projects,
                        education,
                        skills,
                        contacts,
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

    // ✅ 새 프로젝트도 항상 user_id = 6으로 저장
    const userId = FIXED_USER_ID;
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
    const status = is_completed === 'true' ? 'completed' : 'in_progress';

    // ✅ 수정 대상도 항상 user_id = 6의 프로젝트만
    const query = 'UPDATE projects SET status = ? WHERE project_id = ? AND user_id = ?';
    db.query(query, [status, id, FIXED_USER_ID], (err) => {
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

    // ✅ 삭제도 항상 user_id = 6인 프로젝트만
    const query = 'DELETE FROM projects WHERE project_id = ? AND user_id = ?';
    db.query(query, [id, FIXED_USER_ID], (err) => {
        if (err) throw err;
        res.redirect('/portfolio');
    });
});

module.exports = router;