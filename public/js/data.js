const DAYS   = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const MONTHS = ['يناير','فبراير','مارس','إبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function nowEG() {
    const d = new Date();
    const h = d.getHours(), m = d.getMinutes();
    const h12 = h % 12 || 12;
    return {
        dayName:    DAYS[d.getDay()],
        date:       `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        time:       `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${h >= 12 ? 'م' : 'ص'}`,
        monthKey:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
        monthLabel: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    };
}

/* ---- Purchases (مشتريات / مصروفات) ---- */
function getPurchases()     { return JSON.parse(localStorage.getItem('ks-purchases') || '[]'); }
function savePurchases(l)   { localStorage.setItem('ks-purchases', JSON.stringify(l)); }
function addPurchase(p)     { const l = getPurchases(); l.unshift(p); savePurchases(l); }
function removePurchase(id) { savePurchases(getPurchases().filter(x => x.id !== id)); }

/* ---- Operations (عمليات / إيرادات) ---- */
function getOperations()     { return JSON.parse(localStorage.getItem('ks-operations') || '[]'); }
function saveOperations(l)   { localStorage.setItem('ks-operations', JSON.stringify(l)); }
function addOperation(o)     { const l = getOperations(); l.unshift(o); saveOperations(l); }
function removeOperation(id) { saveOperations(getOperations().filter(x => x.id !== id)); }

/* ---- Summary ---- */
function getSummary() {
    const purchases  = getPurchases();
    const operations = getOperations();
    const { monthKey } = nowEG();

    const totalExpenses    = purchases.reduce((s, p) => s + p.amount, 0);
    const totalRevenue     = operations.reduce((s, o) => s + o.amount, 0);
    const monthExpenses    = purchases.filter(p => p.monthKey === monthKey).reduce((s, p) => s + p.amount, 0);
    const monthRevenue     = operations.filter(o => o.monthKey === monthKey).reduce((s, o) => s + o.amount, 0);

    return {
        totalExpenses,
        totalRevenue,
        netProfit:    totalRevenue - totalExpenses,
        monthExpenses,
        monthRevenue,
        monthProfit:  monthRevenue - monthExpenses,
    };
}

/* ---- Monthly breakdown ---- */
function getMonthlyData() {
    const map = {};
    getPurchases().forEach(p => {
        if (!map[p.monthKey]) map[p.monthKey] = { label: p.monthLabel, expenses: 0, revenue: 0 };
        map[p.monthKey].expenses += p.amount;
    });
    getOperations().forEach(o => {
        if (!map[o.monthKey]) map[o.monthKey] = { label: o.monthLabel, expenses: 0, revenue: 0 };
        map[o.monthKey].revenue += o.amount;
    });
    return Object.entries(map)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([key, d]) => ({ key, ...d, profit: d.revenue - d.expenses }));
}
