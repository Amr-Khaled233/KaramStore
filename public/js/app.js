checkAuth();

/* ============================================================
   STATE
============================================================ */
let selectedMonth = currentMonthKey();   // "2026-05"
let currentView   = 'home';
let _editExpId    = null;
let _editRevId    = null;

/* ============================================================
   UTILS
============================================================ */
function setText(id, v)  { const el = document.getElementById(id); if (el) el.textContent = v; }
function getVal(id)      { return (document.getElementById(id)?.value || '').trim(); }
function setVal(id, v)   { const el = document.getElementById(id); if (el) el.value = v; }
function clearFields(ids){ ids.forEach(id => setVal(id, '')); }

function fmtMoney(n) {
    const sign = n < 0 ? '-' : '';
    const abs  = Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${sign}${abs} ج`;
}

function emptyRow(icon, msg, cols) {
    return `<tr><td colspan="${cols}">
        <div class="empty"><div class="ei">${icon}</div><p>${msg}</p></div>
    </td></tr>`;
}

function showLoading(show) {
    document.getElementById('loading-overlay').classList.toggle('show', show);
}

function toast(msg, isErr = false) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.toggle('err', isErr);
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ============================================================
   DATETIME TICKER
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
    const btnNow  = document.getElementById('btn-now');
    const btnNext = document.getElementById('btn-next-month');
    if (btnNow)  btnNow.style.opacity  = isNow ? '0' : '1';
    if (btnNow)  btnNow.style.pointerEvents = isNow ? 'none' : 'auto';
    if (btnNext) btnNext.disabled = isNow;
}

function changeMonth(delta) {
    selectedMonth = shiftMonth(selectedMonth, delta);
    renderMonthNav();
    if (currentView === 'home')     renderHome();
    if (currentView === 'expenses') renderExpenses();
    if (currentView === 'revenue')  renderRevenue();
}

function goToNow() {
    selectedMonth = currentMonthKey();
    renderMonthNav();
    if (currentView === 'home')     renderHome();
    if (currentView === 'expenses') renderExpenses();
    if (currentView === 'revenue')  renderRevenue();
}

/* ============================================================
   VIEW ROUTER
============================================================ */
function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + name)?.classList.add('active');
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
    setVal('exp-name',   name);
    setVal('exp-amount', amount);
    setVal('exp-notes',  notes || '');
    setText('modal-exp-title', 'تعديل المصروف');
    openModal('modal-expense');
    setTimeout(() => document.getElementById('exp-name')?.focus(), 100);
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
        await renderHome();
        if (currentView === 'expenses') await renderExpenses();
    } catch (e) {
        toast('❌ ' + e.message, true);
    } finally {
        showLoading(false);
    }
}

async function deleteExpense(id) {
    if (!confirm('هتحذف المصروف ده؟')) return;
    try {
        showLoading(true);
        await API.deleteExpense(id);
        toast('تم الحذف');
        await renderHome();
        await renderExpenses();
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
    setVal('rev-name',   name);
    setVal('rev-amount', amount);
    setVal('rev-notes',  notes || '');
    setText('modal-rev-title', 'تعديل الإيراد');
    openModal('modal-revenue');
    setTimeout(() => document.getElementById('rev-name')?.focus(), 100);
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
        await renderHome();
        if (currentView === 'revenue') await renderRevenue();
    } catch (e) {
        toast('❌ ' + e.message, true);
    } finally {
        showLoading(false);
    }
}

async function deleteRevenue(id) {
    if (!confirm('هتحذف الإيراد ده؟')) return;
    try {
        showLoading(true);
        await API.deleteRevenue(id);
        toast('تم الحذف');
        await renderHome();
        await renderRevenue();
    } catch (e) { toast('❌ ' + e.message, true); }
    finally { showLoading(false); }
}

/* ============================================================
   HOME VIEW
============================================================ */
async function renderHome() {
    renderMonthNav();
    try {
        const [expenses, revenue, summary] = await Promise.all([
            API.getExpenses(selectedMonth),
            API.getRevenue(selectedMonth),
            API.getSummary(),
        ]);

        const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
        const totalRev = revenue.reduce((s, r) => s + r.amount, 0);
        const profit   = totalRev - totalExp;

        /* Profit/loss card */
        const card = document.getElementById('profit-card');
        if (card) {
            card.className = 'profit-card ' + (profit > 0 ? 'is-profit' : profit < 0 ? 'is-loss' : 'is-zero');
            card.innerHTML = `
                <div class="pc-main">
                    <div class="pc-icon">${profit > 0 ? '📈' : profit < 0 ? '📉' : '➖'}</div>
                    <div class="pc-info">
                        <div class="pc-label">${profit > 0 ? '🟢  ربح' : profit < 0 ? '🔴  خسارة' : '⚪  تعادل'}</div>
                        <div class="pc-amount">${profit >= 0 ? '+' : ''}${fmtMoney(profit)}</div>
                    </div>
                </div>
                <div class="pc-sub">
                    مصروفات: ${fmtMoney(totalExp)} &nbsp;|&nbsp; إيرادات: ${fmtMoney(totalRev)}
                </div>
            `;
        }

        setText('h-total-exp', fmtMoney(totalExp));
        setText('h-total-rev', fmtMoney(totalRev));

        renderTopExpenses(expenses);
        renderSummaryTable(summary);

    } catch (e) {
        console.error(e);
        toast('❌ فيه مشكلة في التحميل — تأكد من الاتصال', true);
    }
}

function renderTopExpenses(expenses) {
    const el = document.getElementById('top-exp-list');
    if (!el) return;

    if (!expenses.length) {
        el.innerHTML = `<div class="empty" style="padding:20px"><div class="ei">🛒</div><p>لا يوجد مصروفات في هذا الشهر</p></div>`;
        return;
    }

    /* Group by name */
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
            <div class="top-exp-pct">${((amount/total)*100).toFixed(0)}% من مصروفات الشهر</div>
        </div>
    `).join('');
}

function renderSummaryTable(summary) {
    const tbody = document.getElementById('monthly-body');
    if (!tbody) return;

    if (!summary.length) {
        tbody.innerHTML = emptyRow('📅', 'لا يوجد بيانات بعد', 4);
        return;
    }

    tbody.innerHTML = summary.map(d => `
        <tr class="${d.key === selectedMonth ? 'row-selected' : ''}" onclick="jumpToMonth('${d.key}')" style="cursor:pointer" title="اضغط لعرض الشهر">
            <td><strong>${d.label}</strong></td>
            <td style="color:var(--red)">${fmtMoney(d.expenses)}</td>
            <td style="color:var(--green)">${fmtMoney(d.revenue)}</td>
            <td style="font-weight:700" class="${d.profit > 0 ? 'profit-pos' : d.profit < 0 ? 'profit-neg' : ''}">
                ${d.profit >= 0 ? '+' : ''}${fmtMoney(d.profit)}
            </td>
        </tr>
    `).join('');
}

function jumpToMonth(key) {
    selectedMonth = key;
    renderMonthNav();
    renderHome();
}

/* ============================================================
   EXPENSES VIEW
============================================================ */
async function renderExpenses() {
    renderMonthNav();
    const tbody = document.getElementById('exp-body');
    if (!tbody) return;

    try {
        const items = await API.getExpenses(selectedMonth);
        const total = items.reduce((s, e) => s + e.amount, 0);
        setText('exp-total', fmtMoney(total));

        if (!items.length) {
            tbody.innerHTML = emptyRow('🛒', 'لا يوجد مصروفات في هذا الشهر', 6);
            return;
        }

        tbody.innerHTML = items.map((e, i) => `
            <tr>
                <td style="color:var(--text3)">${i + 1}</td>
                <td>
                    <strong>${e.name}</strong>
                    ${e.notes ? `<div class="td-sub">${e.notes}</div>` : ''}
                </td>
                <td style="color:var(--red);font-weight:700">${fmtMoney(e.amount)}</td>
                <td style="color:var(--gold)">${e.dayName || ''}</td>
                <td style="font-size:12px;white-space:nowrap">${e.date || ''} ${e.time ? '— ' + e.time : ''}</td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-edit btn-sm"
                            onclick="openEditExpense('${e._id}','${e.name.replace(/'/g,"\\'")}',${e.amount},'${(e.notes||'').replace(/'/g,"\\'")}')">
                            تعديل
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteExpense('${e._id}')">حذف</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) { toast('❌ ' + err.message, true); }
}

/* ============================================================
   REVENUE VIEW
============================================================ */
async function renderRevenue() {
    renderMonthNav();
    const tbody = document.getElementById('rev-body');
    if (!tbody) return;

    try {
        const items = await API.getRevenue(selectedMonth);
        const total = items.reduce((s, r) => s + r.amount, 0);
        setText('rev-total', fmtMoney(total));

        if (!items.length) {
            tbody.innerHTML = emptyRow('💵', 'لا يوجد إيرادات في هذا الشهر', 6);
            return;
        }

        tbody.innerHTML = items.map((r, i) => `
            <tr>
                <td style="color:var(--text3)">${i + 1}</td>
                <td>
                    <strong>${r.name}</strong>
                    ${r.notes ? `<div class="td-sub">${r.notes}</div>` : ''}
                </td>
                <td style="color:var(--green);font-weight:700">${fmtMoney(r.amount)}</td>
                <td style="color:var(--gold)">${r.dayName || ''}</td>
                <td style="font-size:12px;white-space:nowrap">${r.date || ''} ${r.time ? '— ' + r.time : ''}</td>
                <td>
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-edit btn-sm"
                            onclick="openEditRevenue('${r._id}','${r.name.replace(/'/g,"\\'")}',${r.amount},'${(r.notes||'').replace(/'/g,"\\'")}')">
                            تعديل
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteRevenue('${r._id}')">حذف</button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (err) { toast('❌ ' + err.message, true); }
}

/* ============================================================
   INIT
============================================================ */
renderMonthNav();
renderHome();
