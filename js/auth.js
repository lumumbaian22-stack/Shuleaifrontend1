// Auth state management
let currentUser = null;
let currentSchool = null;


function stripLargeMediaForStorage(obj) {
    try {
        const clone = JSON.parse(JSON.stringify(obj || {}));
        if (clone.preferences) {
            if (String(clone.preferences.signatureDataUrl || '').startsWith('data:')) clone.preferences.signatureDataUrl = null;
            if (String(clone.preferences.profileImageDataUrl || '').startsWith('data:')) clone.preferences.profileImageDataUrl = null;
        }
        if (String(clone.signature || '').startsWith('data:')) clone.signature = clone.preferences?.signatureFileUrl || clone.signatureUrl || '';
        if (String(clone.signatureUrl || '').startsWith('data:')) clone.signatureUrl = clone.preferences?.signatureFileUrl || clone.signature || '';
        if (String(clone.profileImage || '').startsWith('data:')) clone.profileImage = clone.preferences?.profileImageFileUrl || '';
        return clone;
    } catch (_) { return obj || {}; }
}

// Helper: Merge teacher profile into user object
function mergeTeacherProfile(userData, profile) {
    if (profile) {
        if (userData.role === 'teacher') {
            userData.teacher = profile;
            if (profile.classTeacher) userData.classTeacher = profile.classTeacher;
        }
        if (profile.signature || profile.signatureUrl) {
            userData.signature = profile.signature || profile.signatureUrl;
            userData.signatureUrl = profile.signatureUrl || profile.signature;
        }
    }
    if (userData.preferences?.signatureUrl || userData.preferences?.signatureAbsoluteUrl) {
        userData.signature = userData.preferences.signatureUrl || userData.preferences.signatureAbsoluteUrl;
        userData.signatureUrl = userData.preferences.signatureUrl || userData.preferences.signatureAbsoluteUrl;
    }
    return userData;
}

function schoolScopedKey(key, schoolCode = null) {
    const code = schoolCode || currentSchool?.schoolId || currentSchool?.schoolCode || currentUser?.schoolCode || 'unknown';
    return `${key}:${code}`;
}

function parentSelectedChildKey(userId = null) {
    const id = userId || currentUser?.id || getCurrentUser()?.id || 'unknown-parent';
    return `selectedChild:${id}`;
}

function clearSessionScopedDashboardState() {
    ['schoolSettings','schoolBranding','sidebarBrand','selectedChild','shule_selected_child_id','dashboardData','parentDashboardData','studentDashboardData'].forEach(k => localStorage.removeItem(k));
}

function persistSessionPayload(userData, schoolData) {
    currentUser = userData || null;
    currentSchool = schoolData || null;
    if (currentUser) {
        localStorage.setItem('user', JSON.stringify(stripLargeMediaForStorage(currentUser)));
        localStorage.setItem('userRole', currentUser.role || '');
    }
    if (currentSchool) {
        const schoolCode = currentSchool.schoolId || currentSchool.schoolCode || currentUser?.schoolCode;
        localStorage.setItem('school', JSON.stringify(currentSchool));
        if (schoolCode) localStorage.setItem(schoolScopedKey('schoolSettings', schoolCode), JSON.stringify(currentSchool));
    }
}

function syncProfileAvatarUI() {
    setTimeout(() => {
        if (typeof updateUserInfo === 'function') updateUserInfo();
        if (typeof applyGlobalProfilePictures === 'function') applyGlobalProfilePictures();
    }, 0);
}

// Check if user is authenticated on page load
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
        const response = await api.auth.getMe();
        if (!response.success) throw new Error('Auth failed');
        
        let userData = response.data.user;
        const profile = response.data.profile;
        
        // Merge teacher profile if applicable
        userData = mergeTeacherProfile(userData, profile);
        
        persistSessionPayload(userData, response.data.school || null);
        syncProfileAvatarUI();
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('school');
        localStorage.removeItem('userRole');
        return false;
    }
}

// Super Admin login
async function superAdminLogin(email, password, secretKey) {
    try {
        const response = await api.auth.superAdminLogin(email, password, secretKey);
        if (!response.success) throw new Error(response.message);
        
        
        authToken = response.data.token;
        currentUser = response.data.user;
        
        clearSessionScopedDashboardState();
        localStorage.setItem('authToken', authToken);
        persistSessionPayload(currentUser, null);
        
        return response;
    } catch (error) {
        throw error;
    }
}

// Admin signup
async function adminSignup(adminData) {
    try {
        const response = await api.auth.adminSignup(adminData);
        return response;
    } catch (error) {
        throw error;
    }
}

// Check admin status after school approval
async function checkAdminStatusAfterApproval() {
    try {
        console.log('🔍 Checking admin status after approval...');
        const user = getCurrentUser();
        if (!user) return false;
        
        console.log('Current user:', user);
        console.log('User isActive:', user.isActive);
        console.log('User role:', user.role);
        
        if (user.role === 'admin' && user.isActive === false) {
            const school = getCurrentSchool();
            console.log('School status:', school?.status);
            
            if (school && school.status === 'active') {
                const response = await api.auth.getMe();
                if (response.success) {
                    const refreshedUser = response.data.user;
                    if (refreshedUser.isActive === true) {
                        localStorage.setItem('user', JSON.stringify(stripLargeMediaForStorage(refreshedUser)));
                        localStorage.setItem('userRole', refreshedUser.role);
                        syncProfileAvatarUI();
                        currentUser = refreshedUser;
                        console.log('✅ Admin account activated successfully');
                        return true;
                    }
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Teacher signup with school code
async function teacherSignup(teacherData) {
    try {
        const response = await api.auth.teacherSignup(teacherData);
        return response;
    } catch (error) {
        throw error;
    }
}

// Parent signup with student ELIMUID
async function parentSignup(parentData) {
    try {
        const response = await api.auth.parentSignup({
            name: parentData.name,
            email: parentData.email,
            password: parentData.password,
            phone: parentData.phone,
            studentElimuid: parentData.studentElimuid
        });
        return response;
    } catch (error) {
        throw error;
    }
}

// Student login with ELIMUID
async function studentLogin(elimuid, password) {
    try {
        const response = await api.auth.studentLogin(elimuid, password);
        if (!response.success) throw new Error(response.message);
        
        authToken = response.data.token;
        currentUser = response.data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(stripLargeMediaForStorage(currentUser)));
        localStorage.setItem('userRole', currentUser.role);
        
        return response;
    } catch (error) {
        throw error;
    }
}

// Regular login for admin/teacher/parent
async function login(emailOrPhone, password, role) {
    try {
        console.log('🔐 Attempting login for role:', role);

        const response = await api.auth.login(emailOrPhone, password, role);
        if (!response.success) throw new Error(response.message);

        let userData = response.data.user;
        const profile = response.data.profile;

        // Merge teacher profile into user object
        userData = mergeTeacherProfile(userData, profile);

        authToken = response.data.token;
        currentUser = userData;
        currentSchool = response.data.school;

        console.log('User from login:', currentUser);
        console.log('User teacher classTeacher:', currentUser.teacher?.classTeacher);
        console.log('School status:', currentSchool?.status);

        // Handle inactive admin but active school
        if (currentUser.role === 'admin' && currentUser.isActive === false && currentSchool?.status === 'active') {
            console.log('⚠️ Admin account inactive but school is active - attempting refresh...');
            const meResponse = await api.auth.getMe();
            if (meResponse && meResponse.success && meResponse.data.user) {
                const refreshedUser = meResponse.data.user;
                if (refreshedUser.isActive === true) {
                    currentUser = refreshedUser;
                    console.log('✅ Admin account refreshed and activated!');
                }
            }
        }

        if (currentUser.role === 'admin' && currentUser.isActive === false) {
            console.error('❌ Admin account is still inactive');
            throw new Error('Your account is pending approval. Please wait for the super admin to approve your school.');
        }

        clearSessionScopedDashboardState();
        localStorage.setItem('authToken', authToken);
        persistSessionPayload(currentUser, currentSchool);

        console.log('✅ Login successful, redirecting to dashboard');

        return response;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Verify school code (for teacher signup)
async function verifySchoolCode(schoolCode) {
    try {
        const response = await api.auth.verifySchoolCode(schoolCode);
        return response;
    } catch (error) {
        throw error;
    }
}

// Change password
async function changePassword(currentPassword, newPassword) {
    try {
        const response = await api.auth.changePassword(currentPassword, newPassword);
        return response;
    } catch (error) {
        throw error;
    }
}

// Logout
function logout() {
    clearSessionScopedDashboardState();
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('school');
    localStorage.removeItem('userRole');
    authToken = null;
    refreshToken = null;
    currentUser = null;
    currentSchool = null;
    
    const landingPage = document.getElementById('landing-page');
    const dashboardContainer = document.getElementById('dashboard-container');
    
    if (landingPage) landingPage.style.display = 'block';
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    
    showToast('Logged out successfully', 'success');
}

// Get current user
function getCurrentUser() {
    return currentUser || window.currentUser || JSON.parse(localStorage.getItem('user') || '{}');
}

// Get current school
function getCurrentSchool() {
  try {
    if (currentSchool) return currentSchool;
    const schoolStr = localStorage.getItem('school');
    if (!schoolStr) return null;
    return JSON.parse(schoolStr);
  } catch (error) {
    console.error('Error parsing school:', error);
    return null;
  }
}

// Get current user role
function getCurrentRole() {
    if (currentUser) return currentUser.role;
    return localStorage.getItem('userRole') || null;
}

// Export auth functions
window.superAdminLogin = superAdminLogin;
window.adminSignup = adminSignup;
window.teacherSignup = teacherSignup;
window.parentSignup = parentSignup;
window.studentLogin = studentLogin;
window.login = login;
window.verifySchoolCode = verifySchoolCode;
window.changePassword = changePassword;
window.checkAuth = checkAuth;
window.logout = logout;
window.schoolScopedKey = schoolScopedKey;
window.parentSelectedChildKey = parentSelectedChildKey;
window.clearSessionScopedDashboardState = clearSessionScopedDashboardState;
window.getCurrentUser = getCurrentUser;
window.getCurrentSchool = getCurrentSchool;
window.getCurrentRole = getCurrentRole;
window.checkAdminStatusAfterApproval = checkAdminStatusAfterApproval;
