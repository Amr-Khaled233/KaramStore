checkAuth();

/* ============================================================
   STATE
============================================================ */
let selectedMonth = currentMonthKey();
let currentView   = 'home';
let _editExpId    = null;
let _editRevId    = null;

/* ============================================================
   UTILS
============================================================ */
function setText(id, v)   { const el = document.getElementById(id); if (el) el.textContent = v; }
function getVal(id)       { return (document.getElementById(id)?.value || '').trim(); }
function setVal(id, v)    { const el = document.getElementById(id); if (el) el.value = v; }
function clearFields(ids) { ids.forEach(id => setVal(id, '')); }

function fmtMoney(n) {
    const sign = n < 0 ? '-' : '';
    const abs  = Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${sign}${abs} ج`;
}

function emptyRow(icon, msg, cols) {
    return `<tr><td colspan="${cols}"><div class="empty">
        <div class="ei">${icon}</div><p>${msg}</p>
    </div></td></tr>`;
}

function showLoading(v) {
    document.getElementById('loading-overlay').classList.toggle('show', v);
}

let _toastTimer;
function toast(msg, isErr = false) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.toggle('err', isErr);
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function profitCard(cardId, profit, expTotal, revTotal, noDataMsg) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.className = 'profit-card ' + (profit > 0 ? 'is-profit' : profit < 0 ? 'is-loss' : 'is-zero');
    card.innerHTML = `
        <div class="pc-main">
            <div class="pc-icon">${profit > 0 ? '📈' : profit < 0 ? '📉' : '➖'}</div>
            <div class="pc-info">
                <div class="pc-label">${profit > 0 ? '🟢  ربح' : profit < 0 ? '🔴  خسارة' : '⚪  تعادل'}</div>
                <div class="pc-amount">${profit >= 0 ? '+' : ''}${fmtMoney(profit)}</div>
            </div>
        </div>
        <div class="pc-sub">${expTotal !== null
            ? `مصروفات: ${fmtMoney(expTotal)} &nbsp;|&nbsp; إيرادات: ${fmtMoney(revTotal)}`
            : noDataMsg}</div>
    `;
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
   MONTH NAVIGATION
============================================================ */
function renderMonthNav() {
    setText('selected-month-label', monthLabel(selectedMonth));
    const isNow = selectedMonth === currentMonthKey();
    const btnNext = document.getElementById('btn-next-month');
    if (btnNext) btnNext.disabled = isNow;
}

function changeMonth(delta) {
    selectedMonth = shiftMonth(selectedMonth, delta);
    renderMonthNav();
    if (currentView === 'months') renderMonths();
}

function goToNow() {
    selectedMonth = currentMonthKey();
    renderMonthNav();
    if (currentView === 'months') renderMonths();
}

/* ============================================================
   VIEW ROUTER
============================================================ */
function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + name)?.classList.add('active');
    document.querySelectorAll('.nav-item, .bnav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`[data-view="${name}"]`).forEach(n => n.classList.add('active'));
    currentView = name;
    closeSidebar();
    window.scrollTo(0, 0);

    if (name === 'home')     renderHome();
    if (name === 'months')   renderMonths();
    if (name === 'expenses') renderExpenses();
    if (name === 'revenue')  renderRevenue();
}

/* ============================================================
   SIDEBAR
============================================================ */
function toggleSidebar() {
    const open = document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('show', open);
    document.querySelector('.menu-btn')?.classList.toggle('open', open);
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
    if (e.key === 'Escape')
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

/* ============================================================
   EXPENSE FORM
============================================================ */
function openAddExpense() {
    _editExpId = null;
    clearFields(['exp-name','exp-amount','exp-notes']);
    setText('modal-exp-title', 'إضافة مصروف جديد');
    openModal('modal-expense');
    setTimeout(() => document.getElementById('exp-name')?.focus(), 100);
}

function openEditExpense(id, name, amount, notes) {
    _editExpId = id;
    setVal('exp-name', name); setVal('exp-amount', amount); setVal('exp-notes', notes || '');
    setText('modal-exp-title', 'تعديل المصروف');
    openModal('modal-expense');
}

async function submitExpense() {
    const name   = getVal('exp-name');
    const amount = parseFloat(document.getElementById('exp-amount')?.value) || 0;
    const notes  = getVal('exp-notes');
    if (!name)       { toast('⚠️ اكتب اسم المصروف', true); return; }
    if (amount <= 0) { toast('⚠️ اكتب المبلغ', true); return; }
    try {
        showLoading(true);
        if (_editExpId) {
            await API.updateExpense(_editExpId, { name, amount, notes });
            toast('✓ تم التعديل');
        } else {
            const dt = nowEG();
            await API.addExpense({ name, amount, notes,
                monthKey: dt.monthKey, monthLabel: dt.monthLabel,
                dayName: dt.dayName, date: dt.date, time: dt.time });
            toast(`✓ ${name} — ${fmtMoney(amount)}`);
        }
        closeModal('modal-expense');
        clearFields(['exp-name','exp-amount','exp-notes']);
        _editExpId = null;
        if (currentView === 'home')     await renderHome();
        if (currentView === 'months')   await renderMonths();
        if (currentView === 'expenses') await renderExpenses();
    } catch (e) { toast('❌ ' + e.message, true); }
    finally { showLoading(false); }
}

async function deleteExpense(id) {
    if (!confirm('هتحذف المصروف ده؟')) return;
    try {
        showLoading(true);
        await API.deleteExpense(id);
        toast('تم الحذف');
        if (currentView === 'home')     await renderHome();
        if (currentView === 'months')   await renderMonths();
        if (currentView === 'expenses') await renderExpenses();
    } catch (e) { toast('❌ ' + e.message, true); }
    finally { showLoading(false); }
}

/* ============================================================
   REVENUE FORM
============================================================ */
function openAddRevenue() {
    _editRevId = null;
    clearFields(['rev-name','rev-amount','rev-notes']);
    setText('modal-rev-title', 'إضافة إيراد جديد');
    openModal('modal-revenue');
    setTimeout(() => document.getElementById('rev-name')?.focus(), 100);
}

function openEditRevenue(id, name, amount, notes) {
    _editRevId = id;
    setVal('rev-name', name); setVal('rev-amount', amount); setVal('rev-notes', notes || '');
    setText('modal-rev-title', 'تعديل الإيراد');
    openModal('modal-revenue');
}

async function submitRevenue() {
    const name   = getVal('rev-name');
    const amount = parseFloat(document.getElementById('rev-amount')?.value) || 0;
    const notes  = getVal('rev-notes');
    if (!name)       { toast('⚠️ اكتب وصف الإيراد', true); return; }
    if (amount <= 0) { toast('⚠️ اكتب المبلغ', true); return; }
    try {
        showLoading(true);
        if (_editRevId) {
            await API.updateRevenue(_editRevId, { name, amount, notes });
            toast('✓ تم التعديل');
        } else {
            const dt = nowEG();
            await API.addRevenue({ name, amount, notes,
                monthKey: dt.monthKey, monthLabel: dt.monthLabel,
                dayName: dt.dayName, date: dt.date, time: dt.time });
            toast(`✓ ${name} — ${fmtMoney(amount)}`);
        }
        closeModal('modal-revenue');
        clearFields(['rev-name','rev-amount','rev-notes']);
        _editRevId = null;
        if (currentView === 'home')    await renderHome();
        if (currentView === 'months')  await renderMonths();
        if (currentView === 'revenue') await renderRevenue();
    } catch (e) { toast('❌ ' + e.message, true); }
    finally { showLoading(false); }
}

async function deleteRevenue(id) {
    if (!confirm('هتحذف الإيراد ده؟')) return;
    try {
        showLoading(true);
        await API.deleteRevenue(id);
        toast('تم الحذف');
        if (currentView === 'home')    await renderHome();
        if (currentView === 'months')  await renderMonths();
        if (currentView === 'revenue') await renderRevenue();
    } catch (e) { toast('❌ ' + e.message, true); }
    finally { showLoading(false); }
}

/* ============================================================
   HOME VIEW — إجمالي كل الوقت
============================================================ */
async function renderHome() {
    try {
        const [allExp, allRev, summary] = await Promise.all([
            API.getExpenses(),
            API.getRevenue(),
            API.getSummary(),
        ]);

        const totalExp = allExp.reduce((s, e) => s + e.amount, 0);
        const totalRev = allRev.reduce((s, r) => s + r.amount, 0);
        const profit   = totalRev - totalExp;

        profitCard('home-profit-card', profit, totalExp, totalRev, 'أضف مصروفاتك وإيراداتك');
        setText('home-total-exp', fmtMoney(totalExp));
        setText('home-total-rev', fmtMoney(totalRev));

        renderTopExpenses('home-top-exp', allExp);
        renderSummaryTable('home-monthly-body', summary);

    } catch (e) { toast('❌ تعذّر الاتصال بالسيرفر', true); }
}

function renderTopExpenses(elId, expenses) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!expenses.length) {
        el.innerHTML = `<div class="empty" style="padding:20px"><div class="ei">🛒</div><p>لا يوجد مصروفات بعد</p></div>`;
        return;
    }
    const grouped = {};
    expenses.forEach(e => { grouped[e.name] = (grouped[e.name] || 0) + e.amount; });
    const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const max    = sorted[0][1];
    const total  = expenses.reduce((s, e) => s + e.amount, 0);
    el.innerHTML = sorted.map(([name, amount], i) => `
        <div class="top-exp-item">
            <div class="top-exp-header">
                <div class="top-exp-rank">${i + 1}</div>
                <div class="top-exp-name">${name}</div>
                <div class="top-exp-amount">${fmtMoney(amount)}</div>
            </div>
            <div class="top-exp-bar-wrap">
                <div class="top-exp-bar" style="width:${((amount/max)*100).toFixed(1)}%"></div>
            </div>
            <div class="top-exp-pct">${((amount/total)*100).toFixed(0)}% من الإجمالي</div>
        </div>
    `).join('');
}

function renderSummaryTable(tbodyId, summary) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    if (!summary.length) { tbody.innerHTML = emptyRow('📅', 'لا يوجد بيانات بعد', 4); return; }
    tbody.innerHTML = summary.map(d => `
        <tr style="cursor:pointer" onclick="jumpToMonth('${d.key}')" title="اضغط لعرض الشهر">
            <td><strong>${d.label}</strong></td>
            <td style="color:var(--red)">${fmtMoney(d.expenses)}</td>
            <td style="color:var(--green)">${fmtMoney(d.revenue)}</td>
            <td class="${d.profit > 0 ? 'profit-pos' : d.profit < 0 ? 'profit-neg' : ''}" style="font-weight:700">
                ${d.profit >= 0 ? '+' : ''}${fmtMoney(d.profit)}
            </td>
        </tr>
    `).join('');
}

function jumpToMonth(key) {
    selectedMonth = key;
    showView('months');
}

/* ============================================================
   MONTHS VIEW — شهر بشهر
============================================================ */
async function renderMonths() {
    renderMonthNav();
    setText('months-sub', `مصروفات وإيرادات — ${monthLabel(selectedMonth)}`);
    try {
        const [expenses, revenue] = await Promise.all([
            API.getExpenses(selectedMonth),
            API.getRevenue(selectedMonth),
        ]);

        const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
        const totalRev = revenue.reduce((s, r) => s + r.amount, 0);
        const profit   = totalRev - totalExp;

        profitCard('month-profit-card', profit, totalExp, totalRev, 'لا يوجد بيانات في هذا الشهر');
        setText('month-total-exp', fmtMoney(totalExp));
        setText('month-total-rev', fmtMoney(totalRev));

        renderMonthExpenses(expenses);
        renderMonthRevenue(revenue);

    } catch (e) { toast('❌ ' + e.message, true); }
}

function entryRow(item, i, editFn, deleteFn) {
    const safeN = (item.name||'').replace(/'/g,"\\'");
    const safeO = (item.notes||'').replace(/'/g,"\\'");
    return `
        <tr>
            <td style="color:var(--text3)">${i+1}</td>
            <td>
                <strong>${item.name}</strong>
                ${item.notes ? `<div class="td-sub">${item.notes}</div>` : ''}
            </td>
            <td style="font-weight:700">${fmtMoney(item.amount)}</td>
            <td style="font-size:11px;color:var(--text2);white-space:nowrap">
                ${item.dayName || ''}<br>${item.date || ''}
            </td>
            <td>
                <div style="display:flex;gap:5px">
                    <button class="btn btn-edit btn-sm"
                        onclick="${editFn}('${item._id}','${safeN}',${item.amount},'${safeO}')">تعديل</button>
                    <button class="btn btn-danger btn-sm"
                        onclick="${deleteFn}('${item._id}')">حذف</button>
                </div>
            </td>
        </tr>`;
}

function renderMonthExpenses(items) {
    const tbody = document.getElementById('month-exp-body');
    if (!tbody) return;
    if (!items.length) { tbody.innerHTML = emptyRow('🛒', 'لا يوجد مصروفات', 5); return; }
    tbody.innerHTML = items.map((e, i) => entryRow(e, i, 'openEditExpense', 'deleteExpense')).join('');
}

function renderMonthRevenue(items) {
    const tbody = document.getElementById('month-rev-body');
    if (!tbody) return;
    if (!items.length) { tbody.innerHTML = emptyRow('💵', 'لا يوجد إيرادات', 5); return; }
    tbody.innerHTML = items.map((r, i) => entryRow(r, i, 'openEditRevenue', 'deleteRevenue')).join('');
}

/* ============================================================
   EXPENSES VIEW — كل المصروفات
============================================================ */
async function renderExpenses() {
    const tbody = document.getElementById('exp-body');
    if (!tbody) return;
    try {
        const items = await API.getExpenses();
        setText('exp-total', fmtMoney(items.reduce((s, e) => s + e.amount, 0)));
        if (!items.length) { tbody.innerHTML = emptyRow('🛒', 'لا يوجد مصروفات بعد', 6); return; }
        tbody.innerHTML = items.map((e, i) => {
            const safeN = (e.name||'').replace(/'/g,"\\'");
            const safeO = (e.notes||'').replace(/'/g,"\\'");
            return `<tr>
                <td style="color:var(--text3)">${i+1}</td>
                <td><strong>${e.name}</strong>${e.notes?`<div class="td-sub">${e.notes}</div>`:''}</td>
                <td style="color:var(--red);font-weight:700">${fmtMoney(e.amount)}</td>
                <td style="color:var(--gold)">${e.dayName||''}</td>
                <td style="font-size:12px;white-space:nowrap">${e.date||''} ${e.time?'— '+e.time:''}</td>
                <td><div style="display:flex;gap:6px">
                    <button class="btn btn-edit btn-sm"   onclick="openEditExpense('${e._id}','${safeN}',${e.amount},'${safeO}')">تعديل</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense('${e._id}')">حذف</button>
                </div></td>
            </tr>`;
        }).join('');
    } catch (err) { toast('❌ ' + err.message, true); }
}

/* ============================================================
   REVENUE VIEW — كل الإيرادات
============================================================ */
async function renderRevenue() {
    const tbody = document.getElementById('rev-body');
    if (!tbody) return;
    try {
        const items = await API.getRevenue();
        setText('rev-total', fmtMoney(items.reduce((s, r) => s + r.amount, 0)));
        if (!items.length) { tbody.innerHTML = emptyRow('💵', 'لا يوجد إيرادات بعد', 6); return; }
        tbody.innerHTML = items.map((r, i) => {
            const safeN = (r.name||'').replace(/'/g,"\\'");
            const safeO = (r.notes||'').replace(/'/g,"\\'");
            return `<tr>
                <td style="color:var(--text3)">${i+1}</td>
                <td><strong>${r.name}</strong>${r.notes?`<div class="td-sub">${r.notes}</div>`:''}</td>
                <td style="color:var(--green);font-weight:700">${fmtMoney(r.amount)}</td>
                <td style="color:var(--gold)">${r.dayName||''}</td>
                <td style="font-size:12px;white-space:nowrap">${r.date||''} ${r.time?'— '+r.time:''}</td>
                <td><div style="display:flex;gap:6px">
                    <button class="btn btn-edit btn-sm"   onclick="openEditRevenue('${r._id}','${safeN}',${r.amount},'${safeO}')">تعديل</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRevenue('${r._id}')">حذف</button>
                </div></td>
            </tr>`;
        }).join('');
    } catch (err) { toast('❌ ' + err.message, true); }
}

/* ---- Init ---- */
renderMonthNav();
renderHome();
