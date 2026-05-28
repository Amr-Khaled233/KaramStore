/* =====================
   EGYPTIAN DATE/TIME
===================== */
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

/* =====================
   PRODUCTS CRUD
===================== */
function getProducts()     { return JSON.parse(localStorage.getItem('ks-products') || '[]'); }
function _saveProducts(l)  { localStorage.setItem('ks-products', JSON.stringify(l)); }
function addProduct(p)     { const l = getProducts(); l.unshift(p); _saveProducts(l); }
function removeProduct(id) { _saveProducts(getProducts().filter(p => p.id !== id)); }

/* =====================
   SALES CRUD
===================== */
function getSales()     { return JSON.parse(localStorage.getItem('ks-sales') || '[]'); }
function _saveSales(l)  { localStorage.setItem('ks-sales', JSON.stringify(l)); }
function addSale(s)     { const l = getSales(); l.unshift(s); _saveSales(l); }
function removeSale(id) { _saveSales(getSales().filter(s => s.id !== id)); }

/* =====================
   AGGREGATIONS
===================== */
function getMonthlyRevenue() {
    const map = {};
    getSales().forEach(s => {
        if (!map[s.monthKey]) map[s.monthKey] = { label: s.monthLabel, total: 0, count: 0 };
        map[s.monthKey].total += s.amount;
        map[s.monthKey].count++;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
}
