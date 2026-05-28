checkAuth();

/* ============================================================
   SETTINGS — Language & Theme
============================================================ */
let LANG  = localStorage.getItem('ks-lang')  || 'ar';
let THEME = localStorage.getItem('ks-theme') || 'gold';

const STR = {
  ar: {
    summary:'الملخص', expenses:'المصروفات', revenue:'الإيرادات',
    totalExp:'إجمالي المصروفات', totalRev:'إجمالي الإيرادات',
    netResult:'النتيجة الكلية', thisMonth:'هذا الشهر',
    mExp:'مصروفات الشهر', mRev:'إيرادات الشهر', mResult:'نتيجة الشهر',
    addExp:'+ إضافة مصروف', addRev:'+ إضافة إيراد',
    editExp:'تعديل المصروف', editRev:'تعديل الإيراد',
    addExpTitle:'إضافة مصروف جديد', addRevTitle:'إضافة إيراد جديد',
    monthlyDetails:'تفاصيل كل شهر',
    profit:'🟢 ربح', loss:'🔴 خسارة', zero:'⚪ تعادل',
    col_month:'الشهر', col_exp:'المصروفات', col_rev:'الإيرادات', col_profit:'الربح / الخسارة',
    col_num:'#', col_name:'الاسم / الوصف', col_amount:'المبلغ', col_day:'اليوم', col_dt:'التاريخ والوقت',
    lbl_name:'الاسم / الوصف *', lbl_amount:'المبلغ (ج) *', lbl_notes:'ملاحظات',
    ph_name_exp:'مثال: ورق A4، حبر...', ph_name_rev:'مثال: بيع ورق، شغل طباعة...',
    ph_amount:'0.00', ph_notes:'أي تفاصيل...',
    btn_save:'✓ حفظ', btn_cancel:'إلغاء', btn_edit:'تعديل', btn_delete:'حذف',
    totalExpLbl:'إجمالي المصروفات:', totalRevLbl:'إجمالي الإيرادات:',
    noData:'لا يوجد بيانات بعد', logout:'تسجيل الخروج',
    confirmDel:'هتحذف هذا العنصر؟',
    currency:'ج', settings:'الإعدادات', langLabel:'اللغة', themeLabel:'لون التطبيق',
    themes:{ gold:'ذهبي', blue:'أزرق', purple:'بنفسجي', teal:'فيروزي' },
  },
  en: {
    summary:'Summary', expenses:'Expenses', revenue:'Revenue',
    totalExp:'Total Expenses', totalRev:'Total Revenue',
    netResult:'Net Result', thisMonth:'This Month',
    mExp:'Month Expenses', mRev:'Month Revenue', mResult:'Month Result',
    addExp:'+ Add Expense', addRev:'+ Add Revenue',
    editExp:'Edit Expense', editRev:'Edit Revenue',
    addExpTitle:'New Expense', addRevTitle:'New Revenue',
    monthlyDetails:'Monthly Details',
    profit:'🟢 Profit', loss:'🔴 Loss', zero:'⚪ Break Even',
    col_month:'Month', col_exp:'Expenses', col_rev:'Revenue', col_profit:'Profit / Loss',
    col_num:'#', col_name:'Name / Description', col_amount:'Amount', col_day:'Day', col_dt:'Date & Time',
    lbl_name:'Name / Description *', lbl_amount:'Amount (EGP) *', lbl_notes:'Notes',
    ph_name_exp:'e.g. A4 Paper, Ink...', ph_name_rev:'e.g. Sold paper, Print job...',
    ph_amount:'0.00', ph_notes:'Any details...',
    btn_save:'✓ Save', btn_cancel:'Cancel', btn_edit:'Edit', btn_delete:'Delete',
    totalExpLbl:'Total Expenses:', totalRevLbl:'Total Revenue:',
    noData:'No data yet', logout:'Logout',
    confirmDel:'Delete this item?',
    currency:'EGP', settings:'Settings', langLabel:'Language', themeLabel:'App Color',
    themes:{ gold:'Gold', blue:'Blue', purple:'Purple', teal:'Teal' },
  }
};

function T(key) { return (STR[LANG] || STR.ar)[key] || key; }

function setLang(lang) {
    LANG = lang;
    localStorage.setItem('ks-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    applyI18n();
    renderAll();
}

function setTheme(theme) {
    THEME = theme;
    localStorage.setItem('ks-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.theme === theme));
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === LANG));
}

function applyI18n() {
    // Nav
    setText('nav-summary',  T('summary'));
    setText('nav-expenses', T('expenses'));
    setText('nav-revenue',  T('revenue'));
    setText('bnav-summary',  T('summary'));
    setText('bnav-expenses', T('expenses'));
    setText('bnav-revenue',  T('revenue'));
    // Sidebar footer
    setText('logout-text', T('logout'));
    setText('settings-lbl', T('settings'));
    setText('lang-label',   T('langLabel'));
    setText('theme-label',  T('themeLabel'));
    // Theme labels
    ['gold','blue','purple','teal'].forEach(th => {
        const el = document.getElementById('theme-lbl-' + th);
        if (el) el.textContent = T('themes')[th];
    });
    // Highlight active lang/theme buttons
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === LANG));
    document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s.dataset.theme === THEME));
}

/* ============================================================
   INIT
============================================================ */
document.documentElement.setAttribute('data-theme', THEME);
document.documentElement.setAttribute('lang', LANG);
document.documentElement.setAttribute('dir', LANG === 'ar' ? 'rtl' : 'ltr');

let currentView = 'home';

function renderAll() {
    if (currentView === 'home')     renderHome();
    if (currentView === 'expenses') renderExpenses();
    if (currentView === 'revenue')  renderRevenue();
}

/* ============================================================
   DATETIME
============================================================ */
function tickTime() {
    const dt = nowEG();
    const el = document.getElementById('sidebar-time');
    if (el) el.innerHTML = `<strong>${dt.dayName}</strong>  ${dt.date}<br>⏰  ${dt.time}`;
}
setInterval(tickTime, 1000);
tickTime();

/* ============================================================
   VIEW ROUTER
============================================================ */
function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + name).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${name}"]`)?.classList.add('active');
    document.querySelectorAll('.bnav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.bnav-item[data-view="${name}"]`)?.classList.add('active');
    currentView = name;
    closeSidebar();
    window.scrollTo(0, 0);
    if (name === 'home')     renderHome();
    if (name === 'expenses') renderExpenses();
    if (name === 'revenue')  renderRevenue();
}

/* ============================================================
   SIDEBAR
============================================================ */
function toggleSidebar() {
    const s = document.getElementById('sidebar');
    const o = document.getElementById('sidebar-overlay');
    const b = document.querySelector('.menu-btn');
    const open = s.classList.toggle('open');
    o.classList.toggle('show', open);
    b?.classList.toggle('open', open);
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('show');
    document.querySelector('.menu-btn')?.classList.remove('open');
}

/* ============================================================
   MODALS
============================================================ */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function overlayClick(e, id) { if (e.target.id === id) closeModal(id); }
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

/* ============================================================
   TOAST
============================================================ */
let _t;
function toast(msg, isErr = false) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.toggle('err', isErr);
    el.classList.add('show');
    clearTimeout(_t);
    _t = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ============================================================
   UTILS
============================================================ */
function clearFields(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }
function setText(id, v)   { const el = document.getElementById(id); if (el) el.textContent = v; }
function fmtMoney(n) {
    const abs = Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${abs} ${T('currency')}`;
}

function emptyRow(icon, cols) {
    return `<tr><td colspan="${cols}"><div class="empty"><div class="ei">${icon}</div><p>${T('noData')}</p></div></td></tr>`;
}

/* ============================================================
   EXPENSES — Add / Edit / Delete
============================================================ */
let _editExpId = null;

function openAddExpense() {
    _editExpId = null;
    clearFields(['exp-name','exp-amount','exp-notes']);
    setText('modal-exp-title', T('addExpTitle'));
    setText('modal-exp-btn',   T('btn_save'));
    document.getElementById('exp-name').placeholder   = T('ph_name_exp');
    document.getElementById('exp-amount').placeholder = T('ph_amount');
    document.getElementById('exp-notes').placeholder  = T('ph_notes');
    openModal('modal-expense');
    setTimeout(() => document.getElementById('exp-name').focus(), 100);
}

function openEditExpense(id) {
    const item = getExpenses().find(e => e.id === id);
    if (!item) return;
    _editExpId = id;
    document.getElementById('exp-name').value   = item.name;
    document.getElementById('exp-amount').value = item.amount;
    document.getElementById('exp-notes').value  = item.notes || '';
    setText('modal-exp-title', T('editExp'));
    setText('modal-exp-btn',   T('btn_save'));
    openModal('modal-expense');
    setTimeout(() => document.getElementById('exp-name').focus(), 100);
}

function submitExpense() {
    const name   = document.getElementById('exp-name').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
    const notes  = document.getElementById('exp-notes').value.trim();
    if (!name)       { toast(T('lbl_name').replace(' *',''), true); return; }
    if (amount <= 0) { toast(T('lbl_amount').replace(' *',''), true); return; }

    if (_editExpId) {
        updateExpense(_editExpId, { name, amount, notes });
        toast(`✓ ${T('editExp')}`);
    } else {
        addExpense({ id: Date.now(), name, amount, notes, ...nowEG() });
        toast(`✓ ${name} — ${fmtMoney(amount)}`);
    }
    _editExpId = null;
    closeModal('modal-expense');
    clearFields(['exp-name','exp-amount','exp-notes']);
    renderHome();
    if (currentView === 'expenses') renderExpenses();
}

function deleteExpense(id) {
    if (!confirm(T('confirmDel'))) return;
    removeExpense(id);
    toast(T('btn_delete'));
    renderHome();
    renderExpenses();
}

/* ============================================================
   REVENUE — Add / Edit / Delete
============================================================ */
let _editRevId = null;

function openAddRevenue() {
    _editRevId = null;
    clearFields(['rev-name','rev-amount','rev-notes']);
    setText('modal-rev-title', T('addRevTitle'));
    setText('modal-rev-btn',   T('btn_save'));
    document.getElementById('rev-name').placeholder   = T('ph_name_rev');
    document.getElementById('rev-amount').placeholder = T('ph_amount');
    document.getElementById('rev-notes').placeholder  = T('ph_notes');
    openModal('modal-revenue');
    setTimeout(() => document.getElementById('rev-name').focus(), 100);
}

function openEditRevenue(id) {
    const item = getRevenue().find(r => r.id === id);
    if (!item) return;
    _editRevId = id;
    document.getElementById('rev-name').value   = item.name || item.desc || '';
    document.getElementById('rev-amount').value = item.amount;
    document.getElementById('rev-notes').value  = item.notes || '';
    setText('modal-rev-title', T('editRev'));
    setText('modal-rev-btn',   T('btn_save'));
    openModal('modal-revenue');
    setTimeout(() => document.getElementById('rev-name').focus(), 100);
}

function submitRevenue() {
    const name   = document.getElementById('rev-name').value.trim();
    const amount = parseFloat(document.getElementById('rev-amount').value) || 0;
    const notes  = document.getElementById('rev-notes').value.trim();
    if (!name)       { toast(T('lbl_name').replace(' *',''), true); return; }
    if (amount <= 0) { toast(T('lbl_amount').replace(' *',''), true); return; }

    if (_editRevId) {
        updateRevenue(_editRevId, { name, amount, notes });
        toast(`✓ ${T('editRev')}`);
    } else {
        addRevenue({ id: Date.now(), name, desc: name, amount, notes, ...nowEG() });
        toast(`✓ ${name} — ${fmtMoney(amount)}`);
    }
    _editRevId = null;
    closeModal('modal-revenue');
    clearFields(['rev-name','rev-amount','rev-notes']);
    renderHome();
    if (currentView === 'revenue') renderRevenue();
}

function deleteRevenue(id) {
    if (!confirm(T('confirmDel'))) return;
    removeRevenue(id);
    toast(T('btn_delete'));
    renderHome();
    renderRevenue();
}

/* ============================================================
   HOME VIEW
============================================================ */
function renderHome() {
    const s = getSummary();

    setText('h-total-exp', fmtMoney(s.totalExp));
    setText('h-total-rev', fmtMoney(s.totalRev));
    setText('h-m-exp', fmtMoney(s.monthExp));
    setText('h-m-rev', fmtMoney(s.monthRev));

    // Big profit/loss card
    const card = document.getElementById('profit-card');
    if (card) {
        const p = s.netProfit;
        const mp = s.monthProfit;
        card.className = 'profit-card ' + (p > 0 ? 'is-profit' : p < 0 ? 'is-loss' : 'is-zero');
        card.innerHTML = `
            <div class="pc-main">
                <div class="pc-icon">${p > 0 ? '📈' : p < 0 ? '📉' : '➖'}</div>
                <div class="pc-info">
                    <div class="pc-label">${p > 0 ? T('profit') : p < 0 ? T('loss') : T('zero')}</div>
                    <div class="pc-amount">${p >= 0 ? '+' : ''}${fmtMoney(p)}</div>
                </div>
            </div>
            <div class="pc-sub">${T('thisMonth')}: ${mp >= 0 ? '+' : ''}${fmtMoney(mp)}</div>
        `;
    }

    // Month label cards
    setText('h-m-exp-lbl', T('mExp'));
    setText('h-m-rev-lbl', T('mRev'));

    // Labels
    setText('h-exp-lbl', T('totalExp'));
    setText('h-rev-lbl', T('totalRev'));
    setText('h-this-month', T('thisMonth'));
    setText('h-monthly-title', T('monthlyDetails'));

    renderMonthlyTable();
}

function renderMonthlyTable() {
    const tbody = document.getElementById('monthly-body');
    if (!tbody) return;
    // Update headers
    setText('th-month',  T('col_month'));
    setText('th-exp',    T('col_exp'));
    setText('th-rev',    T('col_rev'));
    setText('th-profit', T('col_profit'));

    const data = getMonthlyData();
    if (!data.length) { tbody.innerHTML = emptyRow('📅', 4); return; }
    tbody.innerHTML = data.map(d => `
        <tr>
            <td><strong>${d.label}</strong></td>
            <td style="color:var(--red)">${fmtMoney(d.exp)}</td>
            <td style="color:var(--green)">${fmtMoney(d.rev)}</td>
            <td class="${d.profit > 0 ? 'profit-pos' : d.profit < 0 ? 'profit-neg' : ''}" style="font-weight:700">
                ${d.profit >= 0 ? '+' : ''}${fmtMoney(d.profit)}
            </td>
        </tr>
    `).join('');
}

/* ============================================================
   EXPENSES VIEW
============================================================ */
function renderExpenses() {
    // Labels
    setText('pu-add-btn',   T('addExp'));
    setText('pu-page-title', T('expenses'));
    setText('pu-total-lbl', T('totalExpLbl'));

    const tbody = document.getElementById('exp-body');
    if (!tbody) return;
    const items = getExpenses();

    setText('exp-total', fmtMoney(items.reduce((s, e) => s + e.amount, 0)));

    if (!items.length) { tbody.innerHTML = emptyRow('🛒', 6); return; }
    tbody.innerHTML = items.map((e, i) => `
        <tr>
            <td style="color:var(--text3)">${i+1}</td>
            <td>
                <strong>${e.name}</strong>
                ${e.notes ? `<div style="font-size:11px;color:var(--text2);margin-top:2px">${e.notes}</div>` : ''}
            </td>
            <td style="color:var(--red);font-weight:700">${fmtMoney(e.amount)}</td>
            <td style="color:var(--gold)">${e.dayName}</td>
            <td style="font-size:12px;white-space:nowrap">${e.date} — ${e.time}</td>
            <td>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-edit btn-sm" onclick="openEditExpense(${e.id})">${T('btn_edit')}</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense(${e.id})">${T('btn_delete')}</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/* ============================================================
   REVENUE VIEW
============================================================ */
function renderRevenue() {
    // Labels
    setText('rev-add-btn',   T('addRev'));
    setText('rev-page-title', T('revenue'));
    setText('rev-total-lbl', T('totalRevLbl'));

    const tbody = document.getElementById('rev-body');
    if (!tbody) return;
    const items = getRevenue();

    setText('rev-total', fmtMoney(items.reduce((s, r) => s + r.amount, 0)));

    if (!items.length) { tbody.innerHTML = emptyRow('💵', 6); return; }
    tbody.innerHTML = items.map((r, i) => `
        <tr>
            <td style="color:var(--text3)">${i+1}</td>
            <td>
                <strong>${r.name || r.desc}</strong>
                ${r.notes ? `<div style="font-size:11px;color:var(--text2);margin-top:2px">${r.notes}</div>` : ''}
            </td>
            <td style="color:var(--green);font-weight:700">${fmtMoney(r.amount)}</td>
            <td style="color:var(--gold)">${r.dayName}</td>
            <td style="font-size:12px;white-space:nowrap">${r.date} — ${r.time}</td>
            <td>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-edit btn-sm" onclick="openEditRevenue(${r.id})">${T('btn_edit')}</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRevenue(${r.id})">${T('btn_delete')}</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/* ---- Init ---- */
applyI18n();
renderHome();
