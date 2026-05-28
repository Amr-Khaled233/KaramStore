const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const DAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS_AR = ['يناير','فبراير','مارس','إبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function nowEG() {
    const d = new Date();
    const h = d.getHours(), m = d.getMinutes();
    const h12 = h % 12 || 12;
    const lang = localStorage.getItem('ks-lang') || 'ar';
    const DAYS = lang === 'ar' ? DAYS_AR : DAYS_EN;
    const MONTHS = lang === 'ar' ? MONTHS_AR : MONTHS_EN;
    return {
        dayName:    DAYS[d.getDay()],
        date:       `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        time:       `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${h >= 12 ? 'م' : 'ص'}`,
        monthKey:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
        monthLabel: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    };
}

/* ---- Expenses (المصروفات) ---- */
function getExpenses()      { return JSON.parse(localStorage.getItem('ks-purchases') || '[]'); }
function _saveExpenses(l)   { localStorage.setItem('ks-purchases', JSON.stringify(l)); }
function addExpense(e)      { const l = getExpenses(); l.unshift(e); _saveExpenses(l); }
function removeExpense(id)  { _saveExpenses(getExpenses().filter(x => x.id !== id)); }
function updateExpense(id, upd) {
    _saveExpenses(getExpenses().map(x => x.id === id ? { ...x, ...upd } : x));
}

/* ---- Revenue (الإيرادات) ---- */
function getRevenue()       { return JSON.parse(localStorage.getItem('ks-operations') || '[]'); }
function _saveRevenue(l)    { localStorage.setItem('ks-operations', JSON.stringify(l)); }
function addRevenue(r)      { const l = getRevenue(); l.unshift(r); _saveRevenue(l); }
function removeRevenue(id)  { _saveRevenue(getRevenue().filter(x => x.id !== id)); }
function updateRevenue(id, upd) {
    _saveRevenue(getRevenue().map(x => x.id === id ? { ...x, ...upd } : x));
}

/* ---- Summary ---- */
function getSummary() {
    const exp = getExpenses(), rev = getRevenue();
    const { monthKey } = nowEG();
    const totalExp   = exp.reduce((s, e) => s + e.amount, 0);
    const totalRev   = rev.reduce((s, r) => s + r.amount, 0);
    const monthExp   = exp.filter(e => e.monthKey === monthKey).reduce((s, e) => s + e.amount, 0);
    const monthRev   = rev.filter(r => r.monthKey === monthKey).reduce((s, r) => s + r.amount, 0);
    return {
        totalExp, totalRev,
        netProfit:   totalRev - totalExp,
        monthExp, monthRev,
        monthProfit: monthRev - monthExp,
    };
}

/* ---- Monthly breakdown ---- */
function getMonthlyData() {
    const map = {};
    getExpenses().forEach(e => {
        if (!map[e.monthKey]) map[e.monthKey] = { label: e.monthLabel, exp: 0, rev: 0 };
        map[e.monthKey].exp += e.amount;
    });
    getRevenue().forEach(r => {
        if (!map[r.monthKey]) map[r.monthKey] = { label: r.monthLabel, exp: 0, rev: 0 };
        map[r.monthKey].rev += r.amount;
    });
    return Object.entries(map)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([key, d]) => ({ key, ...d, profit: d.rev - d.exp }));
}
