(function () {
  'use strict';
  const h = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const money = (v) => `KES ${Number(v || 0).toLocaleString()}`;
  const out = (msg, type='info') => {
    const el = document.getElementById('fee-structure-status') || document.getElementById('dashboard-content') || document.body;
    const box = document.createElement('div');
    box.className = `v28-status ${type}`;
    box.textContent = msg;
    el.prepend(box);
    setTimeout(() => box.remove(), 8000);
  };
  function itemRow(i = 1, name = '', amount = '') {
    return `<div class="v28-fee-item-row" data-row="${i}"><input class="v28-input fee-item-name" placeholder="Fee item e.g. Tuition" value="${h(name)}"><input class="v28-input fee-item-amount" type="number" min="0" placeholder="Amount" value="${h(amount)}"><button type="button" class="v28-btn danger" onclick="this.closest('.v28-fee-item-row').remove();v28RecalcFeeTotal()">Remove</button></div>`;
  }
  window.v28RenderAdminFeeStructures = async function () {
    const root = document.getElementById('dashboard-content') || document.getElementById('admin-content') || document.querySelector('main');
    if (!root) return;
    root.innerHTML = `<section class="v28-page"><div class="v28-hero"><div><p class="v28-eyebrow">Finance</p><h1>Fee Structures</h1><p>Create class-based fee structures, assign them to students, lock terms, and keep all changes audited.</p></div><button class="v28-btn primary" onclick="v28OpenFeeStructureForm()">Create Fee Structure</button></div><div id="fee-structure-status"></div><div id="v28-fee-structure-list" class="v28-grid"></div></section>`;
    await window.v28LoadFeeStructures();
  };
  window.v28LoadFeeStructures = async function () {
    const list = document.getElementById('v28-fee-structure-list');
    if (!list || !window.api?.feeStructures) return;
    try {
      const res = await api.feeStructures.list();
      const rows = res.data || [];
      list.innerHTML = rows.length ? rows.map(s => `<article class="v28-card"><div class="v28-card-head"><div><h3>${h(s.name)}</h3><p>${h(s.className)} • ${h(s.term)} ${h(s.year)} • ${h(s.curriculum || '')}</p></div><span class="v28-pill ${h(s.status)}">${h(s.status)}</span></div><div class="v28-total">${money(s.totalAmount)}</div><div class="v28-items">${(s.items || []).map(i => `<span>${h(i.name)}: ${money(i.amount)}</span>`).join('')}</div><div class="v28-actions"><button class="v28-btn" onclick="v28EditFeeStructure(${s.id})">Edit</button><button class="v28-btn" onclick="v28ActivateFeeStructure(${s.id})">Activate</button><button class="v28-btn" onclick="v28AssignFeeStructure(${s.id})">Assign</button><button class="v28-btn danger" onclick="v28LockFeeStructure(${s.id})">Lock</button></div></article>`).join('') : '<div class="v28-card">No fee structures found. Create the first one for a class/term.</div>';
    } catch (e) { list.innerHTML = `<div class="v28-card danger">${h(e.message)}</div>`; }
  };
  window.v28OpenFeeStructureForm = function (structure = null) {
    const modal = document.createElement('div');
    modal.className = 'v28-modal-shell';
    const items = structure?.items?.length ? structure.items : [{ name: 'Tuition', amount: '' }];
    modal.innerHTML = `<div class="v28-modal"><div class="v28-modal-head"><h2>${structure ? 'Edit' : 'Create'} Fee Structure</h2><button onclick="this.closest('.v28-modal-shell').remove()">×</button></div><div class="v28-form-grid"><input id="fs-name" class="v28-input" placeholder="Name e.g. Grade 6 Term 1 Fees" value="${h(structure?.name || '')}"><input id="fs-class" class="v28-input" placeholder="Class / Grade e.g. Grade 6" value="${h(structure?.className || '')}"><select id="fs-term" class="v28-input"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select><input id="fs-year" class="v28-input" type="number" value="${h(structure?.year || new Date().getFullYear())}"><input id="fs-curriculum" class="v28-input" placeholder="Curriculum e.g. CBC" value="${h(structure?.curriculum || 'CBC')}"><input id="fs-due" class="v28-input" type="date" value="${structure?.dueDate ? new Date(structure.dueDate).toISOString().slice(0,10) : ''}"></div><h3>Required fee items</h3><div id="fs-items">${items.map((i, idx) => itemRow(idx+1, i.name, i.amount)).join('')}</div><button class="v28-btn" onclick="document.getElementById('fs-items').insertAdjacentHTML('beforeend', window.v28FeeItemRow());v28RecalcFeeTotal()">Add Item</button><div class="v28-total-line">Total: <strong id="fs-total">KES 0</strong></div><div class="v28-modal-actions"><button class="v28-btn" onclick="this.closest('.v28-modal-shell').remove()">Cancel</button><button class="v28-btn primary" onclick="v28SaveFeeStructure(${structure?.id || 'null'})">Save</button></div></div>`;
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
    const items = [...document.querySelectorAll('.v28-fee-item-row')].map(row => ({ name: row.querySelector('.fee-item-name')?.value, amount: Number(row.querySelector('.fee-item-amount')?.value || 0) })).filter(i => i.name);
    const data = { name: document.getElementById('fs-name')?.value, className: document.getElementById('fs-class')?.value, gradeLevel: document.getElementById('fs-class')?.value, term: document.getElementById('fs-term')?.value, year: Number(document.getElementById('fs-year')?.value), curriculum: document.getElementById('fs-curriculum')?.value, dueDate: document.getElementById('fs-due')?.value || null, items };
    try { if (id) await api.feeStructures.update(id, data); else await api.feeStructures.create(data); document.querySelector('.v28-modal-shell')?.remove(); out('Fee structure saved.', 'success'); await v28LoadFeeStructures(); } catch (e) { out(e.message, 'danger'); }
  };
  window.v28EditFeeStructure = async function (id) { try { const res = await api.feeStructures.get(id); v28OpenFeeStructureForm(res.data); } catch (e) { out(e.message, 'danger'); } };
  window.v28ActivateFeeStructure = async id => { try { await api.feeStructures.activate(id); out('Fee structure activated.', 'success'); await v28LoadFeeStructures(); } catch(e) { out(e.message, 'danger'); } };
  window.v28LockFeeStructure = async id => { if (!confirm('Lock this fee structure? Locked structures cannot be silently edited.')) return; try { await api.feeStructures.lock(id); out('Fee structure locked.', 'success'); await v28LoadFeeStructures(); } catch(e) { out(e.message, 'danger'); } };
  window.v28AssignFeeStructure = async id => { const overwrite = confirm('Assign to matching class students. Press OK to overwrite existing accounts for the same term/year, or Cancel to skip existing accounts.'); try { const res = await api.feeStructures.assign(id, { overwrite }); out(`Assignment completed for ${res.data?.results?.length || 0} students.`, 'success'); } catch(e) { out(e.message, 'danger'); } };
})();
