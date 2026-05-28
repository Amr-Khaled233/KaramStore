/* ============================================================
   KaramStore — Main Application
============================================================ */
checkAuth();

let revenueChart = null;
let currentView  = 'dashboard';

/* ---- Datetime ticker ---- */
function tickDatetime() {
    const dt = nowEG();
    const el = document.getElementById('sidebar-time');
    if (el) el.innerHTML = `<strong>${dt.dayName}</strong>  ${dt.date}<br>⏰  ${dt.time}`;
}
setInterval(tickDatetime, 1000);
tickDatetime();

/* ============================================================
   VIEW ROUTER
============================================================ */
function showView(name, _el) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + name).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${name}"]`)?.classList.add('active');

    document.querySelectorAll('.bnav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.bnav-item[data-view="${name}"]`)?.classList.add('active');

    currentView = name;
    closeSidebar();
    window.scrollTo(0, 0);

    if (name === 'dashboard') renderDashboard();
    if (name === 'products')  renderProducts();
    if (name === 'sales')     renderSales();
}

/* ============================================================
   SIDEBAR (mobile)
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
let _toastTimer;
function toast(msg, isErr = false) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.toggle('err', isErr);
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ============================================================
   PRODUCTS
============================================================ */
function submitProduct() {
    const name  = document.getElementById('p-name').value.trim();
    const cat   = document.getElementById('p-cat').value;
    const qty   = parseInt(document.getElementById('p-qty').value)   || 1;
    const buy   = parseFloat(document.getElementById('p-buy').value)  || 0;
    const sell  = parseFloat(document.getElementById('p-sell').value) || 0;
    const notes = document.getElementById('p-notes').value.trim();

    if (!name) { toast('لازم تكتب اسم المنتج!', true); return; }

    addProduct({ id: Date.now(), name, cat, qty, buy, sell, notes, ...nowEG() });
    closeModal('modal-product');
    clearFields(['p-name','p-qty','p-buy','p-sell','p-notes']);
    toast(`تم إضافة "${name}" ✓`);
    renderDashboard();
    if (currentView === 'products') renderProducts();
}

function deleteProduct(id) {
    if (!confirm('هتحذف المنتج ده؟')) return;
    removeProduct(id);
    toast('تم حذف المنتج');
    renderDashboard();
    if (currentView === 'products') renderProducts();
}

/* ============================================================
   SALES
============================================================ */
function submitSale() {
    const desc   = document.getElementById('s-desc').value.trim();
    const amount = parseFloat(document.getElementById('s-amount').value) || 0;
    const type   = document.getElementById('s-type').value;

    if (!desc || amount <= 0) { toast('الوصف والمبلغ مطلوبين!', true); return; }

    addSale({ id: Date.now(), desc, amount, type, ...nowEG() });
    closeModal('modal-sale');
    clearFields(['s-desc','s-amount']);
    toast(`تم تسجيل ${amount.toFixed(2)} ج ✓`);
    updateStats();
    if (currentView === 'sales')     renderSales();
    if (currentView === 'dashboard') renderDashboard();
}

function quickSale() {
    const desc   = document.getElementById('qs-desc').value.trim();
    const amount = parseFloat(document.getElementById('qs-amount').value) || 0;

    if (!desc || amount <= 0) { toast('الوصف والمبلغ مطلوبين!', true); return; }

    addSale({ id: Date.now(), desc, amount, type: 'بيع', ...nowEG() });
    clearFields(['qs-desc','qs-amount']);
    toast(`تم تسجيل ${amount.toFixed(2)} ج ✓`);
    renderDashboard();
}

function deleteSale(id) {
    if (!confirm('هتحذف المبيعة دي؟')) return;
    removeSale(id);
    toast('تم حذف المبيعة');
    renderSales();
    updateStats();
}

/* ============================================================
   UTILS
============================================================ */
function clearFields(ids) { ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; }); }

function emptyRow(icon, msg, cols = 20) {
    return `<tr><td colspan="${cols}"><div class="empty"><div class="ei">${icon}</div><p>${msg}</p></div></td></tr>`;
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

/* ============================================================
   STATS
============================================================ */
function updateStats() {
    const products = getProducts();
    const sales    = getSales();
    const { monthKey } = nowEG();

    const monthRev = sales.filter(s => s.monthKey === monthKey).reduce((a, s) => a + s.amount, 0);
    const totalRev = sales.reduce((a, s) => a + s.amount, 0);
    const totalCost = products.reduce((a, p) => a + p.buy * p.qty, 0);
    const profit   = totalRev - totalCost;

    setText('stat-products', products.length);
    setText('stat-month-rev', monthRev.toFixed(0) + ' ج');
    setText('stat-total-rev', totalRev.toFixed(0) + ' ج');

    const el = document.getElementById('stat-profit');
    if (el) {
        el.textContent = profit.toFixed(0) + ' ج';
        el.style.color = profit >= 0 ? 'var(--green)' : 'var(--red)';
    }
}

/* ============================================================
   DASHBOARD VIEW
============================================================ */
function renderDashboard() {
    updateStats();
    _renderRecentProducts();
    _renderMonthlySummary();
}

function _renderRecentProducts() {
    const tbody = document.getElementById('recent-body');
    if (!tbody) return;
    const items = getProducts().slice(0, 5);
    if (!items.length) { tbody.innerHTML = emptyRow('📦', 'لا يوجد منتجات بعد — ابدأ بإضافة أول منتج!', 4); return; }
    tbody.innerHTML = items.map(p => `
        <tr>
            <td><div class="td-name">${p.name}</div><div class="td-sub">${p.cat}</div></td>
            <td><span class="badge badge-gold">${p.buy.toFixed(2)} ج</span></td>
            <td>${p.sell > 0 ? p.sell.toFixed(2) + ' ج' : '—'}</td>
            <td style="font-size:11px;color:var(--text2)">${p.date}</td>
        </tr>
    `).join('');
}

function _renderMonthlySummary() {
    const el = document.getElementById('monthly-summary');
    if (!el) return;
    const monthly = getMonthlyRevenue();
    if (!monthly.length) {
        el.innerHTML = '<div class="empty" style="padding:22px"><div class="ei">📅</div><p>لا يوجد بيانات بعد</p></div>';
        return;
    }
    const max = Math.max(...monthly.map(m => m[1].total));
    el.innerHTML = [...monthly].reverse().slice(0, 5).map(([, d]) => `
        <div class="month-row">
            <div class="month-bar-wrap">
                <div class="month-name">${d.label}</div>
                <div class="month-bar" style="width:${((d.total / max) * 100).toFixed(1)}%"></div>
                <div class="month-ops">${d.count} عملية</div>
            </div>
            <div class="month-amt">${d.total.toFixed(0)} ج</div>
        </div>
    `).join('');
}

/* ============================================================
   PRODUCTS VIEW
============================================================ */
function renderProducts() {
    const tbody     = document.getElementById('products-body');
    if (!tbody) return;
    const search    = (document.getElementById('p-search')?.value  || '').toLowerCase();
    const catFilter = document.getElementById('p-cat-filter')?.value || '';

    const items = getProducts().filter(p => {
        const ms = !search || p.name.toLowerCase().includes(search) || (p.notes || '').toLowerCase().includes(search);
        const mc = !catFilter || p.cat === catFilter;
        return ms && mc;
    });

    if (!items.length) { tbody.innerHTML = emptyRow('📦', 'لا يوجد منتجات', 12); return; }

    tbody.innerHTML = items.map((p, i) => {
        const pu = p.sell - p.buy;
        return `
        <tr>
            <td style="color:var(--text3)">${i + 1}</td>
            <td class="td-name">${p.name}</td>
            <td><span class="badge badge-gold">${p.cat}</span></td>
            <td>${p.buy.toFixed(2)} ج</td>
            <td>${p.sell > 0 ? p.sell.toFixed(2) + ' ج' : '—'}</td>
            <td>${p.qty}</td>
            <td class="${p.sell > 0 ? (pu >= 0 ? 'profit-pos' : 'profit-neg') : ''}">${p.sell > 0 ? (pu >= 0 ? '+' : '') + pu.toFixed(2) + ' ج' : '—'}</td>
            <td style="color:var(--gold)">${p.dayName}</td>
            <td style="font-size:12px">${p.date}</td>
            <td style="font-size:12px">${p.time}</td>
            <td style="color:var(--text2);font-size:12px">${p.notes || '—'}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">🗑️</button></td>
        </tr>`;
    }).join('');
}

/* ============================================================
   SALES VIEW
============================================================ */
function renderSales() {
    _renderSalesTable();
    _renderMonthlyBreakdown();
    _renderRevenueChart();
}

function _renderSalesTable() {
    const tbody = document.getElementById('sales-body');
    if (!tbody) return;
    const items = getSales();
    if (!items.length) { tbody.innerHTML = emptyRow('💰', 'لا يوجد مبيعات مسجلة بعد', 8); return; }
    tbody.innerHTML = items.map((s, i) => `
        <tr>
            <td style="color:var(--text3)">${i + 1}</td>
            <td class="td-name">${s.desc}</td>
            <td><strong style="color:var(--green)">${s.amount.toFixed(2)} ج</strong></td>
            <td><span class="badge badge-blue">${s.type}</span></td>
            <td style="color:var(--gold)">${s.dayName}</td>
            <td style="font-size:12px">${s.date}</td>
            <td style="font-size:12px">${s.time}</td>
            <td><button class="btn btn-danger btn-sm" onclick="deleteSale(${s.id})">🗑️</button></td>
        </tr>
    `).join('');
}

function _renderMonthlyBreakdown() {
    const el = document.getElementById('monthly-breakdown');
    if (!el) return;
    const monthly = getMonthlyRevenue();
    if (!monthly.length) {
        el.innerHTML = '<div class="empty"><div class="ei">📅</div><p>لا يوجد بيانات</p></div>';
        return;
    }
    const max = Math.max(...monthly.map(m => m[1].total));
    el.innerHTML = [...monthly].reverse().map(([, d]) => `
        <div class="month-row">
            <div class="month-bar-wrap">
                <div class="month-name">${d.label}</div>
                <div class="month-bar" style="width:${((d.total / max) * 100).toFixed(1)}%"></div>
                <div class="month-ops">${d.count} عملية</div>
            </div>
            <div class="month-amt">${d.total.toFixed(0)} ج</div>
        </div>
    `).join('');
}

function _renderRevenueChart() {
    const canvas = document.getElementById('revenue-chart');
    if (!canvas) return;
    const monthly = getMonthlyRevenue();

    if (revenueChart) { revenueChart.destroy(); revenueChart = null; }
    if (!monthly.length) return;

    revenueChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: monthly.map(m => m[1].label),
            datasets: [{
                label: 'الإيراد',
                data: monthly.map(m => m[1].total),
                backgroundColor: 'rgba(245,158,11,.7)',
                borderColor: '#f59e0b',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    rtl: true,
                    callbacks: { label: ctx => `${ctx.parsed.y.toFixed(2)} جنيه` },
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderWidth: 1,
                    titleColor: '#f59e0b',
                    bodyColor: '#f1f5f9',
                    padding: 12,
                    titleFont: { family: 'Cairo', weight: '700', size: 13 },
                    bodyFont:  { family: 'Cairo', size: 13 },
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(45,55,72,.5)' },
                    ticks: { color: '#94a3b8', font: { family: 'Cairo', size: 12 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Cairo', size: 12 } }
                }
            }
        }
    });
}

/* ============================================================
   INIT
============================================================ */
renderDashboard();
