// parent-dashboard.js - Complete Parent Dashboard

async function renderParentSection(section) {
    switch(section) {
        case 'dashboard':
            return await renderParentDashboard();
        case 'progress':
            return await renderParentProgress();
        case 'competency':
            return await renderParentCompetency();    
        case 'payments':
            return await renderParentPayments();
        case 'chat':
            return await renderParentChat();
        case 'settings':
            return await renderProfileSection();
        default:
            return await renderParentDashboard();
    }
}

async function renderParentCompetency() {
  const selectedChildId = dashboardData.selectedChildId;
  const progress = await apiRequest(`/api/cbe/student-progress/${selectedChildId}`);
  // Group by competency
  const compMap = {};
  progress.data.forEach(p => {
    const comp = p.LearningOutcome.Competency;
    if (!compMap[comp.id]) compMap[comp.id] = { name: comp.name, levels: [] };
    compMap[comp.id].levels.push(p.level);
  });
  const chartData = Object.values(compMap).map(comp => ({
    competency: comp.name,
    averageLevel: comp.levels.reduce((sum, l) => sum + (l === 'EE' ? 4 : l === 'ME' ? 3 : l === 'AE' ? 2 : 1), 0) / comp.levels.length
  }));
  // Render a bar chart (you can use Chart.js)
  return `<div class="space-y-6"><h2 class="text-2xl font-bold">Competency Progress</h2><canvas id="parent-competency-chart" height="300"></canvas><script>
    new Chart(document.getElementById('parent-competency-chart'), {
      type: 'bar',
      data: { labels: ${JSON.stringify(chartData.map(c => c.competency))}, datasets: [{ label: 'Average Level (1-4)', data: ${JSON.stringify(chartData.map(c => c.averageLevel))}, backgroundColor: '#3b82f6' }] }
    });
  </script></div>`;
}

async function renderParentDashboard() {
    try {
        const school = getCurrentSchool();
        const childrenResponse = await api.parent.getChildren();
        const children = childrenResponse.data || [];

        let selectedChildSummary = null;
        let selectedChildId = null;

        if (children.length > 0) {
            selectedChildId = children[0].id;
            const summaryResponse = await api.parent.getChildSummary(selectedChildId);
            selectedChildSummary = summaryResponse.data;
        }

        dashboardData = {
            children: children,
            selectedChild: selectedChildSummary,
            selectedChildId: selectedChildId
        };

        let html = `
            <div class="space-y-6 animate-fade-in">
                <!-- School Name Header -->
                <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 id="parent-school-name" class="text-xl font-semibold">${escapeHtml(school?.name || 'Your School')}</h2>
                            <p class="text-sm text-muted-foreground">Parent Portal</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm">
                            <p class="text-xs text-muted-foreground">School Code</p>
                            <p class="text-sm font-mono font-bold">${school?.shortCode || 'SHL-XXXXX'}</p>
                        </div>
                    </div>
                </div>

                <div class="flex gap-2 border-b pb-4 overflow-x-auto" id="child-selector">
        `;

        if (children.length === 0) {
            html += `<p class="text-muted-foreground">No children linked to your account</p>`;
        } else {
            children.forEach((child, index) => {
                const childName = child.User?.name || 'Unknown';
                const childGrade = child.grade || 'N/A';
                const isActive = index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted';

                html += `
                    <button onclick="selectChild('${child.id}')" 
                            class="child-selector-btn px-4 py-2 ${isActive} rounded-lg transition-all">
                        ${escapeHtml(childName)} (Grade ${escapeHtml(childGrade)})
                    </button>
                `;
            });
        }

        html += `</div>`;

        if (selectedChildSummary) {
            const classTeacher = selectedChildSummary.classTeacher;
            const student = selectedChildSummary.student || {};
            const avgScore = selectedChildSummary.averageScore || 0;
            const recentRecords = selectedChildSummary.recentRecords || [];
            const recentAttendance = selectedChildSummary.recentAttendance || [];
            const outstandingFees = selectedChildSummary.outstandingFees || null;

            const attendanceRate = recentAttendance.length > 0 
                ? Math.round((recentAttendance.filter(a => a.status === 'present').length / recentAttendance.length) * 100) 
                : 0;

            const feeBalance = outstandingFees?.balance || 0;

            if (classTeacher) {
                html += `
                    <div class="rounded-xl border bg-card p-4 mb-4">
                        <div class="flex items-center gap-3">
                            <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <i data-lucide="user" class="h-5 w-5 text-primary"></i>
                            </div>
                            <div>
                                <p class="text-xs text-muted-foreground">Class Teacher</p>
                                <p class="font-medium">${escapeHtml(classTeacher.name || 'Not Assigned')}</p>
                                <p class="text-xs text-muted-foreground">${escapeHtml(classTeacher.email || '')}</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            html += `
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">ELIMUID</p>
                                <h3 class="text-lg font-mono font-bold mt-1">${escapeHtml(student.elimuid || 'N/A')}</h3>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                <i data-lucide="id-card" class="h-6 w-6 text-purple-600"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Class Average</p>
                                <h3 class="text-2xl font-bold mt-1">${avgScore}%</h3>
                                <p class="text-xs text-muted-foreground mt-1">Overall performance</p>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center">
                                <i data-lucide="trending-up" class="h-6 w-6 text-violet-600"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Attendance</p>
                                <h3 class="text-2xl font-bold mt-1">${attendanceRate}%</h3>
                                <p class="text-xs text-muted-foreground mt-1">Last ${recentAttendance.length} days</p>
                            </div>
                            <div class="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                <i data-lucide="calendar-check" class="h-6 w-6 text-amber-600"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="rounded-xl border bg-card p-6 card-hover">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Fee Balance</p>
                                <h3 class="text-2xl font-bold mt-1 ${feeBalance > 0 ? 'text-red-600' : 'text-green-600'}">
                                    $${feeBalance}
                                </h3>
                                <p class="text-xs text-muted-foreground mt-1">${feeBalance > 0 ? 'Outstanding' : 'Paid in full'}</p>
                            </div>
                            <div class="h-12 w-12 rounded-lg ${feeBalance > 0 ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center">
                                <i data-lucide="credit-card" class="h-6 w-6 ${feeBalance > 0 ? 'text-red-600' : 'text-green-600'}"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="p-4 border-b">
                        <h3 class="font-semibold">Recent Grades</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Subject</th>
                                    <th class="px-4 py-3 text-left font-medium">Assessment</th>
                                    <th class="px-4 py-3 text-center font-medium">Score</th>
                                    <th class="px-4 py-3 text-center font-medium">Grade</th>
                                    <th class="px-4 py-3 text-left font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${recentRecords.slice(0, 5).map(record => {
                                    const score = record.score || 0;
                                    const gradeClass = score >= 80 ? 'bg-green-100 text-green-700' : 
                                                      score >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                                                      'bg-red-100 text-red-700';
                                    return `
                                        <tr class="hover:bg-accent/50 transition-colors">
                                            <td class="px-4 py-3 font-medium">${escapeHtml(record.subject || 'N/A')}</td>
                                            <td class="px-4 py-3">${escapeHtml(record.assessmentName || record.assessmentType || 'N/A')}</td>
                                            <td class="px-4 py-3 text-center">${score}%</td>
                                            <td class="px-4 py-3 text-center">
                                                <span class="px-2 py-1 ${gradeClass} text-xs rounded-full">
                                                    ${escapeHtml(record.grade || 'N/A')}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3">${record.date ? formatDate(record.date) : 'N/A'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                                ${recentRecords.length === 0 ? `
                                    <tr>
                                        <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
                                            No grade records available
                                        </td>
                                    </tr>
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="home-tasks-container" class="rounded-xl border bg-card p-6">${await renderHomeTasks()}
                </div>
                
                <div class="rounded-xl border bg-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">Report Absence</h3>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium mb-1">Date</label>
                            <input type="date" id="absence-date" value="${new Date().toISOString().split('T')[0]}" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Reason</label>
                            <textarea id="absence-reason" rows="2" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Why will your child be absent?"></textarea>
                        </div>
                        <button onclick="reportAbsence()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">
                            Report Absence
                        </button>
                    </div>
                </div>
            `;
        }

        html += `</div>`;
        return html;

    } catch (error) {
        console.error('Parent dashboard error:', error);
        return `<div class="text-center py-12 text-red-500">Error loading dashboard: ${error.message}</div>`;
    }
}

async function renderParentProgress() {
    try {
        const school = getCurrentSchool();
        const selectedChildId = dashboardData?.selectedChildId;

        if (!selectedChildId) {
            return `<div class="text-center py-12">Please select a child first</div>`;
        }

        const summaryResponse = await api.parent.getChildSummary(selectedChildId);
        const childData = summaryResponse.data;

        const records = childData?.recentRecords || [];
        const avgScore = childData?.averageScore || 0;

        setTimeout(() => {
            const ctx = document.getElementById('parent-gradeChart');
            if (ctx && typeof Chart !== 'undefined') {
                if (window.parentChart) window.parentChart.destroy();
                window.parentChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: records.map(r => r.date ? formatDate(r.date) : ''),
                        datasets: [{
                            label: 'Performance',
                            data: records.map(r => r.score || 0),
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
            }
        }, 100);

        return `
            <div class="space-y-6 animate-fade-in">
                <!-- School Name Header -->
                <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                    <h2 id="parent-school-name-progress" class="text-xl font-semibold">${escapeHtml(school?.name || 'Your School')}</h2>
                    <p class="text-sm text-muted-foreground">Academic Progress - ${escapeHtml(childData?.student?.name || 'Student')}</p>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                    <div class="rounded-xl border bg-card p-6">
                        <p class="text-sm text-muted-foreground">Overall Average</p>
                        <p class="text-3xl font-bold ${avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'}">
                            ${avgScore}%
                        </p>
                    </div>
                    <div class="rounded-xl border bg-card p-6">
                        <p class="text-sm text-muted-foreground">Total Assessments</p>
                        <p class="text-3xl font-bold">${records.length}</p>
                    </div>
                    <div class="rounded-xl border bg-card p-6">
                        <p class="text-sm text-muted-foreground">Last Assessment</p>
                        <p class="text-3xl font-bold text-blue-600">${records[0]?.score || 0}%</p>
                    </div>
                </div>

                <div class="rounded-xl border bg-card p-6">
                    <h3 class="font-semibold mb-4">Performance Over Time</h3>
                    <div class="chart-container h-80">
                        <canvas id="parent-gradeChart"></canvas>
                    </div>
                </div>

                <div class="rounded-xl border bg-card overflow-hidden">
                    <div class="p-4 border-b">
                        <h3 class="font-semibold">Detailed Grades</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-muted/50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-medium">Subject</th>
                                    <th class="px-4 py-3 text-left font-medium">Assessment</th>
                                    <th class="px-4 py-3 text-center font-medium">Score</th>
                                    <th class="px-4 py-3 text-center font-medium">Grade</th>
                                    <th class="px-4 py-3 text-left font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${records.map(record => {
                                    const score = record.score || 0;
                                    const gradeClass = score >= 80 ? 'bg-green-100 text-green-700' : 
                                                      score >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                                                      'bg-red-100 text-red-700';
                                    return `
                                        <tr class="hover:bg-accent/50 transition-colors">
                                            <td class="px-4 py-3 font-medium">${escapeHtml(record.subject || 'N/A')}</td>
                                            <td class="px-4 py-3">${escapeHtml(record.assessmentName || record.assessmentType || 'N/A')}</td>
                                            <td class="px-4 py-3 text-center">${score}%</td>
                                            <td class="px-4 py-3 text-center">
                                                <span class="px-2 py-1 ${gradeClass} text-xs rounded-full">
                                                    ${escapeHtml(record.grade || 'N/A')}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3">${record.date ? formatDate(record.date) : 'N/A'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                                ${records.length === 0 ? `
                                    <tr>
                                        <td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
                                            No grade records available
                                        </td>
                                    </tr>
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Progress error:', error);
        return `<div class="text-center py-12 text-red-500">Error loading progress: ${error.message}</div>`;
    }
}

async function renderParentPayments() {
    try {
        const school = getCurrentSchool();
        const selectedChildId = dashboardData?.selectedChildId;

        let payments = [];
        try {
            const paymentsResponse = await api.parent.getPayments();
            payments = paymentsResponse.data || [];
        } catch (error) {
            console.log('No payment history yet');
        }

        let plans = [];
        try {
            const plansResponse = await api.parent.getSubscriptionPlans();
            plans = plansResponse.data || [];
        } catch (error) {
            console.log('Using default plans');
            plans = [
                { id: 'basic', name: 'Basic', price: 3, features: ['View attendance', 'Report absence'] },
                { id: 'premium', name: 'Premium', price: 10, features: ['Everything in Basic', 'Grades & progress', 'Teacher comments'] },
                { id: 'ultimate', name: 'Ultimate', price: 20, features: ['Everything in Premium', 'Live chat', 'Priority support'] }
            ];
        }

        let schoolDetails = null;
        try {
            const user = getCurrentUser();
            if (user?.schoolCode) {
                const schoolResponse = await api.public.getSchoolInfo(user.schoolCode);
                schoolDetails = schoolResponse.data;
            }
        } catch (error) {
            console.log('Could not fetch school details');
        }

        return `
            <div class="space-y-6 animate-fade-in">
                <!-- School Name Header -->
                <div class="rounded-xl border bg-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
                    <h2 id="parent-school-name-payments" class="text-xl font-semibold">${escapeHtml(school?.name || 'Your School')}</h2>
                    <p class="text-sm text-muted-foreground">Payments & Subscriptions</p>
                </div>

                <div class="grid gap-4 md:grid-cols-3">
                    <div class="rounded-xl border bg-card p-6">
                        <h3 class="font-semibold mb-4">Make Payment</h3>
                        <div class="space-y-3">
                            ${schoolDetails ? `
                                <div class="p-3 bg-muted/30 rounded-lg mb-4">
                                    <p class="text-xs font-medium text-muted-foreground">School Account</p>
                                    <p class="font-medium">${escapeHtml(schoolDetails.name || 'Your School')}</p>
                                    ${schoolDetails.bankDetails ? `
                                        <p class="text-xs mt-2">Bank: ${escapeHtml(schoolDetails.bankDetails.bankName || 'N/A')}</p>
                                        <p class="text-xs">Account: ${escapeHtml(schoolDetails.bankDetails.accountNumber || 'N/A')}</p>
                                    ` : ''}
                                </div>
                            ` : ''}
                            
                            <select id="payment-child" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Select Child</option>
                                ${dashboardData?.children?.map(child => `
                                    <option value="${child.id}" ${child.id == selectedChildId ? 'selected' : ''}>
                                        ${escapeHtml(child.User?.name || 'Unknown')} (${escapeHtml(child.grade)})
                                    </option>
                                `).join('')}
                            </select>
                            
                            <select id="payment-plan" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Select Plan</option>
                                ${plans.map(plan => `
                                    <option value="${plan.id}">${escapeHtml(plan.name)} - $${plan.price}/mo</option>
                                `).join('')}
                            </select>
                            
                            <input type="number" id="payment-amount" placeholder="Amount" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                            
                            <select id="payment-method" class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                                <option value="mpesa">M-Pesa</option>
                                <option value="card">Credit Card</option>
                                <option value="bank">Bank Transfer</option>
                            </select>
                            
                            <button onclick="processPayment()" class="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90">
                                Pay Now
                            </button>
                        </div>
                    </div>
                    
                    <div class="rounded-xl border bg-card p-6">
                        <h3 class="font-semibold mb-4">Payment History</h3>
                        <div class="space-y-2 max-h-96 overflow-y-auto">
                            ${payments.length > 0 ? payments.map(payment => `
                                <div class="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                    <div>
                                        <p class="text-sm font-medium">${escapeHtml(payment.Student?.User?.name || 'Payment')}</p>
                                        <p class="text-xs text-muted-foreground">${formatDate(payment.createdAt)}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-semibold">$${payment.amount}</p>
                                        <span class="text-xs ${payment.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}">
                                            ${payment.status}
                                        </span>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="text-center py-8">
                                    <i data-lucide="credit-card" class="h-12 w-12 mx-auto text-muted-foreground mb-3"></i>
                                    <p class="text-sm text-muted-foreground">No payment history</p>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <div class="rounded-xl border bg-card p-6">
                        <h3 class="font-semibold mb-4">Subscription Plans</h3>
                        <div class="space-y-3">
                            ${plans.map(plan => `
                                <div class="p-4 border rounded-lg hover:border-primary transition-colors">
                                    <div class="flex justify-between items-center mb-2">
                                        <p class="font-semibold">${escapeHtml(plan.name)}</p>
                                        <p class="text-lg font-bold text-primary">$${plan.price}<span class="text-xs font-normal text-muted-foreground">/mo</span></p>
                                    </div>
                                    <ul class="space-y-1 mb-3">
                                        ${plan.features.map(feature => `
                                            <li class="text-xs flex items-center gap-1">
                                                <i data-lucide="check" class="h-3 w-3 text-green-600"></i>
                                                ${escapeHtml(feature)}
                                            </li>
                                        `).join('')}
                                    </ul>
                                    <button onclick="upgradePlan('${plan.id}')" class="w-full py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                                        Select ${escapeHtml(plan.name)}
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Payments error:', error);
        return `<div class="text-center py-12 text-red-500">Error loading payments: ${error.message}</div>`;
    }
}

async function renderParentChat() {
    const selectedChild = dashboardData?.selectedChild?.student || 
                          (dashboardData?.children && dashboardData.children[0]?.User);
    const childName = selectedChild?.name || 'your child';
    const classTeacher = dashboardData?.selectedChild?.classTeacher;
    const conversations = await api.parent.getConversations();
    const messages = conversations.data?.[0]?.messages || [];

    return `
        <div class="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div class="rounded-xl border bg-card p-4 h-[600px] flex flex-col">
                <div class="flex justify-between items-center mb-4 pb-2 border-b">
                    <div>
                        <h3 class="font-semibold">Message School Staff</h3>
                        <p class="text-xs text-muted-foreground">Chat with class teacher or admin about ${escapeHtml(childName)}</p>
                    </div>
                </div>
                
                <div class="flex gap-4 mb-4">
                    <select id="parent-recipient-type" class="px-3 py-2 border rounded-lg bg-background flex-1">
                        <option value="teacher">📚 Class Teacher ${classTeacher ? `(${escapeHtml(classTeacher.name)})` : ''}</option>
                        <option value="admin">🏫 School Administrator</option>
                    </select>
                </div>
                
                <div class="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded-lg" id="parent-chat-messages">
                    ${messages.length > 0 ? messages.map(msg => `
                        <div class="flex ${msg.sender === 'parent' ? 'justify-end' : 'justify-start'}">
                            <div class="${msg.sender === 'parent' ? 'chat-bubble-sent' : 'chat-bubble-received'} max-w-[70%]">
                                <p class="text-sm font-medium">${msg.sender === 'parent' ? 'You' : escapeHtml(msg.senderName)}</p>
                                <p class="text-sm">${escapeHtml(msg.content)}</p>
                                <p class="text-xs text-muted-foreground mt-1">${timeAgo(msg.timestamp)}</p>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="text-center text-muted-foreground py-8">
                            <i data-lucide="message-circle" class="h-12 w-12 mx-auto mb-3 opacity-50"></i>
                            <p>Select a recipient and start messaging</p>
                        </div>
                    `}
                </div>
                
                <div class="flex gap-2">
                    <input type="text" id="parent-chat-input" placeholder="Type your message..." 
                           class="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <button onclick="sendParentMessage()" class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
                        <i data-lucide="send" class="h-4 w-4"></i>
                        Send
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============ HELPER FUNCTIONS ============

async function selectChild(childId) {
    document.querySelectorAll('.child-selector-btn').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-primary-foreground');
        btn.classList.add('bg-muted');
    });

    const selectedBtn = Array.from(document.querySelectorAll('.child-selector-btn'))
        .find(btn => btn.getAttribute('onclick')?.includes(`'${childId}'`));

    if (selectedBtn) {
        selectedBtn.classList.remove('bg-muted');
        selectedBtn.classList.add('bg-primary', 'text-primary-foreground');
    }

    dashboardData.selectedChildId = childId;

    showLoading();
    try {
        const summaryResponse = await api.parent.getChildSummary(childId);
        dashboardData.selectedChild = summaryResponse.data;
        await showDashboardSection(currentSection);
    } catch (error) {
        console.error('Error selecting child:', error);
        showToast('Failed to load child data', 'error');
    } finally {
        hideLoading();
    }
}

async function reportAbsence() {
    const selectedChildId = dashboardData?.selectedChildId;

    if (!selectedChildId) {
        showToast('Please select a child first', 'error');
        return;
    }

    const date = document.getElementById('absence-date')?.value;
    const reason = document.getElementById('absence-reason')?.value;

    if (!date || !reason) {
        showToast('Please select date and enter reason', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.parent.reportAbsence({
            studentId: parseInt(selectedChildId),
            date: date,
            reason: reason
        });

        if (response.success) {
            showToast('✅ Absence reported and class teacher notified', 'success');
            document.getElementById('absence-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('absence-reason').value = '';
        } else {
            throw new Error(response.message || 'Failed to report absence');
        }
    } catch (error) {
        console.error('Report absence error:', error);
        showToast(error.message || 'Failed to report absence', 'error');
    } finally {
        hideLoading();
    }
}

async function processPayment() {
    const selectedChildId = dashboardData?.selectedChildId;
    const childSelect = document.getElementById('payment-child');
    const planSelect = document.getElementById('payment-plan');
    const amountInput = document.getElementById('payment-amount');
    const methodSelect = document.getElementById('payment-method');

    const studentId = childSelect?.value || selectedChildId;
    const plan = planSelect?.value;
    const amount = amountInput?.value;
    const method = methodSelect?.value;

    if (!studentId) {
        showToast('Please select a child', 'error');
        return;
    }

    if (!plan) {
        showToast('Please select a payment plan', 'error');
        return;
    }

    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    if (!method) {
        showToast('Please select payment method', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.parent.makePayment({
            studentId: parseInt(studentId),
            amount: parseFloat(amount),
            method: method,
            plan: plan,
            reference: `PAY-${Date.now()}`
        });

        if (response.success) {
            showToast('✅ Payment initiated. Please complete payment using school details.', 'success');

            if (response.data?.school) {
                const school = response.data.school;
                alert(`
Payment Instructions:
School: ${school.name}
Bank: ${school.bankDetails?.bankName || 'N/A'}
Account: ${school.bankDetails?.accountNumber || 'N/A'}
Amount: $${amount}
                    
Please complete the payment and the school will confirm.
                `);
            }
        } else {
            throw new Error(response.message || 'Payment initiation failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast(error.message || 'Failed to process payment', 'error');
    } finally {
        hideLoading();
    }
}

async function upgradePlan(planId) {
    const selectedChildId = dashboardData?.selectedChildId;

    if (!selectedChildId) {
        showToast('Please select a child first', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.parent.upgradePlan({
            studentId: parseInt(selectedChildId),
            newPlan: planId
        });

        if (response.success) {
            showToast(`✅ Upgrade to ${planId} plan initiated`, 'success');
            if (currentSection === 'payments') {
                await showDashboardSection('payments');
            }
        } else {
            throw new Error(response.message || 'Upgrade failed');
        }
    } catch (error) {
        console.error('Upgrade error:', error);
        showToast(error.message || 'Failed to upgrade plan', 'error');
    } finally {
        hideLoading();
    }
}

// Home Tasks Section
async function renderHomeTasks() {
  const childId = dashboardData.selectedChildId;
  if (!childId) return '<div class="text-center py-4">Select a child first</div>';
  const res = await apiRequest(`/api/home-tasks/today?studentId=${childId}`);
  const tasks = res.data;
  if (!tasks.length) return '<div class="text-center py-4">No tasks for today – check back tomorrow!</div>';
  return `
    <div class="space-y-4">
      <h3 class="font-semibold text-lg">Today’s Learning Tasks</h3>
      ${tasks.map(task => `
        <div class="border rounded-lg p-4 bg-card">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-xs px-2 py-1 rounded-full bg-primary/10">${task.type}</span>
              <h4 class="font-medium mt-1">${escapeHtml(task.title)}</h4>
              <p class="text-sm text-muted-foreground mt-1">⏱️ ${task.estimatedMinutes} min | ⭐ ${task.points} points</p>
            </div>
            <button onclick="toggleTaskInstructions(${task.id})" class="text-primary text-sm">Show</button>
          </div>
          <div id="task-instr-${task.id}" class="hidden mt-2 text-sm bg-muted p-3 rounded">
            <p>${escapeHtml(task.instructions)}</p>
            ${task.materials ? `<p class="mt-1 text-xs">📦 Materials: ${escapeHtml(task.materials)}</p>` : ''}
            <div class="flex gap-2 mt-3">
              <button onclick="completeTask(${task.id}, 'easy')" class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">😊 Easy</button>
              <button onclick="completeTask(${task.id}, 'ok')" class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">😐 Okay</button>
              <button onclick="completeTask(${task.id}, 'hard')" class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">😓 Hard</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
window.toggleTaskInstructions = function(taskId) {
  const el = document.getElementById(`task-instr-${taskId}`);
  if (el) el.classList.toggle('hidden');
};
window.completeTask = async function(taskId, difficulty) {
  try {
    await apiRequest(`/api/home-tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ parentFeedback: { difficulty } })
    });
    showToast('Task completed! Points awarded.', 'success');
    // Refresh the tasks section
    const container = document.getElementById('home-tasks-container');
    if (container) container.innerHTML = await renderHomeTasks();
    if (window.lucide) lucide.createIcons();
  } catch (e) {
    showToast(e.message, 'error');
  }
};

async function showStudentDetails(studentId) {
  const student = await apiRequest(`/api/admin/students/${studentId}`);
  const analytics = await apiRequest(`/api/analytics/student/${studentId}`);
  // Show modal with grades chart, attendance, competency, report absence button
  // Use Chart.js to render line chart for grades over time
}

async function sendParentMessage() {
    const selectedChildId = dashboardData?.selectedChildId;

    if (!selectedChildId) {
        showToast('Please select a child first', 'error');
        return;
    }

    const recipientType = document.getElementById('parent-recipient-type')?.value;
    const message = document.getElementById('parent-chat-input')?.value.trim();

    if (!message) {
        showToast('Please enter a message', 'error');
        return;
    }

    showLoading();
    try {
        const response = await api.parent.sendMessage({
            studentId: parseInt(selectedChildId),
            message: message,
            recipientType: recipientType
        });

        if (response.success) {
            document.getElementById('parent-chat-input').value = '';

            const container = document.getElementById('parent-chat-messages');
            const newMessageHtml = `
                <div class="flex justify-end">
                    <div class="chat-bubble-sent max-w-[70%]">
                        <p class="text-sm font-medium">You</p>
                        <p class="text-sm">${escapeHtml(message)}</p>
                        <p class="text-xs text-muted-foreground mt-1">just now</p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', newMessageHtml);
            container.scrollTop = container.scrollHeight;

            showToast('✅ Message sent to class teacher', 'success');
        } else {
            throw new Error(response.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Send message error:', error);
        showToast(error.message || 'Failed to send message', 'error');
    } finally {
        hideLoading();
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ EXPORT FUNCTIONS ============
window.selectChild = selectChild;
window.reportAbsence = reportAbsence;
window.processPayment = processPayment;
window.upgradePlan = upgradePlan;
window.sendParentMessage = sendParentMessage;
window.renderParentSection = renderParentSection;
window.renderParentDashboard = renderParentDashboard;
window.renderParentProgress = renderParentProgress;
window.renderParentPayments = renderParentPayments;
window.renderParentChat = renderParentChat;
