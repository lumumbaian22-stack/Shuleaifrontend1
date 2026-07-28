// Auth state management
let currentUser = null;
let currentSchool = null;


function canonicalSmallMedia(value){const raw=String(value||'').trim();if(!raw||raw.startsWith('data:')||raw.startsWith('blob:')||raw.includes('/uploads/'))return'';return raw;}
function stripLargeMediaForStorage(obj){const x=obj||{},t=x.teacher||{},s=x.student||{},img=canonicalSmallMedia(x.profileImage||x.profilePicture||x.preferences?.profileImageUrl),sig=canonicalSmallMedia(x.signatureUrl||x.signature||x.preferences?.signatureUrl);return{id:x.id,userId:x.userId||x.id,studentId:x.studentId||s.id||null,elimuid:x.elimuid||s.elimuid||'',name:x.name||'',email:x.email||'',phone:x.phone||'',role:x.role||'',primaryRole:x.primaryRole||x.role||'',schoolCode:x.schoolCode||'',isActive:x.isActive!==false,firstLogin:!!x.firstLogin,mustChangePassword:!!x.mustChangePassword,financeTitle:x.financeTitle||x.preferences?.finance?.title||'',financePermissions:x.financePermissions||x.preferences?.finance?.permissions||[],profileImage:img,profilePicture:img,signature:sig,signatureUrl:sig,classId:x.classId||s.classId||t.classId||null,className:x.className||s.className||'',classTeacher:x.classTeacher||t.classTeacher||null,student:x.role==='student'?{id:x.studentId||s.id||null,elimuid:x.elimuid||s.elimuid||'',classId:x.classId||s.classId||null,className:x.className||s.className||''}:undefined,teacher:x.role==='teacher'?{id:t.id||null,classId:t.classId||null,className:t.className||t.classTeacher||'',classTeacher:t.classTeacher||null,approvalStatus:t.approvalStatus||null,subjects:Array.isArray(t.subjects)?t.subjects.slice(0,30):[]}:undefined};}
function minimalBrandingForStorage(b={}){const logo=canonicalSmallMedia(b.logoUrl||b.logo||'');return{schoolName:b.schoolName||b.displayName||'',displayName:b.displayName||b.schoolName||'',primaryColor:b.primaryColor||'',accentColor:b.accentColor||'',logoUrl:logo,logo};}
function minimalSchoolForStorage(school,user){if(!school)return null;const b=school.settings?.branding||school.branding||{};return{schoolId:school.schoolId||school.schoolCode||user?.schoolCode||'',schoolCode:school.schoolCode||school.schoolId||user?.schoolCode||'',name:school.name||school.schoolName||'',schoolName:school.schoolName||school.name||'',status:school.status||'',system:school.system||school.curriculum||'',schoolStructure:school.schoolStructure||'',subscriptionPlan:school.subscriptionPlan||school.planCode||'',subscriptionStatus:school.subscriptionStatus||'',logo:canonicalSmallMedia(b.logoUrl||b.logo||school.logo||'')};}
function cleanupOversizedSessionStorage(){['schoolSettings','schoolBranding','sidebarBrand','dashboardData','parentDashboardData','studentDashboardData','currentUser','shule_user','student'].forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i)||'';if(/^(schoolSettings:|dashboardData:|schoolBranding:)/.test(k))localStorage.removeItem(k);}}catch(_){}}
function safeSessionSet(key,value){try{localStorage.setItem(key,value);return true}catch(e){if(e?.name!=='QuotaExceededError')throw e;cleanupOversizedSessionStorage();try{localStorage.setItem(key,value);return true}catch(_){return false}}}

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

function clearSessionScopedDashboardState(){['selectedChild','shule_selected_child_id','adminSelectedClass','userRole'].forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});cleanupOversizedSessionStorage();}

function resetAuthenticatedRuntime(options={}) {
    const preserveCredentials = options.preserveCredentials === true;
    try { window.ShuleRealtime?.disconnect?.(); } catch (_) {}
    try { window.__shuleRoleAbortController?.abort?.(); } catch (_) {}
    window.__shuleRoleAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    ['authToken','token','refreshToken','user','school','userRole','shule_user','student','dashboardData','parentDashboardData','studentDashboardData','shule_selected_child_id','selectedChild','adminSelectedClass'].forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});
    if (!preserveCredentials) clearSessionScopedDashboardState();
    document.body.classList.remove('role-admin','role-finance_officer','role-teacher','role-parent','role-student','role-super_admin','role-superadmin');
    window.currentRole = '';
    window.currentSection = '';
    window.dashboardData = {};
    window.studentDashboardData = {};
    window.parentDashboardData = {};
    window.__teacherAssignments = null;
    authToken = null;
    refreshToken = null;
    currentUser = null;
    currentSchool = null;
}

function persistSessionPayload(userData,schoolData){currentUser=userData||null;currentSchool=schoolData||null;cleanupOversizedSessionStorage();if(currentUser){safeSessionSet('user',JSON.stringify(stripLargeMediaForStorage(currentUser)));safeSessionSet('userRole',currentUser.role||'');}if(currentSchool)safeSessionSet('school',JSON.stringify(minimalSchoolForStorage(currentSchool,currentUser)));}


function connectRealtimeAfterAuth(){
    try {
        if (typeof window.ShuleRealtime?.connect === 'function') setTimeout(() => window.ShuleRealtime.connect(), 0);
        else if (typeof window.connectWebSocket === 'function') setTimeout(window.connectWebSocket, 0);
    } catch (_) {}
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
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('school');
        localStorage.removeItem('userRole');
    try { window.ShuleRealtime?.disconnect?.(); } catch (_) {}
        return false;
    }
}

// Super Admin login
async function superAdminLogin(email, password, secretKey) {
    try {
        const response = await api.auth.superAdminLogin(email, password, secretKey);
        if (!response.success) throw new Error(response.message);
        
        
        authToken = response.data.token;
        refreshToken = response.data.refreshToken || null;
        if (refreshToken) safeSessionSet('refreshToken', refreshToken); else localStorage.removeItem('refreshToken');
        const studentProfile = response.data.student || {};
        currentUser = {
            ...(response.data.user || {}),
            studentId: studentProfile.id || response.data.user?.studentId || null,
            elimuid: studentProfile.elimuid || response.data.user?.elimuid || '',
            classId: studentProfile.classId || response.data.user?.classId || null,
            student: {
                id: studentProfile.id || null,
                elimuid: studentProfile.elimuid || '',
                classId: studentProfile.classId || null,
                className: studentProfile.className || studentProfile.grade || ''
            }
        };
        
        clearSessionScopedDashboardState();
        safeSessionSet('authToken',authToken);try{localStorage.removeItem('token')}catch(_){}
        persistSessionPayload(currentUser, null);
        connectRealtimeAfterAuth();
        
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
                        safeSessionSet('user',JSON.stringify(stripLargeMediaForStorage(refreshedUser)));
                        safeSessionSet('userRole',refreshedUser.role);
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
        resetAuthenticatedRuntime({ preserveCredentials: true });
        const response = await api.auth.studentLogin(elimuid, password);
        if (!response.success) throw new Error(response.message);
        
        authToken = response.data.token;
        refreshToken = response.data.refreshToken || null;
        if (refreshToken) safeSessionSet('refreshToken', refreshToken); else localStorage.removeItem('refreshToken');
        currentUser = response.data.user;
        
        safeSessionSet('authToken',authToken);try{localStorage.removeItem('token')}catch(_){}
        safeSessionSet('user',JSON.stringify(stripLargeMediaForStorage(currentUser)));
        safeSessionSet('userRole',currentUser.role);
        connectRealtimeAfterAuth();
        
        return response;
    } catch (error) {
        throw error;
    }
}

// Regular login for admin/teacher/parent
async function login(emailOrPhone, password, role) {
    try {
        resetAuthenticatedRuntime({ preserveCredentials: true });
        console.log('🔐 Attempting login for role:', role);

        const response = await api.auth.login(emailOrPhone, password, role);
        if (!response.success) throw new Error(response.message);

        let userData = response.data.user;
        const profile = response.data.profile;

        // Merge teacher profile into user object
        userData = mergeTeacherProfile(userData, profile);

        authToken = response.data.token;
        refreshToken = response.data.refreshToken || null;
        if (refreshToken) safeSessionSet('refreshToken', refreshToken); else localStorage.removeItem('refreshToken');
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
        safeSessionSet('authToken',authToken);try{localStorage.removeItem('token')}catch(_){}
        persistSessionPayload(currentUser, currentSchool);
        connectRealtimeAfterAuth();

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
    resetAuthenticatedRuntime();
    
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
window.resetAuthenticatedRuntime = resetAuthenticatedRuntime;
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
