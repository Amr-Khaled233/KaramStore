checkAuth();

let currentView = 'home';

/* ---- Datetime ---- */
function tickTime() {
    const dt = nowEG();
    const el = document.getElementById('sidebar-time');
    if (el) el.innerHTML = `<strong>${dt.dayName}</strong>  ${dt.date}<br>⏰  ${dt.time}`;
}
setInterval(tickTime, 1000);
tickTime();

/* ---- View router ---- */
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
    if (name === 'home')       renderHome();
    if (name === 'purchases')  renderPurchases();
    if (name === 'operations') renderOperations();
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

/* ---- Utils ---- */
function clearFields(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }
function setText(id, v)   { const el = document.getElementById(id); if (el) el.textContent = v; }
function fmtMoney(n)      { return n.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ج'; }

function emptyRow(icon, msg, cols) {
    return `<tr><td colspan="${cols}"><div class="empty"><div class="ei">${icon}</div><p>${msg}</p></div></td></tr>`;
}

/* ============================================================
   PURCHASES
============================================================ */
function submitPurchase() {
    const name   = document.getElementById('pu-name').value.trim();
    const amount = parseFloat(document.getElementById('pu-amount').value) || 0;
    const notes  = document.getElementById('pu-notes').value.trim();

    if (!name)      { toast('اكتب اسم المنتج أو الشراء', true); return; }
    if (amount <= 0) { toast('اكتب المبلغ المدفوع', true); return; }

    addPurchase({ id: Date.now(), name, amount, notes, ...nowEG() });
    closeModal('modal-purchase');
    clearFields(['pu-name', 'pu-amount', 'pu-notes']);
    toast(`تم تسجيل "${name}" — ${fmtMoney(amount)}`);
    renderHome();
    if (currentView === 'purchases') renderPurchases();
}

function deletePurchase(id) {
    if (!confirm('هتحذف المشترى ده؟')) return;
    removePurchase(id);
    toast('تم الحذف');
    renderHome();
    renderPurchases();
}

/* ============================================================
   OPERATIONS
============================================================ */
function submitOperation() {
    const desc   = document.getElementById('op-desc').value.trim();
    const amount = parseFloat(document.getElementById('op-amount').value) || 0;
    const notes  = document.getElementById('op-notes').value.trim();

    if (!desc)       { toast('اكتب وصف العملية', true); return; }
    if (amount <= 0) { toast('اكتب المبلغ المحصّل', true); return; }

    addOperation({ id: Date.now(), desc, amount, notes, ...nowEG() });
    closeModal('modal-operation');
    clearFields(['op-desc', 'op-amount', 'op-notes']);
    toast(`تم تسجيل "${desc}" — ${fmtMoney(amount)}`);
    renderHome();
    if (currentView === 'operations') renderOperations();
}

function deleteOperation(id) {
    if (!confirm('هتحذف العملية دي؟')) return;
    removeOperation(id);
    toast('تم الحذف');
    renderHome();
    renderOperations();
}

/* ============================================================
   HOME VIEW
============================================================ */
function renderHome() {
    const s = getSummary();

    setText('h-expenses', fmtMoney(s.totalExpenses));
    setText('h-revenue',  fmtMoney(s.totalRevenue));

    const profitEl = document.getElementById('h-profit');
    if (profitEl) {
        profitEl.textContent = fmtMoney(s.netProfit);
        profitEl.style.color = s.netProfit >= 0 ? 'var(--green)' : 'var(--red)';
    }

    setText('h-m-expenses', fmtMoney(s.monthExpenses));
    setText('h-m-revenue',  fmtMoney(s.monthRevenue));

    const mProfitEl = document.getElementById('h-m-profit');
    if (mProfitEl) {
        mProfitEl.textContent = fmtMoney(s.monthProfit);
        mProfitEl.style.color = s.monthProfit >= 0 ? 'var(--green)' : 'var(--red)';
    }

    renderMonthlyTable();
}

function renderMonthlyTable() {
    const tbody = document.getElementById('monthly-body');
    if (!tbody) return;
    const data = getMonthlyData();
    if (!data.length) {
        tbody.innerHTML = emptyRow('📅', 'لا يوجد بيانات بعد', 4);
        return;
    }
    tbody.innerHTML = data.map(d => `
        <tr>
            <td><strong>${d.label}</strong></td>
            <td style="color:var(--red)">${fmtMoney(d.expenses)}</td>
            <td style="color:var(--green)">${fmtMoney(d.revenue)}</td>
            <td class="${d.profit >= 0 ? 'profit-pos' : 'profit-neg'}">${d.profit >= 0 ? '+' : ''}${fmtMoney(d.profit)}</td>
        </tr>
    `).join('');
}

/* ============================================================
   PURCHASES VIEW
============================================================ */
function renderPurchases() {
    const tbody = document.getElementById('pu-body');
    if (!tbody) return;
    const items = getPurchases();
    if (!items.length) { tbody.innerHTML = emptyRow('🛒', 'لا يوجد مشتريات مسجلة بعد', 6); return; }
    tbody.innerHTML = items.map((p, i) => `
        <tr>
            <td style="color:var(--text3)">${i + 1}</td>
            <td><strong>${p.name}</strong>${p.notes ? `<div style="font-size:11px;color:var(--text2);margin-top:2px">${p.notes}</div>` : ''}</td>
            <td style="color:var(--red);font-weight:700">${fmtMoney(p.amount)}</td>
            <td style="color:var(--gold)">${p.dayName}</td>
            <td style="font-size:12px">${p.date} — ${p.time}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deletePurchase(${p.id})">حذف</button></td>
        </tr>
    `).join('');

    const total = getPurchases().reduce((s, p) => s + p.amount, 0);
    setText('pu-total', fmtMoney(total));
}

/* ============================================================
   OPERATIONS VIEW
============================================================ */
function renderOperations() {
    const tbody = document.getElementById('op-body');
    if (!tbody) return;
    const items = getOperations();
    if (!items.length) { tbody.innerHTML = emptyRow('💼', 'لا يوجد عمليات مسجلة بعد', 6); return; }
    tbody.innerHTML = items.map((o, i) => `
        <tr>
            <td style="color:var(--text3)">${i + 1}</td>
            <td><strong>${o.desc}</strong>${o.notes ? `<div style="font-size:11px;color:var(--text2);margin-top:2px">${o.notes}</div>` : ''}</td>
            <td style="color:var(--green);font-weight:700">${fmtMoney(o.amount)}</td>
            <td style="color:var(--gold)">${o.dayName}</td>
            <td style="font-size:12px">${o.date} — ${o.time}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteOperation(${o.id})">حذف</button></td>
        </tr>
    `).join('');

    const total = getOperations().reduce((s, o) => s + o.amount, 0);
    setText('op-total', fmtMoney(total));
}

/* ---- Init ---- */
renderHome();
