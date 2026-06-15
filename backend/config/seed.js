require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Destination = require('../models/Destination');
const KBArticle = require('../models/KBArticle');

const DOCUMENT_STATUS_FLOW_FULL = [
  'not_requested', 'requested', 'received', 'under_review', 'approved',
  'sent_for_translation', 'translated', 'sent_for_legalization', 'legalized', 'ready'
];

const DOCUMENT_STATUS_FLOW_SIMPLE = ['not_requested', 'requested', 'received', 'approved', 'ready'];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Founders
  const existingFounder = await User.findOne({ email: 'haithem@elnadjah.com' });
  if (!existingFounder) {
    await User.create([
      { name: 'Haithem', email: 'haithem@elnadjah.com', password: 'elnadjah2024', role: 'founder' },
      { name: 'Fouad', email: 'fouad@elnadjah.com', password: 'elnadjah2024', role: 'founder' },
    ]);
    console.log('✓ Founders created');
  }

  // Lithuania destination
  const existing = await Destination.findOne({ code: 'LT' });
  if (!existing) {
    await Destination.create({
      name: 'Lithuania',
      code: 'LT',
      flag: '🇱🇹',
      isActive: true,
      pipelineStages: [
        {
          name: 'Document Collection',
          order: 0,
          color: '#3B82F6',
          description: 'Collect all required documents from the student',
          checklist: [
            { label: 'Request passport copy from student', type: 'action', isMandatory: true, order: 0 },
            { label: 'Request BAC certificate and transcripts', type: 'action', isMandatory: true, order: 1 },
            { label: 'Request CV and motivation letter', type: 'action', isMandatory: true, order: 2 },
            { label: 'Initiate PCC request process with student', type: 'action', isMandatory: true, order: 3 },
            { label: 'Verify all document copies are clear and complete', type: 'verification', isMandatory: true, order: 4 },
          ],
        },
        {
          name: 'PCC & Legalization',
          order: 1,
          color: '#8B5CF6',
          description: 'Police Clearance Certificate and double legalization process',
          checklist: [
            { label: 'Confirm PCC has been obtained from Ministry of Justice', type: 'verification', isMandatory: true, order: 0 },
            { label: 'Guide student through MFA legalization (Step 1)', type: 'action', isMandatory: true, order: 1 },
            { label: 'Send PCC to Polish embassy (Step 2)', type: 'action', isMandatory: true, order: 2 },
            { label: 'Confirm receipt from Lithuanian MFA (Step 3)', type: 'verification', isMandatory: true, order: 3 },
            { label: 'Legalized PCC received and verified', type: 'verification', isMandatory: true, order: 4 },
          ],
        },
        {
          name: 'University Application',
          order: 2,
          color: '#10B981',
          description: 'Select university, submit application, and get acceptance',
          checklist: [
            { label: 'Select university and program for student', type: 'action', isMandatory: true, order: 0 },
            { label: 'Submit application and pay application fee', type: 'action', isMandatory: true, order: 1 },
            { label: 'Prepare student for motivational interview', type: 'action', isMandatory: true, order: 2 },
            { label: 'Confirm student attended motivational interview', type: 'verification', isMandatory: true, order: 3 },
            { label: 'Conditional acceptance received from university', type: 'verification', isMandatory: true, order: 4 },
            { label: 'Student paid first tuition installment', type: 'verification', isMandatory: true, order: 5 },
            { label: 'Final acceptance and mediation code received — record expiry date!', type: 'verification', isMandatory: true, order: 6 },
          ],
        },
        {
          name: 'MIGRIS Application',
          order: 3,
          color: '#F59E0B',
          description: 'Lithuanian immigration system TRP application',
          checklist: [
            { label: 'VERIFY: mediation code is still valid before proceeding', type: 'verification', isMandatory: true, order: 0 },
            { label: 'Student fills TRP application on MIGRIS system', type: 'action', isMandatory: true, order: 1 },
            { label: 'All documents uploaded on MIGRIS', type: 'verification', isMandatory: true, order: 2 },
            { label: 'Proof of funds confirmed (min €1,153/month)', type: 'verification', isMandatory: true, order: 3 },
            { label: 'Health insurance confirmed', type: 'verification', isMandatory: true, order: 4 },
            { label: 'Proof of accommodation confirmed', type: 'verification', isMandatory: true, order: 5 },
            { label: 'VFS appointment booked', type: 'action', isMandatory: true, order: 6 },
          ],
        },
        {
          name: 'VFS Appointment',
          order: 4,
          color: '#EF4444',
          description: 'VFS Global appointment — document submission',
          checklist: [
            { label: 'Remind student of VFS appointment date and location', type: 'student_notification', isMandatory: true, order: 0 },
            { label: 'Confirm student has all original documents for VFS', type: 'verification', isMandatory: true, order: 1 },
            { label: 'Student attended VFS appointment', type: 'verification', isMandatory: true, order: 2 },
            { label: 'Migration Department online interview completed (within 5 days)', type: 'verification', isMandatory: true, order: 3 },
            { label: 'Remind student: MAXIMUM €1,000 cash allowed at Algerian airport', type: 'student_notification', isMandatory: true, order: 4 },
          ],
        },
        {
          name: 'TRP & Travel',
          order: 5,
          color: '#06B6D4',
          description: 'TRP card collection and pre-departure preparation',
          checklist: [
            { label: 'TRP approved — notify student', type: 'student_notification', isMandatory: true, order: 0 },
            { label: 'Student collected TRP card at VFS', type: 'verification', isMandatory: true, order: 1 },
            { label: 'Pre-departure briefing done with student', type: 'action', isMandatory: true, order: 2 },
            { label: 'Remind student: max €1,000 cash, pack all documents', type: 'student_notification', isMandatory: true, order: 3 },
            { label: 'Airport pickup arranged (if applicable)', type: 'action', isMandatory: false, order: 4 },
            { label: 'Student arrived and settled — case complete', type: 'verification', isMandatory: true, order: 5 },
          ],
        },
      ],
      documentDefinitions: [
        { name: 'Passport', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_SIMPLE, order: 0 },
        { name: 'BAC Certificate', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_FULL, order: 1 },
        { name: 'University Transcripts', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_FULL, order: 2 },
        { name: 'CV (Curriculum Vitae)', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_SIMPLE, order: 3 },
        { name: 'Motivation Letter', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_SIMPLE, order: 4 },
        { name: 'Language Certificate', isRequired: false, statusFlow: DOCUMENT_STATUS_FLOW_SIMPLE, order: 5 },
        { name: 'PCC (Police Clearance Certificate)', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_FULL, order: 6 },
        { name: 'Proof of Funds (€1,153/month)', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_SIMPLE, order: 7 },
        { name: 'Health Insurance', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_SIMPLE, order: 8 },
        { name: 'Proof of Accommodation', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_SIMPLE, order: 9 },
        { name: 'University Final Acceptance Letter', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_SIMPLE, order: 10 },
        { name: 'Mediation Code', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_SIMPLE, order: 11 },
        { name: 'MIGRIS Application Confirmation', isRequired: true, statusFlow: DOCUMENT_STATUS_FLOW_SIMPLE, order: 12 },
      ],
    });
    console.log('✓ Lithuania destination created');
  }

  const lithuania = await Destination.findOne({ code: 'LT' });
  if (lithuania) {
    await KBArticle.findOneAndUpdate(
      { type: 'destination', title: 'Lithuania — Master Knowledge Base' },
      {
        $set: {
          type: 'destination',
          status: 'published',
          title: 'Lithuania — Master Knowledge Base',
          destinationRef: lithuania._id,
          destinationName: lithuania.name,
          countryCode: lithuania.code,
          flag: lithuania.flag,
          overview: `
            <h2>Country Overview</h2>
            <p><strong>Official Name:</strong> Republic of Lithuania</p>
            <p><strong>Capital:</strong> Vilnius</p>
            <p><strong>Population:</strong> ~2.9 million people</p>
            <p><strong>Currency:</strong> Euro (€)</p>
            <p><strong>Region:</strong> Northern Europe (Baltic States)</p>
            <p><strong>European Union:</strong> Yes</p>
            <p><strong>Schengen Area:</strong> Yes</p>
            <p><strong>NATO:</strong> Yes</p>

            <h2>Why Students Choose Lithuania</h2>
            <ol>
              <li><strong>Europe + Schengen</strong> - students receive a Lithuanian residence permit and can travel within the Schengen area according to the applicable rules.</li>
              <li><strong>Affordable compared to Western Europe</strong> - typical tuition is about €3,000-€5,000/year for bachelor programmes and €4,000-€9,000/year for master programmes, depending on the university and programme.</li>
              <li><strong>English-taught programmes</strong> - Lithuania offers 500+ English-taught programmes.</li>
              <li><strong>Modern EU country</strong> - safe, digital services, modern infrastructure, and a stable economy.</li>
            </ol>

            <h2>Main Student Cities</h2>
            <h3>Vilnius</h3>
            <p><strong>Positioning:</strong> Best city overall.</p>
            <p><strong>Advantages:</strong> Capital, largest city, most international students, most jobs, most universities, and the biggest startup ecosystem.</p>
            <p><strong>Major sectors:</strong> IT, fintech, business services, startups. Vilnius generates over 40% of Lithuania's GDP.</p>
            <p><strong>Universities:</strong> Vilnius University, Vilnius Gediminas Technical University, Vilniaus kolegija, SMK College of Applied Sciences, Mykolas Romeris University.</p>

            <h3>Kaunas</h3>
            <p><strong>Positioning:</strong> Best student city.</p>
            <p><strong>Advantages:</strong> Lower living costs than Vilnius, strong student atmosphere, and a strong engineering and technology reputation.</p>
            <p><strong>Major universities:</strong> Kaunas University of Technology, Vytautas Magnus University, Kauno kolegija, SMK College of Applied Sciences.</p>

            <h3>Klaipėda</h3>
            <p><strong>Positioning:</strong> Budget-friendly coastal city.</p>
            <p><strong>Advantages:</strong> Baltic Sea, lower rent, smaller and quieter environment.</p>
            <p><strong>Good for:</strong> Tourism, business, and students preferring smaller cities.</p>

            <h2>Lithuanian Higher Education System</h2>
            <p><strong>Universities:</strong> VU, KTU, MRU, VMU, VILNIUS TECH. Focus: academic, research, theory.</p>
            <p><strong>Universities of Applied Sciences / Colleges:</strong> VIKO, SMK, KVK. Focus: practical skills, industry-oriented learning, internships.</p>
            <p>This distinction is important for sales agents.</p>

            <h2>Strongest Universities</h2>
            <p><strong>Vilnius University:</strong> Founded in 1579, oldest university in Lithuania, largest university, top-ranked nationally, and among the world's top 500 universities according to QS.</p>
            <p><strong>Kaunas University of Technology:</strong> Known for engineering, IT, technology, and cybersecurity. Very popular among international students.</p>
            <p><strong>Vilnius Gediminas Technical University:</strong> Known for engineering, architecture, aviation, and technology. Around 20% international students from 80+ countries.</p>

            <h2>Most Popular Fields Among Algerians</h2>
            <p>Business, International Business, Management, Marketing, Technology, Software Engineering, Computer Science, Cyber Security, Information Systems, Tourism, Tourism Management, Hospitality, Health, Nursing, Medicine, and Pharmacy.</p>

            <h2>Cost of Living</h2>
            <p><strong>Budget student estimate:</strong> €500-€800/month is a common estimate for living costs.</p>
            <p><strong>Accommodation:</strong> Dorm €100-€250, shared apartment €150-€350, private apartment €300-€700+ depending on the city.</p>

            <h2>Climate</h2>
            <p><strong>Winter:</strong> typically -5°C to 0°C.</p>
            <p><strong>Summer:</strong> 20-30°C.</p>
            <p>Many Algerian students arrive without proper winter clothing.</p>

            <h2>Employment Market</h2>
            <p><strong>Strong sectors:</strong> IT, software, cybersecurity, data, fintech.</p>
            <p>Vilnius is one of the strongest fintech hubs in the region.</p>
            <p><strong>Shared service centers:</strong> customer support, operations, business administration, logistics, warehousing, transport.</p>

            <h2>Positioning Against Other Destinations</h2>
            <p><strong>Lithuania vs France:</strong> faster admissions, more English programmes, lower costs, and a simpler university application process. Trade-offs: smaller country and a smaller Algerian community.</p>
            <p><strong>Lithuania vs Germany:</strong> easier admission, easier application process, and less bureaucracy. Trade-off: lower international reputation than top German universities.</p>
            <p><strong>Lithuania vs Canada:</strong> much cheaper, faster process, and Schengen access. Trade-off: smaller labour market.</p>

            <h2>Internal Sales Positioning</h2>
            <p><strong>Budget-conscious student:</strong> Lithuania.</p>
            <p><strong>Wants English studies:</strong> Lithuania.</p>
            <p><strong>Wants Europe quickly:</strong> Lithuania.</p>
            <p><strong>Wants IT/Cybersecurity:</strong> Lithuania.</p>
            <p><strong>Wants Medicine:</strong> consider Lithuania, but only specific universities such as Lithuanian University of Health Sciences, where medicine tuition is significantly higher than business programmes.</p>
          `,
          faqs: [
            {
              question: 'Why is Lithuania a good choice for Algerian students?',
              answer: 'It combines Schengen access, English-taught programmes, lower costs than Western Europe, and a simpler admissions process.'
            },
            {
              question: 'Which city should students choose first?',
              answer: 'Vilnius is the best overall city, while Kaunas is often the best student city for lower costs and a strong student atmosphere.'
            },
            {
              question: 'Is Lithuania suitable for IT and cybersecurity?',
              answer: 'Yes. The strongest sectors include IT, software, cybersecurity, data, and fintech.'
            },
            {
              question: 'What budget should we quote to students?',
              answer: 'A common estimate is about €500-€800 per month for living costs, depending on the city and accommodation type.'
            },
            {
              question: 'How should we position Lithuania against France or Germany?',
              answer: 'Emphasize faster admissions, more English programmes, lower cost, and less bureaucracy.'
            },
          ],
          steps: [
            { title: 'Profile the student', description: 'Confirm budget, language preference, field of study, and target city.' },
            { title: 'Recommend the right city and institution type', description: 'Match Vilnius, Kaunas, or Klaipėda to the student profile, and distinguish between universities and colleges.' },
            { title: 'Explain tuition and living costs', description: 'Set expectations early using realistic tuition and accommodation ranges.' },
            { title: 'Check program language and admission fit', description: 'Prioritize English-taught programmes and confirm the applicant can meet the requirements.' },
            { title: 'Position the destination competitively', description: 'Use the France, Germany, and Canada comparisons when the student needs a clear decision framework.' },
          ],
          deadlines: [
            { label: 'Application timing', date: '', notes: 'Confirm the university-specific intake and deadline before promising a timeline.' },
            { label: 'Document preparation', date: '', notes: 'Advise students to prepare winter clothing and proof of funds early.' },
          ],
          requiredDocuments: [
            { name: 'Passport', notes: 'Must be valid for the full process.' },
            { name: 'BAC certificate and transcripts', notes: 'Usually required for admission.' },
            { name: 'CV and motivation letter', notes: 'Commonly requested by universities.' },
            { name: 'English proficiency evidence', notes: 'Where required by the programme.' },
            { name: 'Proof of funds', notes: 'Needed for the residence permit stage.' },
          ],
          financialRequirements: 'Typical tuition ranges are about €3,000-€5,000/year for bachelor programmes and €4,000-€9,000/year for master programmes, depending on the university and programme. A common living-cost estimate is €500-€800/month. Accommodation is usually around €100-€250 for dorms, €150-€350 for shared apartments, and €300-€700+ for private apartments depending on the city.',
          commonMistakes: [
            'Treating universities and colleges as the same category.',
            'Selling Vilnius, Kaunas, and Klaipėda with the same positioning.',
            'Ignoring winter preparation and cost-of-living expectations.',
            'Promising medicine without checking the exact university and tuition.',
            'Forgetting to qualify the student for English-taught programmes and documentation requirements.',
          ],
          agentTips: `
            <p><strong>Short positioning line:</strong> Lithuania is the best budget-friendly Schengen option for students who want English studies, fast admissions, and practical European value.</p>
            <p><strong>Lead with fit:</strong> Budget-conscious, English-taught, Europe quickly, IT/cybersecurity, or medicine at selected institutions.</p>
            <p><strong>Be precise:</strong> Always separate universities from colleges and explain city choices using the student's budget and lifestyle.</p>
          `,
          lastUpdatedByName: 'Seed Script',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('✓ Lithuania knowledge base article upserted');
  }

  if (lithuania) {
    await KBArticle.findOneAndUpdate(
      { type: 'university', title: 'SMK — Master Profile' },
      {
        $set: {
          type: 'university',
          status: 'published',
          title: 'SMK — Master Profile',
          destinationRef: lithuania._id,
          destinationName: lithuania.name,
          countryCode: lithuania.code,
          flag: lithuania.flag,
          universityName: 'SMK College of Applied Sciences (Socialinių mokslų kolegija)',
          city: 'Vilnius / Kaunas / Klaipėda',
          programs: [
            { name: 'International Business', tuitionFee: 3800, language: 'English' },
            { name: 'Business Creation and Management', tuitionFee: 3800, language: 'English' },
            { name: 'Future Business and Artificial Intelligence', tuitionFee: 3800, language: 'English' },
            { name: 'Project Management', tuitionFee: 3800, language: 'English' },
            { name: 'Tourism and Recreation', tuitionFee: 3800, language: 'English' },
            { name: 'Event Management', tuitionFee: 3800, language: 'English' },
            { name: 'Programming and Multimedia', tuitionFee: 4400, language: 'English' },
            { name: 'Information and Cyber Security', tuitionFee: 4400, language: 'English' },
            { name: 'Computer Games and Animation', tuitionFee: 4400, language: 'English' },
            { name: 'Video Production and Media', tuitionFee: 4500, language: 'English' },
            { name: 'Digital Communication', tuitionFee: 3800, language: 'English' },
            { name: 'General Practice Nursing', tuitionFee: 4200, language: 'English' },
          ],
          intakes: [
            {
              semester: 'Fall Intake',
              applicationDeadline: '',
              startDate: '',
              notes: 'Applications open early in the year. Semester starts in September. Non-EU deadline is usually around July 1.'
            },
            {
              semester: 'Spring Intake',
              applicationDeadline: '',
              startDate: '',
              notes: 'Applications open in September. Semester starts in February. Non-EU deadline is usually around December 1.'
            },
          ],
          applicationRequirements: `
            <h2>Admission Requirements</h2>
            <p><strong>Secondary education:</strong> required.</p>
            <p><strong>Minimum academic profile:</strong> around 50% overall for many programmes.</p>
            <p><strong>Common required subjects for business programmes:</strong> Mathematics and English.</p>
            <p><strong>Accepted English tests:</strong> IELTS 5.5+, TOEFL 69+, PTE 59+, Duolingo 110+, or LanguageCert B2+.</p>
            <p><strong>SMK English test:</strong> available for around €50.</p>
            <p><strong>Interview:</strong> every applicant should expect a motivation interview of around 15 minutes. It is scored and evaluates English level, motivation, understanding of the programme, understanding of Lithuania, future goals, and communication ability.</p>
            <p><strong>Important tuition rule:</strong> for non-EU students requiring TRP, SMK states the full first-year tuition fee must be paid before the mediation code is issued.</p>
          `,
          admissionProfile: `
            <h2>SMK Positioning</h2>
            <p><strong>Compared with VIKO:</strong> SMK is private, more marketing-focused, stronger on practical learning, easier to communicate with international students, and has a more flexible admission approach. VIKO is public, more established in public reputation, and usually lower tuition.</p>

            <h2>Campuses</h2>
            <h3>Vilnius</h3>
            <p>Largest demand. Best for business, marketing, communication, IT, and media. Capital city, most international students, more jobs, better networking, and a better startup ecosystem.</p>
            <h3>Kaunas</h3>
            <p>Cheaper than Vilnius and a strong student city with a technology ecosystem. Good for IT, AI, programming, games, and business.</p>
            <h3>Klaipėda</h3>
            <p>Cheapest city, coastal environment, smaller and quieter. Good for tourism, business, and students wanting lower costs.</p>

            <h2>Programmes That Matter for Algerian Students</h2>
            <p><strong>Most popular / budget-friendly:</strong> International Business, Business Creation and Management, Future Business and Artificial Intelligence, Project Management, Tourism and Recreation, Event Management, Digital Communication.</p>
            <p><strong>Technology focus:</strong> Programming and Multimedia, Information and Cyber Security, Computer Games and Animation.</p>
            <p><strong>Media focus:</strong> Video Production and Media is the most expensive SMK programme.</p>
            <p><strong>Health:</strong> General Practice Nursing is one of the strongest employment-oriented programmes.</p>

            <h2>Internal Sales Notes</h2>
            <p>Use SMK when the student wants a private college with practical learning, easier communication, and flexible admissions. It is a strong fit for business, cybersecurity, programming, digital communication, and nursing. For non-EU applicants, emphasize that first-year tuition must be paid before mediation code issuance.</p>
          `,
          processingTime: 'SMK states a normal admission file can be processed in roughly one month if documents are complete.',
          internalNotes: `
            <h2>Strongest Selling Programmes</h2>
            <p>International Business, Future Business and AI, Information and Cyber Security, Programming &amp; Multimedia, and Project Management.</p>
            <h2>Programmes That Generate Curiosity</h2>
            <p>Future Business &amp; AI, Cyber Security, Digital Communication.</p>
            <h2>Most Budget-Friendly Choice</h2>
            <p>Business programmes at about €3,800/year.</p>
            <h2>Highest Tuition</h2>
            <p>Video Production &amp; Media at about €4,500/year.</p>
            <h2>Agent Reminder</h2>
            <p>For non-EU students, the full first-year tuition must be paid before the mediation code is issued. This is operationally important and should be explained early.</p>
          `,
          lastUpdatedByName: 'Seed Script',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('✓ SMK knowledge base article upserted');
  }

  console.log('\n✅ Seed complete!');
  console.log('Login credentials:');
  console.log('  haithem@elnadjah.com / elnadjah2024');
  console.log('  fouad@elnadjah.com / elnadjah2024');
  console.log('\n⚠️  Change passwords after first login!');
  await mongoose.disconnect();
}

seed().catch(console.error);
