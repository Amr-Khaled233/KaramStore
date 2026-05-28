require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', (req, res) => {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ ok: false, error: 'كلمة السر مطلوبة' });
    if (password === process.env.PASSWORD) return res.json({ ok: true });
    res.status(401).json({ ok: false, error: 'كلمة السر غلط، حاول تاني' });
});

app.get('/dashboard.html', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname, 'public', 'login.html')));

// Local dev: start listening
if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log(`\n🏪  KaramStore شغال على: http://localhost:${PORT}\n`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n❌  البورت ${PORT} مشغول.\n   شغّل: npx kill-port ${PORT}\n`);
        } else {
            console.error(err);
        }
        process.exit(1);
    });
}

// Vercel: export as handler
module.exports = app;
