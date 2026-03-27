// Auth state management
let currentUser = null;
let currentSchool = null;

// Check if user is authenticated on page load
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
        const response = await api.auth.getMe();
        currentUser = response.data.user;
        currentSchool = response.data.school;
        
        // Save everything including role
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('school', JSON.stringify(currentSchool));
        localStorage.setItem('userRole', currentUser.role);
        
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
        
        authToken = response.data.token;
        currentUser = response.data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('userRole', currentUser.role);
        
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
        
        // If user is admin and school is active, but user is inactive
        if (user.role === 'admin' && user.isActive === false) {
            const school = getCurrentSchool();
            console.log('School status:', school?.status);
            
            if (school && school.status === 'active') {
                // Try to refresh user data
                const response = await api.auth.getMe();
                if (response && response.data && response.data.user) {
                    const updatedUser = response.data.user;
                    console.log('Updated user from API:', updatedUser);
                    
                    if (updatedUser.isActive === true) {
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        localStorage.setItem('userRole', updatedUser.role);
                        currentUser = updatedUser;
                        console.log('✅ Admin account activated successfully');
                        return true;
                    } else {
                        console.log('⚠️ Admin account still inactive in API');
                        return false;
                    }
                }
            } else {
                console.log('School status is not active:', school?.status);
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
        
        authToken = response.data.token;
        currentUser = response.data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('userRole', currentUser.role);
        
        return response;
    } catch (error) {
        throw error;
    }
}

// Regular login for admin/teacher/parent
async function login(email, password, role) {
    try {
        console.log('🔐 Attempting login for:', email, 'role:', role);
        
        const response = await api.auth.login(email, password, role);
        
        console.log('Login response:', response);
        
        if (!response || !response.success) {
            throw new Error(response?.message || 'Login failed');
        }
        
        authToken = response.data.token;
        currentUser = response.data.user;
        currentSchool = response.data.school;
        
        console.log('User from login:', currentUser);
        console.log('User isActive:', currentUser.isActive);
        console.log('School status:', currentSchool?.status);
        
        // CHECK: If user is admin but inactive, but school is active
        if (currentUser.role === 'admin' && currentUser.isActive === false && currentSchool?.status === 'active') {
            console.log('⚠️ Admin account inactive but school is active - attempting refresh...');
            // Try to refresh user data
            const meResponse = await api.auth.getMe();
            if (meResponse && meResponse.data && meResponse.data.user) {
                const refreshedUser = meResponse.data.user;
                if (refreshedUser.isActive === true) {
                    currentUser = refreshedUser;
                    console.log('✅ Admin account refreshed and activated!');
                }
            }
        }
        
        // Final check: If admin and still inactive, show error
        if (currentUser.role === 'admin' && currentUser.isActive === false) {
            console.error('❌ Admin account is still inactive');
            throw new Error('Your account is pending approval. Please wait for the super admin to approve your school.');
        }
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        localStorage.setItem('school', JSON.stringify(currentSchool));
        localStorage.setItem('userRole', currentUser.role);
        
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
    return currentUser || JSON.parse(localStorage.getItem('user') || '{}');
}

// Get current school
function getCurrentSchool() {
    return currentSchool || JSON.parse(localStorage.getItem('school') || '{}');
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
window.getCurrentUser = getCurrentUser;
window.getCurrentSchool = getCurrentSchool;
window.getCurrentRole = getCurrentRole;
window.checkAdminStatusAfterApproval = checkAdminStatusAfterApproval;