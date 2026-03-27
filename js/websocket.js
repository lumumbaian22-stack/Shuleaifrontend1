// websocket.js - Complete real-time update system

let socket = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

// Connect WebSocket with authentication
function connectWebSocket() {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) return;
    
    // Close existing connection
    if (socket) {
        socket.close();
    }
    
    // Connect to Socket.io server
    socket = io('https://shuleaibackend-32h1.onrender.com', {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });
    
    socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        reconnectAttempts = 0;
        
        // Join user's personal room
        if (user.id) {
            socket.emit('join', user.id);
        }
        
        // Join school room for real-time updates
        if (user.schoolCode) {
            socket.emit('join-school', user.schoolCode);
        }
    });
    
    socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
    });
    
    // ============ REAL-TIME UPDATE HANDLERS ============
    
    // Student updates
    socket.on('student-added', (data) => {
        console.log('🔔 Student added:', data);
        handleStudentUpdate('added', data);
    });
    
    socket.on('student-updated', (data) => {
        console.log('🔔 Student updated:', data);
        handleStudentUpdate('updated', data);
    });
    
    socket.on('student-deleted', (data) => {
        console.log('🔔 Student deleted:', data);
        handleStudentUpdate('deleted', data);
    });
    
    socket.on('student-suspended', (data) => {
        console.log('🔔 Student suspended:', data);
        handleStudentUpdate('suspended', data);
    });
    
    socket.on('student-reactivated', (data) => {
        console.log('🔔 Student reactivated:', data);
        handleStudentUpdate('reactivated', data);
    });
    
    // Teacher updates
    socket.on('teacher-updated', (data) => {
        console.log('🔔 Teacher updated:', data);
        handleTeacherUpdate(data);
    });
    
    // Attendance updates
    socket.on('attendance-updated', (data) => {
        console.log('🔔 Attendance updated:', data);
        handleAttendanceUpdate(data);
    });
    
    // Curriculum updates
    socket.on('curriculum-updated', (data) => {
        console.log('🔔 Curriculum updated:', data);
        handleCurriculumUpdate(data);
    });
    
    // Class assignment updates
    socket.on('class-assigned', (data) => {
        console.log('🔔 Class assignment updated:', data);
        handleClassUpdate(data);
    });
    
    socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(connectWebSocket, 1000 * reconnectAttempts);
        }
    });
}

// ============ UPDATE HANDLERS ============

function handleStudentUpdate(action, data) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update teacher dashboard if teacher
    if (user.role === 'teacher') {
        if (typeof refreshMyStudents === 'function') {
            refreshMyStudents();
        }
        showToast(`📢 Student ${action}: ${data.name}`, 'info');
    }
    
    // Update admin dashboard if admin
    if (user.role === 'admin') {
        if (typeof refreshStudentsList === 'function') {
            refreshStudentsList();
        }
        showToast(`📢 Student ${action}: ${data.name}`, 'info');
    }
}

function handleTeacherUpdate(data) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'admin') {
        if (typeof refreshTeachersList === 'function') {
            refreshTeachersList();
        }
        showToast(`📢 Teacher ${data.action}: ${data.name}`, 'info');
    }
}

function handleAttendanceUpdate(data) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'teacher' && typeof refreshMyStudents === 'function') {
        refreshMyStudents();
    }
    
    if (user.role === 'admin' && typeof refreshStudentsList === 'function') {
        refreshStudentsList();
    }
    
    showToast(`📢 Attendance updated for ${data.date}`, 'info');
}

function handleCurriculumUpdate(data) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update local storage with new curriculum
    const schoolSettings = JSON.parse(localStorage.getItem('schoolSettings') || '{}');
    schoolSettings.curriculum = data.curriculum;
    localStorage.setItem('schoolSettings', JSON.stringify(schoolSettings));
    
    // Refresh current dashboard based on role
    if (user.role === 'teacher' && typeof refreshMyStudents === 'function') {
        refreshMyStudents();
    } else if (user.role === 'admin' && typeof refreshStudentsList === 'function') {
        refreshStudentsList();
    } else if (user.role === 'parent' && typeof refreshParentDashboard === 'function') {
        refreshParentDashboard();
    } else if (user.role === 'student' && typeof refreshStudentDashboard === 'function') {
        refreshStudentDashboard();
    }
    
    showToast(`📢 Curriculum updated to ${data.curriculumName}`, 'info');
}

function handleClassUpdate(data) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'teacher') {
        // If teacher's class assignment changed, refresh their data
        if (data.teacherId == user.id) {
            if (typeof refreshMyStudents === 'function') {
                refreshMyStudents();
            }
        }
    }
    
    if (user.role === 'admin') {
        if (typeof refreshClassesList === 'function') {
            refreshClassesList();
        }
        if (typeof refreshTeachersList === 'function') {
            refreshTeachersList();
        }
        if (typeof refreshStudentsList === 'function') {
            refreshStudentsList();
        }
    }
}

// ============ EMIT FUNCTIONS (Call these when making changes) ============

function emitStudentUpdate(action, studentData) {
    if (socket && socket.connected) {
        socket.emit('student-update', {
            action,
            ...studentData,
            timestamp: new Date().toISOString()
        });
    }
}

function emitTeacherUpdate(action, teacherData) {
    if (socket && socket.connected) {
        socket.emit('teacher-update', {
            action,
            ...teacherData,
            timestamp: new Date().toISOString()
        });
    }
}

function emitAttendanceUpdate(data) {
    if (socket && socket.connected) {
        socket.emit('attendance-update', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }
}

function emitCurriculumUpdate(curriculum) {
    if (socket && socket.connected) {
        const curriculumNames = {
            'cbc': 'CBC',
            '844': '8-4-4',
            'british': 'British',
            'american': 'American'
        };
        
        socket.emit('curriculum-update', {
            curriculum,
            curriculumName: curriculumNames[curriculum] || curriculum,
            timestamp: new Date().toISOString()
        });
    }
}

// Export functions
window.connectWebSocket = connectWebSocket;
window.emitStudentUpdate = emitStudentUpdate;
window.emitTeacherUpdate = emitTeacherUpdate;
window.emitAttendanceUpdate = emitAttendanceUpdate;
window.emitCurriculumUpdate = emitCurriculumUpdate;