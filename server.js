const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Database 
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'email_system',
    charset: 'utf8mb4'
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'violet-mail-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

//  connection
async function getDbConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.error('Connect failed mate:', error);
        throw error;
    }
}

//check if user is logged in
function isLoggedIn(req, res, next) {
    if (req.session.user_id) {
        next();
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
}

// POST /api/login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: 'Must have password and username!' });
    }

    try {
        const conn = await getDbConnection();
        const [results] = await conn.execute(`
            SELECT u.user_id, u.username, l.password_hash, l.last_login
            FROM user_info u
            JOIN login l ON u.user_id = l.user_id
            WHERE u.username = ?
        `, [username]);

        if (results.length > 0) {
            const user = results[0];
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (isValidPassword) {
                req.session.user_id = user.user_id;
                req.session.username = user.username;
                req.session.logged_in = true;

                await conn.execute(`
                    UPDATE login SET last_login = NOW() WHERE user_id = ?
                `, [user.user_id]);

                await conn.end();
                res.json({ 
                    success: true, 
                    user: { 
                        id: user.user_id, 
                        username: user.username,
                        last_login: user.last_login || 'This is the first time login'
                    }
                });
            } else {
                await conn.end();
                res.json({ success: false, message: 'Wrong password mate, think again!' });
            }
        } else {
            await conn.end();
            res.json({ success: false, message: 'No user found!' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Server error' });
    }
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.json({ success: false, message: 'Logout failed' });
        } else {
            res.json({ success: true, message: 'Logged out successfully' });
        }
    });
});

// GET /api/inbox
app.get('/api/inbox', isLoggedIn, async (req, res) => {
    try {
        const conn = await getDbConnection();
        const [results] = await conn.execute(`
            SELECT e.*, u.username as sender_name
            FROM emails e
            JOIN user_info u ON e.sender_id = u.user_id
            WHERE e.recipient_id = ?
            ORDER BY e.sent_time DESC
        `, [req.session.user_id]);

        await conn.end();
        res.json({ emails: results });
    } catch (error) {
        console.error('Inbox error:', error);
        res.json({ error: 'Failed to load inbox' });
    }
});

// GET /api/sent
app.get('/api/sent', isLoggedIn, async (req, res) => {
    try {
        const conn = await getDbConnection();
        const [results] = await conn.execute(`
            SELECT e.*, u.username as recipient_name
            FROM emails e
            JOIN user_info u ON e.recipient_id = u.user_id
            WHERE e.sender_id = ?
            ORDER BY e.sent_time DESC
        `, [req.session.user_id]);

        await conn.end();
        res.json({ emails: results });
    } catch (error) {
        console.error('Sent emails error:', error);
        res.json({ error: 'Failed to load sent emails' });
    }
});

// POST /api/send-email
app.post('/api/send-email', isLoggedIn, async (req, res) => {
    const { recipient, subject, message } = req.body;

    if (!recipient || !subject || !message) {
        return res.json({ success: false, message: 'Text Needed!' });
    }

    try {
        const conn = await getDbConnection();
        
        const [recipientResults] = await conn.execute(`
            SELECT user_id FROM user_info WHERE username = ?
        `, [recipient]);

        if (recipientResults.length === 0) {
            await conn.end();
            return res.json({ success: false, message: 'Cannot find receiver mate' });
        }

        const recipient_id = recipientResults[0].user_id;

        await conn.execute(`
            INSERT INTO emails (sender_id, recipient_id, subject, body)
            VALUES (?, ?, ?, ?)
        `, [req.session.user_id, recipient_id, subject, message]);

        await conn.end();
        res.json({ success: true, message: 'Send Successful' });
    } catch (error) {
        console.error('Send email error:', error);
        res.json({ success: false, message: 'Fail to Send Email: ' + error.message });
    }
});

// GET /api/check-emails
app.get('/api/check-emails', isLoggedIn, async (req, res) => {
    try {
        const last_check = req.session.last_email_check;
        
        if (!last_check) {
            req.session.last_email_check = new Date().toISOString();
            return res.json({ hasNewEmails: false });
        }

        const conn = await getDbConnection();
        const [results] = await conn.execute(`
            SELECT COUNT(*) as count FROM emails
            WHERE recipient_id = ? AND sent_time > ?
        `, [req.session.user_id, last_check]);

        const hasNewEmails = results[0].count > 0;
        req.session.last_email_check = new Date().toISOString();

        await conn.end();
        res.json({ hasNewEmails });
    } catch (error) {
        console.error('Check emails error:', error);
        res.json({ hasNewEmails: false });
    }
});

// GET /api/email/:id
app.get('/api/email/:id', isLoggedIn, async (req, res) => {
    const email_id = req.params.id;
    
    try {
        const conn = await getDbConnection();
        const [results] = await conn.execute(`
            SELECT e.*, 
                   sender.username as sender_name, 
                   recipient.username as recipient_name
            FROM emails e
            JOIN user_info sender ON e.sender_id = sender.user_id
            JOIN user_info recipient ON e.recipient_id = recipient.user_id
            WHERE e.email_id = ? AND (e.sender_id = ? OR e.recipient_id = ?)
        `, [email_id, req.session.user_id, req.session.user_id]);

        if (results.length === 0) {
            await conn.end();
            return res.json({ error: 'Email not found' });
        }

        const email = results[0];

        if (email.recipient_id == req.session.user_id && email.is_read == 0) {
            await conn.execute(`
                UPDATE emails SET is_read = 1 WHERE email_id = ?
            `, [email_id]);
        }

        await conn.end();
        res.json({ email });
    } catch (error) {
        console.error('Get email error:', error);
        res.json({ error: 'Failed to load email' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Violet Mail server running on http://localhost:${PORT}`);
});