/* API layer — all calls to Express/MongoDB backend */

const API = {

    async _req(url, opts = {}) {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...opts,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `خطأ ${res.status}`);
        return data;
    },

    /* ---- Expenses ---- */
    getExpenses(month)      { return this._req(`/api/expenses?month=${month}`); },
    addExpense(body)        { return this._req('/api/expenses', { method:'POST', body: JSON.stringify(body) }); },
    updateExpense(id, body) { return this._req(`/api/expenses/${id}`, { method:'PUT',  body: JSON.stringify(body) }); },
    deleteExpense(id)       { return this._req(`/api/expenses/${id}`, { method:'DELETE' }); },

    /* ---- Revenue ---- */
    getRevenue(month)       { return this._req(`/api/revenue?month=${month}`); },
    addRevenue(body)        { return this._req('/api/revenue', { method:'POST', body: JSON.stringify(body) }); },
    updateRevenue(id, body) { return this._req(`/api/revenue/${id}`, { method:'PUT',  body: JSON.stringify(body) }); },
    deleteRevenue(id)       { return this._req(`/api/revenue/${id}`, { method:'DELETE' }); },

    /* ---- Summary (all months) ---- */
    getSummary()            { return this._req('/api/summary'); },
};
