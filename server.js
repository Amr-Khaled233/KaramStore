require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const path     = require('path');
const dns      = require('dns');

// Local-only DNS fix for Atlas SRV lookup (harmless, skipped on Vercel)
if (!process.env.VERCEL) {
    try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}
}

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ============================================================
   MONGODB CONNECTION (serverless-safe, cached)
============================================================ */
let cached = global._ksMongoose;
if (!cached) cached = global._ksMongoose = { conn: null, promise: null };

async function connectDB() {
    if (cached.conn) return cached.conn;
    if (!process.env.MONGODB_URI) {
        throw new Error('متغيّر MONGODB_URI مش موجود في إعدادات السيرفر');
    }
    if (!cached.promise) {
        cached.promise = mongoose
            .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
            .then(m => { console.log('✅  MongoDB متصل'); return m; })
            .catch(err => { cached.promise = null; throw err; });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

// تأكد من الاتصال قبل أي عملية على قاعدة البيانات
async function dbGuard(req, res, next) {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('❌  MongoDB:', err.message);
        res.status(503).json({ error: 'قاعدة البيانات مش متصلة — تأكد من إعدادات MONGODB_URI' });
    }
}

/* ============================================================
   SCHEMAS
============================================================ */
const entrySchema = new mongoose.Schema({
    name:       { type: String, required: true },
    amount:     { type: Number, required: true },
    notes:      { type: String, default: '' },
    monthKey:   { type: String, required: true, index: true },
    monthLabel: String,
    entryDate:  String,
    dayName:    String,
    date:       String,
    time:       String,
}, { timestamps: true });

const Expense = mongoose.model('Expense', entrySchema);
const Revenue = mongoose.model('Revenue', entrySchema);

/* ============================================================
   GENERIC CRUD ROUTER
============================================================ */
function crudRouter(Model) {
    const r = express.Router();

    // GET ?month=2026-05
    r.get('/', async (req, res) => {
        try {
            const filter = req.query.month ? { monthKey: req.query.month } : {};
            const items  = await Model.find(filter).sort({ createdAt: -1 });
            res.json(items);
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    // POST
    r.post('/', async (req, res) => {
        try {
            const item = await Model.create(req.body);
            res.status(201).json(item);
        } catch (e) { res.status(400).json({ error: e.message }); }
    });

    // PUT /:id
    r.put('/:id', async (req, res) => {
        try {
            const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!item) return res.status(404).json({ error: 'العنصر مش موجود' });
            res.json(item);
        } catch (e) { res.status(400).json({ error: e.message }); }
    });

    // DELETE /:id
    r.delete('/:id', async (req, res) => {
        try {
            await Model.findByIdAndDelete(req.params.id);
            res.json({ ok: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    return r;
}

app.use('/api/expenses', dbGuard, crudRouter(Expense));
app.use('/api/revenue',  dbGuard, crudRouter(Revenue));

/* ============================================================
   SUMMARY — كل الأشهر
============================================================ */
app.get('/api/summary', dbGuard, async (req, res) => {
    try {
        const [exp, rev] = await Promise.all([
            Expense.aggregate([
                { $group: { _id: '$monthKey', label: { $first: '$monthLabel' }, total: { $sum: '$amount' } } },
            ]),
            Revenue.aggregate([
                { $group: { _id: '$monthKey', label: { $first: '$monthLabel' }, total: { $sum: '$amount' } } },
            ]),
        ]);

        const map = {};
        exp.forEach(e => { map[e._id] = { key: e._id, label: e.label, expenses: e.total, revenue: 0 }; });
        rev.forEach(r => {
            if (!map[r._id]) map[r._id] = { key: r._id, label: r.label, expenses: 0, revenue: 0 };
            map[r._id].revenue = r.total;
        });

        const result = Object.values(map)
            .map(m => ({ ...m, profit: m.revenue - m.expenses }))
            .sort((a, b) => b.key.localeCompare(a.key));

        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ============================================================
   AUTH
============================================================ */
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

/* ============================================================
   START (local only)
============================================================ */
if (require.main === module) {
    connectDB().catch(err => console.error('❌  MongoDB:', err.message));
    const server = app.listen(PORT, () => {
        console.log(`\n🏪  KaramStore على: http://localhost:${PORT}\n`);
    });
    server.on('error', err => {
        if (err.code === 'EADDRINUSE')
            console.error(`\n❌  البورت ${PORT} مشغول. شغّل: npx kill-port ${PORT}\n`);
        else console.error(err);
        process.exit(1);
    });
}

module.exports = app;
