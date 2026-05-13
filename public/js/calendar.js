/* Rendu du calendrier mensuel. Exposé globalement via window.renderCalendar. */

const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function toISO(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function renderCalendar(year, month, absenceMap, joursLibresSet, onDayClick) {
  const today    = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // ── En-têtes ──
  const headerEl = document.getElementById('cal-headers');
  headerEl.innerHTML = WEEKDAY_LABELS.map((name, i) =>
    `<div class="weekday-header ${i >= 5 ? 'weekend-header' : ''}">${name}</div>`
  ).join('');

  // ── Cellules ──
  const daysEl      = document.getElementById('cal-days');
  const firstDow    = new Date(year, month - 1, 1).getDay(); // 0=Dim
  const daysInMonth = new Date(year, month, 0).getDate();

  let html = '';

  // Cellules vides avant le 1er
  for (let i = 0; i < firstDow; i++) {
    html += `<div class="day-cell day-empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dow    = new Date(year, month - 1, d).getDay();
    const iso    = toISO(year, month, d);
    const isWE   = dow === 5 || dow === 6;
    const isFut  = iso > todayISO;
    const isToday= iso === todayISO;
    const isLib  = joursLibresSet.has(iso);
    const abs    = absenceMap.get(iso);

    let cls  = 'day-cell';
    let info = '';

    if (isWE) {
      cls += ' day-weekend';
    } else if (isLib) {
      cls  += ' day-libre clickable';
      info  = `<div class="day-hours">🗓 Jour libre</div>`;
    } else if (abs) {
      const ha = parseFloat(abs.heures_absentes);
      const hp = parseFloat(abs.heures_presentes);
      if (ha === 0) {
        cls  += ' day-present clickable';
        info  = `<div class="day-hours">✓ ${hp}h présent</div>`;
      } else {
        cls  += ' day-absent clickable';
        info  = `<div class="day-hours">✗ ${ha}h absent</div>`;
        if (hp > 0) info += `<div class="day-hours">✓ ${hp}h présent</div>`;
      }
    } else if (!isFut) {
      cls += ' clickable';
    } else {
      cls += ' day-future';
    }

    if (isToday) cls += ' day-today';

    const data = (!isWE && !isFut)
      ? `data-iso="${iso}" data-dow="${dow}"`
      : '';

    html += `
      <div class="${cls}" ${data}>
        <span class="day-number">${d}</span>
        ${info}
      </div>`;
  }

  daysEl.innerHTML = html;

  // Event delegation — un seul listener
  daysEl.onclick = (e) => {
    const cell = e.target.closest('[data-iso]');
    if (cell) onDayClick(cell.dataset.iso, parseInt(cell.dataset.dow));
  };
}

window.renderCalendar = renderCalendar;
window.toISO = toISO;
