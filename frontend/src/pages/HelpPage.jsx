import { useEffect, useRef } from 'react';
import {
  Printer, LayoutDashboard, GraduationCap, CheckSquare, FileText,
  DollarSign, MessageSquare, ClipboardList, Bell,
  AlertTriangle, Flag, FileSignature, ArrowRight, Lock, Check,
  ChevronRight, Star, Lightbulb, ShieldAlert, Info, BookOpen,
  Clock, AlarmClock, Calendar, Smartphone, Library, Send, KeyRound,
  Globe,
} from 'lucide-react';

const SECTIONS = [
  { id: 'overview',       label: 'Overview',           icon: BookOpen },
  { id: 'dashboard',      label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'students',       label: 'Students',           icon: GraduationCap },
  { id: 'pipeline',       label: 'Progress & Pipeline',icon: CheckSquare },
  { id: 'documents',      label: 'Documents',          icon: FileText },
  { id: 'payments',       label: 'Payments',           icon: DollarSign },
  { id: 'communications', label: 'Communication Log',  icon: MessageSquare },
  { id: 'tasks',          label: 'Tasks',              icon: ClipboardList },
  { id: 'notifications',  label: 'Notifications',      icon: Bell },
  { id: 'student-app',    label: 'Student App',        icon: Smartphone },
  { id: 'kb',             label: 'Knowledge Base',     icon: Library },
  { id: 'tips',           label: 'Tips & Practices',   icon: Star },
];

function SectionTitle({ id, icon: Icon, children }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-4 pt-2">
      <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">{children}</h2>
    </div>
  );
}

function Step({ n, children }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{children}</p>
    </div>
  );
}

function Tip({ children }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg mb-2">
      <Lightbulb className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
      <p className="text-sm text-green-800">{children}</p>
    </div>
  );
}

function Warning({ children }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg mb-2">
      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800">{children}</p>
    </div>
  );
}

function Note({ children }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg mb-2">
      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
      <p className="text-sm text-blue-800">{children}</p>
    </div>
  );
}

function Badge({ color = 'brand', children }) {
  const colors = {
    brand:  'bg-brand-100 text-brand-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    gray:   'bg-gray-100 text-gray-700',
    orange: 'bg-orange-100 text-orange-700',
    blue:   'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm mb-5 ${className}`}>
      {children}
    </div>
  );
}

function SubHeading({ children }) {
  return <h3 className="text-base font-semibold text-gray-800 mb-3 mt-5 first:mt-0">{children}</h3>;
}

export default function HelpPage() {
  const printRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'help-print-style';
    style.textContent = `
      @media print {
        aside, .no-print { display: none !important; }
        body { background: white !important; }
        .print-root { padding: 0 !important; max-width: 100% !important; }
        .print-cover { display: flex !important; }
        .card, [class*="shadow"] { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        a { color: inherit !important; text-decoration: none !important; }
        @page { margin: 20mm; size: A4; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="print-root flex gap-6 max-w-6xl" ref={printRef}>

      {/* Print cover — hidden on screen */}
      <div className="print-cover hidden flex-col items-center justify-center min-h-[60vh] w-full text-center mb-10">
        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">El Nadjah DC System</h1>
        <p className="text-lg text-gray-500 mb-1">Agent User Guide</p>
        <p className="text-sm text-gray-400">elnadjah.agency@gmail.com</p>
        <div className="mt-8 border-t border-gray-200 pt-6 w-64">
          <p className="text-xs text-gray-400">Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Left nav — desktop only (hidden on print) */}
      <nav className="no-print hidden sm:block w-52 shrink-0 sticky top-6 self-start">
        <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm space-y-0.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 pb-2">Contents</p>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors text-left"
            >
              <s.icon className="w-3.5 h-3.5 shrink-0" />
              {s.label}
            </button>
          ))}
          <div className="pt-2 mt-2 border-t border-gray-100">
            <button
              onClick={() => window.print()}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              Save as PDF
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6 sm:space-y-8 pb-16">

        {/* Page header */}
        <div className="no-print space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Agent Guide</h1>
              <p className="text-sm text-gray-400 mt-0.5">Everything you need to use the DC System effectively</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 btn-secondary text-sm shrink-0"
            >
              <Printer className="w-4 h-4" /><span className="hidden sm:inline">Save as PDF</span>
            </button>
          </div>

          {/* Mobile jump-to select */}
          <div className="sm:hidden">
            <select
              className="input text-sm w-full"
              defaultValue=""
              onChange={e => { if (e.target.value) { scrollTo(e.target.value); e.target.value = ''; } }}
            >
              <option value="" disabled>Jump to section…</option>
              {SECTIONS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        <Card>
          <SectionTitle id="overview" icon={BookOpen}>Overview</SectionTitle>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            The <strong>El Nadjah DC System</strong> is your central workspace for managing every student's study-abroad journey — from the first intake to visa approval. Every piece of information, every document, every deadline lives here so nothing falls through the cracks.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: GraduationCap, label: 'Students',       desc: 'Full profiles, filters, and status' },
              { icon: CheckSquare,   label: 'Pipeline',        desc: 'Track progress stage by stage' },
              { icon: FileText,      label: 'Documents',       desc: 'Mark required docs ready/missing' },
              { icon: DollarSign,    label: 'Payments',        desc: 'Log fees and track balances' },
              { icon: MessageSquare, label: 'Comms Log',       desc: 'Record every interaction' },
              { icon: ClipboardList, label: 'Tasks',           desc: 'Action items and timed reminders' },
              { icon: Smartphone,    label: 'Student App',     desc: 'Notify students and manage access' },
              { icon: Library,       label: 'Knowledge Base',  desc: 'Destination and university guides' },
              { icon: Bell,          label: 'Notifications',   desc: 'Automatic alerts on key events' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── DASHBOARD ── */}
        <Card>
          <SectionTitle id="dashboard" icon={LayoutDashboard}>Dashboard</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            The Dashboard is your daily starting point. It surfaces the most important information so you can prioritize without digging through student lists.
          </p>
          <SubHeading>What you see</SubHeading>
          <ul className="space-y-2 text-sm text-gray-700 mb-4">
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>My Students / Tasks</strong> — two summary cards showing your total active student count and pending task count at a glance</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Recent Notifications</strong> — your 5 latest notifications, unread ones first</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Tasks & Reminders</strong> — your next 7 pending tasks, sorted by overdue → urgent → due date</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Urgent Cases</strong> — students you've marked as Urgent, shown as quick-access cards</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Expiring Soon</strong> — students whose mediation code expires within 14 days or VFS appointment is within 7 days</span></li>
          </ul>
          <Tip>Open the Dashboard first thing each morning. Handle urgent and expiring-soon cases before anything else.</Tip>
        </Card>

        {/* ── STUDENTS ── */}
        <Card>
          <SectionTitle id="students" icon={GraduationCap}>Students</SectionTitle>

          <SubHeading>Viewing the student list</SubHeading>
          <p className="text-sm text-gray-700 mb-3">Go to <strong>Students</strong> in the sidebar. You see all students assigned to you — founders see everyone. Use the search bar and filters to narrow down by destination, stage, status, or payment state.</p>

          <SubHeading>Filters</SubHeading>
          <div className="space-y-1.5 mb-4 text-sm text-gray-700">
            <div className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Destination</strong> — filter by country/program type</span></div>
            <div className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Stage</strong> — filter by current pipeline stage name</span></div>
            <div className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Status</strong> — Urgent, Flagged, or No Contract</span></div>
            <div className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Payment</strong> — Has Remaining Debt, Fully Paid, or No Payments Yet</span></div>
            <div className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Agent</strong> (founders only) — filter by assigned DC agent</span></div>
          </div>

          <SubHeading>Status badges</SubHeading>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 text-sm">
              <Badge color="red"><AlertTriangle className="w-3 h-3" /> Urgent</Badge>
              <span className="text-gray-600">Case needs immediate attention — click to toggle</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Badge color="yellow"><Flag className="w-3 h-3" /> Flagged</Badge>
              <span className="text-gray-600">Flagged with a specific reason — click to remove flag</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Badge color="green"><FileSignature className="w-3 h-3" /> Contract Signed</Badge>
              <span className="text-gray-600">Student has signed the service contract</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Badge color="red"><FileSignature className="w-3 h-3" /> No Contract</Badge>
              <span className="text-gray-600">Contract not yet obtained — follow up!</span>
            </div>
          </div>
          <Note>All three badges on the student detail page are <strong>interactive buttons</strong> — click Urgent to toggle it, click the flag badge to remove a flag (or click "Flag" to set one with a reason), click the contract badge to flip its status.</Note>

          <SubHeading>Adding a new student</SubHeading>
          <Step n={1}>Click <strong>+ Add Student</strong> on the Students page.</Step>
          <Step n={2}>Fill in the student's name, WhatsApp number, and email.</Step>
          <Step n={3}>Select the <strong>Destination</strong>. This controls which pipeline stages and documents appear.</Step>
          <Step n={4}>Assign a DC agent (founders only) and optionally select the Sales Agent who referred the student.</Step>
          <Step n={5}>Select the University and Program if known.</Step>
          <Step n={6}>Enter the <strong>Service Amount</strong> in DZD and check <strong>Contract Signed</strong> if already obtained.</Step>
          <Step n={7}>Click <strong>Add Student</strong>. The system generates app login credentials — copy and share them with the student before leaving the screen.</Step>
          <Warning>The generated app password is shown only once. If you leave the screen without copying it, use "Reset App Password" on the student's page to generate a new one.</Warning>

          <SubHeading>Editing a student profile</SubHeading>
          <Step n={1}>Open the student's detail page.</Step>
          <Step n={2}>Click <strong>Edit Profile</strong> (top-right on desktop, or the "Edit" button next to the status badges on mobile).</Step>
          <Step n={3}>Update any fields and save. The header updates immediately.</Step>

          <SubHeading>Notes</SubHeading>
          <p className="text-sm text-gray-700 mb-3">The yellow Notes box below the profile card is editable. Click the pencil icon, type your note, and save. Use it for informal context that changes over time — like "waiting for uncle to return from abroad" or "prefers morning calls".</p>
          <Tip>Notes are visible to founders too, so keep them professional and relevant.</Tip>
        </Card>

        {/* ── PIPELINE ── */}
        <Card>
          <SectionTitle id="pipeline" icon={CheckSquare}>Progress & Pipeline</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            The <strong>Progress tab</strong> on a student's page shows their full step-by-step journey. The pipeline is split into two phases: <strong>University Acceptance</strong> and <strong>Visa Process</strong>. Switch between them using the tabs at the top of the Progress section.
          </p>

          <SubHeading>Reading the stepper</SubHeading>
          <div className="flex items-center gap-3 mb-4 flex-wrap text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
              <span>Stage done</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">2</span>
              </div>
              <span>Current stage</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center">
                <span className="text-xs font-bold text-gray-300">3</span>
              </div>
              <span>Upcoming</span>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-3">Click any stage circle to preview its checklist without changing the student's actual progress.</p>

          <SubHeading>Completing checklist items</SubHeading>
          <Step n={1}>Open the student and go to <strong>Progress</strong>.</Step>
          <Step n={2}>The current stage is highlighted. Its checklist appears below the stepper.</Step>
          <Step n={3}>Click each checklist item to mark it done. Changes save immediately.</Step>
          <Step n={4}>Items marked <strong>Required to Advance</strong> must all be checked before you can advance to the next stage.</Step>

          <SubHeading>Advancing to the next stage</SubHeading>
          <Step n={1}>Complete all required checklist items in the current stage.</Step>
          <Step n={2}>The <strong className="text-green-700">Advance</strong> button turns green when you're ready.</Step>
          <Step n={3}>Click <strong>Advance</strong>. The student moves to the next stage automatically.</Step>
          <Note>If the Advance button shows a <Lock className="w-3.5 h-3.5 inline text-gray-400" /> lock icon, mandatory items are still pending. Check what's missing in the checklist above it.</Note>

          <SubHeading>Opening a future stage for the student</SubHeading>
          <p className="text-sm text-gray-700 mb-3">By default, students can only see their current stage in the app. If you need the student to start preparing for an upcoming stage early, click that stage in the stepper and use <strong>Open for student</strong>. Up to 2 stages can be open at the same time.</p>
          <Tip>Use "Open for student" when you want the student to start gathering documents for the next stage before you formally advance them.</Tip>

          <SubHeading>Moving a student to a different stage (override)</SubHeading>
          <p className="text-sm text-gray-700 mb-3">Click any stage in the stepper, then click <strong>Set as Current</strong>. Use this when correcting a mistake or after a manual review with the founder.</p>
          <Warning>Use stage overrides carefully. The Activity tab records every stage change with your name and timestamp.</Warning>

          <SubHeading>Recording a decision</SubHeading>
          <p className="text-sm text-gray-700 mb-3">At the end of each phase (last stage of University Acceptance, last stage of Visa Process), a <strong>Decision</strong> section appears. Click <strong>✓ Positive</strong> or <strong>✕ Negative</strong>, optionally add a note for context, and save. The decision is permanently recorded on the student's profile.</p>

          <SubHeading>Stage history</SubHeading>
          <p className="text-sm text-gray-700">Every stage transition is logged in the <strong>History tab</strong> — not inside the Progress tab. Open the student → History to see the full audit trail of stage changes, who made them, and when.</p>
        </Card>

        {/* ── DOCUMENTS ── */}
        <Card>
          <SectionTitle id="documents" icon={FileText}>Documents</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            The <strong>Documents tab</strong> tracks which required documents have been received, are missing, or are still pending for a student. Documents are grouped into University Acceptance phase and Visa Process phase.
          </p>

          <SubHeading>Updating a document status</SubHeading>
          <Step n={1}>Open a student → <strong>Documents</strong> tab.</Step>
          <Step n={2}>Find the document and click its row to expand it.</Step>
          <Step n={3}>In the expanded view, click the new status button (the current status is highlighted with a ring).</Step>
          <Step n={4}>The status updates immediately and is logged in the activity history.</Step>

          <SubHeading>Document statuses</SubHeading>
          <p className="text-sm text-gray-700 mb-3">Statuses are configured by the founder per destination, but typically include:</p>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-3"><Badge color="gray">Not Requested</Badge><span className="text-gray-600">Default — nothing has been done yet</span></div>
            <div className="flex items-center gap-3"><Badge color="brand">Pending</Badge><span className="text-gray-600">Student has been asked, waiting for response</span></div>
            <div className="flex items-center gap-3"><Badge color="green">Ready</Badge><span className="text-gray-600">Document received and verified</span></div>
            <div className="flex items-center gap-3"><Badge color="red">Missing</Badge><span className="text-gray-600">Expected but not provided by student</span></div>
          </div>

          <SubHeading>Reading document details</SubHeading>
          <p className="text-sm text-gray-700 mb-3">When you expand a document row, you also see: instructions defined for this document (steps, requirements), and the full status change history (who changed it, when).</p>
          <Tip>Check the "ready of total" counter at the top of each phase group to get an instant sense of how complete a student's file is.</Tip>
        </Card>

        {/* ── PAYMENTS ── */}
        <Card>
          <SectionTitle id="payments" icon={DollarSign}>Payments</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            The <strong>Payments tab</strong> inside each student tracks all financial transactions — service fees, university application fees, visa fees, or any other charges. The payment summary at the top always shows the current balance.
          </p>

          <SubHeading>Payment summary</SubHeading>
          <p className="text-sm text-gray-700 mb-3">Three figures are shown: <strong>Service Amount</strong> (the agreed total), <strong>Paid</strong> (sum of all "service fee" payments), and <strong>Remaining</strong> (the difference). A progress bar shows how much of the service fee has been collected.</p>

          <SubHeading>Adding a payment</SubHeading>
          <Step n={1}>Go to a student → <strong>Payments</strong> tab.</Step>
          <Step n={2}>Click <strong>Add Payment</strong>.</Step>
          <Step n={3}>Enter the <strong>Amount</strong> and select the <strong>Date</strong>.</Step>
          <Step n={4}>Select the <strong>Category</strong> (e.g. Service Fee, Visa Fee, University Fee — defined by the founder).</Step>
          <Step n={5}>Select the <strong>Method</strong> (Cash, Bank Transfer, CCP, etc.).</Step>
          <Step n={6}>Optionally add a <strong>Note</strong> for extra context, then click <strong>Save Payment</strong>.</Step>
          <Warning>Only payments categorised as "Service Fee" count toward the Paid and Remaining totals. Other categories (visa fee, etc.) are logged but don't affect the service balance.</Warning>
          <Warning>Verify the payment balance before scheduling any visa appointment. Do not advance students with outstanding service fee balances without founder approval.</Warning>
        </Card>

        {/* ── COMMUNICATIONS ── */}
        <Card>
          <SectionTitle id="communications" icon={MessageSquare}>Communication Log</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            Every call, WhatsApp exchange, or meeting with a student should be logged here as a short note. This creates a shared record so any team member covering the case can get up to speed instantly.
          </p>

          <SubHeading>Adding a log entry</SubHeading>
          <Step n={1}>Open a student → <strong>Communication Log</strong> tab.</Step>
          <Step n={2}>Click <strong>Add Note</strong>.</Step>
          <Step n={3}>Type a brief summary of what was discussed or decided.</Step>
          <Step n={4}>Click <strong>Save</strong>. The entry is timestamped and attributed to you automatically.</Step>

          <Tip>Log on the same day it happens. Even one line is enough: "Called student — passport scan arriving Thursday".</Tip>
          <Note>Communication notes are visible to the founder at all times. Keep them factual and professional.</Note>
        </Card>

        {/* ── TASKS ── */}
        <Card>
          <SectionTitle id="tasks" icon={ClipboardList}>Tasks &amp; Reminders</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            Tasks cover everything from a simple to-do to a timed reminder. You can create them from the <strong>Tasks</strong> page in the sidebar, or directly from a student's page (the Action Items section at the bottom) to link them to that student automatically.
          </p>

          <SubHeading>Creating a task</SubHeading>
          <Step n={1}>Click <strong>New Item</strong> (from the Tasks page or the Dashboard).</Step>
          <Step n={2}>Enter a title and set the priority — Normal or 🔴 Urgent.</Step>
          <Step n={3}>Optionally set a <strong>Due Date</strong>. If you also check <strong>Include exact time</strong>, the system fires an inbox notification at that time — useful for appointments and deadlines you must not miss.</Step>
          <Step n={4}>When a time is set, you can also choose <strong>Notify me</strong> — how many minutes before the time you want the reminder (0, 5, 15, 30, or 60 min).</Step>
          <Step n={5}>Assign the task to yourself or another team member.</Step>
          <Step n={6}>Optionally link it to a student, a pipeline stage, and even a specific checklist item.</Step>
          <Step n={7}>Click <strong>Create</strong>.</Step>

          <SubHeading>Date vs. timed reminder</SubHeading>
          <div className="space-y-3 mb-4 text-sm text-gray-700">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Date only</p>
                <p className="text-gray-500">Shows as a due date on the card. Overdue items turn orange — but no notification is sent.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-brand-50 rounded-lg">
              <AlarmClock className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Date + time <span className="text-brand-600">(timed reminder)</span></p>
                <p className="text-gray-500">Sends an inbox notification at the exact time. Use this for appointments, visa dates, and anything you must not miss.</p>
              </div>
            </div>
          </div>

          <SubHeading>Completing a task</SubHeading>
          <p className="text-sm text-gray-700 mb-3">Click the checkbox on a task to mark it done. Completed items collapse to the bottom of the list and remain on record.</p>
          <Tip>Review your Tasks list every morning before checking notifications. Clear what's done, add new items while they're fresh.</Tip>
        </Card>

        {/* ── NOTIFICATIONS ── */}
        <Card>
          <SectionTitle id="notifications" icon={Bell}>Notifications</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            Notifications are automatic alerts generated by the system when something important happens. The sidebar shows a red badge when you have unread notifications.
          </p>

          <SubHeading>What triggers a notification</SubHeading>
          <div className="space-y-2 mb-4 text-sm text-gray-700">
            {[
              { color: 'green',  label: 'New Case',              desc: 'A new student has been assigned to you' },
              { color: 'blue',   label: 'Handoff',               desc: 'A student was transferred to you from another agent' },
              { color: 'red',    label: 'Stage Blocked',         desc: 'A mandatory checklist item has been flagged as blocked' },
              { color: 'orange', label: 'Document Overdue',      desc: 'A required document has passed its deadline' },
              { color: 'yellow', label: 'Mediation Code Expiry', desc: 'A mediation code is expiring within 14 days' },
              { color: 'violet', label: 'VFS Appointment',       desc: 'A VFS appointment is coming within 7 days' },
              { color: 'gray',   label: 'Custom',                desc: 'A manual notification sent to you by the founder' },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-start gap-3 flex-wrap">
                <Badge color={color}>{label}</Badge>
                <span className="text-gray-600">{desc}</span>
              </div>
            ))}
          </div>

          <SubHeading>Reading notifications</SubHeading>
          <Step n={1}>Click <strong>Notifications</strong> in the sidebar.</Step>
          <Step n={2}>Notifications are grouped: <strong>Today</strong>, <strong>Yesterday</strong>, <strong>This Week</strong>, <strong>Earlier</strong>.</Step>
          <Step n={3}>Click a notification card to mark it as read (the blue dot disappears).</Step>
          <Step n={4}>Click <strong>Mark all read</strong> to clear everything at once.</Step>
          <Step n={5}>Click the <Globe className="w-3.5 h-3.5 inline text-brand-500" /> icon on a notification to jump directly to that student's page.</Step>
          <Note>Recent notifications also appear on your Dashboard so you don't have to visit the Notifications page every time.</Note>
        </Card>

        {/* ── STUDENT APP ── */}
        <Card>
          <SectionTitle id="student-app" icon={Smartphone}>Student App</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            Each student has access to the El Nadjah student PWA where they can follow their progress, view documents, and receive notifications. The <strong>Student App</strong> card on each student's detail page gives you two tools to manage their access.
          </p>

          <SubHeading>Send a notification to the student</SubHeading>
          <Step n={1}>Open the student's detail page and scroll to the <strong>Student App</strong> card.</Step>
          <Step n={2}>Click <strong>Notify Student</strong>.</Step>
          <Step n={3}>Enter a <strong>Title</strong> and a <strong>Message</strong>.</Step>
          <Step n={4}>Click <strong>Send</strong>. The student receives a push notification on their phone (even if the app is closed) and the message appears in their in-app notification list.</Step>
          <Tip>Use this to confirm appointments, share important updates, or prompt the student to check their documents — without having to call or WhatsApp manually.</Tip>

          <SubHeading>Reset app password</SubHeading>
          <Step n={1}>In the <strong>Student App</strong> card, click <strong>Reset App Password</strong>.</Step>
          <Step n={2}>A new password is generated and displayed immediately.</Step>
          <Step n={3}>Copy it using the Copy button and share it with the student via WhatsApp.</Step>
          <Warning>The new password replaces the old one immediately. The student will be logged out of the app and must use the new password to log back in.</Warning>

          <SubHeading>Student app login</SubHeading>
          <p className="text-sm text-gray-700">Students log in to the app using their <strong>WhatsApp number</strong> as their username and the password set at registration (or the most recently reset one). The app is accessible at the El Nadjah student portal URL.</p>
        </Card>

        {/* ── KNOWLEDGE BASE ── */}
        <Card>
          <SectionTitle id="kb" icon={Library}>Knowledge Base</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            The <strong>Knowledge Base</strong> (KB) is the team's shared reference library — one place for all destination guides and university profiles. Access it from the sidebar.
          </p>

          <SubHeading>What's in the KB</SubHeading>
          <div className="space-y-2 mb-4 text-sm text-gray-700">
            <div className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Destination guides</strong> — overview of the process for each country (France, Hungary, etc.), key deadlines, visa rules, and tips</span></div>
            <div className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>University profiles</strong> — specific details for each partner university: city, programs offered, requirements, and notes</span></div>
          </div>

          <SubHeading>Using the KB</SubHeading>
          <Step n={1}>Click <strong>Knowledge Base</strong> in the sidebar.</Step>
          <Step n={2}>Use the tabs to filter by Destinations or Universities, or search by name.</Step>
          <Step n={3}>Click an article to read the full guide.</Step>
          <Note>Only founders can create and edit KB articles. If a destination guide is outdated or missing information, flag it to the founder.</Note>
          <Tip>Check the KB article for a destination before asking the founder about the process. It's the first source of truth for anything destination-specific.</Tip>
        </Card>

        {/* ── TIPS ── */}
        <Card>
          <SectionTitle id="tips" icon={Star}>Tips &amp; Best Practices</SectionTitle>

          <SubHeading>Daily routine</SubHeading>
          <div className="space-y-2 mb-4">
            <Tip>Start each day on the Dashboard. Handle urgent cases and expiring-soon students before opening anything else.</Tip>
            <Tip>Review your Tasks list every morning. Complete overdue ones before adding new ones.</Tip>
            <Tip>Check Notifications — anything unread from yesterday needs a follow-up action today.</Tip>
          </div>

          <SubHeading>Student management</SubHeading>
          <div className="space-y-2 mb-4">
            <Tip>Log every call and message in the Communication Log on the same day it happens. One line is enough.</Tip>
            <Tip>Mark the contract badge as "Contract Signed" the moment you receive it — don't leave it as "No Contract" once it's done.</Tip>
            <Tip>Use the Notes box for context that changes — a promised date, a family situation. Clear stale notes regularly.</Tip>
            <Tip>Use "Notify Student" in the Student App card instead of WhatsApp for important updates — it creates a record in the student's notification history.</Tip>
          </div>

          <SubHeading>Pipeline discipline</SubHeading>
          <div className="space-y-2 mb-4">
            <Warning>Never advance a stage without completing all required checklist items. The system blocks it, but don't work around it using "Set as Current" unless the founder explicitly approves.</Warning>
            <Tip>When a student asks "where are we?" — open their Progress tab. The stepper gives an instant visual to describe over the phone.</Tip>
            <Tip>Use "Open for student" when you want the student to start preparing documents for the next stage before you formally advance them.</Tip>
          </div>

          <SubHeading>Documents and payments</SubHeading>
          <div className="space-y-2 mb-4">
            <Tip>Update document statuses as soon as you receive or follow up. A status that hasn't changed in a week needs a note or an action.</Tip>
            <Warning>Verify the payment balance before scheduling any visa appointment. Outstanding service balances must be cleared or approved by the founder first.</Warning>
          </div>

          <SubHeading>When in doubt</SubHeading>
          <div className="space-y-2">
            <Note>If you're unsure about a destination's process, check the Knowledge Base first before asking the founder.</Note>
            <Note>If you see a student marked Urgent and don't know why, check the Communication Log and Notes before acting. Context is everything.</Note>
          </div>
        </Card>

        <p className="text-xs text-gray-300 text-center no-print">El Nadjah DC System — Internal Agent Guide</p>
      </div>
    </div>
  );
}
