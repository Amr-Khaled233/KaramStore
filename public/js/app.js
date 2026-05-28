checkAuth();

/* ============================================================
   I18N — Language only (no themes)
============================================================ */
let LANG = localStorage.getItem('ks-lang') || 'ar';

const STR = {
  ar: {
    summary:'الملخص', expenses:'المصروفات', revenue:'الإيرادات',
    dashboard:'لوحة التحكم', dashSub:'ملخص مصروفاتك وإيراداتك',
    totalExp:'إجمالي المصروفات', totalRev:'إجمالي الإيرادات',
    thisMonth:'هذا الشهر',
    mExp:'مصروفات الشهر', mRev:'إيرادات الشهر',
    profit:'🟢  ربح', loss:'🔴  خسارة', zero:'⚪  تعادل',
    topExp:'أكثر المصروفات', viewAll:'عرض الكل',
    monthlyDetails:'تفاصيل الأشهر',
    col_month:'الشهر', col_exp:'مصروفات', col_rev:'إيرادات', col_result:'النتيجة',
    col_num:'#', col_name:'الاسم / الوصف', col_amount:'المبلغ', col_day:'اليوم', col_dt:'التاريخ والوقت',
    addExpTitle:'إضافة مصروف', addRevTitle:'إضافة إيراد',
    editExp:'تعديل المصروف', editRev:'تعديل الإيراد',
    lbl_name:'الاسم / الوصف *', lbl_amount:'المبلغ (ج) *', lbl_notes:'ملاحظات',
    ph_exp:'مثال: ورق A4، حبر طابعة...', ph_rev:'مثال: بيع ورق، شغل طباعة...',
    btn_save:'✓ حفظ', btn_cancel:'إلغاء', btn_edit:'تعديل', btn_delete:'حذف',
    totalExpLbl:'إجمالي المصروفات:', totalRevLbl:'إجمالي الإيرادات:',
    addExpShort:'+ مصروف', addRevShort:'+ إيراد',
    expSub:'اللي دفعته', revSub:'اللي حصّلته',
    noData:'لا يوجد بيانات بعد',
    confirmDel:'هتحذف هذا العنصر؟',
    logout:'تسجيل الخروج',
    settings:'الإعدادات', langLabel:'اللغة',
    currency:'ج',
    thisMonthResult:'نتيجة الشهر:',
  },
  en: {
    summary:'Summary', expenses:'Expenses', revenue:'Revenue',
    dashboard:'Dashboard', dashSub:'Your expenses & revenue at a glance',
    totalExp:'Total Expenses', totalRev:'Total Revenue',
    thisMonth:'This Month',
    mExp:'Month Expenses', mRev:'Month Revenue',
    profit:'🟢  Profit', loss:'🔴  Loss', zero:'⚪  Break Even',
    topExp:'Top Expenses', viewAll:'View All',
    monthlyDetails:'Monthly Details',
    col_month:'Month', col_exp:'Expenses', col_rev:'Revenue', col_result:'Result',
    col_num:'#', col_name:'Name / Description', col_amount:'Amount', col_day:'Day', col_dt:'Date & Time',
    addExpTitle:'New Expense', addRevTitle:'New Revenue',
    editExp:'Edit Expense', editRev:'Edit Revenue',
    lbl_name:'Name / Description *', lbl_amount:'Amount (EGP) *', lbl_notes:'Notes',
    ph_exp:'e.g. A4 Paper, Ink...', ph_rev:'e.g. Sold paper, Print job...',
    btn_save:'✓ Save', btn_cancel:'Cancel', btn_edit:'Edit', btn_delete:'Delete',
    totalExpLbl:'Total Expenses:', totalRevLbl:'Total Revenue:',
    addExpShort:'+ Expense', addRevShort:'+ Revenue',
    expSub:'What you paid', revSub:'What you earned',
    noData:'No data yet',
    confirmDel:'Delete this item?',
    logout:'Logout',
    settings:'Settings', langLabel:'Language',
    currency:'EGP',
    thisMonthResult:'Month result:',
  }
};

function T(k) { return (STR[LANG] || STR.ar)[k] || k; }

function setLang(lang) {
    LANG = lang;
    localStorage.setItem('ks-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    applyI18n();
    renderAll();
}

function applyI18n() {
    const ids = {
        'nav-summary': T('summary'), 'nav-expenses': T('expenses'), 'nav-revenue': T('revenue'),
        'bnav-summary': T('summary'), 'bnav-expenses': T('expenses'), 'bnav-revenue': T('revenue'),
        'logout-text-side': T('logout'),
        'settings-lbl': T('settings'), 'lang-label': T('langLabel'),
        'h-page-title': T('dashboard'), 'h-page-sub': T('dashSub'),
        'addexp-lbl': T('addExpShort'), 'addrev-lbl': T('addRevShort'),
        'pu-page-title': T('expenses'), 'pu-page-sub': T('expSub'), 'pu-add-btn': '+ ' + T('expenses'),
        'rev-page-title': T('revenue'),  'rev-page-sub': T('revSub'), 'rev-add-btn': '+ ' + T('revenue'),
        'modal-exp-cancel': T('btn_cancel'), 'modal-rev-cancel': T('btn_cancel'),
    };
    Object.entries(ids).forEach(([id, val]) => setText(id, val));
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === LANG));
}

/* ============================================================
   INIT
============================================================ */
document.documentElement.setAttribute('lang', LANG);
document.documentElement.setAttribute('dir', LANG === 'ar' ? 'rtl' : 'ltr');

let currentView = 'home';

function renderAll() {
    if (currentView === 'home')     renderHome();
    if (currentView === 'expenses') renderExpenses();
    if (currentView === 'revenue')  renderRevenue();
}

/* ---- Datetime ---- */
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

/* ---- Sidebar ---- */
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

/* ---- Modals ---- */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function overlayClick(e, id) { if (e.target.id === id) closeModal(id); }
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

/* ---- Toast ---- */
let _t;
function toast(msg, isErr = false) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.toggle('err', isErr);
    el.classList.add('show');
    clearTimeout(_t);
    _t = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ---- Helpers ---- */
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
    document.getElementById('exp-name').placeholder = T('ph_exp');
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
    openModal('modal-expense');
    setTimeout(() => document.getElementById('exp-name').focus(), 100);
}

function submitExpense() {
    const name   = document.getElementById('exp-name').value.trim();
    const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
    const notes  = document.getElementById('exp-notes').value.trim();
    if (!name)       { toast('⚠️ ' + T('lbl_name').replace(' *',''), true); return; }
    if (amount <= 0) { toast('⚠️ ' + T('lbl_amount').replace(' *',''), true); return; }

    if (_editExpId) {
        updateExpense(_editExpId, { name, amount, notes });
        toast('✓ ' + T('editExp'));
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
    if (currentView === 'expenses') renderExpenses();
}

/* ============================================================
   REVENUE — Add / Edit / Delete
============================================================ */
let _editRevId = null;

function openAddRevenue() {
    _editRevId = null;
    clearFields(['rev-name','rev-amount','rev-notes']);
    setText('modal-rev-title', T('addRevTitle'));
    document.getElementById('rev-name').placeholder = T('ph_rev');
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
    openModal('modal-revenue');
    setTimeout(() => document.getElementById('rev-name').focus(), 100);
}

function submitRevenue() {
    const name   = document.getElementById('rev-name').value.trim();
    const amount = parseFloat(document.getElementById('rev-amount').value) || 0;
    const notes  = document.getElementById('rev-notes').value.trim();
    if (!name)       { toast('⚠️ ' + T('lbl_name').replace(' *',''), true); return; }
    if (amount <= 0) { toast('⚠️ ' + T('lbl_amount').replace(' *',''), true); return; }

    if (_editRevId) {
        updateRevenue(_editRevId, { name, amount, notes });
        toast('✓ ' + T('editRev'));
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
    if (currentView === 'revenue') renderRevenue();
}

/* ============================================================
   HOME VIEW
============================================================ */
function renderHome() {
    const s = getSummary();

    /* Profit card */
    const card = document.getElementById('profit-card');
    if (card) {
        const p = s.netProfit;
        card.className = 'profit-card ' + (p > 0 ? 'is-profit' : p < 0 ? 'is-loss' : 'is-zero');
        card.innerHTML = `
            <div class="pc-main">
                <div class="pc-icon">${p > 0 ? '📈' : p < 0 ? '📉' : '➖'}</div>
                <div class="pc-info">
                    <div class="pc-label">${p > 0 ? T('profit') : p < 0 ? T('loss') : T('zero')}</div>
                    <div class="pc-amount">${p >= 0 ? '+' : ''}${fmtMoney(p)}</div>
                </div>
            </div>
            <div class="pc-sub">${T('thisMonthResult')} ${s.monthProfit >= 0 ? '+' : ''}${fmtMoney(s.monthProfit)}</div>
        `;
    }

    /* Stats */
    setText('h-total-exp',   fmtMoney(s.totalExp));
    setText('h-total-rev',   fmtMoney(s.totalRev));
    setText('h-exp-lbl',     T('totalExp'));
    setText('h-rev-lbl',     T('totalRev'));
    setText('h-this-month',  T('thisMonth'));
    setText('h-m-exp',       fmtMoney(s.monthExp));
    setText('h-m-rev',       fmtMoney(s.monthRev));
    setText('h-m-exp-lbl',   T('mExp'));
    setText('h-m-rev-lbl',   T('mRev'));
    setText('top-exp-title', T('topExp'));
    setText('top-exp-link',  T('viewAll'));
    setText('h-monthly-title', T('monthlyDetails'));

    renderTopExpenses();
    renderMonthlyTable();
}

/* ---- Top Expenses chart ---- */
function renderTopExpenses() {
    const el = document.getElementById('top-exp-list');
    if (!el) return;

    const all = getExpenses();
    if (!all.length) {
        el.innerHTML = `<div class="empty" style="padding:20px"><div class="ei">🛒</div><p>${T('noData')}</p></div>`;
        return;
    }

    /* Group by name, sum amounts */
    const grouped = {};
    all.forEach(e => {
        const key = e.name.trim();
        grouped[key] = (grouped[key] || 0) + e.amount;
    });

    const sorted = Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7);

    const max = sorted[0][1];

    el.innerHTML = sorted.map(([name, amount], i) => {
        const pct = ((amount / max) * 100).toFixed(1);
        const totalPct = ((amount / all.reduce((s,e) => s+e.amount, 0)) * 100).toFixed(0);
        return `
            <div class="top-exp-item">
                <div class="top-exp-header">
                    <div class="top-exp-rank">${i + 1}</div>
                    <div class="top-exp-name">${name}</div>
                    <div class="top-exp-amount">${fmtMoney(amount)}</div>
                </div>
                <div class="top-exp-bar-wrap">
                    <div class="top-exp-bar" style="width:${pct}%"></div>
                </div>
                <div class="top-exp-pct">${totalPct}% ${T('currency') === 'ج' ? 'من الإجمالي' : 'of total'}</div>
            </div>
        `;
    }).join('');
}

/* ---- Monthly table ---- */
function renderMonthlyTable() {
    const tbody = document.getElementById('monthly-body');
    if (!tbody) return;
    setText('th-month',  T('col_month'));
    setText('th-exp',    T('col_exp'));
    setText('th-rev',    T('col_rev'));
    setText('th-profit', T('col_result'));

    const data = getMonthlyData();
    if (!data.length) { tbody.innerHTML = emptyRow('📅', 4); return; }
    tbody.innerHTML = data.map(d => `
        <tr>
            <td><strong>${d.label}</strong></td>
            <td style="color:var(--red)">${fmtMoney(d.exp)}</td>
            <td style="color:var(--green)">${fmtMoney(d.rev)}</td>
            <td style="font-weight:700" class="${d.profit > 0 ? 'profit-pos' : d.profit < 0 ? 'profit-neg' : ''}">
                ${d.profit >= 0 ? '+' : ''}${fmtMoney(d.profit)}
            </td>
        </tr>
    `).join('');
}

/* ============================================================
   EXPENSES VIEW
============================================================ */
function renderExpenses() {
    setText('pu-total-lbl', T('totalExpLbl'));
    // Table headers
    setText('th2-num',    T('col_num'));
    setText('th2-name',   T('col_name'));
    setText('th2-amount', T('col_amount'));
    setText('th2-day',    T('col_day'));
    setText('th2-dt',     T('col_dt'));

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
                    <button class="btn btn-edit btn-sm"   onclick="openEditExpense(${e.id})">${T('btn_edit')}</button>
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
    setText('rev-total-lbl', T('totalRevLbl'));
    setText('th3-num',    T('col_num'));
    setText('th3-name',   T('col_name'));
    setText('th3-amount', T('col_amount'));
    setText('th3-day',    T('col_day'));
    setText('th3-dt',     T('col_dt'));

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
                    <button class="btn btn-edit btn-sm"   onclick="openEditRevenue(${r.id})">${T('btn_edit')}</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRevenue(${r.id})">${T('btn_delete')}</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/* ---- Init ---- */
applyI18n();
renderHome();
