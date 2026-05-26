(function () {
  'use strict';

  const SUPPORT_EMAIL = 'shuleai.info@gmail.com';
  const SUPPORT_WHATSAPP_DISPLAY = '0700 201 922';
  const SUPPORT_WHATSAPP_E164 = '254700201922';

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function currentUser() {
    try {
      if (typeof getCurrentUser === 'function') return getCurrentUser() || {};
    } catch (_) {}
    try { return JSON.parse(localStorage.getItem('user') || '{}') || {}; } catch (_) { return {}; }
  }

  function currentRole(fallback) {
    const user = currentUser();
    return (fallback || user.role || localStorage.getItem('role') || 'user').toLowerCase();
  }

  function supportContext() {
    const user = currentUser();
    const role = currentRole();
    const section = window.currentSection || window.activeDashboardSection || document.querySelector('[data-current-section]')?.dataset?.currentSection || 'Help';
    const name = user.name || user.fullName || 'User';
    const school = user.schoolName || user.schoolCode || 'School not specified';
    return { user, role, section, name, school };
  }

  function buildSupportMessage(channel) {
    const ctx = supportContext();
    return `Hello Shule AI Support, I need help.\n\nName: ${ctx.name}\nRole: ${ctx.role}\nSchool: ${ctx.school}\nSection: ${ctx.section}\nIssue: `;
  }

  window.openShuleWhatsappSupport = function openShuleWhatsappSupport() {
    const text = encodeURIComponent(buildSupportMessage('whatsapp'));
    const url = `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (typeof showToast === 'function') showToast('Opening WhatsApp support...', 'info');
  };

  window.openShuleEmailSupport = function openShuleEmailSupport() {
    const ctx = supportContext();
    const subject = encodeURIComponent(`Shule AI Support Request - ${ctx.role}`);
    const body = encodeURIComponent(buildSupportMessage('email'));
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const articles = {
    admin: [
      {
        icon: '🏫',
        title: 'Getting started as a school admin',
        summary: 'Set up school records, classes, teachers, students, parents, and the academic year before daily operations begin.',
        tags: ['setup', 'school', 'classes', 'students'],
        steps: ['Confirm school profile and branding.', 'Create or import classes.', 'Add teachers and subject assignments.', 'Add students and link parents.', 'Review dashboard alerts daily.']
      },
      {
        icon: '💰',
        title: 'Grouped fee structures for multiple classes',
        summary: 'Create one fee structure, select multiple classes, and keep it as one grouped card. Opening the card shows assigned classes, student count, items, term, and status.',
        tags: ['finance', 'fees', 'grouped', 'classes'],
        steps: ['Open Finance & Fees.', 'Create Fee Structure.', 'Select one or more classes.', 'Save as one grouped structure.', 'Open View Classes/Edit to add or remove classes.', 'Activate to generate individual student fee accounts.']
      },
      {
        icon: '🧾',
        title: 'Recording cash, bank, card, and manual M-Pesa payments',
        summary: 'Record offline payments against one selected student and one fee account. Approved payments update that student balance only.',
        tags: ['cash', 'bank', 'card', 'manual mpesa', 'payment'],
        steps: ['Open Finance & Fees → Payment Records.', 'Find the student.', 'Click Record Payment.', 'Choose payment method and fee account.', 'Enter amount, reference, date, and notes.', 'Save as pending or approved.']
      },
      {
        icon: '🎓',
        title: 'Bursaries, waivers, discounts, and credits',
        summary: 'Credits reduce a student balance but are shown separately from parent-paid money. They should be approved and audited.',
        tags: ['bursary', 'waiver', 'discount', 'credit'],
        steps: ['Open the student finance record.', 'Choose Add Bursary/Credit.', 'Enter sponsor/source, amount, reference, and notes.', 'Approve when verified.', 'Check that balance updates only for that student.']
      },
      {
        icon: '📊',
        title: 'Understanding finance totals and defaulters',
        summary: 'Total expected comes from active fee accounts. Parent paid and credits reduce the outstanding balance. Defaulters are students with balance above zero.',
        tags: ['defaulters', 'stats', 'expected', 'balance'],
        steps: ['Activate fee structures.', 'Confirm fee accounts were generated.', 'Record/approve payments.', 'Review total expected, parent-paid, bursary/credit, outstanding, and defaulter count.']
      },
      {
        icon: '🔔',
        title: 'Payment and overdue alerts',
        summary: 'Admins receive alerts for pending manual payments, failed STK attempts, bursary approvals, overdue balances, and subscription renewals.',
        tags: ['alerts', 'overdue', 'subscriptions'],
        steps: ['Open Alerts.', 'Filter finance or subscription alerts.', 'Open the student or payment record.', 'Resolve pending approvals or overdue follow-up.']
      },
      {
        icon: '👩‍🏫',
        title: 'Teacher, subject, and class assignments',
        summary: 'Teacher dashboards depend on correct class and subject assignments. If a teacher cannot see learners or marks, check assignments first.',
        tags: ['teacher', 'subject', 'class'],
        steps: ['Open Classes.', 'Select the class.', 'Assign class teacher.', 'Assign subject teachers.', 'Save and ask teacher to refresh.']
      },
      {
        icon: '📚',
        title: 'Reports, marks, and publishing workflow',
        summary: 'Marks should move from draft to reviewed to published. Published marks feed reports, analytics, parents, and students.',
        tags: ['marks', 'reports', 'publish'],
        steps: ['Teachers enter draft marks.', 'Review subject/class totals.', 'Publish final marks.', 'Generate and share reports.']
      }
    ],
    parent: [
      {
        icon: '👨‍👩‍👧',
        title: 'Selecting the right child',
        summary: 'If you have more than one child, select one child first. Balances, payment history, marks, alerts, and subscriptions must stay individual per child.',
        tags: ['child', 'select', 'siblings'],
        steps: ['Open the dashboard or Payments.', 'Use the child selector.', 'Check that the selected name is correct.', 'Review that child’s information only.']
      },
      {
        icon: '💳',
        title: 'Paying school fees',
        summary: 'Use Payments to view the selected child’s total expected, parent-paid amount, bursary/credit, and current balance.',
        tags: ['fees', 'balance', 'payment'],
        steps: ['Open Payments.', 'Select the child.', 'Select fee account/term if more than one exists.', 'Choose M-Pesa STK or manual payment instructions.', 'Submit and watch payment status.']
      },
      {
        icon: '🧾',
        title: 'Payment history filters',
        summary: 'History can be filtered by All, Pending, Successful/Approved, Failed, Rejected, Bursaries/Credits, and Adjustments for the selected child only.',
        tags: ['history', 'pending', 'failed', 'successful'],
        steps: ['Open Payments.', 'Select one child.', 'Open Payment History.', 'Choose a filter.', 'Confirm the records belong to that child.']
      },
      {
        icon: '🏦',
        title: 'Bank, cash, card, and manual M-Pesa payments',
        summary: 'If you pay outside STK push, the school can record or approve the payment manually. It appears in your child’s history after verification.',
        tags: ['bank', 'cash', 'card', 'manual mpesa'],
        steps: ['Pay using the school’s official instructions.', 'Keep the receipt/reference.', 'Submit manual M-Pesa code where available or contact the school.', 'Wait for approval.', 'Check that balance updates.']
      },
      {
        icon: '🎓',
        title: 'Bursaries and credits',
        summary: 'Bursaries, waivers, scholarships, or discounts reduce balance after approval, but they are shown separately from money paid by the parent.',
        tags: ['bursary', 'credit', 'waiver'],
        steps: ['Open Payments.', 'Select the child.', 'Check Bursary/Credit amount.', 'Open history for details and references.']
      },
      {
        icon: '🔔',
        title: 'Payment, overdue, and subscription alerts',
        summary: 'You may receive alerts for successful, pending, failed, or rejected payments, overdue fees, bursaries, and child subscription renewal or expiry.',
        tags: ['alerts', 'overdue', 'subscription'],
        steps: ['Open Alerts.', 'Review payment or subscription notices.', 'Open Payments if action is needed.', 'Contact support if something looks wrong.']
      },
      {
        icon: '📈',
        title: 'Viewing academic progress',
        summary: 'Use Progress, Marks, Attendance, and Reports to follow your child’s performance after the school publishes records.',
        tags: ['progress', 'marks', 'reports'],
        steps: ['Select child.', 'Open Progress, Marks, or Reports.', 'Choose term where available.', 'Contact school if records look missing.']
      }
    ],
    teacher: [
      {
        icon: '📝',
        title: 'Entering marks correctly',
        summary: 'Select class, subject, term, and assessment before entering scores. Save drafts before publishing final marks.',
        tags: ['marks', 'scores', 'publish'],
        steps: ['Open Enter Marks.', 'Choose assigned class and subject.', 'Load students.', 'Enter scores.', 'Save draft.', 'Publish only after review.']
      },
      {
        icon: '👥',
        title: 'Why your students may not show',
        summary: 'Students appear based on class teacher or subject teacher assignments. Ask admin to check assignments if a class is missing.',
        tags: ['students', 'assignment', 'class'],
        steps: ['Open My Students.', 'Confirm assigned class/subject.', 'Ask admin to update assignment if empty.', 'Refresh dashboard.']
      },
      {
        icon: '✅',
        title: 'Taking attendance',
        summary: 'Mark learners as present, absent, or late and save once per day. Corrections should include a reason.',
        tags: ['attendance', 'present', 'absent'],
        steps: ['Open Attendance.', 'Select date/class.', 'Mark every learner.', 'Save attendance.']
      },
      {
        icon: '📌',
        title: 'Homework and study room support',
        summary: 'Create homework, review submissions, and guide study rooms where students can ask class/topic questions.',
        tags: ['homework', 'study room', 'submissions'],
        steps: ['Open Homework or Study Chat.', 'Create task/thread.', 'Set due date or topic.', 'Review responses.']
      },
      {
        icon: '🕒',
        title: 'Timetable and duty',
        summary: 'Timetable and duty cards depend on admin assignments. Use Duty to check in/out and review assigned shifts.',
        tags: ['timetable', 'duty'],
        steps: ['Open Timetable or Duty.', 'Review today’s assignment.', 'Check in/out where required.']
      }
    ],
    student: [
      {
        icon: '🤖',
        title: 'Using the AI Tutor',
        summary: 'Ask clear subject/topic questions. The tutor can explain, quiz, revise, and help you practise, but it cannot change official marks.',
        tags: ['ai tutor', 'study', 'revision'],
        steps: ['Open AI Tutor.', 'Ask a clear question.', 'Request examples or quizzes.', 'Review the answer and practise.']
      },
      {
        icon: '📚',
        title: 'Homework and submissions',
        summary: 'Open Homework to view tasks, due dates, attachments, and submission status. Submit before the deadline.',
        tags: ['homework', 'submission', 'deadline'],
        steps: ['Open Homework.', 'Read instructions.', 'Upload or type your answer.', 'Submit before due date.']
      },
      {
        icon: '📊',
        title: 'Marks, reports, and progress',
        summary: 'Marks and reports appear after teachers publish them. Draft marks may not be visible immediately.',
        tags: ['marks', 'reports', 'progress'],
        steps: ['Open Marks or Reports.', 'Choose term.', 'Review subjects.', 'Ask teacher if something is missing.']
      },
      {
        icon: '💬',
        title: 'Study chat and classmates',
        summary: 'Use study chat respectfully for learning help, teacher topics, and class discussions.',
        tags: ['chat', 'study room', 'classmates'],
        steps: ['Open Study Chat.', 'Choose topic or classmate.', 'Ask a learning question.', 'Keep messages respectful.']
      }
    ],
    superadmin: [
      {
        icon: '🏢',
        title: 'Approving schools',
        summary: 'Review school details, subscription status, admin contact, and setup completeness before approval.',
        tags: ['schools', 'approve', 'subscription'],
        steps: ['Open School Approvals.', 'Review school details.', 'Approve or reject.', 'Monitor setup progress.']
      },
      {
        icon: '💳',
        title: 'Platform subscriptions',
        summary: 'Use subscription records to review school plans, renewal state, failed payments, and locked features.',
        tags: ['subscriptions', 'billing', 'plans'],
        steps: ['Open Subscriptions.', 'Filter due/expired plans.', 'Open school details.', 'Resolve payment or override where allowed.']
      },
      {
        icon: '🛡️',
        title: 'Security and support checks',
        summary: 'Monitor login issues, tenant isolation alerts, migrations, health checks, and support requests.',
        tags: ['security', 'health', 'support'],
        steps: ['Open system health.', 'Review alerts.', 'Check support tickets.', 'Escalate critical issues.']
      }
    ]
  };

  const roleNames = {
    admin: 'School Admin', parent: 'Parent', teacher: 'Teacher', student: 'Student', superadmin: 'Super Admin', super_admin: 'Super Admin'
  };

  function roleArticles(role) {
    if (role === 'super_admin') role = 'superadmin';
    return articles[role] || articles.admin;
  }

  function renderArticleCard(article, idx) {
    return `
      <article class="help-v78-card help-article rounded-2xl p-5 transition-all cursor-pointer" data-title="${esc(article.title.toLowerCase())}" data-content="${esc(article.summary.toLowerCase())}" data-keywords="${esc((article.tags || []).join(' ').toLowerCase())}" onclick="showHelpArticleDetailV78(${idx})">
        <div class="flex items-start gap-3">
          <div class="h-11 w-11 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-xl">${esc(article.icon || '📘')}</div>
          <div class="min-w-0 flex-1">
            <h3 class="font-bold text-lg leading-tight">${esc(article.title)}</h3>
            <p class="help-v78-muted mt-2 text-sm leading-relaxed">${esc(article.summary)}</p>
            <div class="mt-3 flex flex-wrap gap-2">${(article.tags || []).slice(0, 4).map(tag => `<span class="help-v78-chip rounded-full px-2.5 py-1 text-xs font-semibold">${esc(tag)}</span>`).join('')}</div>
          </div>
        </div>
      </article>`;
  }

  window.renderHelpSection = function renderHelpSectionV78(roleArg) {
    const role = currentRole(roleArg);
    const normalizedRole = role === 'super_admin' ? 'superadmin' : role;
    const list = roleArticles(normalizedRole);
    window.__shuleHelpV78Articles = list;
    const roleLabel = roleNames[normalizedRole] || 'User';
    return `
      <section class="help-v78-shell space-y-6 animate-fade-in max-w-6xl mx-auto">
        <div class="help-v78-hero rounded-3xl p-6 md:p-8">
          <div class="grid gap-6 lg:grid-cols-[1.4fr_.9fr] lg:items-center">
            <div>
              <p class="text-xs uppercase tracking-[0.22em] font-black text-primary">Shule AI Help Center</p>
              <h2 class="mt-2 text-3xl md:text-4xl font-black tracking-tight">Support for ${esc(roleLabel)} Dashboard</h2>
              <p class="help-v78-muted mt-3 max-w-2xl leading-relaxed">Search quick guides, learn what each section does, and contact Shule AI support directly through WhatsApp or email when you need extra help.</p>
              <div class="help-v78-actions mt-5 flex flex-wrap gap-3">
                <button type="button" onclick="openShuleWhatsappSupport()" class="help-v78-primary-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold shadow-sm"><i data-lucide="message-circle" class="h-4 w-4"></i> WhatsApp Support</button>
                <button type="button" onclick="openShuleEmailSupport()" class="help-v78-outline-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold"><i data-lucide="mail" class="h-4 w-4"></i> Email Support</button>
              </div>
            </div>
            <div class="help-v78-support-card rounded-2xl p-5">
              <h3 class="font-black text-lg">Direct Support</h3>
              <p class="help-v78-muted mt-2 text-sm">Use these when you are stuck, payments look wrong, a dashboard is not loading, or records are missing.</p>
              <div class="mt-4 space-y-3 text-sm">
                <button type="button" onclick="openShuleWhatsappSupport()" class="w-full help-v78-outline-btn rounded-xl px-4 py-3 text-left flex items-center justify-between gap-3"><span><b>WhatsApp</b><br><span class="help-v78-muted">${SUPPORT_WHATSAPP_DISPLAY}</span></span><i data-lucide="external-link" class="h-4 w-4"></i></button>
                <button type="button" onclick="openShuleEmailSupport()" class="w-full help-v78-outline-btn rounded-xl px-4 py-3 text-left flex items-center justify-between gap-3"><span><b>Email</b><br><span class="help-v78-muted">${SUPPORT_EMAIL}</span></span><i data-lucide="send" class="h-4 w-4"></i></button>
              </div>
            </div>
          </div>
        </div>

        <div class="relative">
          <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 help-v78-muted"></i>
          <input type="text" id="help-search" placeholder="Search payments, classes, marks, alerts, subscriptions, timetable..." onkeyup="searchHelpArticles()" class="help-v78-search w-full rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-primary/40 transition-all">
        </div>

        <div class="grid gap-4 md:grid-cols-2" id="help-articles-container">
          ${list.map(renderArticleCard).join('')}
        </div>

        <div class="help-v78-support-card rounded-3xl p-6 md:p-7">
          <div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h3 class="text-xl font-black">Still need extra support?</h3>
              <p class="help-v78-muted mt-2">The buttons below open a direct WhatsApp chat or a prefilled email to Shule AI support. Include the dashboard section and what you were trying to do.</p>
            </div>
            <div class="help-v78-actions flex flex-wrap gap-3">
              <button type="button" onclick="openShuleWhatsappSupport()" class="help-v78-primary-btn inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold"><i data-lucide="message-circle" class="h-4 w-4"></i> Chat on WhatsApp</button>
              <button type="button" onclick="openShuleEmailSupport()" class="help-v78-outline-btn inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold"><i data-lucide="mail" class="h-4 w-4"></i> Email Support</button>
            </div>
          </div>
        </div>
      </section>`;
  };

  window.searchHelpArticles = function searchHelpArticlesV78() {
    const searchTerm = document.getElementById('help-search')?.value.toLowerCase().trim() || '';
    const cards = Array.from(document.querySelectorAll('.help-article'));
    let found = 0;
    cards.forEach(card => {
      const haystack = `${card.dataset.title || ''} ${card.dataset.content || ''} ${card.dataset.keywords || ''}`;
      const match = !searchTerm || haystack.includes(searchTerm);
      card.style.display = match ? '' : 'none';
      if (match) found += 1;
    });
    const container = document.getElementById('help-articles-container');
    if (!container) return;
    let empty = document.getElementById('no-results-message');
    if (!found && searchTerm) {
      if (!empty) {
        empty = document.createElement('div');
        empty.id = 'no-results-message';
        empty.className = 'help-v78-card rounded-2xl p-8 text-center md:col-span-2';
        container.appendChild(empty);
      }
      empty.innerHTML = `<i data-lucide="search-x" class="h-12 w-12 mx-auto help-v78-muted mb-3"></i><h3 class="font-bold">No guide found</h3><p class="help-v78-muted mt-1">Try another keyword or contact support directly.</p><div class="help-v78-actions mt-4 flex justify-center gap-3"><button onclick="openShuleWhatsappSupport()" class="help-v78-primary-btn rounded-xl px-4 py-2 font-bold">WhatsApp</button><button onclick="openShuleEmailSupport()" class="help-v78-outline-btn rounded-xl px-4 py-2 font-bold">Email</button></div>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    } else if (empty) {
      empty.remove();
    }
  };

  window.showHelpArticleDetailV78 = function showHelpArticleDetailV78(index) {
    const list = window.__shuleHelpV78Articles || roleArticles(currentRole());
    const article = list[Number(index)];
    if (!article) return;
    showHelpArticleDetail(article.title, article.summary, article.steps || [], article.tags || []);
  };

  window.showHelpArticleDetail = function showHelpArticleDetailV78(title, content, steps, tags) {
    const safeSteps = Array.isArray(steps) ? steps : [];
    const safeTags = Array.isArray(tags) ? tags : [];
    let modal = document.getElementById('help-article-modal');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="help-article-modal" class="fixed inset-0 z-[9999] hidden">
          <div class="help-v78-modal-backdrop absolute inset-0" onclick="closeHelpArticleModal()"></div>
          <div class="absolute inset-x-3 top-8 bottom-8 md:inset-x-auto md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 w-auto md:w-full md:max-w-2xl">
            <div class="help-v78-modal-card rounded-3xl p-5 md:p-6 max-h-full overflow-y-auto">
              <div class="modal-content"></div>
            </div>
          </div>
        </div>`);
      modal = document.getElementById('help-article-modal');
    }
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = `
      <div class="space-y-5">
        <div class="flex items-start justify-between gap-3 border-b pb-4" style="border-color:var(--border, rgba(148,163,184,.25));">
          <div>
            <h3 class="text-2xl font-black leading-tight">${esc(title)}</h3>
            <div class="mt-3 flex flex-wrap gap-2">${safeTags.map(tag => `<span class="help-v78-chip rounded-full px-2.5 py-1 text-xs font-semibold">${esc(tag)}</span>`).join('')}</div>
          </div>
          <button onclick="closeHelpArticleModal()" class="help-v78-outline-btn rounded-xl h-10 w-10 flex items-center justify-center shrink-0" aria-label="Close help article">×</button>
        </div>
        <p class="help-v78-muted leading-relaxed">${esc(content)}</p>
        ${safeSteps.length ? `<div class="space-y-3"><h4 class="font-black">Steps</h4>${safeSteps.map((step, i) => `<div class="help-v78-step"><b>${i + 1}.</b> ${esc(step)}</div>`).join('')}</div>` : ''}
        <div class="help-v78-support-card rounded-2xl p-4">
          <h4 class="font-black">Need direct help?</h4>
          <p class="help-v78-muted text-sm mt-1">Message support with your role, school and the issue you are facing.</p>
          <div class="help-v78-actions mt-4 flex flex-wrap gap-3">
            <button onclick="openShuleWhatsappSupport()" class="help-v78-primary-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold"><i data-lucide="message-circle" class="h-4 w-4"></i> WhatsApp</button>
            <button onclick="openShuleEmailSupport()" class="help-v78-outline-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 font-bold"><i data-lucide="mail" class="h-4 w-4"></i> Email</button>
          </div>
        </div>
      </div>`;
    modal.classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  };

  window.closeHelpArticleModal = function closeHelpArticleModalV78() {
    const modal = document.getElementById('help-article-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.ShuleSupport = {
    email: SUPPORT_EMAIL,
    whatsapp: SUPPORT_WHATSAPP_DISPLAY,
    whatsappUrl: `https://wa.me/${SUPPORT_WHATSAPP_E164}`,
    openWhatsApp: window.openShuleWhatsappSupport,
    openEmail: window.openShuleEmailSupport
  };
})();
