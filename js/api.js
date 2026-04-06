// API Configuration
const API_BASE_URL = 'https://shuleaibackend-32h1.onrender.com';

// Token management
let authToken = localStorage.getItem('authToken');
let refreshToken = localStorage.getItem('refreshToken');

// Track rate limit state
let rateLimitUntil = null;

// API request wrapper with authentication
async function apiRequest(endpoint, options = {}) {
    // Check if we're in rate limit cooldown
    if (rateLimitUntil && new Date() < rateLimitUntil) {
        const waitSeconds = Math.ceil((rateLimitUntil - new Date()) / 1000);
        throw new Error(`Rate limited. Please wait ${waitSeconds} seconds before trying again.`);
    }
    
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const config = {
        ...options,
        headers,
        credentials: 'include'
    };
    
    try {
        const response = await fetch(url, config);
        
        // Handle rate limiting (429)
        if (response.status === 429) {
            // Try to get retry-after header
            let retryAfter = 60; // default 60 seconds
            const retryAfterHeader = response.headers.get('Retry-After');
            if (retryAfterHeader) {
                retryAfter = parseInt(retryAfterHeader) || 60;
            }
            
            // Set cooldown
            rateLimitUntil = new Date(Date.now() + (retryAfter * 1000));
            
            throw new Error(`Too many login attempts. Please wait ${retryAfter} seconds before trying again.`);
        }
        
        // Handle empty responses
        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            console.error('Failed to parse response:', text);
            throw new Error(`Server error: ${text.substring(0, 100)}`);
        }
        
        // Handle token refresh
        if (response.status === 401 && refreshToken) {
            const refreshed = await refreshAuthToken();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${authToken}`;
                const retryResponse = await fetch(url, {
                    ...options,
                    headers
                });
                return handleResponse(retryResponse);
            }
        }
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Request failed:', error);
        throw error;
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
    
    login: (email, password, role) => 
        apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, role })
        }),
    
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
    getSchoolDistribution: () => apiRequest('/api/super-admin/school-distribution')
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
    updateTeacher: (teacherId, data) => 
        apiRequest(`/api/admin/teachers/${teacherId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    getDashboardData: () => apiRequest('/api/admin/dashboard'),
    getClassDetails: (classId) => apiRequest(`/api/admin/classes/${classId}`)
};

// ============ TEACHER ENDPOINTS ============
const teacherAPI = {
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
    addComment: (data) => 
        apiRequest('/api/teacher/comment', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    uploadMarksCSV: (formData) => 
        uploadFile('/api/teacher/upload/marks', formData),
    getConversations: () => apiRequest('/api/teacher/conversations'),
    getStaffMembers: () => apiRequest('/api/teacher/staff-members'),
    getStaffConversations: () => apiRequest('/api/teacher/chat/conversations'),
    getGroupMessages: () => apiRequest('/api/teacher/chat/group-messages'),
    getPrivateMessages: (otherUserId) => apiRequest(`/api/teacher/chat/messages/${otherUserId}`),
    sendGroupMessage: (data) => apiRequest('/api/teacher/group-message', { method: 'POST', body: JSON.stringify(data) }),
    sendPrivateMessage: (data) => apiRequest('/api/teacher/private-message', { method: 'POST', body: JSON.stringify(data) }),
    getParentMessages: (parentId) => apiRequest(`/api/teacher/messages/${parentId}`),
    replyToParent: (data) => apiRequest('/api/teacher/reply', { method: 'POST', body: JSON.stringify(data) }),
    getPerformanceData: () => apiRequest('/api/teacher/performance'),
    getMyAssignments: () => apiRequest('/api/teacher/my-assignments'),
    getParentConversations: () => apiRequest('/api/teacher/conversations'),
    getMessages: (otherUserId) => apiRequest(`/api/teacher/messages/${otherUserId}`),
    markMessagesAsRead: (otherUserId) => 
        apiRequest(`/api/teacher/messages/read/${otherUserId}`, { method: 'PUT' }),
    replyToParent: (data) => 
        apiRequest('/api/teacher/reply', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    deleteStudent: (studentId) => 
        apiRequest(`/api/teacher/students/${studentId}`, { method: 'DELETE' }),
    getClassStudents: (classId) => apiRequest(`/api/teacher/classes/${classId}/students`),
    getMyClass: () => apiRequest('/api/teacher/my-class'),
    getMySubjects: () => apiRequest('/api/teacher/my-subjects'),
    getTeacherStats: () => apiRequest('/api/teacher/stats'),
    uploadStudentsCSV: (formData, onProgress) => uploadFile('/api/teacher/students/upload', formData, onProgress)
};

// ============ PARENT ENDPOINTS ============
const parentAPI = {
    getChildren: () => apiRequest('/api/parent/children'),
    getChildSummary: (studentId) => 
        apiRequest(`/api/parent/child/${studentId}/summary`),
    reportAbsence: (data) => 
        apiRequest('/api/parent/report-absence', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    makePayment: (data) => 
        apiRequest('/api/parent/pay', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getPayments: () => apiRequest('/api/parent/payments'),
    getSubscriptionPlans: () => apiRequest('/api/parent/plans'),
    upgradePlan: (data) => 
        apiRequest('/api/parent/upgrade-plan', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    sendMessage: (data) => 
        apiRequest('/api/parent/message', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getConversations: () => apiRequest('/api/parent/conversations'),
    getMessages: (otherUserId) => 
        apiRequest(`/api/parent/messages/${otherUserId}`),
    confirmPayment: (data) => 
        apiRequest('/api/parent/payment-confirm', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getChildMarks: (studentId) => apiRequest(`/api/parent/child/${studentId}/marks`),
    getChildClassPerformance: (studentId) => apiRequest(`/api/parent/child/${studentId}/class-performance`),
    getChildSubjectPerformance: (studentId) => apiRequest(`/api/parent/child/${studentId}/subject-performance`)
};

// ============ STUDENT ENDPOINTS ============
const studentAPI = {
    getGrades: () => apiRequest('/api/student/grades'),
    getAttendance: () => apiRequest('/api/student/attendance'),
    getMaterials: () => apiRequest('/api/student/materials'),
    sendMessage: (receiverId, content) => 
        apiRequest('/api/student/message', {
            method: 'POST',
            body: JSON.stringify({ receiverId, content })
        }),
    getMessages: (otherUserId) => 
        apiRequest(`/api/student/messages/${otherUserId}`),
    setFirstPassword: (data) => 
        apiRequest('/api/student/set-first-password', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    getAllMarks: () => apiRequest('/api/student/marks/all'),
    getClassPerformance: () => apiRequest('/api/student/class-performance'),
    getSubjectPerformance: () => apiRequest('/api/student/subject-performance'),
    getGPA: () => apiRequest('/api/student/gpa')
};

// ============ DUTY ENDPOINTS ============
const dutyAPI = {
    getTodayDuty: () => apiRequest('/api/duty/today'),
    getWeeklyDuty: () => apiRequest('/api/duty/week'),
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
        })
};

// File upload helper
async function uploadFile(endpoint, file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    
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
                reject(new Error(`Upload failed: ${xhr.status}`));
            }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        
        xhr.open('POST', `${API_BASE_URL}${endpoint}`);
        if (authToken) {
            xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
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

// ============ SINGLE EXPORT STATEMENT ============
window.api = {
    auth: authAPI,
    superAdmin: superAdminAPI,
    admin: adminAPI,
    teacher: teacherAPI,
    parent: parentAPI,
    student: studentAPI,
    duty: dutyAPI,
    analytics: analyticsAPI,
    upload: uploadAPI,
    public: publicAPI,
    school: schoolAPI,
    user: userAPI,
    help: helpAPI,      // added
    tasks: tasksAPI     // added
};

// Legacy support
window.apiRequest = apiRequest;
window.uploadFile = uploadFile;

console.log('✅ API loaded successfully!');
console.log('📊 Available APIs:', Object.keys(window.api).join(', '));
