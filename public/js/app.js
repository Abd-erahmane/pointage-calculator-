const MONTH_NAMES = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const state = {
  etudiants:      [],
  selectedId:     null,   // étudiant actif
  year:           new Date().getFullYear(),
  month:          new Date().getMonth() + 1,
  absenceMap:     new Map(),
  joursLibresSet: new Set(),
  selectedISO:    null,
  selectedDow:    null,
  deleteTargetId: null,
};

// ── Bootstrap ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  bindNav();
  bindPanel();
  bindEtudiantForm();
  bindDeleteModal();
  loadEtudiants();
});

// ═══════════════════════════════════════════════════════════════════
// ÉTUDIANTS
// ═══════════════════════════════════════════════════════════════════

async function loadEtudiants() {
  try {
    state.etudiants = await api.getEtudiants();
    renderSidebar();
    // Si un étudiant était déjà sélectionné, le re-sélectionner
    if (state.selectedId) {
      const still = state.etudiants.find(e => e.id === state.selectedId);
      if (still) selectEtudiant(state.selectedId);
      else       deselectEtudiant();
    }
  } catch (err) {
    console.error('Erreur chargement étudiants :', err);
  }
}

function renderSidebar() {
  const ul = document.getElementById('etudiant-list');
  if (state.etudiants.length === 0) {
    ul.innerHTML = `<li class="px-4 py-6 text-center text-xs text-gray-400">
      Aucun étudiant.<br>Ajoutez-en un ci-dessus.
    </li>`;
    return;
  }

  ul.innerHTML = state.etudiants.map(e => {
    const initials = ((e.prenom?.[0] || '') + (e.nom?.[0] || '')).toUpperCase() || '?';
    const fullName = [e.prenom, e.nom].filter(Boolean).join(' ');
    const isActive = e.id === state.selectedId;

    return `
      <li data-id="${e.id}"
          class="etudiant-item flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl cursor-pointer
                 transition-all select-none
                 ${isActive ? 'bg-blue-600 text-white shadow' : 'hover:bg-gray-100 text-gray-700'}">
        <!-- Avatar initiales -->
        <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                    ${isActive ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-600'}">
          ${initials}
        </div>
        <!-- Nom -->
        <span class="flex-1 font-medium text-sm truncate">${fullName}</span>
        <!-- Bouton supprimer -->
        <button class="btn-delete-etudiant flex-shrink-0 opacity-0 group-hover:opacity-100
                       ${isActive ? 'text-blue-200 hover:text-white' : 'text-gray-300 hover:text-red-500'}
                       transition text-lg leading-none"
                data-id="${e.id}" data-name="${fullName}"
                title="Supprimer">×</button>
      </li>`;
  }).join('');

  // Rendre le bouton supprimer visible au hover de chaque li
  ul.querySelectorAll('.etudiant-item').forEach(li => {
    li.addEventListener('mouseenter', () => {
      li.querySelector('.btn-delete-etudiant').style.opacity = '1';
    });
    li.addEventListener('mouseleave', () => {
      if (li.dataset.id != state.selectedId)
        li.querySelector('.btn-delete-etudiant').style.opacity = '0';
    });
  });

  // Clic sélection
  ul.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.btn-delete-etudiant');
    if (delBtn) {
      e.stopPropagation();
      openDeleteModal(parseInt(delBtn.dataset.id), delBtn.dataset.name);
      return;
    }
    const li = e.target.closest('.etudiant-item');
    if (li) selectEtudiant(parseInt(li.dataset.id));
  });
}

function bindEtudiantForm() {
  document.getElementById('form-add-etudiant').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nom    = document.getElementById('input-nom').value.trim();
    const prenom = document.getElementById('input-prenom').value.trim();
    const errEl  = document.getElementById('add-error');

    if (!nom) {
      errEl.textContent = 'Le nom est requis.';
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');

    try {
      const created = await api.addEtudiant(nom, prenom);
      document.getElementById('input-nom').value    = '';
      document.getElementById('input-prenom').value = '';
      await loadEtudiants();
      selectEtudiant(created.id);
    } catch (err) {
      errEl.textContent = 'Erreur lors de l\'ajout.';
      errEl.classList.remove('hidden');
    }
  });
}

// ── Sélection d'un étudiant ────────────────────────────────────────
function selectEtudiant(id) {
  state.selectedId = id;
  const etudiant = state.etudiants.find(e => e.id === id);

  document.getElementById('placeholder').classList.add('hidden');
  document.getElementById('student-content').classList.remove('hidden');

  const fullName = etudiant
    ? [etudiant.prenom, etudiant.nom].filter(Boolean).join(' ')
    : '';
  document.getElementById('selected-name').textContent = fullName;

  renderSidebar();
  loadMonth();
}

function deselectEtudiant() {
  state.selectedId = null;
  document.getElementById('placeholder').classList.remove('hidden');
  document.getElementById('student-content').classList.add('hidden');
  renderSidebar();
}

// ── Suppression étudiant ───────────────────────────────────────────
function openDeleteModal(id, name) {
  state.deleteTargetId = id;
  document.getElementById('confirm-name').textContent = name;
  document.getElementById('confirm-delete').classList.remove('hidden');
}

function bindDeleteModal() {
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    document.getElementById('confirm-delete').classList.add('hidden');
    state.deleteTargetId = null;
  });
  document.getElementById('confirm-ok').addEventListener('click', async () => {
    if (!state.deleteTargetId) return;
    try {
      await api.deleteEtudiant(state.deleteTargetId);
      document.getElementById('confirm-delete').classList.add('hidden');
      if (state.selectedId === state.deleteTargetId) deselectEtudiant();
      state.deleteTargetId = null;
      await loadEtudiants();
    } catch (err) {
      console.error('Erreur suppression :', err);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// CALENDRIER / MOIS
// ═══════════════════════════════════════════════════════════════════

function bindNav() {
  document.getElementById('btn-prev').addEventListener('click', () => {
    if (state.month === 1) { state.month = 12; state.year--; }
    else { state.month--; }
    loadMonth();
  });
  document.getElementById('btn-next').addEventListener('click', () => {
    if (state.month === 12) { state.month = 1; state.year++; }
    else { state.month++; }
    loadMonth();
  });
}

async function loadMonth() {
  if (!state.selectedId) return;
  const { selectedId, year, month } = state;

  document.getElementById('month-label').textContent =
    `${MONTH_NAMES[month - 1]} ${year}`;

  try {
    const [absences, joursLibres, stats] = await Promise.all([
      api.getAbsences(selectedId, month, year),
      api.getJoursLibres(selectedId, month, year),
      api.getStats(selectedId, month, year),
    ]);

    state.absenceMap     = new Map(absences.map(a => [a.date, a]));
    state.joursLibresSet = new Set(joursLibres.map(j => j.date));

    renderCalendar(year, month, state.absenceMap, state.joursLibresSet, openPanel);
    updateDashboard(stats);
  } catch (err) {
    console.error('Erreur chargement mois :', err);
  }
}

// ── Dashboard ─────────────────────────────────────────────────────
function updateDashboard(stats) {
  document.getElementById('stat-theor').textContent   = `${stats.theoreticalHours}h`;
  document.getElementById('stat-present').textContent = `${stats.totalPresent}h`;
  document.getElementById('stat-absent').textContent  = `${stats.totalAbsent}h`;

  const pct   = stats.percentage;
  const pctEl = document.getElementById('stat-pct');
  pctEl.textContent = `${pct.toFixed(2)}%`;

  // Badge couleur taux
  const wrap = document.getElementById('stat-pct-wrap');
  wrap.className = 'font-bold px-3 py-1 rounded-full text-sm ';
  if (pct > 20)       wrap.className += 'bg-red-100 text-red-700';
  else if (pct > 10)  wrap.className += 'bg-yellow-100 text-yellow-700';
  else                wrap.className += 'bg-green-100 text-green-700';

  // Barre
  const bar = document.getElementById('absence-bar');
  bar.style.width = `${Math.min(pct, 100)}%`;
  bar.className = 'h-2 rounded-full';
  if (pct <= 10)      bar.classList.add('bar-ok');
  else if (pct <= 20) bar.classList.add('bar-warning');
  else                bar.classList.add('bar-danger');

  // Alerte
  const banner = document.getElementById('alert-banner');
  if (stats.alert) {
    banner.classList.remove('hidden');
    document.getElementById('alert-pct').textContent = `${pct.toFixed(2)}%`;
  } else {
    banner.classList.add('hidden');
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODAL SAISIE JOUR
// ═══════════════════════════════════════════════════════════════════

function openPanel(iso, dow) {
  state.selectedISO = iso;
  state.selectedDow = dow;

  const maxH  = dow === 4 ? 3 : 7;
  const isLib = state.joursLibresSet.has(iso);
  const abs   = state.absenceMap.get(iso);

  const [y, m, d] = iso.split('-');
  const dowLabels = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  document.getElementById('panel-title').textContent =
    `${dowLabels[dow]} ${d}/${m}/${y}`;

  const maxEl = document.getElementById('panel-max');
  maxEl.textContent = `Journée théorique : ${maxH}h`;
  maxEl.className   = dow === 4 ? 'text-xs font-bold text-orange-500' : 'text-xs text-gray-400';

  document.getElementById('panel-jour-libre').checked = isLib;

  const hpEl = document.getElementById('panel-hp');
  const haEl = document.getElementById('panel-ha');
  hpEl.max = maxH; haEl.max = maxH;
  hpEl.value = abs ? parseFloat(abs.heures_presentes) : '';
  haEl.value = abs ? parseFloat(abs.heures_absentes)  : '';

  document.getElementById('panel-motif').value = '';
  togglePanelFields(isLib);
  updateHoursUI();

  document.getElementById('day-panel').classList.remove('hidden');
  hpEl.focus();
}

function togglePanelFields(isLib) {
  document.getElementById('panel-hours').style.display = isLib ? 'none' : '';
  document.getElementById('panel-motif-row').classList.toggle('hidden', !isLib);
}

// ── Indicateur visuel ─────────────────────────────────────────────
function updateHoursUI() {
  const maxH = state.selectedDow === 4 ? 3 : 7;
  const hp   = parseFloat(document.getElementById('panel-hp').value) || 0;
  const ha   = parseFloat(document.getElementById('panel-ha').value) || 0;
  const tot  = hp + ha;
  const over = tot > maxH;

  document.getElementById('hp-hint').textContent = hp > 0 ? `${hp}h` : '';
  document.getElementById('ha-hint').textContent = ha > 0 ? `${ha}h` : '';

  const totalLabel = document.getElementById('hours-total-label');
  totalLabel.textContent = `${tot}h / ${maxH}h`;
  totalLabel.style.color = over ? '#dc2626' : (tot === maxH ? '#16a34a' : '#374151');

  const hpPct = Math.min((hp / maxH) * 100, 100);
  const haPct = Math.min((ha / maxH) * 100, 100 - hpPct);
  document.getElementById('hours-bar-present').style.width = `${hpPct}%`;
  document.getElementById('hours-bar-absent').style.width  = `${haPct}%`;
  document.getElementById('hours-bar-absent').style.backgroundColor = over ? '#ef4444' : '#f87171';

  document.getElementById('lbl-present-pct').textContent = hp > 0 ? `${hp}h présent` : '';
  document.getElementById('lbl-absent-pct').textContent  = ha > 0 ? `${ha}h absent`  : '';

  const errEl = document.getElementById('hours-error');
  if (over) {
    errEl.textContent = `⚠ Total dépasse ${maxH}h — maximum du ${state.selectedDow === 4 ? 'jeudi' : 'jour'} !`;
    errEl.classList.remove('hidden');
  } else {
    errEl.classList.add('hidden');
  }

  const hpInput = document.getElementById('panel-hp');
  const haInput = document.getElementById('panel-ha');
  hpInput.style.borderColor = over ? '#ef4444' : '';
  haInput.style.borderColor = over ? '#ef4444' : '';

  const saveBtn = document.getElementById('btn-save');
  saveBtn.disabled = over;
  saveBtn.className = over
    ? 'w-full bg-gray-300 text-gray-500 font-bold py-2.5 rounded-xl text-sm cursor-not-allowed'
    : 'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition text-sm';
}

// ── Contrôles du panneau ──────────────────────────────────────────
function bindPanel() {
  document.getElementById('panel-close').addEventListener('click', closePanel);
  document.getElementById('day-panel').addEventListener('click', (e) => {
    if (e.target.id === 'day-panel') closePanel();
  });
  document.getElementById('panel-jour-libre').addEventListener('change', (e) => {
    togglePanelFields(e.target.checked);
  });

  document.getElementById('panel-hp').addEventListener('input', updateHoursUI);
  document.getElementById('panel-ha').addEventListener('input', updateHoursUI);

  document.getElementById('hp-plus') .addEventListener('click', () => stepHours('hp', +0.5));
  document.getElementById('hp-minus').addEventListener('click', () => stepHours('hp', -0.5));
  document.getElementById('ha-plus') .addEventListener('click', () => stepHours('ha', +0.5));
  document.getElementById('ha-minus').addEventListener('click', () => stepHours('ha', -0.5));

  document.getElementById('btn-full-present').addEventListener('click', () => {
    const maxH = state.selectedDow === 4 ? 3 : 7;
    document.getElementById('panel-hp').value = maxH;
    document.getElementById('panel-ha').value = 0;
    updateHoursUI();
  });
  document.getElementById('btn-full-absent').addEventListener('click', () => {
    const maxH = state.selectedDow === 4 ? 3 : 7;
    document.getElementById('panel-hp').value = 0;
    document.getElementById('panel-ha').value = maxH;
    updateHoursUI();
  });

  document.getElementById('btn-save').addEventListener('click', handleSave);
}

function stepHours(field, delta) {
  const el   = document.getElementById(`panel-${field}`);
  const maxH = state.selectedDow === 4 ? 3 : 7;
  const next = Math.min(Math.max((parseFloat(el.value) || 0) + delta, 0), maxH);
  el.value   = Math.round(next * 10) / 10;
  updateHoursUI();
}

function closePanel() {
  document.getElementById('day-panel').classList.add('hidden');
  state.selectedISO = null;
  state.selectedDow = null;
}

// ── Sauvegarde ────────────────────────────────────────────────────
async function handleSave() {
  const { selectedId, selectedISO, selectedDow } = state;
  if (!selectedISO || !selectedId) return;

  const isLib = document.getElementById('panel-jour-libre').checked;

  if (!isLib) {
    const maxH = selectedDow === 4 ? 3 : 7;
    const hp   = parseFloat(document.getElementById('panel-hp').value) || 0;
    const ha   = parseFloat(document.getElementById('panel-ha').value) || 0;
    if (hp + ha > maxH) {
      document.getElementById('hours-error').textContent =
        `⚠ Total (${hp + ha}h) dépasse le maximum autorisé (${maxH}h).`;
      document.getElementById('hours-error').classList.remove('hidden');
      return;
    }
  }

  try {
    if (isLib) {
      const motif = document.getElementById('panel-motif').value.trim();
      await api.addJourLibre(selectedId, selectedISO, motif);
    } else {
      if (state.joursLibresSet.has(selectedISO)) {
        await api.removeJourLibre(selectedId, selectedISO);
      }
      const hp = parseFloat(document.getElementById('panel-hp').value) || 0;
      const ha = parseFloat(document.getElementById('panel-ha').value) || 0;
      await api.upsertAbsence(selectedId, selectedISO, hp, ha);
    }
    closePanel();
    await loadMonth();
  } catch (err) {
    console.error('Erreur sauvegarde :', err);
    alert("Erreur lors de l'enregistrement.");
  }
}
