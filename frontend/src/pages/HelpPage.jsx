import { useEffect, useRef } from 'react';
import {
  Printer, LayoutDashboard, GraduationCap, CheckSquare, FileText,
  DollarSign, MessageSquare, ClipboardList, Bell,
  AlertTriangle, Flag, FileSignature, ArrowRight, Lock, Check,
  ChevronRight, Star, Lightbulb, ShieldAlert, Info, BookOpen,
  Users, Globe, Clock, AlarmClock, Calendar
} from 'lucide-react';

const SECTIONS = [
  { id: 'overview',        label: 'Overview',           icon: BookOpen },
  { id: 'dashboard',       label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'students',        label: 'Managing Students',  icon: GraduationCap },
  { id: 'pipeline',        label: 'Progress & Pipeline',icon: CheckSquare },
  { id: 'documents',       label: 'Documents',          icon: FileText },
  { id: 'payments',        label: 'Payments',           icon: DollarSign },
  { id: 'communications',  label: 'Communication Log',  icon: MessageSquare },
  { id: 'tasks',           label: 'Tasks',              icon: ClipboardList },
  { id: 'notifications',   label: 'Notifications',      icon: Bell },
  { id: 'tips',            label: 'Tips & Best Practices', icon: Star },
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
              { icon: GraduationCap, label: 'Students',      desc: 'Full student profiles and status' },
              { icon: CheckSquare,   label: 'Pipeline',       desc: 'Track stage-by-stage progress' },
              { icon: FileText,      label: 'Documents',      desc: 'Mark required docs done/missing' },
              { icon: DollarSign,    label: 'Payments',       desc: 'Log fees and payment status' },
              { icon: MessageSquare, label: 'Comms Log',      desc: 'Record every interaction' },
              { icon: ClipboardList, label: 'Tasks',          desc: 'Action items for your cases' },
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
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>My Students</strong> — your assigned active cases at a glance</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Urgent cases</strong> — students flagged <Badge color="red"><AlertTriangle className="w-3 h-3" />Urgent</Badge> appear highlighted</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Upcoming tasks</strong> — tasks due soon assigned to you</span></li>
            <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" /><span><strong>Stats counters</strong> — total active, blocked, and pipeline summary</span></li>
          </ul>
          <Tip>Open the Dashboard first thing each morning. Urgent and blocked students are shown at the top — handle those before anything else.</Tip>
        </Card>

        {/* ── STUDENTS ── */}
        <Card>
          <SectionTitle id="students" icon={GraduationCap}>Managing Students</SectionTitle>

          <SubHeading>Viewing the student list</SubHeading>
          <p className="text-sm text-gray-700 mb-3">Go to <strong>Students</strong> in the sidebar. You see all students assigned to you (founders see everyone). Use the search bar and destination/stage filters to narrow down.</p>
          <p className="text-sm text-gray-700 mb-4">Each card shows the student's name, destination, current pipeline stage, urgent/flagged badges, and contract status.</p>

          <SubHeading>Status badges</SubHeading>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 text-sm">
              <Badge color="red"><AlertTriangle className="w-3 h-3" /> Urgent</Badge>
              <span className="text-gray-600">Case needs immediate attention</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Badge color="yellow"><Flag className="w-3 h-3" /> Flagged</Badge>
              <span className="text-gray-600">Something specific needs follow-up (reason shown)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Badge color="green"><FileSignature className="w-3 h-3" /> Contract Signed</Badge>
              <span className="text-gray-600">Student has signed the service contract</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Badge color="red"><FileSignature className="w-3 h-3" /> Contract Not Signed</Badge>
              <span className="text-gray-600">Contract not yet obtained — follow up!</span>
            </div>
          </div>

          <SubHeading>Adding a new student</SubHeading>
          <Step n={1}>Click the <strong>+ Add Student</strong> button on the Students page.</Step>
          <Step n={2}>Fill in the student's personal details: name, phone, WhatsApp, email, passport number.</Step>
          <Step n={3}>Select their <strong>Destination</strong> (country/program type). This controls which pipeline stages appear.</Step>
          <Step n={4}>Select the <strong>University</strong> if applicable and the starting pipeline stage.</Step>
          <Step n={5}>Click <strong>Save</strong>. The student appears in your list immediately.</Step>

          <SubHeading>Editing a student profile</SubHeading>
          <Step n={1}>Open the student's detail page by clicking their card.</Step>
          <Step n={2}>Click <strong>Edit Profile</strong> (top right corner).</Step>
          <Step n={3}>Update any fields: destination, university, program, BAC grade, language level, etc.</Step>
          <Step n={4}>Save changes. The header updates immediately.</Step>

          <SubHeading>Contract status</SubHeading>
          <p className="text-sm text-gray-700 mb-3">The contract badge in the student header is a <strong>toggle button</strong>. Click it once to flip between "Signed" and "Not Signed". No form needed.</p>
          <Warning>Always make sure the contract is signed before advancing a student past the first pipeline stage. Do not process applications for unsigned students.</Warning>

          <SubHeading>Notes</SubHeading>
          <p className="text-sm text-gray-700 mb-3">The yellow Notes box below the profile card is editable. Click the pencil icon, type your note, and save. Use it for informal context that doesn't fit elsewhere (e.g., "family prefers morning calls", "waiting for uncle to return from abroad").</p>
          <Tip>Notes are visible to founders too, so keep them professional and relevant.</Tip>
        </Card>

        {/* ── PIPELINE ── */}
        <Card>
          <SectionTitle id="pipeline" icon={CheckSquare}>Progress & Pipeline</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            The <strong>Progress tab</strong> (inside a student's page) shows the full step-by-step journey for that student's destination. Each stage has a checklist of tasks to complete.
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
          <p className="text-sm text-gray-700 mb-3">Click any stage circle to preview that stage's checklist — without changing the student's actual current stage.</p>

          <SubHeading>Completing checklist items</SubHeading>
          <Step n={1}>Open the student and go to <strong>Progress</strong>.</Step>
          <Step n={2}>The current stage is highlighted in blue. Its checklist appears below the stepper.</Step>
          <Step n={3}>Tick each checklist item as you complete it. Changes save immediately.</Step>
          <Step n={4}>Items marked <strong>Mandatory</strong> must all be ticked before you can advance.</Step>

          <SubHeading>Advancing to the next stage</SubHeading>
          <Step n={1}>Complete all mandatory checklist items in the current stage.</Step>
          <Step n={2}>The <strong className="text-green-700">Advance</strong> button turns green when you're ready.</Step>
          <Step n={3}>Click <strong>Advance</strong>. The student moves to the next stage and a notification is sent.</Step>

          <Note>If the Advance button shows a <Lock className="w-3.5 h-3.5 inline text-gray-400" /> lock icon, it means mandatory items are still pending. Hover over the warning message to see how many are left.</Note>

          <SubHeading>Moving a student to a different stage (override)</SubHeading>
          <p className="text-sm text-gray-700 mb-3">Click any stage in the stepper, then click <strong>Set as Current</strong>. Use this when correcting a mistake or after a manual review.</p>
          <Warning>Use stage overrides carefully. Moving a student backward clears no data, but the stage history records the change with your name and timestamp.</Warning>

          <SubHeading>Stage history</SubHeading>
          <p className="text-sm text-gray-700">The Stage History section (below the checklist) shows every stage transition: stage name, who moved it, and when. This is a permanent audit trail.</p>
        </Card>

        {/* ── DOCUMENTS ── */}
        <Card>
          <SectionTitle id="documents" icon={FileText}>Documents</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            The <strong>Documents tab</strong> lets you track which required documents have been received, are missing, or are overdue for a student.
          </p>

          <SubHeading>Document statuses</SubHeading>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-3"><Badge color="gray">Pending</Badge><span className="text-gray-600">Not yet received — default state</span></div>
            <div className="flex items-center gap-3"><Badge color="green">Received</Badge><span className="text-gray-600">Document is in hand / uploaded</span></div>
            <div className="flex items-center gap-3"><Badge color="red">Missing</Badge><span className="text-gray-600">Expected but not provided by student</span></div>
            <div className="flex items-center gap-3"><Badge color="orange">Overdue</Badge><span className="text-gray-600">Deadline passed without the document</span></div>
          </div>

          <SubHeading>How to update a document</SubHeading>
          <Step n={1}>Open a student → <strong>Documents</strong> tab.</Step>
          <Step n={2}>Find the document in the list and change its status from the dropdown.</Step>
          <Step n={3}>Optionally add a note (e.g., "student says it will arrive tomorrow").</Step>
          <Step n={4}>Save. The change is logged in the activity history.</Step>

          <Tip>Set documents to "Overdue" proactively when a student misses a deadline — it triggers an automatic notification to remind the team.</Tip>
        </Card>

        {/* ── PAYMENTS ── */}
        <Card>
          <SectionTitle id="payments" icon={DollarSign}>Payments</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            The <strong>Payments tab</strong> inside each student tracks all financial transactions: service fees, university application fees, visa fees, and any other charges.
          </p>

          <SubHeading>Adding a payment</SubHeading>
          <Step n={1}>Go to a student → <strong>Payments</strong> tab.</Step>
          <Step n={2}>Click <strong>Add Payment</strong>.</Step>
          <Step n={3}>Enter the amount, payment type (service fee, visa fee, etc.), and date.</Step>
          <Step n={4}>Mark it as <strong>Paid</strong> or <strong>Pending</strong>.</Step>
          <Step n={5}>Save. The running total updates automatically.</Step>

          <SubHeading>Payment summary</SubHeading>
          <p className="text-sm text-gray-700 mb-3">At the top of the Payments tab you see: <strong>Total charged</strong>, <strong>Total paid</strong>, and <strong>Balance remaining</strong>. Use this to quickly confirm a student's payment status before any service step.</p>
          <Warning>Never advance a student to visa submission stage while there is an outstanding balance. Confirm with the founder if unsure.</Warning>
        </Card>

        {/* ── COMMUNICATIONS ── */}
        <Card>
          <SectionTitle id="communications" icon={MessageSquare}>Communication Log</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            Every call, WhatsApp, email, or in-person meeting with a student or university should be logged here. This creates a shared record so anyone covering the case can pick up instantly.
          </p>

          <SubHeading>Adding a log entry</SubHeading>
          <Step n={1}>Open a student → <strong>Communication Log</strong> tab.</Step>
          <Step n={2}>Click <strong>Add Entry</strong>.</Step>
          <Step n={3}>Select the channel: Call, WhatsApp, Email, Meeting, Other.</Step>
          <Step n={4}>Write a brief summary of what was discussed or decided.</Step>
          <Step n={5}>Set the date/time and save.</Step>

          <Tip>Log communications on the same day they happen. Even a one-line summary is valuable: "Called student, awaiting passport scan by Thursday".</Tip>
          <Note>Communication logs are visible to the founder at all times. Keep notes factual and professional.</Note>
        </Card>

        {/* ── TASKS ── */}
        <Card>
          <SectionTitle id="tasks" icon={ClipboardList}>Tasks &amp; Reminders</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            Tasks cover everything from a simple to-do to a timed reminder with a notification. You can create them for yourself or assign them to any team member. They can be linked to a specific student or be general office work.
          </p>

          <SubHeading>Creating a task</SubHeading>
          <Step n={1}>Go to <strong>Tasks</strong> in the sidebar for your full list, or open a student's page and use the Tasks section there to create a student-linked item directly.</Step>
          <Step n={2}>Click <strong>New Item</strong>.</Step>
          <Step n={3}>Enter a title and set the priority.</Step>
          <Step n={4}>Optionally set a <strong>Due Date</strong>. If you also check <strong>Include exact time</strong>, the system will fire an inbox notification at that time.</Step>
          <Step n={5}>Assign it to yourself or another agent, and optionally link it to a student.</Step>
          <Step n={6}>Save. The item appears in the assignee's task list immediately.</Step>

          <SubHeading>Date vs. timed reminder</SubHeading>
          <div className="space-y-3 mb-4 text-sm text-gray-700">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Date only</p>
                <p className="text-gray-500">Shows as a due date on the card. Overdue items are highlighted in orange but no notification is sent.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-brand-50 rounded-lg">
              <AlarmClock className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Date + time <span className="text-brand-600">(timed reminder)</span></p>
                <p className="text-gray-500">Sends an inbox notification at the exact time. Use this for appointments, deadlines, and follow-ups you must not miss.</p>
              </div>
            </div>
          </div>

          <SubHeading>Priorities</SubHeading>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-3"><Badge color="gray">Normal</Badge><span className="text-gray-600">Standard work item — do it in order</span></div>
            <div className="flex items-center gap-3"><Badge color="red">🔴 Urgent</Badge><span className="text-gray-600">Needs immediate attention — shown first and highlighted in red</span></div>
          </div>

          <SubHeading>Completing a task</SubHeading>
          <p className="text-sm text-gray-700 mb-3">Click the checkbox on a task to mark it done. You can optionally add a short completion note (useful for "called back — confirmed for Thursday"). Completed items collapse to the bottom and stay for the record.</p>
          <Tip>Review your Tasks list every morning before checking notifications. Clear what's done, add new action items while they're fresh.</Tip>
        </Card>

        {/* ── NOTIFICATIONS ── */}
        <Card>
          <SectionTitle id="notifications" icon={Bell}>Notifications</SectionTitle>
          <p className="text-sm text-gray-700 mb-4">
            Notifications are automatic alerts generated by the system when something important happens. The sidebar shows a <span className="inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5">3</span> badge when you have unread notifications.
          </p>

          <SubHeading>What triggers a notification</SubHeading>
          <div className="space-y-2 mb-4 text-sm text-gray-700">
            {[
              { type: 'new_case',              color: 'green',  label: 'New Case',               desc: 'A new student has been assigned to you' },
              { type: 'handoff',               color: 'blue',   label: 'Handoff',                desc: 'A student was transferred to you from another agent' },
              { type: 'stage_blocked',         color: 'red',    label: 'Stage Blocked',          desc: 'A mandatory checklist item has been flagged as blocked' },
              { type: 'document_overdue',      color: 'orange', label: 'Document Overdue',       desc: 'A required document has passed its deadline' },
              { type: 'mediation_code_expiry', color: 'yellow', label: 'Mediation Code Expiry',  desc: 'The mediation code for a student is about to expire' },
              { type: 'vfs_appointment',       color: 'brand',  label: 'VFS Appointment',        desc: 'A VFS appointment reminder' },
              { type: 'custom',                color: 'gray',   label: 'Custom',                 desc: 'Manual notifications sent by the founder' },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <Badge color={color}>{label}</Badge>
                <span className="text-gray-600">{desc}</span>
              </div>
            ))}
          </div>

          <SubHeading>Reading and clearing notifications</SubHeading>
          <Step n={1}>Click <strong>Notifications</strong> in the sidebar.</Step>
          <Step n={2}>Notifications are grouped: <strong>Today</strong>, <strong>Yesterday</strong>, <strong>This Week</strong>, <strong>Earlier</strong>.</Step>
          <Step n={3}>Click a notification card to mark it as read (the blue dot disappears).</Step>
          <Step n={4}>Click <strong>Mark all read</strong> to clear everything at once.</Step>
          <Step n={5}>Click the <ExternalLink className="w-3.5 h-3.5 inline text-brand-500" /> icon on a notification to jump directly to that student's page.</Step>

          <Note>Notifications refresh automatically every 30 seconds. You do not need to reload the page.</Note>
        </Card>

        {/* ── TIPS ── */}
        <Card>
          <SectionTitle id="tips" icon={Star}>Tips &amp; Best Practices</SectionTitle>

          <SubHeading>Daily routine</SubHeading>
          <div className="space-y-2 mb-4">
            <Tip>Start each day on the Dashboard. Check urgent cases and blocked students first.</Tip>
            <Tip>Review your Tasks list every morning. Complete overdue ones before adding new ones.</Tip>
            <Tip>Check Notifications — anything unread from yesterday needs a follow-up action today.</Tip>
          </div>

          <SubHeading>Student management</SubHeading>
          <div className="space-y-2 mb-4">
            <Tip>Log every call and message in the Communication Log on the same day it happens. One line is enough.</Tip>
            <Tip>Mark the contract as "Signed" the moment you receive it. Don't leave it as "Not Signed" once it's done.</Tip>
            <Tip>Use the Notes box for context that changes — like waiting on a family member or a promised date. Clear stale notes.</Tip>
          </div>

          <SubHeading>Pipeline discipline</SubHeading>
          <div className="space-y-2 mb-4">
            <Warning>Never advance a stage without completing all mandatory checklist items. The system will block you, but don't try to work around it with the "Set as Current" override.</Warning>
            <Tip>When a student asks "where are we in the process?" — open their Progress tab. The stepper gives you an instant visual to describe over the phone.</Tip>
          </div>

          <SubHeading>Documents and payments</SubHeading>
          <div className="space-y-2 mb-4">
            <Tip>Update document statuses as soon as you receive or follow up on them. "Pending" should never stay for more than a week without a note.</Tip>
            <Warning>Verify the payment balance before scheduling any visa appointment. Unpaid students should not proceed to submission.</Warning>
          </div>

          <SubHeading>When in doubt</SubHeading>
          <div className="space-y-2">
            <Note>If you're unsure whether to advance a stage, check the KB article for that destination's process first.</Note>
            <Note>If you see a student marked Urgent and you don't know why, check the Communication Log and Notes before acting. Context is everything.</Note>
          </div>
        </Card>

        <p className="text-xs text-gray-300 text-center no-print">El Nadjah DC System — Internal Agent Guide</p>
      </div>
    </div>
  );
}

// Inline icon since ExternalLink is not imported in scope above
function ExternalLink({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
