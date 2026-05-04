// Shule AI v15 scale upgrade layer: paginated list protection and scale-ready API helpers.
(function () {
  'use strict';

  const DEFAULT_LIMIT = 50;
  const MAX_LIMIT = 100;

  function clampLimit(limit) {
    const value = parseInt(limit || DEFAULT_LIMIT, 10);
    if (!Number.isFinite(value)) return DEFAULT_LIMIT;
    return Math.min(Math.max(value, 1), MAX_LIMIT);
  }

  function query(params) {
    const out = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') out.set(k, v);
    });
    const s = out.toString();
    return s ? `?${s}` : '';
  }

  async function scaleRequest(path, params = {}) {
    const page = Math.max(1, parseInt(params.page || 1, 10));
    const limit = clampLimit(params.limit);
    return apiRequest(`/api/scale${path}${query({ ...params, page, limit })}`);
  }

  window.scaleAPI = {
    students: (params) => scaleRequest('/students', params),
    teachers: (params) => scaleRequest('/teachers', params),
    parents: (params) => scaleRequest('/parents', params),
    academicRecords: (params) => scaleRequest('/academic-records', params),
    attendance: (params) => scaleRequest('/attendance', params),
    alerts: (params) => scaleRequest('/alerts', params),
    messages: (params) => scaleRequest('/messages', params),
    overview: (params) => scaleRequest('/overview', params),
    queueCsvImport: (payload) => apiRequest('/api/jobs/csv-import', { method: 'POST', body: JSON.stringify(payload || {}) }),
    queueMarksImport: (payload) => apiRequest('/api/jobs/marks-import', { method: 'POST', body: JSON.stringify(payload || {}) }),
    queueReportCards: (payload) => apiRequest('/api/jobs/report-cards', { method: 'POST', body: JSON.stringify(payload || {}) }),
    jobs: (params) => apiRequest(`/api/jobs${query(params || {})}`)
  };

  function normalizePagedResponse(resp) {
    const data = resp?.data || resp || {};
    if (Array.isArray(data)) return { rows: data, pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 } };
    return { rows: data.rows || data.items || [], pagination: data.pagination || { page: 1, limit: DEFAULT_LIMIT, total: (data.rows || []).length, totalPages: 1 } };
  }

  function renderPagination(container, pagination, onPage) {
    if (!container || !pagination) return;
    const { page, totalPages, total, limit } = pagination;
    container.innerHTML = `
      <div class="pagination-bar" style="display:flex;align-items:center;gap:10px;justify-content:space-between;margin-top:16px;flex-wrap:wrap;">
        <span>Showing page ${page} of ${totalPages || 1} • ${total || 0} total • ${limit || DEFAULT_LIMIT} per page</span>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">Previous</button>
          <button class="btn btn-sm" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">Next</button>
        </div>
      </div>`;
    container.querySelectorAll('button[data-page]').forEach(btn => btn.onclick = () => onPage(parseInt(btn.dataset.page, 10)));
  }

  window.v15LoadScaleStudents = async function (options = {}) {
    const target = document.getElementById(options.targetId || 'adminStudentsTable') || document.getElementById('studentsTableBody');
    const pager = document.getElementById(options.pagerId || 'adminStudentsPager');
    const page = options.page || 1;
    const res = await window.scaleAPI.students({ page, limit: options.limit || DEFAULT_LIMIT, search: options.search || '', grade: options.grade || '', status: options.status || 'active' });
    const { rows, pagination } = normalizePagedResponse(res);
    if (target) {
      target.innerHTML = rows.map(s => {
        const u = s.User || s.user || {};
        return `<tr><td>${u.name || 'Unnamed'}</td><td>${s.elimuid || '-'}</td><td>${s.grade || '-'}</td><td>${u.phone || '-'}</td><td>${s.status || '-'}</td></tr>`;
      }).join('') || '<tr><td colspan="5">No students found.</td></tr>';
    }
    renderPagination(pager, pagination, nextPage => window.v15LoadScaleStudents({ ...options, page: nextPage }));
    return rows;
  };

  window.v15LoadScaleTeachers = async function (options = {}) {
    const target = document.getElementById(options.targetId || 'adminTeachersTable') || document.getElementById('teachersTableBody');
    const pager = document.getElementById(options.pagerId || 'adminTeachersPager');
    const res = await window.scaleAPI.teachers({ page: options.page || 1, limit: options.limit || DEFAULT_LIMIT, search: options.search || '', status: options.status || '' });
    const { rows, pagination } = normalizePagedResponse(res);
    if (target) {
      target.innerHTML = rows.map(t => {
        const u = t.User || t.user || {};
        return `<tr><td>${u.name || 'Unnamed'}</td><td>${t.employeeId || '-'}</td><td>${t.department || '-'}</td><td>${u.phone || '-'}</td><td>${t.approvalStatus || '-'}</td></tr>`;
      }).join('') || '<tr><td colspan="5">No teachers found.</td></tr>';
    }
    renderPagination(pager, pagination, nextPage => window.v15LoadScaleTeachers({ ...options, page: nextPage }));
    return rows;
  };

  window.v15QueueLargeImport = async function (mode, filename) {
    const job = mode === 'marks'
      ? await window.scaleAPI.queueMarksImport({ filename })
      : await window.scaleAPI.queueCsvImport({ filename, mode: mode || 'students' });
    if (window.toast) toast(job.message || 'Import queued.');
    return job;
  };

  console.log('✅ Shule AI v15 scale upgrades loaded');
})();
