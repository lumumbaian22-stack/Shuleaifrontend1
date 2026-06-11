// API Configuration
const API_BASE_URL = (localStorage.getItem('SHULE_API_BASE_URL') || 'https://shuleaibackend-32h1.onrender.com').replace(/\/$/, '');

// Token management
let authToken = localStorage.getItem('authToken');
let refreshToken = localStorage.getItem('refreshToken');

// API request wrapper with authentication
function cleanQueryParams(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query.set(key, String(value));
    });
    return query.toString();
}
window.cleanQueryParams = cleanQueryParams;

async function apiRequest(endpoint, options = {}) {
    authToken = localStorage.getItem('authToken') || localStorage.getItem('token') || authToken;
    const url = `${API_BASE_URL}${endpoint}`;
    const method = String(options.method || 'GET').toUpperCase();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    const attempts = method === 'GET' ? 2 : 1;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
            const response = await fetch(url, { ...options, headers });
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After') || 60;
                throw new Error(`Rate limited. Please wait ${retryAfter} seconds.`);
            }
            const contentType = response.headers.get('content-type') || '';
            let data;
            if (contentType.includes('application/json')) data = await response.json();
            else {
                const text = await response.text();
                throw new Error(text.includes('<html') ? `Server error (${response.status}): Please check the server logs.` : `Unexpected response: ${text.substring(0, 100)}`);
            }
            if (!response.ok) {
                const validationMessage = Array.isArray(data?.errors) ? data.errors.map(err => err.msg || err.message || `${err.path || err.param || 'Field'} is invalid`).join(', ') : null;
                const message = validationMessage || data?.message || data?.error || `Request failed with status ${response.status}`;
                const error = new Error(message); error.status = response.status; error.data = data;
                const transient = [502,503,504].includes(response.status) || (response.status === 500 && /connection terminated|connection reset|econnreset|database.*unavailable/i.test(message));
                if (attempt + 1 < attempts && transient) { await new Promise(r => setTimeout(r, 350)); continue; }
                throw error;
            }
            return data;
        } catch (error) {
            const networkFailure = error instanceof TypeError || /failed to fetch|networkerror|connection terminated|connection reset|econnreset/i.test(String(error?.message || ''));
            if (attempt + 1 < attempts && networkFailure) { await new Promise(r => setTimeout(r, 350)); continue; }
            console.error('API Request failed:', error);
            throw error?.message ? error : new Error('Network error');
        }
    }
}

async function handleResponse(response) {
    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error(`Invalid response: ${text.substring(0, 100)}`);
    }
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    return data;
}

async function refreshAuthToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
    return false;
}

// ============ AUTH ENDPOINTS ============
const authAPI = {
    superAdminLogin: (email, password, secretKey) => 
        apiRequest('/api/auth/super-admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, secretKey })
        }),
    
    adminSignup: (data) => 
        apiRequest('/api/auth/admin/signup', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    teacherSignup: (data) => 
        apiRequest('/api/auth/teacher/signup', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    parentSignup: (data) => 
        apiRequest('/api/auth/parent/signup', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    studentLogin: (elimuid, password) => 
        apiRequest('/api/auth/student/login', {
            method: 'POST',
            body: JSON.stringify({ elimuid, password })
        }),
    
    login: (emailOrPhone, password, role) => {
        const identifier = String(emailOrPhone || '').trim();
        const payload = { email: identifier, emailOrPhone: identifier, password, role };
        if (/^[+\d\s-]{7,}$/.test(identifier)) payload.phone = identifier;
        return apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    
    verifySchoolCode: (schoolCode) => 
        apiRequest('/api/auth/verify-school', {
            method: 'POST',
            body: JSON.stringify({ schoolCode })
        }),
    
    getMe: () => apiRequest('/api/auth/me'),
    
    logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
    
    changePassword: (currentPassword, newPassword) => 
        apiRequest('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        })
};

// ============ SUPER ADMIN ENDPOINTS ============
const superAdminAPI = {
    getOverview: () => apiRequest('/api/super-admin/overview'),
    getSchools: () => apiRequest('/api/super-admin/schools'),
    getPendingSchools: () => apiRequest('/api/super-admin/pending-schools'),
    getSuspendedSchools: () => apiRequest('/api/super-admin/suspended-schools'),
    approveSchool: (schoolId) => 
        apiRequest(`/api/super-admin/schools/${schoolId}/approve`, { method: 'POST' }),
    rejectSchool: (schoolId, reason) => 
        apiRequest(`/api/super-admin/schools/${schoolId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        }),
    suspendSchool: (schoolId, reason) => 
        apiRequest(`/api/super-admin/schools/${schoolId}/suspend`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        }),
    reactivateSchool: (schoolId, reason) => 
        apiRequest(`/api/super-admin/schools/${schoolId}/reactivate`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        }),
    createSchool: (data) => 
        apiRequest('/api/super-admin/schools', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    updateSchool: (schoolId, data) => 
        apiRequest(`/api/super-admin/schools/${schoolId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    deleteSchool: (schoolId) => 
        apiRequest(`/api/super-admin/schools/${schoolId}`, { method: 'DELETE' }),
    getPendingRequests: () => apiRequest('/api/super-admin/requests'),
    approveRequest: (requestId) => 
        apiRequest(`/api/super-admin/requests/${requestId}/approve`, { method: 'POST' }),
    rejectRequest: (requestId, reason) => 
        apiRequest(`/api/super-admin/requests/${requestId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        }),
    updateBankDetails: (schoolId, data) => 
        apiRequest(`/api/super-admin/bank-details/${schoolId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    getAllUsers: () => apiRequest('/api/super-admin/users'),
    getSystemMetrics: () => apiRequest('/api/super-admin/metrics'),
    getSystemLogs: () => apiRequest('/api/super-admin/logs'),
    getRequestHistory: () => apiRequest('/api/super-admin/requests/history'),
    getSchoolStats: (schoolId) => apiRequest(`/api/super-admin/schools/${schoolId}/stats`),
    getGrowthData: () => apiRequest('/api/super-admin/growth-data'),
    getSchoolDistribution: () => apiRequest('/api/super-admin/school-distribution'),
    getPlatformSettings: () => apiRequest('/api/super-admin/platform-settings'),
    updatePlatformSettings: (data) => 
        apiRequest('/api/super-admin/platform-settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    resetPlatformSettings: () => apiRequest('/api/super-admin/settings/reset', { method: 'POST' }),
    runSystemBackup: () => apiRequest('/api/super-admin/backup', { method: 'POST' }),
    clearPlatformCache: () => apiRequest('/api/super-admin/cache/clear', { method: 'POST' }),
    exportPlatformData: () => apiRequest('/api/super-admin/export'),
    exportData: function() { return this.exportPlatformData(); },
    clearCache: function() { return this.clearPlatformCache(); },
    runBackup: function() { return this.runSystemBackup(); },
    resetSettings: function() { return this.resetPlatformSettings(); },
    getAnalytics: () => apiRequest(`/api/super-admin/analytics?_=${Date.now()}`),
    getSchoolDetail: (schoolId) => apiRequest(`/api/super-admin/schools/${schoolId}/detail`),
    updateSchoolAccessControls: (schoolId, data) => apiRequest(`/api/super-admin/schools/${schoolId}/access-controls`, { method: 'PUT', body: JSON.stringify(data) }),
    getPaymentRequests: (params = {}) => apiRequest(`/api/super-admin/payment-requests${Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : ''}`),
    reviewPaymentRequest: (requestId, data) => apiRequest(`/api/super-admin/payment-requests/${requestId}/review`, { method: 'POST', body: JSON.stringify(data) })
};

// ============ ADMIN ENDPOINTS ============
const adminAPI = {
    getTeachers: () => apiRequest('/api/admin/teachers'),
    getStudents: () => apiRequest('/api/admin/students'),
    getParents: () => apiRequest('/api/admin/parents'),
    getPendingApprovals: () => apiRequest('/api/admin/approvals/pending'),
    approveTeacher: (teacherId, action, rejectionReason) => 
        apiRequest(`/api/admin/teachers/${teacherId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ action, rejectionReason })
        }),
    suspendTeacher: (teacherId, reason) => 
        apiRequest(`/api/admin/teachers/${teacherId}/suspend`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        }),
    reactivateTeacher: (teacherId) => 
        apiRequest(`/api/admin/teachers/${teacherId}/reactivate`, { method: 'POST' }),
    deactivateTeacher: (teacherId, data) => 
        apiRequest(`/api/admin/teachers/${teacherId}/deactivate`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    activateTeacher: (teacherId) => 
        apiRequest(`/api/admin/teachers/${teacherId}/activate`, { method: 'POST' }),
    deleteTeacher: (teacherId) => 
        apiRequest(`/api/admin/teachers/${teacherId}`, { method: 'DELETE' }),
    getSchoolSettings: () => apiRequest('/api/admin/settings'),
    updateSchoolSettings: (data) => 
        apiRequest('/api/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    createClass: (data) => 
        apiRequest('/api/admin/classes', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getClasses: () => apiRequest('/api/admin/classes'),
    getClassTransferOptions: () => apiRequest('/api/lifecycle/transfer-options'),
    previewClassTransfer: (data) => apiRequest('/api/lifecycle/transfers/preview', { method:'POST', body:JSON.stringify(data) }),
    createClassTransfer: (data) => apiRequest('/api/lifecycle/transfers', { method:'POST', body:JSON.stringify(data) }),
    listClassTransfers: (params={}) => apiRequest(`/api/lifecycle/transfers${Object.keys(params).length?`?${cleanQueryParams(params)}`:''}`),
    getClassTransfer: (id) => apiRequest(`/api/lifecycle/transfers/${id}`),
    approveClassTransfer: (id,data={}) => apiRequest(`/api/lifecycle/transfers/${id}/approve`, { method:'POST', body:JSON.stringify(data) }),
    rejectClassTransfer: (id,reason) => apiRequest(`/api/lifecycle/transfers/${id}/reject`, { method:'POST', body:JSON.stringify({reason}) }),
    cancelClassTransfer: (id,reason='') => apiRequest(`/api/lifecycle/transfers/${id}/cancel`, { method:'POST', body:JSON.stringify({reason}) }),
    rollbackClassTransfer: (id,reason) => apiRequest(`/api/lifecycle/transfers/${id}/rollback`, { method:'POST', body:JSON.stringify({reason}) }),
    getStudentEnrollmentHistory: (studentId) => apiRequest(`/api/lifecycle/students/${studentId}/enrollments`),
    listPromotionBatches: () => apiRequest('/api/lifecycle/promotions'),
    createPromotionPreview: (data) => apiRequest('/api/lifecycle/promotions/preview', { method:'POST', body:JSON.stringify(data) }),
    getPromotionBatch: (id) => apiRequest(`/api/lifecycle/promotions/${id}`),
    updatePromotionDecision: (batchId, decisionId, data) => apiRequest(`/api/lifecycle/promotions/${batchId}/decisions/${decisionId}`, { method:'PATCH', body:JSON.stringify(data) }),
    confirmPromotionBatch: (id, data={}) => apiRequest(`/api/lifecycle/promotions/${id}/confirm`, { method:'POST', body:JSON.stringify(data) }),
    rollbackPromotionBatch: (id, reason) => apiRequest(`/api/lifecycle/promotions/${id}/rollback`, { method:'POST', body:JSON.stringify({ reason }) }),
    updateClass: (classId, data) => 
        apiRequest(`/api/admin/classes/${classId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    deleteClass: (classId) => 
        apiRequest(`/api/admin/classes/${classId}`, { method: 'DELETE' }),
    getAvailableTeachers: () => apiRequest('/api/admin/available-teachers'),
    assignTeacherToClass: (classId, teacherId) => 
        apiRequest(`/api/admin/classes/${classId}/assign-teacher`, {
            method: 'POST',
            body: JSON.stringify({ teacherId })
        }),
    removeTeacherFromClass: (classId) => 
        apiRequest(`/api/admin/classes/${classId}/remove-teacher`, { method: 'POST' }),
    getClassStudents: (classId) => 
        apiRequest(`/api/admin/classes/${classId}/students`),
    getClassSubjectAssignments: (classId) => 
        apiRequest(`/api/admin/classes/${classId}/subjects`),
    assignTeacherToSubject: (data) => 
        apiRequest('/api/admin/classes/subject-assign', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    removeSubjectAssignment: (assignmentId) => 
        apiRequest(`/api/admin/classes/subject-assign/${assignmentId}`, { method: 'DELETE' }),
    getStudentDetails: (studentId) => 
        apiRequest(`/api/admin/students/${studentId}`),
    suspendStudent: (studentId, data) => 
        apiRequest(`/api/admin/students/${studentId}/suspend`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    reactivateStudent: (studentId) => 
        apiRequest(`/api/admin/students/${studentId}/reactivate`, { method: 'POST' }),
    expelStudent: (studentId, data) => 
        apiRequest(`/api/admin/students/${studentId}/expel`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    deleteStudent: (studentId) => 
        apiRequest(`/api/admin/students/${studentId}`, { method: 'DELETE' }),
    updateStudent: (studentId, data) => 
        apiRequest(`/api/admin/students/${studentId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    generateDutyRoster: (startDate, endDate) => 
        apiRequest('/api/admin/duty/generate', {
            method: 'POST',
            body: JSON.stringify({ startDate, endDate })
        }),
    getDutyStats: () => apiRequest('/api/admin/duty/stats'),
    getFairnessReport: () => apiRequest('/api/admin/duty/fairness-report'),
    manualAdjustDuty: (data) => 
        apiRequest('/api/admin/duty/adjust', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getUnderstaffedAreas: () => apiRequest('/api/admin/duty/understaffed'),
    getTeacherWorkload: () => apiRequest('/api/admin/duty/teacher-workload'),
    getStudentGrades: () => apiRequest('/api/admin/grades/stats'),
    getAttendanceStats: () => apiRequest('/api/admin/attendance/stats'),
    getAttendanceSession: (classId, date) => apiRequest(`/api/attendance/sessions/${classId}/${date}`),
    correctLockedAttendance: (sessionId, data) => apiRequest(`/api/attendance/sessions/${sessionId}/corrections`, { method:'POST', body:JSON.stringify(data) }),
    getAttendanceCorrections: (sessionId) => apiRequest(`/api/attendance/sessions/${sessionId}/corrections`),
    updateTeacher: (teacherId, data) => 
        apiRequest(`/api/admin/teachers/${teacherId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    getDashboardData: () => apiRequest('/api/admin/dashboard'),
    getClassDetails: async (classId) => {
        try {
            return await apiRequest(`/api/admin/classes/${classId}`);
        } catch (error) {
            const classes = await apiRequest('/api/admin/classes');
            const found = (classes.data || []).find(c => String(c.id) === String(classId));
            if (!found) throw error;
            return { success: true, data: found };
        }
    },
    getAnalytics: () => apiRequest(`/api/admin/analytics?_=${Date.now()}`),
    batchAssignSubjects: (classIdOrData, assignments = null) => {
        const payload = (typeof classIdOrData === 'object' && assignments === null)
            ? classIdOrData
            : { classId: classIdOrData, assignments };
        return apiRequest('/api/admin/classes/subject-assign-batch', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    getCurriculumSetup: () => apiRequest('/api/admin/curriculum/setup'),
    updateCurriculumSetup: (data) => apiRequest('/api/admin/curriculum/setup', { method: 'PUT', body: JSON.stringify(data) }),
    getCurriculumLevels: () => apiRequest('/api/admin/curriculum/levels'),
    getCurriculumSubjectBank: () => apiRequest('/api/admin/curriculum/subject-bank'),
    getSchoolSubjects: () => apiRequest('/api/admin/curriculum/school-subjects'),
    saveSchoolSubjects:(subjects)=>apiRequest('/api/admin/curriculum/school-subjects',{method:'PUT',body:JSON.stringify({subjects})}),
    getCustomSubjects:()=>apiRequest('/api/admin/curriculum/custom-subjects'),
    createCustomSubject:(data)=>apiRequest('/api/admin/curriculum/custom-subjects',{method:'POST',body:JSON.stringify(data||{})}),
    deleteCustomSubject:(id)=>apiRequest(`/api/admin/curriculum/custom-subjects/${encodeURIComponent(id)}`,{method:'DELETE'}),
    getAssessmentSettings: () => apiRequest('/api/admin/assessment-settings'),
    saveAssessmentSettings: (assessmentSettings) => apiRequest('/api/admin/assessment-settings', { method: 'PUT', body: JSON.stringify({ assessmentSettings }) }),
    getEligibleSubjectsForClass: (classId) => apiRequest(`/api/admin/curriculum/classes/${classId}/subjects`),
    previewClassGeneration: () => apiRequest('/api/admin/curriculum/classes/generation-preview'),
    generateClassesFromSettings: (previewToken) => apiRequest('/api/admin/curriculum/classes/generate', { method:'POST', body:JSON.stringify({ previewToken }) }),
    syncCurriculumClasses: (data = {}) => apiRequest('/api/admin/curriculum/classes/sync', { method:'POST', body: JSON.stringify(data || {}) }),
    getStudentSubjectSelection: (studentId) => apiRequest(`/api/admin/students/${studentId}/subject-selection`),
    saveStudentSubjectSelection: (studentId, data) => apiRequest(`/api/admin/students/${studentId}/subject-selection`, { method: 'PUT', body: JSON.stringify(data) }),
    submitSchoolPaymentConfirmation: (data) => apiRequest('/api/admin/billing/payment-confirmation', { method: 'POST', body: JSON.stringify(data) }),
    getParentConversations: () => apiRequest('/api/admin/parent-conversations'),
    getParentMessages: (parentId) => apiRequest(`/api/admin/messages/${parentId}`),
    replyToParent: (data) => apiRequest('/api/admin/reply-parent', { method: 'POST', body: JSON.stringify(data) }),
    getFinanceStaff: () => apiRequest('/api/admin/finance-staff'),
    createFinanceStaff: (data) => apiRequest('/api/admin/finance-staff', { method:'POST', body:JSON.stringify(data) }),
    updateFinanceStaff: (userId, data) => apiRequest(`/api/admin/finance-staff/${userId}`, { method:'PATCH', body:JSON.stringify(data) })
};

// ============ TEACHER ENDPOINTS ============
const teacherAPI = {
    getClassTransferOptions: () => apiRequest('/api/lifecycle/transfer-options'),
    previewClassTransfer: (data) => apiRequest('/api/lifecycle/transfers/preview', { method:'POST', body:JSON.stringify(data) }),
    requestClassTransfer: (data) => apiRequest('/api/lifecycle/transfer-requests', { method:'POST', body:JSON.stringify(data) }),
    listClassTransfers: (params={}) => apiRequest(`/api/lifecycle/transfers${Object.keys(params).length?`?${cleanQueryParams(params)}`:''}`),
    cancelClassTransfer: (id,reason='') => apiRequest(`/api/lifecycle/transfers/${id}/cancel`, { method:'POST', body:JSON.stringify({reason}) }),
    getStudentEnrollmentHistory: (studentId) => apiRequest(`/api/lifecycle/students/${studentId}/enrollments`),
    getMyStudents: () => apiRequest('/api/teacher/students'),
    addStudent: (data) => 
        apiRequest('/api/teacher/students', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    enterMarks: (data) => 
        apiRequest('/api/teacher/marks', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    takeAttendance: (data) => 
        apiRequest('/api/teacher/attendance', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getAttendanceSession: (classId, date) => apiRequest(`/api/attendance/sessions/${classId}/${date}`),
    saveAttendanceDraft: (sessionId, records) => apiRequest(`/api/attendance/sessions/${sessionId}/draft`, { method: 'PUT', body: JSON.stringify({ records }) }),
    lockAttendanceSession: (sessionId) => apiRequest(`/api/attendance/sessions/${sessionId}/lock`, { method: 'POST', body: JSON.stringify({}) }),
    releaseAttendanceClass: (sessionId, data) => apiRequest(`/api/attendance/sessions/${sessionId}/release`, { method: 'POST', body: JSON.stringify(data) }),
    addComment: (data) => 
        apiRequest('/api/teacher/comment', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    uploadMarksCSV: (formData) => uploadFile('/api/teacher/upload/marks', formData),
    getConversations: () => apiRequest('/api/teacher/conversations'),
    getStaffMembers: () => apiRequest('/api/teacher/staff-members'),
    getStaffConversations: () => apiRequest('/api/teacher/conversations'),
    getGroupMessages: () => apiRequest('/api/teacher/group-messages'),
    getPrivateMessages: (otherUserId) => apiRequest(`/api/teacher/private-messages/${otherUserId}`),
    sendGroupMessage: (data) => apiRequest('/api/teacher/group-message', { method: 'POST', body: JSON.stringify(data) }),
    sendPrivateMessage: (data) => apiRequest('/api/teacher/private-message', { method: 'POST', body: JSON.stringify(data) }),
    getParentMessages: (parentId) => apiRequest(`/api/teacher/messages/${parentId}`),
    replyToParent: (data) => apiRequest('/api/teacher/reply', { method: 'POST', body: JSON.stringify(data) }),
    getPerformanceData: () => apiRequest('/api/teacher/performance'),
    getMyAssignments: () => apiRequest('/api/teacher/my-assignments'),
    getParentConversations: () => apiRequest('/api/teacher/parent-conversations'),
    getMessages: (otherUserId) => apiRequest(`/api/teacher/messages/${otherUserId}`),
    markMessagesAsRead: (otherUserId) => apiRequest(`/api/teacher/messages/read/${otherUserId}`, { method: 'PUT' }),
    deleteMessage: (messageId, mode = 'me') => apiRequest(`/api/teacher/messages/${messageId}`, { method: 'DELETE', body: JSON.stringify({ deleteFor: mode, mode }) }),
    deleteStudent: (studentId) => apiRequest(`/api/teacher/students/${studentId}`, { method: 'DELETE' }),
    getClassStudents: (classId) => apiRequest(`/api/teacher/classes/${classId}/students`),
    getMyClass: () => apiRequest('/api/teacher/my-class'),
    getMySubjects: () => apiRequest('/api/teacher/my-subjects'),
    getTeacherStats: () => apiRequest('/api/teacher/stats'),
    uploadStudentsCSV: (formData, onProgress) => uploadFile('/api/upload/students', formData, onProgress),
    publishMarks: (data) => apiRequest('/api/teacher/marks/publish', { method: 'POST', body: JSON.stringify(data) }),
    updateMark: (recordId, data) => apiRequest(`/api/teacher/marks/${recordId}`, { method: 'PUT', body: JSON.stringify(data) }),
    getAnalytics: () => apiRequest(`/api/teacher/analytics?_=${Date.now()}`),
    getGradebook: (params = {}) => apiRequest('/api/teacher/gradebook' + (Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '')),
    getClassStudentsForSubject: (params = {}) => apiRequest('/api/teacher/class-students' + (Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '')),
    getClassReportSnapshots: (params = {}) => apiRequest('/api/teacher/reports/snapshots' + (Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '')),
    getStudentReportPreview: (studentId, params = {}) => apiRequest(`/api/teacher/students/${studentId}/report-card-preview` + (Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '')),
    getSubjectRequests: () => apiRequest('/api/teacher/subject-selection-requests'),
    reviewSubjectRequest: (selectionId, data) => apiRequest(`/api/teacher/subject-selection-requests/${selectionId}/review`, { method:'POST', body: JSON.stringify(data || {}) })
};

// ============ PARENT ENDPOINTS ============
const parentAPI = {
    getChildren: () => apiRequest('/api/parent/children'),
    linkChildByElimuId: (elimuid) => apiRequest('/api/parent/children/link', { method: 'POST', body: JSON.stringify({ elimuid }) }),
    getChildTodayAttendance: (studentId) => apiRequest(`/api/parent/child/${studentId}/attendance/today`),
    getChildSummary: (studentId) => 
        apiRequest(`/api/parent/child/${studentId}/summary`),
    getChildReportCardDetails: (studentId) => apiRequest(`/api/parent/child/${studentId}/report-card-details`),
    reportAbsence: (data) => 
        apiRequest('/api/parent/report-absence', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    // Subscription payments must use the real Daraja STK route.
    // The old /api/parent/pay endpoint is intentionally disabled for production safety.
    makePayment: (data) => 
        apiRequest('/api/payments/parent/fee/stk', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    submitManualFeePayment: (data) =>
        apiRequest('/api/payments/parent/fee/manual', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getPayments: () => apiRequest('/api/parent/payments'),
    getStudentFeeAccounts: (studentId) => apiRequest(`/api/payments/parent/students/${studentId}/fee-accounts`),
    getStudentPaymentHistory: (studentId, params = {}) => apiRequest(`/api/payments/parent/students/${studentId}/history${Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : ''}`),
    getSubscriptionPlans: () => apiRequest('/api/parent/plans'),
    // Upgrade/renew a child plan through real Daraja STK.
    // Keeps legacy callers working while avoiding disabled fake payment routes.
    upgradePlan: (data) => 
        apiRequest('/api/payments/parent/subscription/stk', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    sendMessage: (data) => 
        apiRequest('/api/parent/message', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getConversations: (params = {}) => apiRequest('/api/parent/conversations' + (Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '')),
    getMessages: (otherUserId, params = {}) => 
        apiRequest(`/api/parent/messages/${otherUserId}` + (Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '')),
    getChildMarks: (studentId) => apiRequest(`/api/parent/child/${studentId}/marks`),
    getFees: (studentId) => apiRequest(`/api/parent/fees/${studentId}`),
    getChildClassPerformance: (studentId) => apiRequest(`/api/parent/child/${studentId}/class-performance`),
    getChildSubjectPerformance: (studentId) => apiRequest(`/api/parent/child/${studentId}/subject-performance`),
    getAnalytics: (childId) => apiRequest(`/api/parent/analytics?childId=${encodeURIComponent(childId || '')}&_=${Date.now()}`),
    getChildSubjectSelection: (childId) => apiRequest(`/api/parent/child/${childId}/subject-selection`),
    saveChildSubjectSelection: (childId, data) => apiRequest(`/api/parent/child/${childId}/subject-selection`, { method:'PUT', body:JSON.stringify(data || {}) }),
    getChildEnrollmentHistory: (childId) => apiRequest(`/api/lifecycle/children/${childId}/enrollments`)
};

// ============ STUDENT ENDPOINTS ============
const studentAPI = {
    getDashboard: () => apiRequest('/api/student/dashboard'),
    getGrades: () => apiRequest('/api/student/grades'),
    getRecommendations: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/student/recommendations${query ? `?${query}` : ''}`);
    },
    careerOptions: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/student/careers${query ? `?${query}` : ''}`);
    },
    getCareerInterests: () => apiRequest('/api/student/career/interests'),
    saveCareerInterests: (data) => apiRequest('/api/student/career/interests', { method: 'PUT', body: JSON.stringify(data) }),
    generateCareerInsights: () => apiRequest('/api/student/career/insights', { method: 'POST' }),
    getAttendance: () => apiRequest('/api/student/attendance'),
    sendGroupMessage: (data) => apiRequest('/api/student/group-message', { method: 'POST', body: JSON.stringify(data) }),
    getMaterials: () => apiRequest('/api/student/materials'),
    sendMessage: (receiverId, content) => 
        apiRequest('/api/student/message', {
            method: 'POST',
            body: JSON.stringify({ receiverId, content })
        }),
    getMessages: (otherUserId) => 
        apiRequest(`/api/student/messages/${otherUserId}`),
    getGroupMessages: () => apiRequest('/api/student/group-messages'),   // <-- ADDED
    setFirstPassword: (data) => 
        apiRequest('/api/student/set-first-password', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getAllMarks: () => apiRequest('/api/student/marks/all'),
    getClassPerformance: () => apiRequest('/api/student/class-performance'),
    getSubjectPerformance: () => apiRequest('/api/student/subject-performance'),
    getGPA: () => apiRequest('/api/student/gpa'),
    getAnalytics: () => apiRequest(`/api/student/analytics?_=${Date.now()}`),
    getSubjectSelection: () => apiRequest('/api/student/subject-selection'),
    saveSubjectSelection: (data) => apiRequest('/api/student/subject-selection', { method:'PUT', body:JSON.stringify(data || {}) }),
    getEnrollmentHistory: () => apiRequest('/api/lifecycle/me/enrollments')
};

// ============ DUTY ENDPOINTS ============
const dutyAPI = {
    generate: (startDate, endDate) => apiRequest('/api/duty/generate', { method:'POST', body:JSON.stringify({ startDate, endDate }) }),
    getStats: () => apiRequest('/api/duty/stats'),
    getTodayDuty: () => apiRequest('/api/duty/today'),
    getWeeklyDuty: () => apiRequest('/api/duty/week'),
    getVerificationConfig: () => apiRequest('/api/duty/verification-config'),
    updateVerificationConfig: (data) => apiRequest('/api/duty/verification-config', { method: 'PUT', body: JSON.stringify(data) }),
    getComplianceReport: (date = '') => apiRequest(`/api/duty/compliance-report${date ? `?date=${encodeURIComponent(date)}` : ''}`),
    getLateArrivals: (date = '') => apiRequest(`/api/duty/late-arrivals${date ? `?date=${encodeURIComponent(date)}` : ''}`),
    verifiedCheckIn: (data) => apiRequest('/api/duty/check-in/verified', { method: 'POST', body: JSON.stringify(data) }),
    verifiedCheckOut: (data) => apiRequest('/api/duty/check-out/verified', { method: 'POST', body: JSON.stringify(data) }),
    checkIn: (data) => 
        apiRequest('/api/duty/check-in', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    checkOut: (data) => 
        apiRequest('/api/duty/check-out', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    updatePreferences: (data) => 
        apiRequest('/api/duty/preferences', {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    requestSwap: (data) => 
        apiRequest('/api/duty/request-swap', {
            method: 'POST',
            body: JSON.stringify(data)
        })
};

// ============ SCHOOL ENDPOINTS ============
const schoolAPI = {
    createNameChangeRequest: (data) => 
        apiRequest('/api/school/name-change-request', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getNameChangeRequests: () => 
        apiRequest('/api/school/name-change-requests')
};

// ============ ANALYTICS ENDPOINTS ============
const analyticsAPI = {
    getStudentAnalytics: (studentId, curriculum, period) => 
        apiRequest(`/api/analytics/student/${studentId}?curriculum=${curriculum || ''}&period=${period || 'term'}`),
    getClassAnalytics: (classId, subject) => 
        apiRequest(`/api/analytics/class/${classId}${subject ? `?subject=${subject}` : ''}`),
    getSchoolAnalytics: () => apiRequest('/api/analytics/school'),
    compareCurriculum: (studentId) => 
        apiRequest(`/api/analytics/compare/${studentId}`)
};

// ============ UPLOAD ENDPOINTS ============
const uploadAPI = {
    uploadStudents: (formData, onProgress) => 
        uploadFile('/api/upload/students', formData, onProgress),
    uploadMarks: (formData, onProgress) => 
        uploadFile('/api/upload/marks', formData, onProgress),
    uploadAttendance: (formData, onProgress) => 
        uploadFile('/api/upload/attendance', formData, onProgress),
    downloadTemplate: (type) => 
        apiRequest(`/api/upload/template/${type}`, { responseType: 'blob' }),
    validateCSV: (formData) => 
        uploadFile('/api/upload/validate', formData),
    getUploadHistory: () => apiRequest('/api/upload/history')
};

// ============ PUBLIC ENDPOINTS ============
const publicAPI = {
    getPublicDutyToday: (schoolId) => 
        apiRequest(`/api/public/duty/today?schoolId=${schoolId}`),
    getPublicWeeklyDuty: (schoolId) => 
        apiRequest(`/api/public/duty/week?schoolId=${schoolId}`),
    getSchoolInfo: (schoolId) => 
        apiRequest(`/api/public/school/${schoolId}`)
};

// ============ USER PROFILE ENDPOINTS ============
const userAPI = {
    updateProfile: (data) => 
        apiRequest('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    updatePreferences: (preferences) => 
        apiRequest('/api/user/preferences', {
            method: 'PUT',
            body: JSON.stringify({ preferences })
        }),
    getMyStats: () => apiRequest('/api/user/stats'),
    exportMyData: () => apiRequest('/api/user/export'),
    deactivateAccount: (reason) => 
        apiRequest('/api/user/deactivate', {
            method: 'POST',
            body: JSON.stringify({ reason })
        }),
    getAlerts: () => apiRequest('/api/user/alerts'),
    uploadProfilePicture: (formData, onProgress) => uploadFile('/api/user/profile-picture', formData, onProgress),
    uploadSignature: (formData, onProgress) => uploadFile('/api/user/signature', formData, onProgress)
};


// ============ ALERTS ENDPOINTS ============
const alertsAPI = {
    getMine: () => apiRequest('/api/alerts'),
    create: (data) => apiRequest('/api/alerts', { method: 'POST', body: JSON.stringify(data) }),
    markRead: (id) => apiRequest(`/api/alerts/${id}/read`, { method: 'PUT' }),
    markAllRead: () => apiRequest('/api/alerts/read-all', { method: 'PUT' }),
    suggestParentMessage: (data) => apiRequest('/api/alerts/suggest-parent-message', { method: 'POST', body: JSON.stringify(data) }),
    suggestAnnouncement: (data) => apiRequest('/api/alerts/suggest-announcement', { method: 'POST', body: JSON.stringify(data) })
};

// ============ CONSENT ENDPOINTS ============
const consentAPI = {
    getStatus: () => apiRequest('/api/consent/status'),
    accept: (termsAccepted, privacyAccepted) => apiRequest('/api/consent/accept', {
        method: 'POST',
        body: JSON.stringify({ termsAccepted, privacyAccepted })
    }),
    getDPAStatus: () => apiRequest('/api/consent/dpa/status'),
    acceptDPA: () => apiRequest('/api/consent/dpa/accept', { method: 'POST' }),
    giveParentalConsent: (studentId) => apiRequest('/api/consent/parental-consent', {
        method: 'POST',
        body: JSON.stringify({ studentId })
    })
};

// File upload helper
async function uploadFile(endpoint, fileOrFormData, onProgress) {
    const formData = fileOrFormData instanceof FormData ? fileOrFormData : new FormData();
    if (!(fileOrFormData instanceof FormData)) {
        formData.append('file', fileOrFormData);
    }
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable && onProgress) {
                const percent = (e.loaded / e.total) * 100;
                onProgress(percent);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                    reject(new Error('Invalid response from server'));
                }
            } else {
                let message = `Upload failed: ${xhr.status}`;
                try {
                    const parsed = JSON.parse(xhr.responseText || '{}');
                    message = parsed.message || message;
                } catch (_) {}
                reject(new Error(message));
            }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        
        xhr.open('POST', `${API_BASE_URL}${endpoint}`);
        const currentToken = localStorage.getItem('authToken') || localStorage.getItem('token') || authToken;
        if (currentToken) {
            xhr.setRequestHeader('Authorization', `Bearer ${currentToken}`);
        }
        xhr.send(formData);
    });
}

// ============ HELP API ============
const helpAPI = {
  getArticles: (role) => apiRequest(`/api/help/articles?role=${role}`),
  search: (query) => apiRequest(`/api/help/search?q=${query}`)
};

// ============ TASKS API ============
const tasksAPI = {
  getTasks: () => apiRequest('/api/tasks'),
  createTask: (data) => apiRequest('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (taskId, data) => apiRequest(`/api/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (taskId) => apiRequest(`/api/tasks/${taskId}`, { method: 'DELETE' }),
  completeTask: (taskId) => apiRequest(`/api/tasks/${taskId}/complete`, { method: 'POST' })
};

// ============ STUDENT DETAILS ============
const studentsAPI = {
    getFullDetails: (studentId) => apiRequest(`/api/user/students/${studentId}/details`)
};

// ============ NEW FEATURES APIs ============

// Homework
const homeworkAPI = {
    getTeacherAssignments: () => apiRequest('/api/homework/teacher'),
    createAssignment: (data) => apiRequest('/api/homework/assign', { method: 'POST', body: JSON.stringify(data) }),
    getStudentAssignments: () => apiRequest('/api/homework/student'),
    submitAssignment: (assignmentId, data) => apiRequest(`/api/homework/submit/${assignmentId}`, { method: 'POST', body: JSON.stringify(data) }),
    uploadSubmissionAttachment: (formData) => apiRequest('/api/homework/submission-attachments', { method: 'POST', body: formData })
};

// Calendar
const calendarAPI = {
    getEvents: () => apiRequest('/api/calendar'),
    createEvent: (data) => apiRequest('/api/calendar', { method: 'POST', body: JSON.stringify(data) }),
    deleteEvent: (id) => apiRequest(`/api/calendar/${id}`, { method: 'DELETE' })
};

// Timetable
const timetableAPI = {
    generate: (weekStartDate) => apiRequest('/api/timetable/generate', { method: 'POST', body: JSON.stringify({ weekStartDate }) }),
    getForTeacher: (teacherId, weekStart) => apiRequest(`/api/timetable/teacher/${teacherId}?weekStart=${weekStart}`),
    getForClass: (classId, weekStart) => apiRequest(`/api/timetable/class/${classId}?weekStart=${weekStart}`),
    publish: (id) => apiRequest(`/api/timetable/${id}/publish`, { method: 'POST' })
};

// Gamification
const gamificationAPI = {
    getLeaderboard: (classId) => apiRequest(`/api/gamification/leaderboard/${classId}`),
    getBadges: (studentId) => apiRequest(`/api/gamification/badges/${studentId}`),
    getRewards: () => apiRequest('/api/gamification/rewards'),
    redeemReward: (data) => apiRequest('/api/gamification/rewards/redeem', { method: 'POST', body: JSON.stringify(data) })
};


// Enhanced AI Tutor
const tutorAPI = {
    getConfig: () => apiRequest('/api/tutor/config'),
    ask: (data) => apiRequest('/api/tutor/ask', { method: 'POST', body: JSON.stringify(data) }),
    getProgress: (studentId = '') => apiRequest(`/api/tutor/progress/${studentId}`),
    getSession: (studentId = '') => apiRequest(`/api/tutor/session/${studentId}`),
    listSessions: () => apiRequest('/api/tutor/sessions'),
    createSession: (data = {}) => apiRequest('/api/tutor/sessions', { method:'POST', body:JSON.stringify(data) }),
    getSessionById: (id) => apiRequest(`/api/tutor/sessions/${id}`),
    submitPracticeAnswer: (data) => apiRequest('/api/tutor/practice/answer', { method: 'POST', body: JSON.stringify(data) }),
    getParentReport: (parentId = '') => apiRequest(`/api/tutor/reports/parent/${parentId}`),
    getTeacherReport: (classId = '') => apiRequest(`/api/tutor/reports/teacher/${classId}`)
};

// Global Search
const searchAPI = {
    globalSearch: (q) => apiRequest(`/api/search?q=${encodeURIComponent(q)}`)
};




// ============ FEE STRUCTURE ENDPOINTS ============
const feeStructureAPI = {
    list: (params = {}) => apiRequest('/api/fee-structures' + (Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '')),
    get: (id) => apiRequest(`/api/fee-structures/${id}`),
    create: (data) => apiRequest('/api/fee-structures', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/api/fee-structures/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/api/fee-structures/${id}`, { method: 'DELETE' }),
    activate: (id) => apiRequest(`/api/fee-structures/${id}/activate`, { method: 'POST' }),
    lock: (id) => apiRequest(`/api/fee-structures/${id}/lock`, { method: 'POST' }),
    assign: (id, data) => apiRequest(`/api/fee-structures/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
    studentAccounts: (params = {}) => apiRequest('/api/fee-structures/student-accounts' + (Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : '')),
    adjustStudentAccount: (feeId, data) => apiRequest(`/api/fee-structures/student-accounts/${feeId}/adjust`, { method: 'POST', body: JSON.stringify(data) })
};

// ============ PAYMENT / DARAJA ENDPOINTS ============
const paymentAPI = {
    getSchoolSettings: () => apiRequest('/api/payments/admin/school-settings'),
    updateSchoolSettings: (data) => apiRequest('/api/payments/admin/school-settings', { method: 'PUT', body: JSON.stringify(data) }),
    testSchoolConnection: () => apiRequest('/api/payments/admin/test-connection', { method: 'POST' }),
    getPlatformSettings: () => apiRequest('/api/payments/superadmin/platform-settings'),
    updatePlatformSettings: (data) => apiRequest('/api/payments/superadmin/platform-settings', { method: 'PUT', body: JSON.stringify(data) }),
    parentFeeSTK: (data) => apiRequest('/api/payments/parent/fee/stk', { method: 'POST', body: JSON.stringify(data) }),
    parentFeeManual: (data) => apiRequest('/api/payments/parent/fee/manual', { method: 'POST', body: JSON.stringify(data) }),
    getManualQueue: () => apiRequest('/api/payments/admin/manual-queue'),
    getAdminRecords: (params = {}) => { const q = cleanQueryParams(params); return apiRequest(`/api/payments/admin/records${q ? `?${q}` : ''}`); },
    getFinanceContext: () => apiRequest('/api/payments/admin/context'),
    getAdminFinanceSummary: () => apiRequest('/api/payments/admin/finance-summary'),
    getStudentFinance: (studentId) => apiRequest(`/api/payments/admin/students/${studentId}/finance`),
    getStudentHistory: (studentId, params = {}) => apiRequest(`/api/payments/admin/students/${studentId}/history${Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : ''}`),
    recordManualPayment: (studentId, data) => apiRequest(`/api/payments/admin/students/${studentId}/manual-payment`, { method: 'POST', body: JSON.stringify(data) }),
    recordBursary: (studentId, data) => apiRequest(`/api/payments/admin/students/${studentId}/bursary`, { method: 'POST', body: JSON.stringify(data) }),
    approveManualPayment: (paymentId, data = {}) => apiRequest(`/api/payments/admin/manual-queue/${paymentId}/approve`, { method: 'POST', body: JSON.stringify(data) }),
    rejectManualPayment: (paymentId, data = {}) => apiRequest(`/api/payments/admin/manual-queue/${paymentId}/reject`, { method: 'POST', body: JSON.stringify(data) }),
    parentSubscriptionSTK: (data) => apiRequest('/api/payments/parent/subscription/stk', { method: 'POST', body: JSON.stringify(data) }),
    parentSubscriptionManual: (data) => apiRequest('/api/payments/parent/subscription/manual', { method: 'POST', body: JSON.stringify(data) }),
    getPlatformManualQueue: () => apiRequest('/api/payments/superadmin/platform-manual-queue'),
    getParentSchoolPaymentSettings: () => apiRequest('/api/payments/parent/school-settings'),
    reviewPlatformManualPayment: (paymentId, data = {}) => apiRequest(`/api/payments/superadmin/platform-manual-queue/${paymentId}/review`, { method: 'POST', body: JSON.stringify(data) }),
    schoolSubscriptionSTK: (data) => apiRequest('/api/payments/school/subscription/stk', { method: 'POST', body: JSON.stringify(data) }),
    adminNameChangeSTK: (data) => apiRequest('/api/payments/admin/name-change/stk', { method: 'POST', body: JSON.stringify(data) }),
    platformSTK: (data) => apiRequest('/api/payments/platform/stk', { method: 'POST', body: JSON.stringify(data) }),
    querySTKStatus: (checkoutRequestId) => apiRequest(`/api/payments/stk/${checkoutRequestId}/status`)
};


// ============ LOCKED LIFECYCLE / REPORT HISTORY ENDPOINTS ============
const lifecycleAPI = {
    getUpcomingBirthdays: (days = 60) => apiRequest(`/api/lifecycle/birthdays/upcoming?days=${encodeURIComponent(days)}`),
    getBirthdaySettings: () => apiRequest('/api/lifecycle/birthdays/settings'),
    saveBirthdaySettings: (data) => apiRequest('/api/lifecycle/birthdays/settings', { method:'PUT', body:JSON.stringify(data || {}) }),
    updateBirthdayPrivacy: (studentId, data) => apiRequest(`/api/lifecycle/birthdays/students/${studentId}/privacy`, { method:'PATCH', body:JSON.stringify(data || {}) }),
    processBirthdayReminders: () => apiRequest('/api/lifecycle/birthdays/process', { method:'POST', body:JSON.stringify({}) }),
    getReportHistory: (params = {}) => apiRequest(`/api/report-cards/history${Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : ''}`),
    getReportSnapshot: (id) => apiRequest(`/api/report-cards/history/${id}`),
    correctReportSnapshot: (id, data) => apiRequest(`/api/report-cards/history/${id}/correct`, { method:'POST', body:JSON.stringify(data || {}) }),
    shareReportSnapshot: (id, data) => apiRequest(`/api/report-cards/history/${id}/share`, { method:'POST', body:JSON.stringify(data || {}) })
};

// ============ FINANCE WORKSPACE ============
const financeAPI={
    getModules:()=>apiRequest('/api/finance/modules'),
    getOverview:(params={})=>{const q=cleanQueryParams(params);return apiRequest(`/api/finance/overview${q?`?${q}`:''}`);},
    getAlerts:(limit=200)=>apiRequest(`/api/finance/alerts?limit=${encodeURIComponent(limit)}`),
    getInvoices:(params={})=>{const q=cleanQueryParams(params);return apiRequest(`/api/finance/invoices${q?`?${q}`:''}`);},
    getAnalytics:(params={})=>{const q=cleanQueryParams(params);return apiRequest(`/api/finance/analytics${q?`?${q}`:''}`);},
    getAuditTrail:(params={})=>{const q=cleanQueryParams(params);return apiRequest(`/api/finance/audit-trail${q?`?${q}`:''}`);},
    getExpenses:(params={})=>{const q=cleanQueryParams(params);return apiRequest(`/api/finance/expenses${q?`?${q}`:''}`);},
    createExpense:(data)=>apiRequest('/api/finance/expenses',{method:'POST',body:JSON.stringify(data||{})}),
    updateExpense:(id,data)=>apiRequest(`/api/finance/expenses/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(data||{})}),
    deleteExpense:(id)=>apiRequest(`/api/finance/expenses/${encodeURIComponent(id)}`,{method:'DELETE'}),
    getReport:(params={})=>{const q=cleanQueryParams(params);return apiRequest(`/api/finance/report${q?`?${q}`:''}`);}
};

// ============ ASSEMBLE API OBJECT ============
const api = {
    auth: authAPI,
    alerts: alertsAPI,
    superAdmin: superAdminAPI,
    admin: adminAPI,
    teacher: teacherAPI,
    parent: parentAPI,
    student: studentAPI,
    lifecycle: lifecycleAPI,
    finance: financeAPI,
    duty: dutyAPI,
    analytics: analyticsAPI,
    upload: uploadAPI,
    public: publicAPI,
    school: schoolAPI,
    user: userAPI,
    help: helpAPI,
    tasks: tasksAPI,
    consent: consentAPI,
    students: studentsAPI,
    homework: homeworkAPI,        // <-- NEW
    calendar: calendarAPI,        // <-- NEW
    timetable: timetableAPI,      // <-- NEW
    gamification: gamificationAPI,// <-- NEW
    search: searchAPI,            // <-- NEW
    tutor: tutorAPI,              // <-- ENHANCED AI TUTOR
    payments: paymentAPI,          // <-- DARAJA / M-PESA
    feeStructures: feeStructureAPI, // <-- ADMIN FEE STRUCTURE CONTROL
    sms: {
        getConfig: () => apiRequest('/api/sms/config'),
        saveConfig: (payload) => apiRequest('/api/sms/config', { method:'PUT', body: JSON.stringify(payload) }),
        send: (payload) => apiRequest('/api/sms/send', { method:'POST', body: JSON.stringify(payload) }),
        getHistory: () => apiRequest('/api/sms/history')
    },
    homeTasks: {
        getToday: (studentId) => apiRequest(`/api/home-tasks/today?studentId=${studentId}`),
        complete: (taskId, feedback) => apiRequest(`/api/home-tasks/${taskId}/complete`, { method: 'POST', body: JSON.stringify(feedback) })
    },
    subscription: {
        getPlans: (ownerType) => apiRequest(`/api/subscription/plans${ownerType ? `?ownerType=${encodeURIComponent(ownerType)}` : ''}`),
        getMyStatus: () => apiRequest('/api/subscription/my-status'),
        getSchoolStatus: () => apiRequest('/api/subscription/school/status'),
        getSchoolBillingHistory: () => apiRequest('/api/subscription/school/billing-history'),
        requestSchool: (data) => apiRequest('/api/subscription/school/request', { method: 'POST', body: JSON.stringify(data) }),
        getChildStatus: (studentId) => apiRequest(`/api/subscription/child/${encodeURIComponent(studentId)}/status`),
        requestChild: (data) => apiRequest('/api/subscription/child/request', { method: 'POST', body: JSON.stringify(data) }),
        upgrade: (data) => apiRequest('/api/subscription/upgrade', { method: 'POST', body: JSON.stringify(data) })
    }
};

// Expose globally
window.api = api;
window.apiRequest = apiRequest;
window.uploadFile = uploadFile;

console.log('✅ API loaded successfully!');
console.log('📊 Available APIs:', Object.keys(window.api).join(', '));


function resolveMediaUrl(url) {
    if (!url) return '';
    let raw = String(url).trim();
    if (!raw) return '';

    // V111: Data/blob URLs are complete media URLs. Do NOT prefix them with the backend.
    // This fixes broken requests like:
    // https://shuleaibackend-32h1.onrender.com/data:image/png;base64,...
    const embeddedDataUrlIndex = raw.search(/data:image\/[a-zA-Z0-9.+-]+;base64,/i);
    if (embeddedDataUrlIndex >= 0) {
        return raw.slice(embeddedDataUrlIndex);
    }
    if (/^(data|blob):/i.test(raw)) return raw;
    if (/\/uploads\/profiles\//i.test(raw)) return '';
    if (/^http:\/\/shuleaibackend-32h1\.onrender\.com/i.test(raw)) raw = raw.replace(/^http:/i, 'https:');
    if (/^https?:\/\//i.test(raw)) return raw;

    // Some cached values may accidentally start with /data:image/ after earlier normalization.
    if (/^\/?data:image\//i.test(raw)) return raw.replace(/^\/+/, '');

    // If an image field contains raw base64 only, still render it instead of making an invalid API URL.
    if (/^[A-Za-z0-9+/\r\n]+={0,2}$/.test(raw) && raw.length > 500) {
        return 'data:image/png;base64,' + raw.replace(/\s+/g, '');
    }

    const base = (typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '').replace(/\/$/, '');
    if (!base) return raw;
    return base + (raw.startsWith('/') ? raw : '/' + raw);
}
window.resolveMediaUrl = resolveMediaUrl;
window.normalizeShuleMediaUrl = resolveMediaUrl;


// ============ V9 CHAT / THREADS / ACHIEVEMENTS ============
const chatV9API = {
    getDepartments: () => apiRequest('/api/chat-v9/departments'),
    getDepartmentGroup: (departmentId) => apiRequest(`/api/chat-v9/departments/${departmentId}/group`),
    createDepartment: (data) => apiRequest('/api/chat-v9/departments', { method: 'POST', body: JSON.stringify(data) }),
    updateDepartment: (departmentId, data) => apiRequest(`/api/chat-v9/departments/${departmentId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDepartment: (departmentId) => apiRequest(`/api/chat-v9/departments/${departmentId}`, { method: 'DELETE' }),
    getTeachers: () => apiRequest('/api/chat-v9/teachers'),

    getTeacherGroups: () => apiRequest('/api/chat-v9/teacher/groups'),
    createTeacherGroup: (data) => apiRequest('/api/chat-v9/teacher/groups', { method: 'POST', body: JSON.stringify(data) }),

    getDirectMessages: (userId) => apiRequest(`/api/chat-v9/teacher/direct/${userId}`),
    sendDirectMessage: (receiverId, content, attachmentUrl = null, attachment = null, replyToMessageId = null, clientMessageId = null) =>
        apiRequest('/api/chat-v9/teacher/direct', { method: 'POST', body: JSON.stringify({ receiverId, content, attachmentUrl, attachment, replyToMessageId, clientMessageId }) }),
    editMessage: (messageId, content) => apiRequest(`/api/chat-v9/messages/${messageId}`, { method: 'PUT', body: JSON.stringify({ content }) }),
    deleteMessage: (messageId, mode = 'me') => apiRequest(`/api/chat-v9/messages/${messageId}`, { method: 'DELETE', body: JSON.stringify({ mode }) }),
    getStudentDirectMessages: (userId) => apiRequest(`/api/chat-v9/student/direct/${userId}`),
    sendStudentDirectMessage: (receiverId, content, attachmentUrl = null, attachment = null, replyToMessageId = null, clientMessageId = null) =>
        apiRequest('/api/chat-v9/student/direct', { method: 'POST', body: JSON.stringify({ receiverId, content, attachmentUrl, attachment, replyToMessageId, clientMessageId }) }),

    getGroupMessages: (groupId) => apiRequest(`/api/chat-v9/teacher/groups/${groupId}/messages`),
    getGroupMembers: (groupId) => apiRequest(`/api/chat-v9/teacher/groups/${groupId}/members`),
    updateGroupMembers: (groupId, memberUserIds) => apiRequest(`/api/chat-v9/teacher/groups/${groupId}/members`, { method: 'PUT', body: JSON.stringify({ memberUserIds }) }),
    getAvailableMembers: () => apiRequest('/api/chat-v9/teacher/available-members'),
    uploadAttachment: (formData) => uploadFile('/api/chat-v9/attachments', formData),
    sendGroupMessage: (groupId, content, attachmentUrl = null, attachment = null, replyToMessageId = null, clientMessageId = null) =>
        apiRequest(`/api/chat-v9/teacher/groups/${groupId}/messages`, { method: 'POST', body: JSON.stringify({ content, attachmentUrl, attachment, replyToMessageId, clientMessageId }) }),

    getClassroomThreads: () => apiRequest('/api/chat-v9/classroom/threads'),
    createClassroomThread: (data) => apiRequest('/api/chat-v9/classroom/threads', { method: 'POST', body: JSON.stringify(data) }),
    updateClassroomThread: (threadId, data) => apiRequest(`/api/chat-v9/classroom/threads/${threadId}`, { method: 'PUT', body: JSON.stringify(data) }),
    replyToThread: (threadId, content, parentReplyId = null, clientMessageId = null) =>
        apiRequest(`/api/chat-v9/classroom/threads/${threadId}/replies`, { method: 'POST', body: JSON.stringify({ content, parentReplyId, clientMessageId }) }),
    editThreadReply: (replyId, content) => apiRequest(`/api/chat-v9/classroom/replies/${replyId}`, { method: 'PUT', body: JSON.stringify({ content }) }),
    deleteThreadReply: (replyId, mode = 'me') => apiRequest(`/api/chat-v9/classroom/replies/${replyId}`, { method: 'DELETE', body: JSON.stringify({ mode }) }),

    awardThreadReply: (replyId, points = 0, streakDelta = 0, note = '') =>
        apiRequest(`/api/chat-v9/classroom/replies/${replyId}/award`, { method: 'POST', body: JSON.stringify({ points, streakDelta, note }) }),
    awardChatMessage: (messageId, points = 0, streakDelta = 0, note = '') =>
        apiRequest(`/api/chat-v9/teacher/messages/${messageId}/award`, { method: 'POST', body: JSON.stringify({ points, streakDelta, note }) }),
    reactToMessage: (messageId, emoji) =>
        apiRequest(`/api/chat-v9/teacher/messages/${messageId}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
    pinThreadReply: (replyId, isPinned = true) =>
        apiRequest(`/api/chat-v9/classroom/replies/${replyId}/pin`, { method: 'POST', body: JSON.stringify({ isPinned }) }),

    getMyAchievements: () => apiRequest('/api/chat-v9/achievements/me')
};
window.chatV9API = chatV9API;
