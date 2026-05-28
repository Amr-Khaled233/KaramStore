/* Date helpers only — data now lives in MongoDB */

const DAYS_AR   = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const MONTHS_AR = ['يناير','فبراير','مارس','إبريل','مايو','يونيو',
                   'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function nowEG() {
    const d  = new Date();
    const h  = d.getHours(), m = d.getMinutes();
    const h12 = h % 12 || 12;
    return {
        name:       '',
        amount:     0,
        notes:      '',
        dayName:    DAYS_AR[d.getDay()],
        date:       `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`,
        time:       `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${h >= 12 ? 'م' : 'ص'}`,
        monthKey:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
        monthLabel: `${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`,
    };
}

function monthLabel(monthKey) {
    const [y, m] = monthKey.split('-').map(Number);
    return `${MONTHS_AR[m - 1]} ${y}`;
}

function currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function shiftMonth(monthKey, delta) {
    const [y, m] = monthKey.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
