// Admin Departments UI - V9.2
let v92DepartmentState = { teachers: [], departments: [] };

async function renderAdminDepartments() {
    return `
        <div class="space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                <div class="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
                    <div>
                        <h2 class="text-2xl font-bold">Departments</h2>
                        <p class="text-muted-foreground">Create departments, select department heads, assign teachers, and auto-create department group chats.</p>
                    </div>
                    <button onclick="v92OpenDepartmentModal()" class="px-4 py-2 bg-primary text-white rounded-lg">+ Create Department</button>
                </div>
            </div>
            <div class="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
                <section class="rounded-xl border bg-card p-6">
                    <h3 class="font-bold text-lg mb-2">How departments work</h3>
                    <div class="space-y-3 text-sm text-muted-foreground">
                        <div class="p-3 rounded-lg bg-muted/40"><strong class="text-foreground">1. Admin creates department</strong><br>Example: Science, Languages, Games, Boarding.</div>
                        <div class="p-3 rounded-lg bg-muted/40"><strong class="text-foreground">2. Admin selects department head</strong><br>The head becomes admin of that department group chat.</div>
                        <div class="p-3 rounded-lg bg-muted/40"><strong class="text-foreground">3. Admin assigns teachers</strong><br>All selected teachers become department members.</div>
                        <div class="p-3 rounded-lg bg-muted/40"><strong class="text-foreground">4. Department group appears</strong><br>Teachers see it in their Groups tab together with Staff Room.</div>
                    </div>
                </section>
                <section id="v92-departments-root" class="rounded-xl border bg-card p-6">
                    <div class="text-center py-12 text-muted-foreground">Loading departments...</div>
                </section>
            </div>
        </div>
    `;
}

async function v92LoadDepartments() {
    const root = document.getElementById('v92-departments-root');
    if (!root) return;
    try {
        const [depsRes, teachersRes] = await Promise.all([
            chatV9API.getDepartments(),
            chatV9API.getTeachers()
        ]);
        v92DepartmentState.departments = depsRes.data || [];
        v92DepartmentState.teachers = (teachersRes.data || []).map(u => ({
            userId: u.id,
            teacherId: u.Teacher?.id || u.teacher?.id || u.id,
            name: u.name,
            email: u.email,
            profileImage: u.profileImage
        }));
        root.innerHTML = v92RenderDepartmentsList();
        if (typeof applyGlobalProfilePictures === 'function') applyGlobalProfilePictures();
    } catch (err) {
        console.error('Departments load failed:', err);
        root.innerHTML = `<div class="text-center py-12 text-red-500">Could not load departments: ${escapeHtml(err.message)}</div>`;
    }
}

function v92RenderDepartmentsList() {
    const deps = v92DepartmentState.departments || [];
    if (!deps.length) {
        return `
            <div class="text-center py-12">
                <div class="h-16 w-16 mx-auto rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl mb-3">🏫</div>
                <h3 class="font-bold text-lg">No departments yet</h3>
                <p class="text-muted-foreground mb-4">Create your first department and assign teachers.</p>
                <button onclick="v92OpenDepartmentModal()" class="px-4 py-2 bg-primary text-white rounded-lg">Create Department</button>
            </div>
        `;
    }
    return `
        <div class="flex justify-between gap-4 items-center mb-4">
            <div>
                <h3 class="font-bold text-lg">School Departments</h3>
                <p class="text-sm text-muted-foreground">${deps.length} active departments</p>
            </div>
            <button onclick="v92LoadDepartments()" class="px-3 py-2 border rounded-lg">Refresh</button>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
            ${deps.map(dep => {
                const members = dep.DepartmentMembers || [];
                const head = members.find(m => m.role === 'head');
                const headName = head?.Teacher?.User?.name || 'Not selected';
                return `
                    <article class="rounded-xl border bg-card p-5 hover:shadow-md transition">
                        <div class="flex justify-between gap-3 items-start">
                            <div>
                                <h4 class="font-bold text-lg">${escapeHtml(dep.name)}</h4>
                                <p class="text-sm text-muted-foreground">${escapeHtml(dep.description || 'No description')}</p>
                            </div>
                            <span class="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">${members.length} teachers</span>
                        </div>
                        <div class="mt-4 space-y-2 text-sm">
                            <div class="flex justify-between gap-2">
                                <span class="text-muted-foreground">Department Head</span>
                                <strong>${escapeHtml(headName)}</strong>
                            </div>
                            <div>
                                <span class="text-muted-foreground">Members</span>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    ${members.length ? members.slice(0, 8).map(m => `
                                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs">
                                            ${m.role === 'head' ? '👑' : '👤'} ${escapeHtml(m.Teacher?.User?.name || 'Teacher')}
                                        </span>
                                    `).join('') : '<span class="text-muted-foreground">No teachers assigned</span>'}
                                </div>
                            </div>
                        </div>
                        <div class="mt-5 flex gap-2 flex-wrap">
                            <button onclick="v92OpenDepartmentModal(${dep.id})" class="px-3 py-2 border rounded-lg text-sm">Edit</button>
                            <button onclick="v92DeleteDepartment(${dep.id})" class="px-3 py-2 border rounded-lg text-sm text-red-600">Archive</button>
                            <button onclick="v93OpenDepartmentGroupChat(${dep.id})" class="px-3 py-2 bg-primary text-white rounded-lg text-sm">View Group Chat</button>
                        </div>
                    </article>
                `;
            }).join('')}
        </div>
    `;
}

function v92OpenDepartmentModal(departmentId = null) {
    const dep = departmentId ? v92DepartmentState.departments.find(d => d.id === departmentId) : null;
    const members = dep?.DepartmentMembers || [];
    const selectedTeacherIds = members.map(m => Number(m.teacherId));
    const headTeacherId = Number(dep?.headTeacherId || members.find(m => m.role === 'head')?.teacherId || 0);

    const teacherOptions = v92DepartmentState.teachers.map(t => {
        const selected = selectedTeacherIds.includes(Number(t.teacherId)) ? 'checked' : '';
        return `
            <label class="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                <input type="checkbox" class="v92-dept-teacher" value="${t.teacherId}" ${selected}>
                <span class="global-avatar h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold" data-user-name="${escapeHtml(t.name)}" data-profile-image="${escapeHtml(t.profileImage || '')}">${getInitials(t.name)}</span>
                <span class="flex-1">
                    <strong class="block">${escapeHtml(t.name)}</strong>
                    <small class="text-muted-foreground">${escapeHtml(t.email || '')}</small>
                </span>
            </label>
        `;
    }).join('');

    const headOptions = ['<option value="">Select department head</option>'].concat(
        v92DepartmentState.teachers.map(t => `<option value="${t.teacherId}" ${Number(t.teacherId) === headTeacherId ? 'selected' : ''}>${escapeHtml(t.name)}</option>`)
    ).join('');

    const html = `
        <div id="v92-department-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div class="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background border shadow-2xl">
                <div class="p-6 border-b">
                    <h3 class="text-xl font-bold">${dep ? 'Edit Department' : 'Create Department'}</h3>
                    <p class="text-sm text-muted-foreground">Select department head and teachers. A group chat will appear with Staff Room in teacher Groups.</p>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Department Name</label>
                        <input id="v92-dept-name" class="w-full rounded-lg border p-2" value="${escapeHtml(dep?.name || '')}" placeholder="Science Department">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Description</label>
                        <textarea id="v92-dept-description" class="w-full rounded-lg border p-2" rows="2" placeholder="Handles science subjects and lab coordination">${escapeHtml(dep?.description || '')}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Department Head</label>
                        <select id="v92-dept-head" class="w-full rounded-lg border p-2">${headOptions}</select>
                        <p class="text-xs text-muted-foreground mt-1">The department head becomes admin of the department group chat.</p>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <label class="block text-sm font-medium">Teachers</label>
                            <button onclick="v92SelectAllDeptTeachers()" class="text-sm text-primary">Select all</button>
                        </div>
                        <div class="grid gap-2 md:grid-cols-2 max-h-72 overflow-y-auto">${teacherOptions || '<p class="text-muted-foreground">No teachers found</p>'}</div>
                    </div>
                </div>
                <div class="p-6 border-t flex justify-end gap-3">
                    <button onclick="v92CloseDepartmentModal()" class="px-4 py-2 border rounded-lg">Cancel</button>
                    <button onclick="v92SaveDepartment(${dep?.id || 'null'})" class="px-4 py-2 bg-primary text-white rounded-lg">${dep ? 'Save Changes' : 'Create Department'}</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    if (typeof applyGlobalProfilePictures === 'function') applyGlobalProfilePictures();
}

function v92CloseDepartmentModal() {
    document.getElementById('v92-department-modal')?.remove();
}

function v92SelectAllDeptTeachers() {
    document.querySelectorAll('.v92-dept-teacher').forEach(cb => cb.checked = true);
}

async function v92SaveDepartment(departmentId = null) {
    const name = document.getElementById('v92-dept-name')?.value?.trim();
    const description = document.getElementById('v92-dept-description')?.value?.trim();
    const headTeacherId = Number(document.getElementById('v92-dept-head')?.value || 0) || null;
    const teacherIds = Array.from(document.querySelectorAll('.v92-dept-teacher:checked')).map(cb => Number(cb.value));
    if (!name) return showToast('Department name is required', 'error');
    if (headTeacherId && !teacherIds.includes(headTeacherId)) teacherIds.unshift(headTeacherId);

    try {
        showLoading();
        const payload = { name, description, headTeacherId, teacherIds };
        if (departmentId) await chatV9API.updateDepartment(departmentId, payload);
        else await chatV9API.createDepartment(payload);
        showToast(departmentId ? 'Department updated' : 'Department created', 'success');
        v92CloseDepartmentModal();
        await v92LoadDepartments();
    } catch (err) {
        showToast(err.message || 'Department save failed', 'error');
    } finally {
        hideLoading();
    }
}

async function v92DeleteDepartment(departmentId) {
    if (!confirm('Archive this department and hide its group chat?')) return;
    try {
        showLoading();
        await chatV9API.deleteDepartment(departmentId);
        showToast('Department archived', 'success');
        await v92LoadDepartments();
    } catch (err) {
        showToast(err.message || 'Department archive failed', 'error');
    } finally {
        hideLoading();
    }
}

window.renderAdminDepartments = renderAdminDepartments;
window.v92LoadDepartments = v92LoadDepartments;
