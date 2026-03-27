// API Configuration
const API_BASE_URL = 'https://shuleaibackend-32h1.onrender.com'; // Your Render backend URL

// Token management
let authToken = localStorage.getItem('authToken');
let refreshToken = localStorage.getItem('refreshToken');

// API request wrapper with authentication
async function apiRequest(endpoint, options = {}) {
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
        const data = await response.json();
        
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
    const data = await response.json();
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
        apiRequest(`/api/super-admin/schools/${schoolId}/approve`, {
            method: 'POST'
        }),
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
        apiRequest(`/api/super-admin/schools/${schoolId}`, {
            method: 'DELETE'
        }),
    getPendingRequests: () => apiRequest('/api/super-admin/requests'),
    approveRequest: (requestId) => 
        apiRequest(`/api/super-admin/requests/${requestId}/approve`, {
            method: 'POST'
        }),
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
    // ============ ADD THESE NEW METHODS ============
    // Get all users (for platform health)
    getAllUsers: () => apiRequest('/api/super-admin/users'),

    // Get system metrics
    getSystemMetrics: () => apiRequest('/api/super-admin/metrics'),
    
    // Get system logs
    getSystemLogs: () => apiRequest('/api/super-admin/logs'),

    // Get request history (approved/rejected name changes)
    getRequestHistory: () => apiRequest('/api/super-admin/requests/history'),

    // Get school stats (students, teachers, parents counts)
    getSchoolStats: (schoolId) => apiRequest(`/api/super-admin/schools/${schoolId}/stats`)

};

// ============ ADMIN ENDPOINTS ============
const adminAPI = {
    // Teacher management
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
        apiRequest(`/api/admin/teachers/${teacherId}/reactivate`, {
            method: 'POST'
        }),
    
    deactivateTeacher: (teacherId, data) => 
        apiRequest(`/api/admin/teachers/${teacherId}/deactivate`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    activateTeacher: (teacherId) => 
        apiRequest(`/api/admin/teachers/${teacherId}/activate`, {
            method: 'POST'
        }),
    
    deleteTeacher: (teacherId) => 
        apiRequest(`/api/admin/teachers/${teacherId}`, {
            method: 'DELETE'
        }),
    
    // School settings
    getSchoolSettings: () => apiRequest('/api/admin/settings'),
    updateSchoolSettings: (data) => 
        apiRequest('/api/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    
    // ============ CLASS MANAGEMENT ============
    // Create a new class
    createClass: (data) => 
        apiRequest('/api/admin/classes', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    // Get all classes
    getClasses: () => apiRequest('/api/admin/classes'),
    
    // Update a class
    updateClass: (classId, data) => 
        apiRequest(`/api/admin/classes/${classId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    
    // Delete a class
    deleteClass: (classId) => 
        apiRequest(`/api/admin/classes/${classId}`, {
            method: 'DELETE'
        }),
    
    // Get available teachers for class assignment
    getAvailableTeachers: () => apiRequest('/api/admin/available-teachers'),
    
    // Assign teacher to a class
    assignTeacherToClass: (classId, teacherId) => 
        apiRequest(`/api/admin/classes/${classId}/assign-teacher`, {
            method: 'POST',
            body: JSON.stringify({ teacherId })
        }),
    
    // Remove teacher from a class
    removeTeacherFromClass: (classId) => 
        apiRequest(`/api/admin/classes/${classId}/remove-teacher`, {
            method: 'POST'
        }),
    
    // Get students in a specific class
    getClassStudents: (classId) => 
        apiRequest(`/api/admin/classes/${classId}/students`),
    
    // Student details
    getStudentDetails: (studentId) => 
        apiRequest(`/api/admin/students/${studentId}`),

    // Student suspension/reactivation
    suspendStudent: (studentId, data) => 
        apiRequest(`/api/admin/students/${studentId}/suspend`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    reactivateStudent: (studentId) => 
        apiRequest(`/api/admin/students/${studentId}/reactivate`, {
            method: 'POST'
        }),
    
    // Student expulsion (permanent removal)
    expelStudent: (studentId, data) => 
        apiRequest(`/api/admin/students/${studentId}/expel`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    // Delete student permanently
    deleteStudent: (studentId) => 
        apiRequest(`/api/admin/students/${studentId}`, {
            method: 'DELETE'
        }),
    
    // Duty management
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

    // ============ ADD THESE NEW METHODS ============
    // Get grade statistics for charts
    getStudentGrades: () => apiRequest('/api/admin/grades/stats'),

    // Get attendance statistics
    getAttendanceStats: () => apiRequest('/api/admin/attendance/stats'),

    // Update teacher (for edit teacher modal)
    updateTeacher: (teacherId, data) => 
        apiRequest(`/api/admin/teachers/${teacherId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

    // Get school dashboard data (includes classes count, etc.)
    getDashboardData: () => apiRequest('/api/admin/dashboard')
};

// ============ TEACHER ENDPOINTS ============
const teacherAPI = {
    // Student management
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
    
    // Message system for parent communication
    getConversations: () => apiRequest('/api/teacher/conversations'),
    getMessages: (otherUserId) => apiRequest(`/api/teacher/messages/${otherUserId}`),
    markMessagesAsRead: (otherUserId) => 
        apiRequest(`/api/teacher/messages/read/${otherUserId}`, {
            method: 'PUT'
        }),
    replyToParent: (data) => 
        apiRequest('/api/teacher/reply', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    // Delete student from teacher's class
    deleteStudent: (studentId) => 
        apiRequest(`/api/teacher/students/${studentId}`, {
            method: 'DELETE'
        }),
};

// ============ PARENT ENDPOINTS ============
const parentAPI = {
    // Get all children linked to this parent
    getChildren: () => apiRequest('/api/parent/children'),
    
    // Get summary for a specific child
    getChildSummary: (studentId) => 
        apiRequest(`/api/parent/child/${studentId}/summary`),
    
    // Report absence for a child
    reportAbsence: (data) => 
        apiRequest('/api/parent/report-absence', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    // Make a payment
    makePayment: (data) => 
        apiRequest('/api/parent/pay', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    // Get payment history
    getPayments: () => apiRequest('/api/parent/payments'),
    
    // Get available subscription plans
    getSubscriptionPlans: () => apiRequest('/api/parent/plans'),
    
    // Upgrade subscription plan
    upgradePlan: (data) => 
        apiRequest('/api/parent/upgrade-plan', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    // Send message to teacher or admin
    sendMessage: (data) => 
        apiRequest('/api/parent/message', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    
    // Get all conversations
    getConversations: () => apiRequest('/api/parent/conversations'),
    
    // Get messages with a specific user
    getMessages: (otherUserId) => 
        apiRequest(`/api/parent/messages/${otherUserId}`),
    
    // Confirm payment
    confirmPayment: (data) => 
        apiRequest('/api/parent/payment-confirm', {
            method: 'POST',
            body: JSON.stringify(data)
        })
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
    // Set first password for students
    setFirstPassword: (data) => 
        apiRequest('/api/student/set-first-password', {
            method: 'POST',
            body: JSON.stringify(data)
        })
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

// ============ SCHOOL ENDPOINTS (for name change requests) ============
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
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error('Upload failed'));
            }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        
        xhr.open('POST', `${API_BASE_URL}${endpoint}`);
        xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
        xhr.send(formData);
    });
}

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
    school: schoolAPI
};

// Legacy support
window.apiRequest = apiRequest;
window.uploadFile = uploadFile;

// Log to verify all APIs are loaded
console.log('✅ API loaded successfully!');
console.log('📊 Available APIs:', Object.keys(window.api).join(', '));