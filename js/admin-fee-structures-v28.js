(function () {
  'use strict';
  const h = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const money = (v) => `KES ${Number(v || 0).toLocaleString()}`;
  const pick = (obj, ...keys) => keys.reduce((v,k)=> v ?? obj?.[k], undefined);

  function statusBox(msg, type='info') {
    const el = document.getElementById('fee-structure-status') || document.getElementById('dashboard-content') || document.body;
    const box = document.createElement('div');
    box.className = `v30-finance-status ${type}`;
    box.textContent = msg;
    el.prepend(box);
    setTimeout(() => box.remove(), 6000);
  }

  function itemRow(i = Date.now(), name = '', amount = '') {
    return `<div class="v30-fee-item-row" data-row="${i}">
      <input class="v30-input fee-item-name" placeholder="Fee item e.g. Tuition, Lunch, Transport" value="${h(name)}">
      <input class="v30-input fee-item-amount" type="number" min="0" step="1" placeholder="Amount" value="${h(amount)}">
      <button type="button" class="v30-btn subtle danger" onclick="this.closest('.v30-fee-item-row').remove();v28RecalcFeeTotal()">Remove</button>
    </div>`;
  }

  function normaliseRows(res) {
    return Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res?.feeStructures) ? res.feeStructures : [];
  }

  window.v28RenderAdminFeeStructures = async function () {
    const root = document.getElementById('dashboard-content') || document.getElementById('admin-content') || document.querySelector('main');
    if (!root) return;
    root.innerHTML = `<section class="v30-finance-page">
      <div class="v30-finance-hero">
        <div>
          <p class="v30-kicker">Finance control centre</p>
          <h1>Class Fee Structures</h1>
          <p>Set different fee structures per class, term, year, curriculum and optional services. Assign them to students, lock them after approval, and keep balances auditable.</p>
        </div>
        <div class="v30-hero-actions">
          <button class="v30-btn primary" onclick="v28OpenFeeStructureForm()">+ Create Fee Structure</button>
          <button class="v30-btn" onclick="v28LoadFeeStructures()">Refresh</button>
        </div>
      </div>
      <div id="fee-structure-status"></div>
      <div class="v30-finance-summary" id="v30-fee-summary">
        <div class="v30-summary-card"><span>Total Structures</span><strong>—</strong></div>
        <div class="v30-summary-card"><span>Active</span><strong>—</strong></div>
        <div class="v30-summary-card"><span>Locked</span><strong>—</strong></div>
        <div class="v30-summary-card"><span>Total Configured</span><strong>—</strong></div>
      </div>
      <div class="v30-finance-toolbar">
        <input id="v30-fee-search" class="v30-input" placeholder="Search class, term, curriculum or item..." oninput="v28RenderFeeStructureRows()">
        <select id="v30-fee-status-filter" class="v30-input" onchange="v28RenderFeeStructureRows()">
          <option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="locked">Locked</option>
        </select>
      </div>
      <div id="v28-fee-structure-list" class="v30-fee-list"></div>
    </section>`;
    await window.v28LoadFeeStructures();
  };

  window.v28LoadFeeStructures = async function () {
    const list = document.getElementById('v28-fee-structure-list');
    if (!list) return;
    if (!window.api?.feeStructures) {
      list.innerHTML = '<div class="v30-empty">Fee structure API is not loaded. Hard refresh the browser after deploying the frontend.</div>';
      return;
    }
    list.innerHTML = '<div class="v30-empty">Loading fee structures...</div>';
    try {
      const res = await api.feeStructures.list();
      window.__v30FeeStructures = normaliseRows(res);
      window.v28RenderFeeStructureRows();
    } catch (e) {
      list.innerHTML = `<div class="v30-empty danger">${h(e.message || 'Unable to load fee structures')}</div>`;
    }
  };

  window.v28RenderFeeStructureRows = function () {
    const list = document.getElementById('v28-fee-structure-list');
    if (!list) return;
    const rows = window.__v30FeeStructures || [];
    const q = (document.getElementById('v30-fee-search')?.value || '').toLowerCase();
    const status = document.getElementById('v30-fee-status-filter')?.value || '';
    const filtered = rows.filter(s => {
      const hay = `${s.name||''} ${s.className||''} ${s.gradeLevel||''} ${s.term||''} ${s.year||''} ${s.curriculum||''} ${(s.items||[]).map(i=>i.name).join(' ')}`.toLowerCase();
      return (!q || hay.includes(q)) && (!status || String(s.status || '').toLowerCase() === status);
    });
    const total = rows.reduce((sum, s) => sum + Number(pick(s,'totalAmount','amount','total') || 0), 0);
    const active = rows.filter(s => String(s.status).toLowerCase() === 'active').length;
    const locked = rows.filter(s => String(s.status).toLowerCase() === 'locked' || s.locked).length;
    const summary = document.getElementById('v30-fee-summary');
    if (summary) summary.innerHTML = `<div class="v30-summary-card"><span>Total Structures</span><strong>${rows.length}</strong></div><div class="v30-summary-card"><span>Active</span><strong>${active}</strong></div><div class="v30-summary-card"><span>Locked</span><strong>${locked}</strong></div><div class="v30-summary-card"><span>Total Configured</span><strong>${money(total)}</strong></div>`;
    if (!filtered.length) {
      list.innerHTML = '<div class="v30-empty">No fee structures found. Create one for a class, term and year.</div>';
      return;
    }
    list.innerHTML = filtered.map(s => {
      const totalAmount = pick(s,'totalAmount','amount','total') || 0;
      const items = Array.isArray(s.items) ? s.items : [];
      const lockedState = String(s.status).toLowerCase() === 'locked' || s.locked;
      return `<article class="v30-fee-card">
        <div class="v30-card-main">
          <div>
            <div class="v30-card-title-row"><h3>${h(s.name || `${s.className || s.gradeLevel || 'Class'} Fees`)}</h3><span class="v30-pill ${h(String(s.status || 'draft').toLowerCase())}">${h(s.status || 'draft')}</span></div>
            <p class="v30-card-meta">${h(s.className || s.gradeLevel || 'No class set')} • ${h(s.term || 'Term')} ${h(s.year || '')} • ${h(s.curriculum || 'CBC')} ${s.dueDate ? '• Due ' + h(new Date(s.dueDate).toLocaleDateString()) : ''}</p>
            <div class="v30-item-chips">${items.length ? items.slice(0,8).map(i => `<span>${h(i.name)} <b>${money(i.amount)}</b></span>`).join('') : '<span>No items configured</span>'}</div>
          </div>
          <div class="v30-card-total"><span>Total</span><strong>${money(totalAmount)}</strong></div>
        </div>
        <div class="v30-card-actions">
          <button class="v30-btn" onclick="v28EditFeeStructure(${Number(s.id)})" ${lockedState ? 'title="Locked structures should only be adjusted through approved corrections"' : ''}>Edit</button>
          <button class="v30-btn" onclick="v28ActivateFeeStructure(${Number(s.id)})">Activate</button>
          <button class="v30-btn primary" onclick="v28AssignFeeStructure(${Number(s.id)})">Assign to Class</button>
          <button class="v30-btn danger" onclick="v28LockFeeStructure(${Number(s.id)})">Lock</button>
        </div>
      </article>`;
    }).join('');
  };

  window.v28OpenFeeStructureForm = function (structure = null) {
    const modal = document.createElement('div');
    modal.className = 'v30-modal-shell';
    const items = structure?.items?.length ? structure.items : [
      { name: 'Tuition', amount: '' }, { name: 'Lunch', amount: '' }, { name: 'Transport', amount: '' }
    ];
    modal.innerHTML = `<div class="v30-modal">
      <div class="v30-modal-head"><div><p class="v30-kicker">Fee setup</p><h2>${structure ? 'Edit Fee Structure' : 'Create Fee Structure'}</h2></div><button class="v30-icon-btn" onclick="this.closest('.v30-modal-shell').remove()">×</button></div>
      <div class="v30-form-grid">
        <label>Name<input id="fs-name" class="v30-input" placeholder="Grade 6 Term 1 Fees" value="${h(structure?.name || '')}"></label>
        <label>Class / Grade<input id="fs-class" class="v30-input" placeholder="Grade 6 Blue" value="${h(structure?.className || structure?.gradeLevel || '')}"></label>
        <label>Term<select id="fs-term" class="v30-input"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></label>
        <label>Year<input id="fs-year" class="v30-input" type="number" value="${h(structure?.year || new Date().getFullYear())}"></label>
        <label>Curriculum<input id="fs-curriculum" class="v30-input" placeholder="CBC / CBE / 8-4-4" value="${h(structure?.curriculum || 'CBC')}"></label>
        <label>Due Date<input id="fs-due" class="v30-input" type="date" value="${structure?.dueDate ? new Date(structure.dueDate).toISOString().slice(0,10) : ''}"></label>
      </div>
      <div class="v30-section-title"><h3>Fee Items</h3><button class="v30-btn" onclick="document.getElementById('fs-items').insertAdjacentHTML('beforeend', window.v28FeeItemRow());v28RecalcFeeTotal()">+ Add Item</button></div>
      <div id="fs-items">${items.map((i, idx) => itemRow(idx+1, i.name, i.amount)).join('')}</div>
      <div class="v30-total-line"><span>Calculated total</span><strong id="fs-total">KES 0</strong></div>
      <div class="v30-modal-actions"><button class="v30-btn" onclick="this.closest('.v30-modal-shell').remove()">Cancel</button><button class="v30-btn primary" onclick="v28SaveFeeStructure(${structure?.id || 'null'})">Save Fee Structure</button></div>
    </div>`;
    document.body.appendChild(modal);
    document.getElementById('fs-term').value = structure?.term || 'Term 1';
    document.querySelectorAll('.fee-item-amount').forEach(i => i.addEventListener('input', window.v28RecalcFeeTotal));
    window.v28RecalcFeeTotal();
  };

  window.v28FeeItemRow = () => itemRow(Date.now());
  window.v28RecalcFeeTotal = function () {
    const total = [...document.querySelectorAll('.fee-item-amount')].reduce((s, i) => s + Math.max(0, Number(i.value || 0)), 0);
    const el = document.getElementById('fs-total'); if (el) el.textContent = money(total);
  };

  window.v28SaveFeeStructure = async function (id) {
    const items = [...document.querySelectorAll('.v30-fee-item-row')].map(row => ({ name: row.querySelector('.fee-item-name')?.value?.trim(), amount: Number(row.querySelector('.fee-item-amount')?.value || 0) })).filter(i => i.name && i.amount >= 0);
    const className = document.getElementById('fs-class')?.value?.trim();
    const data = { name: document.getElementById('fs-name')?.value?.trim(), className, gradeLevel: className, term: document.getElementById('fs-term')?.value, year: Number(document.getElementById('fs-year')?.value), curriculum: document.getElementById('fs-curriculum')?.value?.trim() || 'CBC', dueDate: document.getElementById('fs-due')?.value || null, items };
    if (!data.name || !data.className || !items.length) return statusBox('Name, class and at least one fee item are required.', 'danger');
    try {
      if (id) await api.feeStructures.update(id, data); else await api.feeStructures.create(data);
      document.querySelector('.v30-modal-shell')?.remove();
      statusBox('Fee structure saved successfully.', 'success');
      await v28LoadFeeStructures();
    } catch (e) { statusBox(e.message || 'Failed to save fee structure.', 'danger'); }
  };

  window.v28EditFeeStructure = async function (id) { try { const res = await api.feeStructures.get(id); v28OpenFeeStructureForm(res.data); } catch (e) { statusBox(e.message, 'danger'); } };
  window.v28ActivateFeeStructure = async id => { try { await api.feeStructures.activate(id); statusBox('Fee structure activated.', 'success'); await v28LoadFeeStructures(); } catch(e) { statusBox(e.message, 'danger'); } };
  window.v28LockFeeStructure = async id => { if (!confirm('Lock this fee structure? Locked structures cannot be silently edited.')) return; try { await api.feeStructures.lock(id); statusBox('Fee structure locked.', 'success'); await v28LoadFeeStructures(); } catch(e) { statusBox(e.message, 'danger'); } };
  window.v28AssignFeeStructure = async id => {
    const overwrite = confirm('Assign this structure to matching class students. OK = overwrite existing accounts for same term/year. Cancel = skip existing accounts.');
    try { const res = await api.feeStructures.assign(id, { overwrite }); statusBox(`Assignment completed for ${res.data?.results?.length || res.data?.assigned || 0} students.`, 'success'); } catch(e) { statusBox(e.message, 'danger'); }
  };
})();
