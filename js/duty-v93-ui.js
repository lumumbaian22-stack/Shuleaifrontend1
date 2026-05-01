// Smart Duty Verification UI - V9.3
let v93DutyState = { today: null, config: null, compliance: null };

function v93GetGps() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GPS is not supported on this browser/device.'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        capturedAt: new Date().toISOString()
      }),
      err => reject(new Error(err.message || 'Could not get GPS location. Allow location permission.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function v93DeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    capturedAt: new Date().toISOString()
  };
}

async function renderAdminSmartDuty() {
  return `
    <div class="space-y-6 animate-fade-in">
      <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <div class="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
          <div>
            <h2 class="text-2xl font-bold">Smart Duty & Attendance Verification</h2>
            <p class="text-muted-foreground">Generate term/year duties, verify teacher check-ins with GPS + QR + timestamp, and see late arrivals.</p>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button onclick="v93LoadAdminDuty()" class="px-4 py-2 border rounded-lg">Refresh</button>
            <button onclick="v93SaveDutyConfig()" class="px-4 py-2 bg-primary text-white rounded-lg">Save Verification Settings</button>
          </div>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section class="rounded-xl border bg-card p-6 space-y-5">
          <div>
            <h3 class="font-bold text-lg">Generation Settings</h3>
            <p class="text-sm text-muted-foreground">Generate duty rosters weekly, termly, or yearly.</p>
          </div>

          <div class="grid gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Generation Period</label>
              <select id="v93-duty-period" class="w-full rounded-lg border p-2">
                <option value="term">Termly</option>
                <option value="year">Yearly</option>
                <option value="month">Monthly</option>
                <option value="week">Weekly</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1">From Date</label>
                <input id="v93-duty-start" type="date" class="w-full rounded-lg border p-2">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">To Date</label>
                <input id="v93-duty-end" type="date" class="w-full rounded-lg border p-2">
              </div>
            </div>
            <button onclick="v93GenerateDutyRoster()" class="w-full px-4 py-2 bg-primary text-white rounded-lg">Generate Duties</button>
          </div>

          <div class="border-t pt-5">
            <h3 class="font-bold text-lg">GPS + QR Verification</h3>
            <p class="text-sm text-muted-foreground">Prevent check-in cheating by requiring teachers to be inside the school radius and scan/enter the daily QR token.</p>
          </div>

          <div class="grid gap-3">
            <label class="flex items-center justify-between gap-3 p-3 rounded-lg border">
              <span><strong>Require GPS</strong><small class="block text-muted-foreground">Teacher must share location</small></span>
              <input id="v93-require-gps" type="checkbox" checked>
            </label>
            <label class="flex items-center justify-between gap-3 p-3 rounded-lg border">
              <span><strong>Require QR Code</strong><small class="block text-muted-foreground">Teacher must scan/enter duty QR token</small></span>
              <input id="v93-require-qr" type="checkbox">
            </label>
            <div>
              <label class="block text-sm font-medium mb-1">Allowed Radius (meters)</label>
              <input id="v93-radius" type="number" class="w-full rounded-lg border p-2" value="150">
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium mb-1">School Latitude</label>
                <input id="v93-school-lat" type="number" step="any" class="w-full rounded-lg border p-2" placeholder="-1.2921">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">School Longitude</label>
                <input id="v93-school-lng" type="number" step="any" class="w-full rounded-lg border p-2" placeholder="36.8219">
              </div>
            </div>
            <button onclick="v93UseCurrentLocationAsSchool()" class="w-full px-4 py-2 border rounded-lg">Use My Current Location as School GPS</button>
          </div>

          <div class="border-t pt-5">
            <h3 class="font-bold text-lg">Late Arrival Rules</h3>
          </div>
          <div class="grid gap-3">
            <div>
              <label class="block text-sm font-medium mb-1">Teacher Reporting Time</label>
              <input id="v93-reporting-time" type="time" class="w-full rounded-lg border p-2" value="07:00">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Teacher Grace Minutes</label>
              <input id="v93-duty-grace" type="number" class="w-full rounded-lg border p-2" value="15">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Student Reporting Time</label>
              <input id="v93-student-reporting-time" type="time" class="w-full rounded-lg border p-2" value="07:30">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Student Grace Minutes</label>
              <input id="v93-student-grace" type="number" class="w-full rounded-lg border p-2" value="10">
            </div>
          </div>
        </section>

        <section class="space-y-6">
          <div class="grid gap-4 md:grid-cols-4" id="v93-duty-stats">
            <div class="rounded-xl border bg-card p-5"><span class="text-muted-foreground text-sm">Verified</span><strong class="block text-2xl">-</strong></div>
            <div class="rounded-xl border bg-card p-5"><span class="text-muted-foreground text-sm">Late</span><strong class="block text-2xl">-</strong></div>
            <div class="rounded-xl border bg-card p-5"><span class="text-muted-foreground text-sm">Rejected</span><strong class="block text-2xl">-</strong></div>
            <div class="rounded-xl border bg-card p-5"><span class="text-muted-foreground text-sm">Not Checked In</span><strong class="block text-2xl">-</strong></div>
          </div>

          <div class="rounded-xl border bg-card p-6">
            <div class="flex justify-between gap-3 items-center mb-4">
              <div>
                <h3 class="font-bold text-lg">Today’s Duty Verification Board</h3>
                <p class="text-sm text-muted-foreground">Admin sees who checked in, who was late, and who was outside the school vicinity.</p>
              </div>
              <input id="v93-report-date" type="date" class="rounded-lg border p-2" onchange="v93LoadComplianceReport()">
            </div>
            <div id="v93-compliance-root" class="overflow-x-auto">
              <div class="text-center py-12 text-muted-foreground">Loading compliance report...</div>
            </div>
          </div>

          <div class="rounded-xl border bg-card p-6">
            <div class="flex justify-between gap-3 items-center mb-4">
              <div>
                <h3 class="font-bold text-lg">Daily QR Token</h3>
                <p class="text-sm text-muted-foreground">Print/display this at school gate or staff room for verified duty check-in.</p>
              </div>
              <button onclick="v93PrintQrToken()" class="px-4 py-2 border rounded-lg">Print QR Token</button>
            </div>
            <div id="v93-qr-root" class="rounded-xl border bg-muted/30 p-5 font-mono text-sm break-all">Loading token...</div>
          </div>

          <div class="rounded-xl border bg-card p-6">
            <h3 class="font-bold text-lg mb-3">Late Arrival Register</h3>
            <div id="v93-late-root" class="space-y-2 text-sm text-muted-foreground">Loading late arrivals...</div>
          </div>
        </section>
      </div>
    </div>
  `;
}

async function v93LoadAdminDuty() {
  await Promise.allSettled([v93LoadDutyConfig(), v93LoadComplianceReport(), v93LoadLateArrivals()]);
}

async function v93LoadDutyConfig() {
  try {
    const res = await api.duty.getVerificationConfig();
    const data = res.data || {};
    v93DutyState.config = data;
    const s = data.settings || {};
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };
    const chk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    chk('v93-require-gps', s.requireGps !== false);
    chk('v93-require-qr', s.requireQr === true);
    set('v93-radius', s.radiusMeters || 150);
    set('v93-school-lat', s.schoolLat || '');
    set('v93-school-lng', s.schoolLng || '');
    set('v93-reporting-time', s.reportingTime || '07:00');
    set('v93-duty-grace', s.dutyGraceMinutes || 15);
    set('v93-student-reporting-time', s.studentReportingTime || '07:30');
    set('v93-student-grace', s.studentGraceMinutes || 10);
    const qr = document.getElementById('v93-qr-root');
    if (qr) qr.textContent = data.todayQrToken || 'QR token unavailable';
  } catch (err) {
    console.error('Duty config load failed:', err);
    showToast(err.message || 'Failed to load duty verification settings', 'error');
  }
}

async function v93SaveDutyConfig() {
  try {
    showLoading();
    const payload = {
      requireGps: document.getElementById('v93-require-gps')?.checked,
      requireQr: document.getElementById('v93-require-qr')?.checked,
      radiusMeters: Number(document.getElementById('v93-radius')?.value || 150),
      schoolLat: Number(document.getElementById('v93-school-lat')?.value || 0),
      schoolLng: Number(document.getElementById('v93-school-lng')?.value || 0),
      reportingTime: document.getElementById('v93-reporting-time')?.value || '07:00',
      dutyGraceMinutes: Number(document.getElementById('v93-duty-grace')?.value || 15),
      studentReportingTime: document.getElementById('v93-student-reporting-time')?.value || '07:30',
      studentGraceMinutes: Number(document.getElementById('v93-student-grace')?.value || 10)
    };
    await api.duty.updateVerificationConfig(payload);
    showToast('Duty verification settings saved', 'success');
    await v93LoadDutyConfig();
  } catch (err) {
    showToast(err.message || 'Could not save duty settings', 'error');
  } finally {
    hideLoading();
  }
}

async function v93UseCurrentLocationAsSchool() {
  try {
    showLoading();
    const gps = await v93GetGps();
    document.getElementById('v93-school-lat').value = gps.latitude;
    document.getElementById('v93-school-lng').value = gps.longitude;
    showToast('School GPS filled from your current location', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

async function v93LoadComplianceReport() {
  const root = document.getElementById('v93-compliance-root');
  if (!root) return;
  try {
    const date = document.getElementById('v93-report-date')?.value || '';
    const res = await api.duty.getComplianceReport(date);
    const data = res.data || {};
    const summary = data.summary || {};
    const duties = data.duties || [];

    document.getElementById('v93-duty-stats').innerHTML = `
      <div class="rounded-xl border bg-card p-5"><span class="text-muted-foreground text-sm">Verified</span><strong class="block text-2xl text-green-600">${summary.verified || 0}</strong></div>
      <div class="rounded-xl border bg-card p-5"><span class="text-muted-foreground text-sm">Late</span><strong class="block text-2xl text-amber-600">${summary.late || 0}</strong></div>
      <div class="rounded-xl border bg-card p-5"><span class="text-muted-foreground text-sm">Rejected</span><strong class="block text-2xl text-red-600">${summary.rejected || 0}</strong></div>
      <div class="rounded-xl border bg-card p-5"><span class="text-muted-foreground text-sm">Not Checked In</span><strong class="block text-2xl">${summary.notCheckedIn || 0}</strong></div>
    `;

    if (!duties.length) {
      root.innerHTML = '<div class="text-center py-12 text-muted-foreground">No duty roster found for this date.</div>';
      return;
    }
    root.innerHTML = `
      <table class="w-full min-w-[860px]">
        <thead><tr><th>Teacher</th><th>Duty</th><th>Status</th><th>Check-in Time</th><th>GPS</th><th>QR</th><th>Late</th></tr></thead>
        <tbody>
          ${duties.map(d => {
            const ci = d.checkedIn || {};
            const status = ci.accepted === false ? 'Rejected' : ci.accepted === true ? (ci.late?.isLate ? 'Late Verified' : 'Verified') : 'Not Checked In';
            const cls = ci.accepted === false ? 'text-red-600' : ci.late?.isLate ? 'text-amber-600' : ci.accepted ? 'text-green-600' : 'text-muted-foreground';
            return `<tr>
              <td><strong>${escapeHtml(d.teacherName || 'Teacher')}</strong><small class="block text-muted-foreground">ID: ${d.teacherId || '-'}</small></td>
              <td>${escapeHtml(d.area || d.type || 'Duty')}</td>
              <td><strong class="${cls}">${status}</strong></td>
              <td>${ci.checkedAt ? new Date(ci.checkedAt).toLocaleTimeString() : '-'}</td>
              <td>${ci.geo ? `${ci.geo.distanceMeters ?? '-'}m / ${ci.geo.radiusMeters ?? '-'}m` : '-'}</td>
              <td>${ci.qr ? (ci.qr.accepted ? 'Accepted' : 'Failed') : '-'}</td>
              <td>${ci.late?.isLate ? `${ci.late.lateMinutes} min` : '-'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    root.innerHTML = `<div class="text-center py-12 text-red-500">${escapeHtml(err.message)}</div>`;
  }
}

async function v93LoadLateArrivals() {
  const root = document.getElementById('v93-late-root');
  if (!root) return;
  try {
    const date = document.getElementById('v93-report-date')?.value || '';
    const res = await api.duty.getLateArrivals(date);
    const data = res.data || {};
    const teachers = data.lateTeachers || [];
    const students = data.lateStudents || [];
    root.innerHTML = `
      <div class="grid gap-3 md:grid-cols-2">
        <div class="rounded-lg border p-4">
          <h4 class="font-bold mb-2">Late Teachers (${teachers.length})</h4>
          ${teachers.length ? teachers.map(t => `<div class="py-2 border-b last:border-b-0"><strong>${escapeHtml(t.teacherName || 'Teacher')}</strong><small class="block text-muted-foreground">${escapeHtml(t.duty || 'Duty')} • ${t.lateMinutes || 0} min late</small></div>`).join('') : '<p>No late teachers recorded.</p>'}
        </div>
        <div class="rounded-lg border p-4">
          <h4 class="font-bold mb-2">Late Students (${students.length})</h4>
          ${students.length ? students.map(s => `<div class="py-2 border-b last:border-b-0"><strong>${escapeHtml(s.studentName || 'Student')}</strong><small class="block text-muted-foreground">${s.lateMinutes || 0} min late</small></div>`).join('') : '<p>Student late register ready for gate/manual attendance integration.</p>'}
        </div>
      </div>
    `;
  } catch (err) {
    root.innerHTML = `<div class="text-red-500">${escapeHtml(err.message)}</div>`;
  }
}

async function v93GenerateDutyRoster() {
  try {
    showLoading();
    const period = document.getElementById('v93-duty-period')?.value || 'term';
    let start = document.getElementById('v93-duty-start')?.value;
    let end = document.getElementById('v93-duty-end')?.value;
    const today = new Date();
    if (!start) start = today.toISOString().slice(0,10);
    if (!end) {
      const d = new Date(today);
      if (period === 'week') d.setDate(d.getDate() + 7);
      else if (period === 'month') d.setMonth(d.getMonth() + 1);
      else if (period === 'year') d.setFullYear(d.getFullYear() + 1);
      else d.setMonth(d.getMonth() + 3);
      end = d.toISOString().slice(0,10);
    }
    await api.admin.generateDutyRoster(start, end);
    showToast(`Duty roster generated for ${period}`, 'success');
    await v93LoadAdminDuty();
  } catch (err) {
    showToast(err.message || 'Duty generation failed', 'error');
  } finally {
    hideLoading();
  }
}

function v93PrintQrToken() {
  const token = document.getElementById('v93-qr-root')?.textContent || '';
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>Duty QR Token</title><style>body{font-family:Arial;text-align:center;padding:40px}.token{font-size:18px;border:2px dashed #333;padding:24px;margin-top:20px;word-break:break-all}</style></head><body><h1>Shule AI Duty QR Token</h1><p>Display this token at school gate/staff room.</p><div class="token">${token}</div><p>Teachers enter/scan this token during duty check-in.</p></body></html>`);
  w.document.close();
  w.print();
}

async function renderTeacherSmartDuty() {
  return `
    <div class="space-y-6 animate-fade-in">
      <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <h2 class="text-2xl font-bold">My Verified Duty</h2>
        <p class="text-muted-foreground">Check in using GPS, timestamp, and QR token verification.</p>
      </div>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section class="rounded-xl border bg-card p-6">
          <div class="flex justify-between gap-4 items-start mb-5">
            <div>
              <h3 class="font-bold text-lg">Today’s Duty</h3>
              <p id="v93-teacher-duty-location" class="text-muted-foreground">Loading duty...</p>
            </div>
            <span id="v93-teacher-duty-status" class="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold">Loading</span>
          </div>

          <div class="grid gap-4 md:grid-cols-3 mb-6">
            <div class="rounded-lg border p-4"><span class="text-muted-foreground text-sm">Server Timestamp</span><strong id="v93-server-time" class="block">-</strong></div>
            <div class="rounded-lg border p-4"><span class="text-muted-foreground text-sm">GPS Status</span><strong id="v93-gps-status" class="block">Not captured</strong></div>
            <div class="rounded-lg border p-4"><span class="text-muted-foreground text-sm">QR Status</span><strong id="v93-qr-status" class="block">Not entered</strong></div>
          </div>

          <div class="space-y-3">
            <label class="block">
              <span class="block text-sm font-medium mb-1">Daily QR Code / Token</span>
              <input id="v93-duty-qr-token" class="w-full rounded-lg border p-2" placeholder="Scan or enter the school duty QR token">
            </label>
            <label class="block">
              <span class="block text-sm font-medium mb-1">Notes</span>
              <textarea id="v93-duty-notes" class="w-full rounded-lg border p-2" rows="2" placeholder="Optional notes"></textarea>
            </label>
            <div class="flex flex-wrap gap-3">
              <button onclick="v93CaptureTeacherGps()" class="px-4 py-2 border rounded-lg">Capture GPS</button>
              <button onclick="v93TeacherCheckIn()" id="v93-check-in-btn" class="px-4 py-2 bg-primary text-white rounded-lg">Verified Check In</button>
              <button onclick="v93TeacherCheckOut()" id="v93-check-out-btn" class="px-4 py-2 border rounded-lg">Verified Check Out</button>
            </div>
          </div>
        </section>

        <aside class="rounded-xl border bg-card p-6">
          <h3 class="font-bold text-lg">Anti-cheat Rules</h3>
          <div class="space-y-3 mt-4 text-sm text-muted-foreground">
            <div class="p-3 rounded-lg bg-muted/40"><strong class="text-foreground">GPS</strong><br>Must be inside school radius.</div>
            <div class="p-3 rounded-lg bg-muted/40"><strong class="text-foreground">Timestamp</strong><br>Server records exact check-in time and late minutes.</div>
            <div class="p-3 rounded-lg bg-muted/40"><strong class="text-foreground">QR</strong><br>Optional school QR token blocks remote check-ins.</div>
          </div>
        </aside>
      </div>

      <section class="rounded-xl border bg-card p-6">
        <h3 class="font-bold text-lg mb-4">My Weekly Duty</h3>
        <div id="v93-weekly-duty-root" class="overflow-x-auto">Loading weekly duty...</div>
      </section>
    </div>
  `;
}

async function v93LoadTeacherDuty() {
  try {
    const [todayRes, configRes, weekRes] = await Promise.allSettled([
      api.duty.getTodayDuty(),
      api.duty.getVerificationConfig(),
      api.duty.getWeeklyDuty()
    ]);
    const today = todayRes.value?.data || todayRes.value || {};
    const config = configRes.value?.data || {};
    v93DutyState.today = today;
    v93DutyState.config = config;
    const duty = today.duty || today.data?.duty || today;

    const loc = document.getElementById('v93-teacher-duty-location');
    if (loc) loc.textContent = duty?.area || duty?.type || 'No duty assigned today';

    const status = document.getElementById('v93-teacher-duty-status');
    if (status) {
      const text = duty?.checkedIn?.accepted ? (duty.checkedIn?.late?.isLate ? 'Late Verified' : 'Verified') : duty?.checkedIn?.accepted === false ? 'Rejected' : 'Not Checked In';
      status.textContent = text;
      status.className = 'px-3 py-1 rounded-full text-sm font-bold ' + (text === 'Verified' ? 'bg-green-100 text-green-700' : text === 'Late Verified' ? 'bg-amber-100 text-amber-700' : text === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700');
    }

    const server = document.getElementById('v93-server-time');
    if (server) server.textContent = config.serverTime ? new Date(config.serverTime).toLocaleString() : new Date().toLocaleString();

    const week = weekRes.value?.data || [];
    const wr = document.getElementById('v93-weekly-duty-root');
    if (wr) {
      wr.innerHTML = Array.isArray(week) && week.length ? `
        <table class="w-full min-w-[720px]"><thead><tr><th>Date</th><th>Duty</th><th>Status</th></tr></thead><tbody>
          ${week.map(day => `<tr><td>${day.date || '-'}</td><td>${(day.duties || []).map(d => escapeHtml(d.area || d.type || 'Duty')).join(', ') || '-'}</td><td>${day.isToday ? 'Today' : '-'}</td></tr>`).join('')}
        </tbody></table>
      ` : '<div class="text-muted-foreground">No weekly duty found.</div>';
    }
  } catch (err) {
    console.error('Teacher duty load failed:', err);
  }
}

let v93CapturedGps = null;
async function v93CaptureTeacherGps() {
  try {
    showLoading();
    v93CapturedGps = await v93GetGps();
    const el = document.getElementById('v93-gps-status');
    if (el) el.textContent = `Captured ±${Math.round(v93CapturedGps.accuracy || 0)}m`;
    showToast('GPS captured', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

async function v93TeacherCheckIn() {
  try {
    showLoading();
    if (!v93CapturedGps) v93CapturedGps = await v93GetGps();
    const qrToken = document.getElementById('v93-duty-qr-token')?.value?.trim();
    const notes = document.getElementById('v93-duty-notes')?.value?.trim();
    const res = await api.duty.verifiedCheckIn({ gps: v93CapturedGps, qrToken, notes, deviceInfo: v93DeviceInfo() });
    showToast(res.message || 'Verified check-in successful', 'success');
    await v93LoadTeacherDuty();
  } catch (err) {
    showToast(err.message || 'Verified check-in failed', 'error');
  } finally {
    hideLoading();
  }
}

async function v93TeacherCheckOut() {
  try {
    showLoading();
    if (!v93CapturedGps) v93CapturedGps = await v93GetGps();
    const qrToken = document.getElementById('v93-duty-qr-token')?.value?.trim();
    const notes = document.getElementById('v93-duty-notes')?.value?.trim();
    const res = await api.duty.verifiedCheckOut({ gps: v93CapturedGps, qrToken, notes, deviceInfo: v93DeviceInfo() });
    showToast(res.message || 'Verified check-out successful', 'success');
    await v93LoadTeacherDuty();
  } catch (err) {
    showToast(err.message || 'Verified check-out failed', 'error');
  } finally {
    hideLoading();
  }
}

window.renderAdminSmartDuty = renderAdminSmartDuty;
window.v93LoadAdminDuty = v93LoadAdminDuty;
window.renderTeacherSmartDuty = renderTeacherSmartDuty;
window.v93LoadTeacherDuty = v93LoadTeacherDuty;
