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

  function buildEmailSupportLinks() {
    const ctx = supportContext();
    const subjectText = `Shule AI Support Request - ${ctx.role}`;
    const bodyText = buildSupportMessage('email');
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(bodyText);
    return {
      subjectText,
      bodyText,
      mailto: `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`,
      gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${subject}&body=${body}`,
      outlook: `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(SUPPORT_EMAIL)}&subject=${subject}&body=${body}`
    };
  }

  window.copyShuleSupportEmail = async function copyShuleSupportEmail() {
    const links = buildEmailSupportLinks();
    const copyText = `${SUPPORT_EMAIL}\n\nSubject: ${links.subjectText}\n\n${links.bodyText}`;
    try {
      await navigator.clipboard.writeText(copyText);
      if (typeof showToast === 'function') showToast('Support email and message copied.', 'success');
    } catch (_) {
      window.prompt('Copy this support email/message:', copyText);
    }
  };

  window.openShuleWhatsappSupport = function openShuleWhatsappSupport() {
    const text = encodeURIComponent(buildSupportMessage('whatsapp'));
    const url = `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    if (typeof showToast === 'function') showToast('Opening WhatsApp support...', 'info');
  };

  window.showShuleEmailFallback = function showShuleEmailFallback() {
    const links = buildEmailSupportLinks();
    let modal = document.getElementById('shule-email-support-modal');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="shule-email-support-modal" class="fixed inset-0 z-[10000] hidden">
          <div class="help-v78-modal-backdrop absolute inset-0" onclick="document.getElementById('shule-email-support-modal').classList.add('hidden')"></div>
          <div class="absolute inset-x-3 top-10 md:inset-x-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-auto md:w-full md:max-w-lg">
            <div class="help-v78-modal-card rounded-3xl p-5 md:p-6 space-y-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-xl font-black">Email Shule AI Support</h3>
                  <p class="help-v78-muted text-sm mt-1">If your browser does not open an email app automatically, use Gmail, Outlook, or copy the support details.</p>
                </div>
                <button class="help-v78-outline-btn rounded-xl h-10 w-10" onclick="document.getElementById('shule-email-support-modal').classList.add('hidden')">×</button>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <a data-email-gmail class="help-v78-primary-btn text-center rounded-xl px-4 py-3 font-bold" target="_blank" rel="noopener noreferrer">Open Gmail</a>
                <a data-email-outlook class="help-v78-outline-btn text-center rounded-xl px-4 py-3 font-bold" target="_blank" rel="noopener noreferrer">Open Outlook</a>
                <a data-email-mailto class="help-v78-outline-btn text-center rounded-xl px-4 py-3 font-bold">Open Email App</a>
                <button type="button" class="help-v78-outline-btn rounded-xl px-4 py-3 font-bold" onclick="copyShuleSupportEmail()">Copy Email Details</button>
              </div>
              <div class="help-v78-support-card rounded-2xl p-4 text-sm">
                <b>Send to:</b> ${SUPPORT_EMAIL}<br>
                <span class="help-v78-muted">Subject and body are prefilled with your role, school, section, and issue space.</span>
              </div>
            </div>
          </div>
        </div>`);
      modal = document.getElementById('shule-email-support-modal');
    }
    modal.querySelector('[data-email-gmail]').href = links.gmail;
    modal.querySelector('[data-email-outlook]').href = links.outlook;
    modal.querySelector('[data-email-mailto]').href = links.mailto;
    modal.classList.remove('hidden');
  };

  window.openShuleEmailSupport = function openShuleEmailSupport(preferred) {
    const links = buildEmailSupportLinks();
    if (preferred === 'mailto') {
      window.location.href = links.mailto;
      setTimeout(window.showShuleEmailFallback, 700);
      return;
    }
    // Gmail web compose is the most reliable redirect on Chrome/Android/desktop when no default mail app is configured.
    const opened = window.open(links.gmail, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.href = links.mailto;
    setTimeout(window.showShuleEmailFallback, 800);
    if (typeof showToast === 'function') showToast('Opening email support...', 'info');
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

  articles.super_admin = articles.superadmin;

  const roleNames = {
    admin: 'School Admin', parent: 'Parent', teacher: 'Teacher', student: 'Student', superadmin: 'Super Admin', super_admin: 'Super Admin'
  };

  const commonArticles = [
    {
      icon: '🔔',
      title: 'How the Alert Center works',
      summary: 'Alerts are grouped by date to avoid clutter. Open a date to see the alerts that arrived that day, mark them as read, and use action buttons where available.',
      tags: ['alerts', 'dates', 'bell', 'read'],
      steps: ['Click the bell icon or Alerts in the sidebar.', 'Open Today, Yesterday, or another date.', 'Use filters such as Financial, Academic, Wellness or Subscription.', 'Mark alerts as read after reviewing them.']
    },
    {
      icon: '✨',
      title: 'What Shule AI Insight means',
      summary: 'Shule AI Insight labels show smart recommendations from the analytics engine or AI-assisted tools. They help users understand what needs attention without searching through every section.',
      tags: ['shule ai', 'insight', 'analytics', 'recommendations'],
      steps: ['Read the insight label.', 'Check the category.', 'Open the suggested section if there is an action button.', 'Contact support if the insight looks wrong.']
    },
    {
      icon: '🌗',
      title: 'Using dark and light mode',
      summary: 'Theme changes should apply to cards, tables, popups, forms and text. If something is hard to read, refresh once and report the section to support.',
      tags: ['dark mode', 'light mode', 'theme', 'visibility'],
      steps: ['Use the top-right theme toggle.', 'Check that the current section changes theme.', 'If text is invisible, open Help and contact support with the section name.']
    },
    {
      icon: '🛟',
      title: 'When to contact support',
      summary: 'Contact support when payments look wrong, records are missing, a dashboard is not loading, a button is dead, or you are unsure what action to take.',
      tags: ['support', 'whatsapp', 'email', 'issue'],
      steps: ['Open Help.', 'Choose WhatsApp or Email Support.', 'The message includes your role, school and current section.', 'Add a clear description of what happened.']
    }
  ];


  const troubleshootingArticles = [
    {
      icon: '🧭',
      title: 'Dashboard looks empty or stuck loading',
      summary: 'This usually happens when the internet is slow, the session expired, or the selected school/role does not have access to that section.',
      tags: ['loading', 'empty', 'dashboard', 'session'],
      steps: ['Check your internet connection.', 'Refresh once.', 'Log out and log in again if the dashboard still looks empty.', 'Check that you are using the correct role account.', 'Contact support with the dashboard name and screenshot.']
    },
    {
      icon: '🔐',
      title: 'Login, invalid token, or not authorized errors',
      summary: 'Invalid token or Not authorized means the login session is expired, the wrong role is logged in, or the account does not have permission for that action.',
      tags: ['login', 'token', 'authorized', 'permission'],
      steps: ['Log out fully.', 'Clear the browser tab and log in again.', 'Confirm the correct role was selected.', 'If it still fails, ask the school admin to confirm your account is active.', 'Send the error text to support.']
    },
    {
      icon: '🔔',
      title: 'I cannot find my alerts',
      summary: 'Use the top-right bell or the Alerts item in the sidebar. Alerts are grouped by date so the center stays clean.',
      tags: ['alerts', 'bell', 'date', 'notifications'],
      steps: ['Click the top-right bell icon.', 'Open Today, Yesterday, or the required date dropdown.', 'Use All or Unread filter.', 'Check category filters such as Financial, Academic, Wellness, Subscription or Announcement.', 'Mark alerts as read after reviewing.']
    },
    {
      icon: '📆',
      title: 'Alerts are grouped by date',
      summary: 'If you do not see an alert immediately, open the date it arrived. Each date expands to show all alerts received that day.',
      tags: ['alert center', 'date grouped', 'dropdown'],
      steps: ['Open Alerts.', 'Find the date header.', 'Click the date to expand it.', 'Review all alerts inside that day.', 'Use action buttons such as View Payments or View Homework.']
    },
    {
      icon: '💬',
      title: 'WhatsApp support does not open',
      summary: 'WhatsApp support opens through wa.me. If your browser blocks the new tab, allow popups or copy the number 0700 201 922.',
      tags: ['whatsapp', 'support', 'popup'],
      steps: ['Click WhatsApp Support once.', 'Allow popups if the browser asks.', 'Make sure WhatsApp or WhatsApp Web is available.', 'If it still fails, send a direct WhatsApp message to 0700 201 922.']
    },
    {
      icon: '✉️',
      title: 'Email support does not open',
      summary: 'Some browsers do not have a default email app for mailto links. Use Open Gmail, Open Outlook, or Copy Email Details from the fallback modal.',
      tags: ['email', 'support', 'gmail', 'mailto'],
      steps: ['Click Email Support.', 'If Gmail opens, send the prefilled message.', 'If nothing opens, use the fallback modal.', 'Choose Open Gmail, Open Outlook, Open Email App, or Copy Email Details.', 'Send to shuleai.info@gmail.com.']
    },
    {
      icon: '🌗',
      title: 'Dark mode text or buttons are hard to see',
      summary: 'Theme changes should update all cards, tables, modals and buttons. If a section remains white or text disappears, report the section name.',
      tags: ['dark mode', 'theme', 'visibility', 'buttons'],
      steps: ['Toggle light/dark mode again.', 'Refresh once if needed.', 'Check if the issue affects one section only.', 'Contact support with the section name and a screenshot.']
    },
    {
      icon: '📣',
      title: 'Sending announcements without AI',
      summary: 'AI suggestions are optional. Admins can type their own title and message, choose recipients, and send without generating an AI suggestion.',
      tags: ['announcement', 'manual', 'ai optional', 'send'],
      steps: ['Open Send Announcement.', 'Choose recipients.', 'Type your own title.', 'Type your own message.', 'Do not press Get Shule AI Suggestion.', 'Press Send Announcement.']
    },
    {
      icon: '✨',
      title: 'Using Shule AI announcement suggestions',
      summary: 'Use the AI assistant only when you want help restructuring a message. The suggestion never sends automatically; admin must review and send.',
      tags: ['ai suggestion', 'announcement', 'admin', 'deepseek'],
      steps: ['Choose audience, topic and tone.', 'Write a brief description.', 'Click Get Shule AI Suggestion.', 'Review title and message.', 'Edit if needed.', 'Click Send Announcement only when ready.']
    },
    {
      icon: '🤖',
      title: 'AI Tutor is locked or unavailable',
      summary: 'Student AI Tutor requires an active Essential, Smart or Genius child subscription. If DeepSeek has insufficient balance, no usage should be deducted.',
      tags: ['ai tutor', 'subscription', 'deepseek', 'usage'],
      steps: ['Confirm the student has Essential, Smart or Genius plan.', 'Check today’s usage limit.', 'If the answer fails, try again later.', 'No usage is deducted when Shule AI cannot answer.', 'Parent can renew or upgrade the child plan.']
    },
    {
      icon: '💳',
      title: 'Payment submitted but balance did not reduce',
      summary: 'Pending, failed and rejected payments are visible in history but do not reduce balance. Approved or successful payments reduce balance.',
      tags: ['payment', 'balance', 'pending', 'failed'],
      steps: ['Open Payments.', 'Select the correct child/student.', 'Open Payment History.', 'Check the payment status.', 'If status is Pending, wait for school approval.', 'If status is Successful/Approved and balance is wrong, contact support.']
    },
    {
      icon: '🧾',
      title: 'Payment history is missing or mixed up',
      summary: 'Payment history must be individual per student. Always select the specific child/student before checking history.',
      tags: ['payment history', 'student specific', 'siblings'],
      steps: ['Select one child/student.', 'Check the fee account/term.', 'Use filters All, Pending, Successful, Failed, Rejected, Bursary/Credit.', 'If another sibling appears, report it immediately.']
    },
    {
      icon: '🏦',
      title: 'Cash, bank, card, or manual M-Pesa payments',
      summary: 'Offline payments must be recorded or approved by admin against the selected student and fee account.',
      tags: ['cash', 'bank', 'card', 'manual mpesa'],
      steps: ['Keep your receipt or reference number.', 'Submit manual M-Pesa where available or contact school office.', 'Admin records/approves the payment.', 'Parent sees the payment under that child only after approval.']
    },
    {
      icon: '🎓',
      title: 'Bursary, waiver, discount or credit is missing',
      summary: 'Credits reduce balance only after approval and should show separately from parent-paid money.',
      tags: ['bursary', 'waiver', 'credit', 'discount'],
      steps: ['Open Payments or student finance record.', 'Check Bursary/Credit amount.', 'Open history and filter Bursaries/Credits.', 'If pending, wait for approval.', 'Contact school if it was approved but not visible.']
    },
    {
      icon: '📚',
      title: 'Homework, marks or reports are missing',
      summary: 'These records may be hidden until teachers/admins publish them. Also check class, subject and term selection.',
      tags: ['homework', 'marks', 'reports', 'missing'],
      steps: ['Confirm the correct class/term is selected.', 'Refresh the section once.', 'Ask the teacher/admin whether the record was published.', 'Contact support if published records still do not appear.']
    },
    {
      icon: '📶',
      title: 'Slow internet or failed request',
      summary: 'If a button seems not to work, the network request may have failed. The system should not lose saved records because of a temporary network issue.',
      tags: ['network', 'request failed', 'slow', 'retry'],
      steps: ['Wait a few seconds.', 'Do not press the same payment button repeatedly.', 'Refresh once.', 'Check if the record already saved.', 'Contact support with the time and action attempted.']
    }
  ];

  const roleScenarioArticles = {
    admin: [
      { icon: '🏗️', title: 'Fee structure created for multiple classes but looks duplicated', summary: 'Grouped fee structures should appear as one card with assigned classes inside. If you see separate duplicate cards, open the structure and check assigned classes before creating another.', tags: ['fee structure', 'grouped', 'duplicate'], steps: ['Open Finance & Fees.', 'Open the fee structure card.', 'View assigned classes.', 'Add/remove classes inside the card.', 'Do not recreate the same structure for the same term/classes.'] },
      { icon: '🧮', title: 'Finance totals look wrong', summary: 'Totals should calculate from active student fee accounts: expected, parent paid, bursary/credit and outstanding.', tags: ['finance totals', 'expected', 'paid', 'balance'], steps: ['Confirm the fee structure is active.', 'Check student fee accounts exist.', 'Check payments are Approved/Successful.', 'Check bursaries are Approved.', 'Refresh Finance & Fees.'] },
      { icon: '📩', title: 'Announcement recipients are empty', summary: 'Announcements need valid linked users. If a class or parent list is empty, check student-parent links and user accounts.', tags: ['announcement', 'recipients', 'parents', 'class'], steps: ['Choose the correct audience.', 'If Specific Class, select a class.', 'Confirm students in the class have linked parents.', 'If Whole School, confirm parent/teacher/student user accounts exist.'] }
    ],
    parent: [
      { icon: '👥', title: 'I have many children but only one appears', summary: 'Parent-child linking may be incomplete. Contact the school so they can link the missing child to your parent account.', tags: ['children', 'parent link', 'missing child'], steps: ['Open Children.', 'Refresh once.', 'If still missing, contact school admin.', 'Share the child name, class, and admission number.'] },
      { icon: '🔒', title: 'AI Tutor asks for subscription', summary: 'There is no free AI tier. Each child needs Essential, Smart or Genius before using the AI Tutor.', tags: ['ai tutor', 'subscription', 'essential', 'smart', 'genius'], steps: ['Open Subscriptions.', 'Select the child.', 'Choose Essential, Smart or Genius.', 'Complete payment.', 'Ask the student to reopen AI Tutor.'] }
    ],
    teacher: [
      { icon: '👩‍🏫', title: 'My assigned class or subject is missing', summary: 'Teacher access depends on class and subject assignments made by admin.', tags: ['assigned class', 'subject', 'teacher'], steps: ['Open Classes/Students.', 'Refresh once.', 'Ask admin to confirm class teacher or subject teacher assignment.', 'Log out and log in again after changes.'] },
      { icon: '📨', title: 'I am not receiving class alerts', summary: 'Teacher alerts depend on assigned classes/subjects and school announcements targeted to teachers.', tags: ['teacher alerts', 'class alerts'], steps: ['Check Alerts section.', 'Confirm class/subject assignment.', 'Check date dropdowns.', 'Contact admin if class alerts still do not appear.'] }
    ],
    student: [
      { icon: '🧠', title: 'AI Tutor says no usage deducted', summary: 'That message means Shule AI could not answer because of provider/account/network issues, and the student usage count should not reduce.', tags: ['ai tutor', 'usage', 'deepseek'], steps: ['Try again later.', 'Check subscription is active.', 'Ask parent/admin if AI service is enabled.', 'Contact support if the error repeats.'] },
      { icon: '🎒', title: 'I cannot see homework or study alerts', summary: 'Homework alerts depend on teacher assignments and published homework for your class.', tags: ['homework', 'study', 'alerts'], steps: ['Open Homework.', 'Check Alerts date groups.', 'Refresh once.', 'Ask teacher if homework was published to your class.'] }
    ],
    superadmin: [
      { icon: '🏢', title: 'A school cannot access a feature', summary: 'Check the school subscription status, feature locks, payment status and account activation.', tags: ['school', 'subscription', 'feature lock'], steps: ['Open school record.', 'Check subscription status.', 'Check feature locks.', 'Check payment history.', 'Apply override only where allowed.'] }
    ]
  };

  function roleArticles(role) {
    if (role === 'super_admin') role = 'superadmin';
    const list = articles[role] || articles.admin;
    const roleExtras = roleScenarioArticles[role] || [];
    return [...list, ...roleExtras, ...commonArticles, ...troubleshootingArticles];
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


// V87_DEEP_TROUBLESHOOTING - expanded practical help scenarios appended without removing existing help.
(function(){
  const scenarios = [
    ['Payment pending','Pending payments are visible but do not reduce balance until school finance approves them. Check the selected child and fee account.'],
    ['Balance not reducing','Balances reduce only after successful/approved payments, bursaries, waivers or credits. Failed/rejected payments stay in history but do not reduce the balance.'],
    ['Payment history missing','Select the correct child first. Payment history is student-specific and never mixes siblings.'],
    ['AI Tutor locked','AI Tutor requires an active Essential, Smart or Genius child plan. There is no free tier.'],
    ['AI Tutor unavailable','If DeepSeek has insufficient balance or network fails, no student usage is deducted. Try again after support confirms the AI provider is funded.'],
    ['Marks showing N/A','Marks must be between 0 and 100. The system calculates grade using the school curriculum. Refresh if curriculum settings were just changed.'],
    ['Report card not opening','Make sure the student belongs to your class/school/parent account and that published marks exist.'],
    ['Class teacher not found','If class teacher messaging fails, message the school admin and ask them to assign a class teacher.'],
    ['Duty swap invalid date','Select a valid duty date from the date picker before submitting a swap request.'],
    ['Bank details missing','Ask the school admin to update Finance & Fees > Payment Settings. Parents should refresh payment details.'],
    ['Profile picture missing','Upload a clear image. If an old uploaded file is unavailable, Shule AI falls back to initials until you upload again.'],
    ['Mobile layout issue','Use Chrome/Safari, refresh cache, and avoid desktop mode. Install the PWA for best phone experience.'],
    ['Invalid token/session expired','Log out and log back in. If the issue continues, contact support.'],
    ['Alerts not appearing','Open Alerts from the bell icon. Alerts are grouped by date and only show items relevant to your role/student.']
  ];
  const old = window.renderHelpSection;
  window.renderHelpSection = function(){
    const base = typeof old === 'function' ? old.apply(this, arguments) : '<div class="space-y-6"><h2 class="text-2xl font-bold">Help Center</h2></div>';
    const extra = `<section class="rounded-xl border bg-card p-5 mt-6"><h3 class="text-xl font-bold mb-3">Troubleshooting Guide</h3><div class="grid gap-3 md:grid-cols-2">${scenarios.map(([t,m])=>`<div class="rounded-lg border p-3"><strong>${t}</strong><p class="text-sm text-muted-foreground mt-1">${m}</p></div>`).join('')}</div><div class="mt-4 flex flex-wrap gap-2"><a class="px-4 py-2 rounded-lg bg-primary text-white" href="https://mail.google.com/mail/?view=cm&fs=1&to=shuleai.info@gmail.com&su=Shule%20AI%20Support%20Request" target="_blank">Open Gmail Support</a><a class="px-4 py-2 rounded-lg border" href="mailto:shuleai.info@gmail.com?subject=Shule%20AI%20Support%20Request">Open Email App</a><a class="px-4 py-2 rounded-lg border" href="https://wa.me/254700201922" target="_blank">WhatsApp Support</a></div></section>`;
    return String(base).replace('</div>', extra + '</div>');
  };
})();
