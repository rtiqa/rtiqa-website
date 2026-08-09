import { ProductItem, SolutionItem, AiCapability, BlogPost, ValueItem, PartnerOrg } from '../types';

export const productsData: ProductItem[] = [
  {
    id: 'rtiqa-core',
    nameEn: 'Rtiqa Core',
    nameAr: 'رتقاء كور',
    category: 'Infrastructure',
    taglineEn: 'The Enterprise Digital Operating Foundation',
    taglineAr: 'البنية الأساسية والتشغيلية الرقمية للمؤسسات',
    descriptionEn: 'Unified identity, cloud security, multi-tenant directory, data fabric, and system integration bus engineered for global education systems.',
    descriptionAr: 'منظومة موحدة للهوية والشبكات، الأمان السحابي، ودليل بيانات شامل ومحرك ربط ذكي صُمم خصيصاً للمؤسسات التعليمية الشاملة.',
    featuresEn: [
      'Multi-tenant Cloud Architecture',
      'Unified Identity & SSO (SAML, OAuth2, OpenID)',
      'Global Data Fabric & Enterprise Bus',
      'SOC2 & GDPR Compliant Security'
    ],
    featuresAr: [
      'بنية سحابية متقدمة متعددة المستأجرين',
      'هوية موحدة وتسجيل الدخول الموحد (SAML, OAuth2, OpenID)',
      'نسيج بيانات شامل وربط مؤسسي',
      'حماية متوافقة مع معايير الأمان العالمية SOC2 و GDPR'
    ],
    icon: 'Cpu',
    badge: 'Foundation',
    statusEn: 'Core Architecture',
    statusAr: 'البنية الأساسية'
  },
  {
    id: 'rtiqa-school',
    nameEn: 'Rtiqa School',
    nameAr: 'رتقاء المدارس',
    category: 'Operations',
    taglineEn: 'Intelligent School Operations & ERP',
    taglineAr: 'إدارة وتخطيط العمليات المدرسية الذكية',
    descriptionEn: 'Next-generation administrative suite covering admissions, attendance, scheduling, staffing, finance, and facilities with real-time AI automation.',
    descriptionAr: 'منظومة إدارية شاملة للقبول، الحضور، الجدول المدرسي، الموارد البشرية، والعمليات المالية مع أتمتة تدفقات العمل بالذكاء الاصطناعي.',
    featuresEn: [
      'Dynamic AI Timetable Generator',
      'Automated Attendance & Micro-tracking',
      'Integrated Finance & Tuition Engine',
      'Facility & Transport Management'
    ],
    featuresAr: [
      'توليد الجداول المدرسية بذكاء اصطناعي محلي',
      'أتمتة تسجيل وتتبع الحضور والغياب',
      'إدارة المالية والمصروفات الدراسية',
      'إدارة المرافق والحافلات المدرسية'
    ],
    icon: 'Building2',
    badge: 'Coming Soon',
    statusEn: 'Roadmap / Coming Soon',
    statusAr: 'قادم قريباً / خريطة الطريق'
  },
  {
    id: 'rtiqa-lms',
    nameEn: 'Rtiqa LMS',
    nameAr: 'رتقاء LMS',
    category: 'Learning',
    taglineEn: 'Adaptive Learning Experience Platform',
    taglineAr: 'منصة تجربة التعلم التكيفي',
    descriptionEn: 'Interactive learning management system featuring immersive course creation, hybrid classrooms, gamified learning paths, and automated grading.',
    descriptionAr: 'منصة تعلم تفاعلية تدعم إنشاء الفصول، الفصول الهجينة، مسارات التعلم التكيفية، والتقييم الآلي المتقدم للواجبات.',
    featuresEn: [
      'Adaptive Learning Pathways',
      'Multimedia Assessment Engine',
      'Real-time Classroom Interaction',
      'SCORM & LTI Standard Support'
    ],
    featuresAr: [
      'مسارات التعلم التكيفي',
      'محرك تقييم متعدد الوسائط والأسئلة',
      'تفاعل مباشر وحي في الفصل الدراسي',
      'دعم معايير SCORM و LTI العالمية'
    ],
    icon: 'GraduationCap',
    badge: 'Coming Soon',
    statusEn: 'Roadmap / Coming Soon',
    statusAr: 'قادم قريباً / خريطة الطريق'
  },
  {
    id: 'rtiqa-ai',
    nameEn: 'Rtiqa AI Engine',
    nameAr: 'محرك رتقاء الذكي',
    category: 'Artificial Intelligence',
    taglineEn: 'Cognitive Intelligence Layer for Education',
    taglineAr: 'طبقة الذكاء الاصطناعي التكيفي للمؤسسات',
    descriptionEn: 'Proprietary AI intelligence stack powering real-time tutoring, automated lesson design, institutional RAG knowledge retrieval, and predictive analytics.',
    descriptionAr: 'منظومة ذكاء اصطناعي سيادية توفر المساعد الذكي للمعلمين، والمعلّم الذكي للطلاب، واسترجاع المعرفة المؤسسية عبر الاسترجاع المعزز بالتوليد (RAG)، والتحليلات التنبؤية.',
    featuresEn: [
      'Generative Lesson & Curriculum Assistant',
      'Student Cognitive Tutor & Diagnostic Assistant',
      'Institutional Document RAG Search',
      'Automated Rubric & Open-ended Essay Grading'
    ],
    featuresAr: [
      'مساعد توليد الدروس والمناهج والمحتوى',
      'المعلّم الذكي المعرفي والمساعد التشخيصي للطالب',
      'استرجاع المعرفة المؤسسية عبر الاسترجاع المعزز بالتوليد (RAG)',
      'التصحيح الآلي المتقدم للأسئلة المقالية'
    ],
    icon: 'Sparkles',
    badge: 'Core AI',
    statusEn: 'Core Engine Live',
    statusAr: 'المحرك الأساسي نشط'
  },
  {
    id: 'rtiqa-teacher',
    nameEn: 'Rtiqa Teacher',
    nameAr: 'رتقاء للمعلم',
    category: 'Empowerment',
    taglineEn: 'AI Co-pilot for Educators',
    taglineAr: 'المساعد الذكي الفائق للإنتاجية والتدريس',
    descriptionEn: 'Empowering teachers with instant AI lesson planning, automated quiz generation, student progress alerts, and personalized intervention blueprints.',
    descriptionAr: 'تمكين للمعلمين بالأدوات الذكية لإعداد الدروس والاختبارات في ثوانٍ، وتتبع سلوك وأداء الطلاب وخطط الدعم.',
    featuresEn: [
      '1-Click Lesson Plan Builder',
      'Automated Quiz & Assessment Creator',
      'Classroom Engagement Monitoring',
      'Personalized Feedback Generator'
    ],
    featuresAr: [
      'بناء التحضير والخطط الدراسية بضغطة زر',
      'إنشاء بنوك الأسئلة والاختبارات التكيفية',
      'متابعة تفاعل الفصل والتنبيهات المباشرة',
      'توليد التغذية الراجعة التكيفية للطلاب'
    ],
    icon: 'UserCheck',
    badge: 'Coming Soon',
    statusEn: 'Roadmap / Coming Soon',
    statusAr: 'قادم قريباً / خريطة الطريق'
  },
  {
    id: 'rtiqa-student',
    nameEn: 'Rtiqa Student',
    nameAr: 'رتقاء للطالب',
    category: 'Experience',
    taglineEn: 'Autonomous & Personalized Learning Workspace',
    taglineAr: 'مساحة التعلم الذاتي والتفوق للطلاب',
    descriptionEn: 'Student-centric space with 24/7 AI learning companion, mastery streaks, skill gap analysis, and interactive study flashcards.',
    descriptionAr: 'بيئة تعلم متكاملة تزود الطالب بـ المعلّم الذكي المتوفر على مدار الساعة 24/7، وتحليل الثغرات الدراسية، وبطاقات استذكار تفاعلية.',
    featuresEn: [
      '24/7 Interactive Socratic AI Tutor',
      'Personalized Knowledge Map & Mastery Trajectory',
      'Gamified Study Quests & Badges',
      'Multi-modal Study Note Summarizer'
    ],
    featuresAr: [
      'المعلّم الذكي السقراطي التفاعلي على مدار الساعة 24/7',
      'خريطة المعرفة المخصصة ومسار الإتقان',
      'مهام استذكار تفاعلية ونقاط إنجاز',
      'ملخصات ذكية متعددة الوسائط للمواد'
    ],
    icon: 'BookOpen',
    badge: 'Coming Soon',
    statusEn: 'Roadmap / Coming Soon',
    statusAr: 'قادم قريباً / خريطة الطريق'
  },
  {
    id: 'rtiqa-parent',
    nameEn: 'Rtiqa Parent',
    nameAr: 'رتقاء ولي الأمر',
    category: 'Engagement',
    taglineEn: 'Complete Transparency & School Connection',
    taglineAr: 'منظومة الشفافية والمتابعة لأولياء الأمور',
    descriptionEn: 'Direct window for parents into academic milestones, attendance, behavioral insights, teacher messaging, and seamless fee management.',
    descriptionAr: 'نافذة موحدة تمنح ولي الأمر شفافية كاملة على تحصيل أبنائه، الحضور، التقارير السلوكية، والتواصل المباشر مع المدرسة.',
    featuresEn: [
      'Real-time Grade & Attendance Feed',
      'Direct School & Teacher Messaging',
      'AI Digest of Student Weekly Growth',
      'One-tap Digital Tuition & Fee Payments'
    ],
    featuresAr: [
      'تحديثات فورية للدرجات والحضور',
      'قناة تواصل موحدة مع إدارة المدرسة والمعلمين',
      'ملخص أسبوعي موجه بالذكاء الاصطناعي لتطور الطالب',
      'دفع الرسوم المدرسية الرقمية بضغطة واحدة'
    ],
    icon: 'Users',
    badge: 'Coming Soon',
    statusEn: 'Roadmap / Coming Soon',
    statusAr: 'قادم قريباً / خريطة الطريق'
  },
  {
    id: 'rtiqa-analytics',
    nameEn: 'Rtiqa Analytics',
    nameAr: 'تحليلات رتقاء',
    category: 'Intelligence',
    taglineEn: 'Institutional Business Intelligence & Predictive Science',
    taglineAr: 'الذكاء المؤسسي والتحليل التنبئي المتقدم',
    descriptionEn: 'Executive intelligence platform consolidating academic trends, operational efficiency metrics, financial health, and drop-out prediction models.',
    descriptionAr: 'لوحات قيادة تنفيذية للقيادات والمدراء لقياس مؤشرات الأداء، النجاح الأكاديمي، الكفاءة التشغيلية والتنبؤ بالخطر المبكر.',
    featuresEn: [
      'Executive Dashboards & KPI Tracking',
      'Predictive Student Retention Algorithms',
      'Resource Utilization Analytics',
      'Automated Ministry & Accreditation Reports'
    ],
    featuresAr: [
      'لوحات تحكم استراتيجية للقيادة التعليمية',
      'خوارزميات التنبؤ بالتعثر الأكاديمي المبكر',
      'تحليلات كفاءة استخدام الموارد والميزانيات',
      'توليد التقارير المعتمدة للجهات الرسمية'
    ],
    icon: 'BarChart3',
    badge: 'Core Analytics',
    statusEn: 'Core Analytics',
    statusAr: 'التحليلات الأساسية'
  },
  {
    id: 'rtiqa-developer',
    nameEn: 'Rtiqa Developer',
    nameAr: 'رتقاء للمطورين',
    category: 'Extensibility',
    taglineEn: 'Open APIs, SDKs & App Ecosystem',
    taglineAr: 'منصة المطورين والربط البرمجي الشامل',
    descriptionEn: 'Extensible ecosystem enabling third-party developers, EdTech startups, and internal IT teams to extend and build custom workflows upon Rtiqa.',
    descriptionAr: 'بيئة برمجية مفتوحة تمكّن الشركات التقنية والشركاء من بناء تطبيقات ودمج حلول جديدة على البنية الرقمية لـ Rtiqa.',
    featuresEn: [
      'GraphQL & RESTful OpenAPI Specifications',
      'Webhooks & Event Stream Integrations',
      'JavaScript, Python & Mobile SDKs',
      'Developer Marketplace & Sandbox'
    ],
    featuresAr: [
      'واجهات برمجة التطبيقات RESTful & GraphQL',
      'دعم الـ Webhooks والأحداث المباشرة',
      'مكتبات ربط باللغات الحديثة (Python, JS, Swift)',
      'بيئة اختبار تجريبية للمطورين Marketplace'
    ],
    icon: 'Code2',
    badge: 'Developer Beta',
    statusEn: 'Developer Beta',
    statusAr: 'تجريبي للمطورين'
  }
];

export const solutionsData: SolutionItem[] = [
  {
    id: 'schools',
    targetEn: 'K-12 Schools & School Networks',
    targetAr: 'المدارس ومجمعات المدارس',
    titleEn: 'Complete Digital Infrastructure for School Excellence',
    titleAr: 'بنية رقمية متكاملة لتميز وتحول المدارس',
    descriptionEn: 'Unify administration, academic delivery, parent engagement, and operational compliance into a single intelligent cloud platform.',
    descriptionAr: 'توحيد جميع العمليات الإدارية، الأكاديمية، التواصل مع أولياء الأمور والامتثال في منصة سحابية ذكية واحدة.',
    benefitsEn: [
      'Up to 60% reduction in administrative overhead',
      'Instant AI timetable & substitution generation',
      'Unified multi-branch school management',
      'Streamlined fee collection and financial workflows'
    ],
    benefitsAr: [
      'تقليل التكاليف التشغيلية والإدارية بنسبة تصل إلى 60%',
      'توليد آلي للجداول والاحتياط في ثوانٍ',
      'إدارة موحدة لفروع المدارس والمجموعات التعليمية',
      'تحصيل مالي رقمي مبسط وتقارير محاسبية موحدة'
    ],
    icon: 'School',
    modulesEn: ['School Operations', 'Finance & Fees', 'Parent Portal', 'Staff Management'],
    modulesAr: ['إدارة العمليات المدرسية', 'المالية والرسوم', 'بوابة أولياء الأمور', 'إدارة الموظفين']
  },
  {
    id: 'higher-ed',
    targetEn: 'Educational Institutions & Colleges',
    targetAr: 'المؤسسات التعليمية والأكاديميات',
    titleEn: 'Enterprise Learning & Institutional Governance',
    titleAr: 'حوكمة المؤسسات وإدارة التعلم الأكاديمي',
    descriptionEn: 'Scale higher education delivery with accredited course management, research workflow tracking, dynamic grading, and complex credit handling.',
    descriptionAr: 'تمكين الكليات والمعاهد بالبنية الرقمية لإدارة المقررات، تتبع الأبحاث، ونظام الساعات المعتمدة والتقييم المؤسسي.',
    benefitsEn: [
      'Multi-department governance and accreditation support',
      'Complex credit hour & prerequisite engine',
      'Seamless research and thesis workflow support',
      'Enterprise analytics for institutional success'
    ],
    benefitsAr: [
      'حوكمة متعددة الأقسام والاعتماد الأكاديمي',
      'محرك متطور للساعات المعتمدة والمتطلبات',
      'دعم مسارات الأبحاث والرسائل العلمية',
      'تحليلات استراتيجية للأداء المؤسسي والاعتمادات'
    ],
    icon: 'Landmark',
    modulesEn: ['Academic Registry', 'Credit Engine', 'LMS', 'Research Hub'],
    modulesAr: ['السجل الأكاديمي', 'محرك الساعات', 'إدارة التعلم', 'مركز الأبحاث']
  },
  {
    id: 'teachers',
    targetEn: 'Teachers & Educators',
    targetAr: 'المعلمون وأعضاء الهيئة التدريسية',
    titleEn: 'Supercharge Teaching with AI Intelligence',
    titleAr: 'مضاعفة إنتاجية المعلم بفضل الذكاء الاصطناعي',
    descriptionEn: 'Free educators from tedious routine work so they can focus on inspiring students, using automated lesson planning, grading, and diagnostic insights.',
    descriptionAr: 'تفريغ المعلم من الأعباء الروتينية ليركز على إلهام وتوجيه الطلاب عبر أتمتة إعداد التحضير، التصحيح المباشر، والتشخيص.',
    benefitsEn: [
      'Save 8+ hours per week on lesson planning & test prep',
      'Instant objective and rubric-based auto-grading',
      'Automatic generation of differentiated exercises',
      'Deep diagnostic charts of classroom learning gaps'
    ],
    benefitsAr: [
      'توفير أكثر من 8 ساعات أسبوعياً من إعداد الدروس',
      'تصحيح آلي فوري مع تغذية راجعة دقيقة للطلاب',
      'توليد تمارين وأنشطة متمايزة تناسب الفروق الفردية',
      'تشخيص دقيق للفجوات التعلمية داخل الصف'
    ],
    icon: 'UserCheck',
    modulesEn: ['Lesson Creator', 'Quiz Generator', 'Grading Co-pilot', 'Class Diagnostics'],
    modulesAr: ['منشئ الدروس', 'مولد الاختبارات', 'المساعد الذكي للتصحيح', 'تشخيص الفصل']
  },
  {
    id: 'students',
    targetEn: 'Students & Autonomous Learners',
    targetAr: 'الطلاب والمتعلمون',
    titleEn: 'Adaptive, Engaging, and Future-Ready Education',
    titleAr: 'تعلم تكيفي ممتع ومستقبل واعد',
    descriptionEn: 'Provide every student with a personalized 24/7 AI tutor that adapts to their pace, learning style, and specific knowledge gaps.',
    descriptionAr: 'تزويد كل طالب بـ المعلّم الذكي المخصص على مدار الساعة 24/7 يتكيف مع نمط تعليمه، وقدراته الاستيعابية، وفجواته المهارية.',
    benefitsEn: [
      'Tailored study pathways matching individual learning styles',
      'Socratic AI guidance encouraging critical thinking',
      'Real-time feedback on homework and practice questions',
      'Gamified learning streaks and mastery indicators'
    ],
    benefitsAr: [
      'مسارات تعلم مخصصة توافق نمط وسرعة الطالب',
      'توجيه سقراطي ذكي يحفز التفكير النقدي',
      'تغذية راجعة فورية على الواجبات والتمارين',
      'وسام إنجاز وشارات تقدم تحفز التفوق المستمر'
    ],
    icon: 'Sparkles',
    modulesEn: ['Socratic Tutor', 'Mastery Hub', 'Smart Notes', 'Practice Arena'],
    modulesAr: ['المعلّم الذكي السقراطي', 'مركز الإتقان', 'الملاحظات الذكية', 'ساحة التمارين']
  },
  {
    id: 'parents',
    targetEn: 'Parents & Families',
    targetAr: 'أولياء الأمور والعائلات',
    titleEn: 'Peace of Mind & Active Academic Partnership',
    titleAr: 'الطمأنينة والشراكة التعليمية المستمرة',
    descriptionEn: 'Connect families closely to their children learning journey with actionable AI summaries, behavioral updates, and instant school updates.',
    descriptionAr: 'ربط أولياء الأمور برحلة أطفالهم التعليمية عبر تقارير ملخصة ذكية، متابعة فورية للحضور، وقنوات تواصل موحدة.',
    benefitsEn: [
      'Instant attendance and academic notifications',
      'Weekly AI digest summarizing strengths & focus areas',
      'Direct, safe messaging channel with teachers and administration',
      'Hassle-free mobile fee payment options'
    ],
    benefitsAr: [
      'إشعارات فورية بالحضور والنقاط الأكاديمية',
      'تقرير أسبوعي ذكي يلخص نقاط القوة ومجالات التحسين',
      'قناة تواصل آمنة ومباشرة مع المعلمين والإدارة',
      'دفع وتتبع الرسوم المدرسية بمرونة كاملة'
    ],
    icon: 'HeartHandshake',
    modulesEn: ['Child Dashboard', 'Weekly AI Digest', 'School Chat', 'Digital Payments'],
    modulesAr: ['لوحة الأبناء', 'الملخص الأسبوعي', 'محادثة المدرسة', 'المدفوعات الرقمية']
  },
  {
    id: 'organizations',
    targetEn: 'Education Organizations & Ministries',
    targetAr: 'المؤسسات الكبرى والجهات التعليمية',
    titleEn: 'National & Regional Education Ecosystem Digitalization',
    titleAr: 'التحول الرقمي الشامل للمنظومات التعليمية الكبرى',
    descriptionEn: 'Deploy sovereign digital education architecture capable of serving hundreds of thousands of students with full data sovereignty and deep intelligence.',
    descriptionAr: 'نشر بنية تحتية رقمية وسيادية قادرة على خدمة ملايين الطلاب والمؤسسات مع أمان متكامل وسيادة كاملة للبيانات.',
    benefitsEn: [
      'Sovereign multi-region deployment models',
      'Real-time national learning metrics & literacy heatmaps',
      'Standardized digital curriculum distribution',
      'Zero-trust security and data protection standards'
    ],
    benefitsAr: [
      'خيارات نشر سيادية سحابية أو محلياً On-Premise',
      'خرائط حرارية ومؤشرات وطنية لمستوى التعلم',
      'توزيع معتمد للمناهج والمحتوى الرقمي الموحد',
      'معايير أمان وانضباط عالية Zero-Trust'
    ],
    icon: 'Globe2',
    modulesEn: ['National Analytics', 'Curriculum Hub', 'Sovereignty Engine', 'Standard Compliance'],
    modulesAr: ['التحليلات الوطنية', 'مركز المناهج', 'محرك السيادة', 'معايير الامتثال']
  }
];

export const aiCapabilitiesData: AiCapability[] = [
  {
    id: 'ai-assistants',
    titleEn: 'Context-Aware AI Assistants',
    titleAr: 'مساعدو ذكاء اصطناعي واعون بالسياق',
    summaryEn: 'Specialized AI roles tuned for teachers, students, and administrators with role-based guardrails.',
    summaryAr: 'نماذج ذكاء اصطناعي متخصصة ومصممة لكل فئة: المعلم، الطالب، والإداري وفق صلاحيات دقيقة.',
    detailsEn: 'Rtiqa AI Assistants understand curriculum boundaries, grade level language, and regional educational standards. They provide safe, pedagogical support without generating hallucinated content.',
    detailsAr: 'يفهم مساعدو رتقاء حدود المناهج الدراسية، مستويات الاستيعاب العمرية، والمعايير التعليمية، حيث يقدمون دعماً تربوياً أميناً وواحياً تماماً دون أي هلوسات.',
    icon: 'Bot',
    tagEn: 'Generative AI',
    tagAr: 'ذكاء اصطناعي توليدي'
  },
  {
    id: 'personalized-learning',
    titleEn: 'Personalized Adaptive Pathways',
    titleAr: 'مسارات تعلم شخصية وتكيفية',
    summaryEn: 'Dynamic knowledge graphs that adjust content difficulty and practice mode in real-time.',
    summaryAr: 'الرسوم البيانية المعرفية (Knowledge Graphs) الديناميكية التي تضبط مستوى صعوبة المحتوى ونمط التمارين في الوقت الفعلي.',
    detailsEn: 'Instead of linear static textbook progression, Rtiqa continuously estimates student cognitive load and skill mastery, dynamically recommending micro-lessons and diagnostic challenges.',
    detailsAr: 'بدلاً من المسار الخطي الثابت، يقيس نظام رتقاء الحمل المعرفي ومدى إتقان المهارات لحظة بلحظة، ليقترح دروساً مصغّرة وتحديات تشخيصية تناسب كل طالب.',
    icon: 'Compass',
    tagEn: 'Adaptive Engine',
    tagAr: 'محرك تكيفي'
  },
  {
    id: 'intelligent-content',
    titleEn: 'Intelligent Content & Curriculum Synthesis',
    titleAr: 'توليد المحتوى والمناهج التفاعلية',
    summaryEn: 'Transforming plain syllabus files into rich interactive simulations, assessments, and lesson packs.',
    summaryAr: 'تحويل ملفات المناهج والنصوص الجافة إلى مفاهيم تفاعلية ورسومات توضيحية واختبارات متكاملة.',
    detailsEn: 'Educators can input core learning outcomes and immediately receive multi-modal content packs complete with rubric criteria, interactive discussion prompts, and differentiated homework options.',
    detailsAr: 'يمكن للمعلم إدخال مخرجات التعلم المستهدفة ليتلقى فوراً حزمة متكاملة تحوي معايير التقييم، أسئلة نقاش صفية، وتدريبات متمايزة لمختلف المستويات.',
    icon: 'FileCode',
    tagEn: 'Curriculum AI',
    tagAr: 'ذكاء المناهج'
  },
  {
    id: 'knowledge-systems',
    titleEn: 'Institutional Knowledge & Secure RAG',
    titleAr: 'المعرفة المؤسسية والاسترجاع المعزز بالتوليد (RAG) الآمن',
    summaryEn: 'Connect school regulations, policies, and historic archives into a searchable AI knowledge brain.',
    summaryAr: 'ربط اللوائح المدرسية، السياسات، والأرشيف التاريخي في عقل مؤسسي يجيب فوراً بدقة.',
    detailsEn: 'Rtiqa builds a private vector index of all school policies, curriculum guides, and internal documentation, enabling staff to query institutional knowledge with cited source accuracy.',
    detailsAr: 'يبني نظام رتقاء فهرس المتجهات (Vector Index) الخاص بكافة سياسات المدرسة وأدلة المناهج والوثائق الداخلية، مما يمكّن الموظفين من الاستعلام عن المعرفة المؤسسية بدقة مع إسناد المصادر.',
    icon: 'Database',
    tagEn: 'RAG & Vector Search',
    tagAr: 'فهرس المتجهات والاسترجاع المعزز بالتوليد (RAG)'
  },
  {
    id: 'automated-workflows',
    titleEn: 'Automated Workflows & Operational AI',
    titleAr: 'أتمتة تدفقات العمل والذكاء التشغيلي',
    summaryEn: 'Automating administrative handoffs, timetable substitutions, and regulatory reporting.',
    summaryAr: 'أتمتة تنقل المهام الإدارية، بدائل جدول الحصص، والتقارير التنظيمية بذكاء.',
    detailsEn: 'When a teacher registers absent, Rtiqa AI automatically recalculates room capacity, teacher workload, subject priorities, and generates substitute notification tasks within seconds.',
    detailsAr: 'عند تسجيل غياب معلم، يقوم محرك الذكاء الاصطناعي بإعادة حساب نصاب الحصص، المهارات المطلوبة، وتوليد إشعارات البدلاء المناسبين خلال ثوانٍ معدودة.',
    icon: 'Workflow',
    tagEn: 'Automation',
    tagAr: 'أتمتة ذكية'
  },
  {
    id: 'data-intelligence',
    titleEn: 'Educational Data Intelligence & Analytics',
    titleAr: 'تحليل البيانات والتنبؤ بالنجاح',
    summaryEn: 'Transforming millions of classroom data points into predictive early-warning signals.',
    summaryAr: 'تحويل ملايين نقاط البيانات اليومية إلى مؤشرات تنبؤية مبكرة لضمان تفوق الطالب.',
    detailsEn: 'By detecting subtle changes in engagement, response latency, and attendance, Rtiqa alerts guidance counselors to academic or behavioral drop-off weeks before grades decline.',
    detailsAr: 'من خلال اكتشاف التغيرات الدقيقة في تفاعل الطالب وزمن الاستجابة والحضور، ينبه النظام المرشدين الطلابيين فوراً قبل تدني درجات الطالب بوقت كافٍ.',
    icon: 'BrainCircuit',
    tagEn: 'Predictive Science',
    tagAr: 'علم البيانات التنبئي'
  }
];

export const blogPostsData: BlogPost[] = [
  {
    id: '1',
    slug: 'ai-operating-system-for-education',
    titleEn: 'Why Education Needs a Unified AI Operating System',
    titleAr: 'لماذا يحتاج التعليم إلى نظام تشغيل موحد بالذكاء الاصطناعي؟',
    excerptEn: 'How fragmented software tools hinder schools and how a true AI OS creates cohesive intelligence across administration, teaching, and learning.',
    excerptAr: 'كيف تعوق الأدوات البرمجية المشتتة تطور المدارس، وكيف يخلق نظام تشغيل الذكاء الاصطناعي بيئة مترابطة تجمع بين الإدارة والتعليم.',
    contentEn: `For the past decade, schools have been forced to stitch together a patchwork of disconnected software tools: one for attendance, one for grading, another for online quizzes, and separate apps for parent communication. This fragmentation leads to siloed data, duplicate work for teachers, and a confusing experience for families.

At **Rtiqa (رتقاء)**, we believe the next era of educational technology requires a shift from isolated applications to a **Unified AI Operating System**. 

### What is an AI Operating System for Education?

An AI Operating System is not just another LMS or administrative portal. It is an enterprise intelligence layer that connects all operational and academic facets of an institution:

1. **Shared Knowledge Infrastructure**: All student achievements, curriculum milestones, and operational data flow into a single secure knowledge graph.
2. **Contextual AI Assistance**: Teachers, students, and administrators interact with specialized AI models that share context. When a teacher creates a lesson plan, the AI student companion immediately understands the learning objectives.
3. **Automated Operational Workflows**: From timetable generation to early intervention warnings, the system anticipates needs rather than merely recording events.

By adopting a sovereign, unified AI architecture, educational institutions transform from reactive record-keepers into intelligent, predictive learning environments.`,
    contentAr: `خلال العقود الماضية، أُجبرت المدارس والمؤسسات التعليمية على التوفيق بين عشرات التطبيقات والأدوات المنفصلة: نظام للحضور، برنامج آخر للدرجات، منصة للاختبارات، وتطبيق للروبوتات والتواصل. أدى هذا التشتت إلى بيانات معزولة، وإرهاق المعلمين بالعمل المكرر، وتجربة مربكة لأولياء الأمور.

في **رتقاء (Rtiqa)**، نؤمن بأن المرحلة القادمة من تقنية التعليم تتطلب تحولاً جذرياً من التطبيقات المنعزلة إلى **نظام تشغيل ذكي وموحد بالذكاء الاصطناعي**.

### ما هو نظام التشغيل بالذكاء الاصطناعي للتعليم؟

نظام التشغيل بالذكاء الاصطناعي ليس مجرد بوابة إدارية أو نظام إدارة تعلم آخر؛ بل هو طبقة ذكاء مؤسسية ترتبط بكافة الجوانب التشغيلية والأكاديمية:

1. **بنية معرفية موحدة**: تتدفق كل إنجازات الطلاب، المخرجات التعليمية، والبيانات الإدارية إلى رسم بياني معرفي موحد وآمن.
2. **دعم متسق مع السياق**: يتفاعل المعلم والطالب والإداري مع نماذج ذكاء اصطناعي تفهم السياق الموحد. فعندما ينشئ المعلم تحضيراً، يفهم مساعد الطالب فوراً الأهداف المقررة.
3. **أتمتة العمليات التشغيلية**: بدءاً من إنشاء الجداول المدرسية إلى التنبيه بالتعثر الأكاديمي، يقوم النظام بالتنبؤ والعمل الاستباقي بدلاً من مجرد التجميع الساكن.

من خلال تبني بنية رقمية سيادية وموحدة، تتحول المؤسسات التعليمية من مراكز حفظ سجلات تقليدية إلى بيئات تعلم ذكية واستباقية.`,
    author: 'Dr. Tariq Al-Mansoor',
    authorRoleEn: 'Chief AI Officer, Rtiqa',
    authorRoleAr: 'رئيس قطاع الذكاء الاصطناعي، رتقاء',
    date: '2026-07-15',
    readTimeEn: '5 min read',
    readTimeAr: 'قراءة 5 دقائق',
    categoryEn: 'AI & Architecture',
    categoryAr: 'الذكاء الاصطناعي والبنية الرقمية',
    tags: ['AI Engine', 'Digital Transformation', 'EdTech Architecture'],
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: '2',
    slug: 'future-of-personalized-tutoring',
    titleEn: 'The Socratic AI Companion: Redefining Student Guidance',
    titleAr: 'المعلّم الذكي السقراطي: إعادة تعريف التوجيه والتعلم الذاتي',
    excerptEn: 'Why generative AI must act as a Socratic guide rather than an answer machine, building student problem-solving skills.',
    excerptAr: 'لماذا يجب أن يعمل الذكاء الاصطناعي كمرشد سقراطي يُحفّز التفكير بدلاً من إعطاء الإجابات المباشرة الجاهزة.',
    contentEn: `When generative AI first entered education, many feared it would encourage passive learning or homework shortcuts. However, when built with pedagogical intentionality, AI can become the most effective Socratic tutor ever created.

### Direct Answers vs. Socratic Scaffolding

Traditional search engines and simple chat interfaces give answers instantly. In contrast, **Rtiqa Student AI** uses Socratic scaffolding:

- **Guided Inquiry**: When a student asks "How do I solve this quadratic equation?", the AI asks "What happens if we first arrange the equation into standard form?"
- **Concept Diagnostic**: The AI evaluates whether the obstacle is algebraic manipulation or concept understanding.
- **Adaptive Mastery**: Exercises scale in difficulty based on the learner's emotional and cognitive readiness.

This approach transforms student interaction with technology, fostering critical thinking, self-efficacy, and a lifelong growth mindset.`,
    contentAr: `عندما دخل الذكاء الاصطناعي التوليدي مجال التعليم لأول مرة، خشي الكثيرون من أن يؤدي إلى التعلم السلبي أو الاعتماد الكامل في إنجاز الواجبات. ولكن عندما يُصمم الذكاء الاصطناعي بمنهجية تربوية مدروسة، يتحول إلى أعظم معلم سقراطي عرفه التاريخ.

### الإجابات المباشرة مقابل التوجيه السقراطي

تكتفي محركات البحث والدردشة العادية بإعطاء الإجابات المباشرة. وفي المقابل، يعمل **محرك رتقاء للطلاب** عبر التوجيه التدريجي:

- **الاستكشاف الموجه**: عندما يسأل الطالب "كيف أحل هذه المعادلة؟"، يجيبه المساعد: "ماذا يحدث لو قمنا بتجميع أطراف المعادلة أولاً؟"
- **تشخيص المفاهيم**: يقيم النظام ما إذا كانت الصعوبة في الأساسيات الرياضية أم في فهم القانون نفسه.
- **الإتقان التكيفي**: تتدرج الأسئلة والتمارين تلقائياً بناءً على الجاهزية الذهنية للطفل أو الشاب.

هذا المنهج يحول التفاعل مع التقنية إلى تجربة لتبني التفكير النقدي، والتحصيل الذاتي المستمر.`,
    author: 'Sarah Jenkins',
    authorRoleEn: 'Head of Educational Pedagogy',
    authorRoleAr: 'رئيسة التطوير التربوي، رتقاء',
    date: '2026-06-28',
    readTimeEn: '4 min read',
    readTimeAr: 'قراءة 4 دقائق',
    categoryEn: 'Personalized Learning',
    categoryAr: 'التعلم الشخصي والتكيفي',
    tags: ['Socratic AI', 'Student Success', 'Pedagogy'],
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: '3',
    slug: 'scaling-school-operations-globally',
    titleEn: 'Digital Infrastructure & Data Sovereignty in Modern Education',
    titleAr: 'البنية الرقمية والسيادة الوطنية للبيانات في التعليم الحديث',
    excerptEn: 'Ensuring absolute privacy, cloud security, and compliance while scaling AI platforms across international jurisdictions.',
    excerptAr: 'ضمان الخصوصية التامة والأمان السحابي والامتثال للأنظمة المحلية أثناء توسيع المنصات الذكية حول العالم.',
    contentEn: `As education systems digitize, data security and national sovereignty have moved to the center of government priorities. Educational data includes minor student records, family information, and national literacy indicators—data that demands the highest standards of protection.

### Rtiqa Security Architecture

1. **Zero-Trust Multi-Tenancy**: Complete encryption in transit and at rest with isolated tenant keys.
2. **Local Data Residence Options**: Deployable on public cloud, national sovereign clouds, or regional enterprise data centers.
3. **Granular Role-Based Control**: Fine-grained access policies preventing unauthorized disclosure while allowing authorized educators to gain deep insights.

Rtiqa proves that global scalability and strict regional compliance can co-exist harmoniously within a modern tech architecture.`,
    contentAr: `مع التحول الرقمي للتعليم، أصبحت سلامة البيانات والسيادة الرقمية الوطنية في صدارة أولويات الحكومات والمؤسسات التعليمية. تشمل البيانات التعليمية سجلات القاصرين، السلوك الدراسي، والمؤشرات الوطنية، وهي بيانات تتطلب أعلى معايير الحماية والتشفير.

### بنية الأمان في منظومة رتقاء

1. **عزل كامل Zero-Trust**: تشفير كامل للبيانات أثناء النقل والتخزين مع مفاتيح مستقلة لكل مؤسسة.
2. **خيارات استضافة سيادية**: إمكانية النشر على السحابة العالمية، السحابة الوطنية السيادية، أو مراكز البيانات الداخلية.
3. **تحكم دقيق في الصلاحيات**: سياسات وصول صارمة تمنع أي تسريب، مع إتاحة البيانات اللازمة فقط للمعلمين والإدارة.

تثبت رتقاء أن التوسع العالمي والالتزام الكامل بالأنظمة السيادية المحلية يمكن أن يعملا في تناغم تام.`,
    author: 'Omar Al-Hassan',
    authorRoleEn: 'VP of Infrastructure & Security',
    authorRoleAr: 'نائب الرئيس للبنية التحتية والأمان، رتقاء',
    date: '2026-05-19',
    readTimeEn: '6 min read',
    readTimeAr: 'قراءة 6 دقائق',
    categoryEn: 'Security & Cloud',
    categoryAr: 'الأمان والبنية السحابية',
    tags: ['Data Sovereignty', 'Cloud Security', 'Compliance'],
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80'
  }
];

export const valuesData: ValueItem[] = [
  {
    titleEn: 'Innovation',
    titleAr: 'الابتكار المستمر',
    descriptionEn: 'Pushing the boundary of AI, cloud, and pedagogical science to reshape learning.',
    descriptionAr: 'تجاوز حدود الذكاء الاصطناعي والحوسبة السحابية وعلوم التربية لإعادة رسم مستقبل التعلم.',
    icon: 'Lightbulb'
  },
  {
    titleEn: 'Intelligence',
    titleAr: 'الذكاء المؤسسي',
    descriptionEn: 'Embedding context-aware machine intelligence across every operational and academic node.',
    descriptionAr: 'دمج الذكاء الاصطناعي الواعي بالسياق في كل عنصر تشغيلي وأكاديمي للمؤسسة.',
    icon: 'Brain'
  },
  {
    titleEn: 'Accessibility',
    titleAr: 'إتاحة التقنية للجميع',
    descriptionEn: 'Designing inclusive, intuitive software that empowers every teacher, student, and admin regardless of technical background.',
    descriptionAr: 'تصميم برمجيات سهلة وشاملة تمكّن كل معلم وطالب وإداري بغض النظر عن خلفيته التقنية.',
    icon: 'HeartHandshake'
  },
  {
    titleEn: 'Scalability',
    titleAr: 'القابلية للنمو والتوسع',
    descriptionEn: 'Architected to gracefully handle individual institutions or nationwide education systems.',
    descriptionAr: 'بنية رقمية مصممة للنمو السلس بدءاً من المدرسة الواحدة وحتى المنظومات الوطنية الكبرى.',
    icon: 'TrendingUp'
  },
  {
    titleEn: 'Trust & Sovereignty',
    titleAr: 'الثقة والسيادة الرقمية',
    descriptionEn: 'Upholding uncompromising security, privacy, and local data compliance across all markets.',
    descriptionAr: 'الالتزام بأقصى درجات الأمان، الخصوصية، وحماية سيادة البيانات المحلية في كل دولة.',
    icon: 'ShieldCheck'
  },
  {
    titleEn: 'Human-Centered AI',
    titleAr: 'تقنية محورها الإنسان',
    descriptionEn: 'AI designed to augment human connection, teacher inspiration, and student empathy.',
    descriptionAr: 'ذكاء اصطناعي صُمم لتعزيز التواصل الإنساني، إلهام المعلم، ونماء الطالب.',
    icon: 'Users'
  },
  {
    titleEn: 'Global Impact',
    titleAr: 'الأثر العالمي المستدام',
    descriptionEn: 'Building solutions that set new standards for global educational quality and efficiency.',
    descriptionAr: 'بناء حلول تضع معايير عالمية جديدة لجودة وكفاءة التعليم في جميع المجتمعات.',
    icon: 'Globe'
  }
];

export const partnerOrgsData: PartnerOrg[] = [
  { name: 'Global Education Council', typeEn: 'International Authority', typeAr: 'هيئة دولية', logoText: 'GEC', regionEn: 'Global', regionAr: 'عالمي' },
  { name: 'National K-12 Federation', typeEn: 'School Network', typeAr: 'شبكة مدارس', logoText: 'NK12', regionEn: 'Middle East & North Africa', regionAr: 'الشرق الأوسط وشمال أفريقيا' },
  { name: 'Apex Higher Ed System', typeEn: 'University Alliance', typeAr: 'تحالف جامعي', logoText: 'AHES', regionEn: 'Europe', regionAr: 'أوروبا' },
  { name: 'Future Education Lab', typeEn: 'R&D Partner', typeAr: 'شريك أبحاث', logoText: 'FEL', regionEn: 'North America', regionAr: 'أمريكا الشمالية' },
  { name: 'Sovereign EdTech Cloud', typeEn: 'Cloud Infrastructure', typeAr: 'بنية سحابية', logoText: 'SEC', regionEn: 'Asia-Pacific', regionAr: 'آسيا والمحيط الهادئ' }
];

export const UI_TEXT = {
  en: {
    brandName: 'Rtiqa',
    brandNameAr: 'رتقاء',
    tagline: 'Building the AI Operating System for Education.',
    heroSubtitle: 'Rtiqa empowers schools, educational institutions, teachers, and students through a unified intelligent technology ecosystem that makes learning, management, and operations seamlessly smart and efficient.',
    exploreRtiqa: 'Explore Rtiqa',
    exploreProducts: 'Explore Products',
    getStarted: 'Get Started',
    requestDemo: 'Schedule Enterprise Demo',
    contactUs: 'Contact Rtiqa',
    learnMore: 'Learn More',
    readArticle: 'Read Article',
    tryAiPlayground: 'Try Rtiqa AI Live',
    
    // Nav items
    navHome: 'Home',
    navProducts: 'Products',
    navSolutions: 'Solutions',
    navAi: 'AI Layer',
    navAbout: 'About Us',
    navBlog: 'Insights & Blog',
    navContact: 'Contact',
    navFaq: 'FAQ & Knowledge Base',
    navCaseStudies: 'Case Studies & Pilots',
    searchPlaceholder: 'Search products, solutions, AI tools...',
    
    // Section Titles
    whatIsRtiqa: 'What is Rtiqa?',
    whatIsRtiqaSub: 'A global technology company building intelligent software, cloud architecture, and AI models designed specifically for the future of education.',
    futureOfEducation: 'The Future of Education is Intelligent',
    futureOfEducationSub: 'Education is moving beyond static textbooks and isolated tools toward interconnected cognitive ecosystems.',
    rtiqaEcosystem: 'The Rtiqa Integrated Ecosystem',
    rtiqaEcosystemSub: 'Nine interconnected intelligent modules working harmoniously under a unified enterprise operating system.',
    aiPoweredIntelligence: 'Rtiqa AI Core Architecture',
    aiPoweredIntelligenceSub: 'A sovereign intelligence layer engineered to understand educational contexts, curriculum guidelines, and administrative workflows.',
    whyRtiqa: 'Why Global Leaders Choose Rtiqa',
    globalVision: 'Global Vision, Local Sovereignty',
    globalVisionSub: 'Designed for global scalability with localized cultural, linguistic, and regulatory flexibility.',
    partnersHeader: 'Trusted by Forward-Thinking Institutions Worldwide',
    finalCtaTitle: 'Ready to Transform Your Educational Infrastructure?',
    finalCtaSub: 'Join leading schools, ministries, and educational networks partnering with Rtiqa to build the future of intelligent education.',
    
    // AI Demo Playground
    aiDemoTitle: 'Experience Rtiqa AI Engine Live',
    aiDemoSub: 'Select a scenario below or enter your own prompt to simulate how Rtiqa AI processes educational workflows in real-time.',
    runPromptBtn: 'Generate AI Insight',
    samplePrompts: [
      'Generate a 45-minute Interactive Physics Lesson Plan on Newton Laws with Rubrics',
      'Analyze student attendance anomalies for Grade 10 and suggest early support steps',
      'Create a Socratic practice quiz on Quadratic Functions for struggling math students',
      'Draft a weekly parent update summarizing class achievements and upcoming projects'
    ],
    
    // Footer & Misc
    footerDesc: 'Rtiqa (رتقاء) is a global AI & technology company building the intelligent operating system for education and enterprise digital infrastructure.',
    allRightsReserved: '© 2026 Rtiqa. All rights reserved.',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    securitySovereignty: 'Security & Sovereignty',
    developerPortal: 'Developer Portal',
    subscribeNewsletter: 'Subscribe to Global EdTech Insights',
    emailPlaceholder: 'Enter your work email address...',
    subscribeBtn: 'Subscribe',
    subscribedMsg: 'Thank you for subscribing to Rtiqa insights.',
    
    // Modal & Forms
    demoModalTitle: 'Schedule an Enterprise Rtiqa Demo',
    demoModalSub: 'Discover how Rtiqa can unify your school operations and learning ecosystem.',
    formName: 'Full Name',
    formEmail: 'Work Email',
    formOrg: 'Organization / Institution Name',
    formType: 'Organization Type',
    formRole: 'Your Role / Title',
    formSubject: 'Inquiry Subject',
    formMessage: 'Message / Project Details',
    formSend: 'Send Message to Rtiqa Team',
    formSending: 'Submitting Inquiry...',
    formSuccessTitle: 'Message Received Successfully',
    formSuccessMsg: 'Thank you for reaching out to Rtiqa. An enterprise solution specialist will contact you shortly.',
    closeModal: 'Close Window',
    
    // Org Types Options
    orgTypes: [
      'K-12 School / School Network',
      'University / Higher Ed Institution',
      'Ministry / Government Body',
      'EdTech Startup / Technology Partner',
      'Teacher / Individual Educator',
      'Investor / Enterprise Partner'
    ]
  },
  ar: {
    brandName: 'Rtiqa',
    brandNameAr: 'رتقاء',
    tagline: 'بناء نظام التشغيل بالذكاء الاصطناعي للتعليم.',
    heroSubtitle: 'تمكّن رتقاء المدارس والمؤسسات التعليمية والمعلمين والطلاب من خلال منظومة تقنية ذكية موحدة تجعل التعلم والإدارة والعمليات أكثر كفاءة وذكاءً وسهولة.',
    exploreRtiqa: 'استكشف رتقاء',
    exploreProducts: 'استكشف المنتجات',
    getStarted: 'ابدأ الآن',
    requestDemo: 'طلب عرض توضيحي للمؤسسات',
    contactUs: 'تواصل مع رتقاء',
    learnMore: 'اقرأ المزيد',
    readArticle: 'قراءة المقال بالكامل',
    tryAiPlayground: 'جرب ذكاء رتقاء مباشرة',
    
    // Nav items
    navHome: 'الرئيسية',
    navProducts: 'المنتجات',
    navSolutions: 'الحلول',
    navAi: 'طبقة الذكاء الاصطناعي',
    navAbout: 'عن رتقاء',
    navBlog: 'المقالات والأفكار',
    navContact: 'تواصل معنا',
    navFaq: 'الأسئلة الشائعة والمعرفية',
    navCaseStudies: 'قصص النجاح ودراسات الحالة',
    searchPlaceholder: 'ابحث في المنتجات، الحلول، أدوات الذكاء الاصطناعي...',
    
    // Section Titles
    whatIsRtiqa: 'ما هي شركة رتقاء (Rtiqa)؟',
    whatIsRtiqaSub: 'شركة تقنية عالمية تبني برمجيات ذكية، بنية سحابية متقدمة، ونماذج ذكاء اصطناعي مخصصة لمستقبل التعليم.',
    futureOfEducation: 'مستقبل التعليم ذكي ومترابط',
    futureOfEducationSub: 'يتجاوز التعليم المناهج التقليدية والأدوات المنعزلة نحو منظومة معرفية وتكيفية متكاملة.',
    rtiqaEcosystem: 'منظومة رتقاء المترابطة',
    rtiqaEcosystemSub: 'تسعة منتجات ذكية متكاملة تعمل بسلاسة تحت مظلة نظام تشغيل مؤسسي موحد.',
    aiPoweredIntelligence: 'البنية الأساسية لذكاء رتقاء الاصطناعي',
    aiPoweredIntelligenceSub: 'طبقة ذكاء سيادية صُممت لتدبر السياق التعليمي، المناهج الدراسية، والعمليات الإدارية.',
    whyRtiqa: 'لماذا تختار المؤسسات العالمية رتقاء؟',
    globalVision: 'رؤية عالمية وسيادة رقمية محلياً',
    globalVisionSub: 'صُممت للنمو والتوسع العالمي مع المرونة التامة للتوافق مع الأنظمة واللغات والثقافات المحلية.',
    partnersHeader: 'تحظى بثقة شبكات المدارس والمؤسسات القيادية عالمياً',
    finalCtaTitle: 'هل أنت جاهز لتحديث البنية الرقمية لمؤسستك التعليمية؟',
    finalCtaSub: 'انضم إلى المدارس الرائدة، الوزارات، والمؤسسات التي تبني مستقبل التعليم الذكي مع رتقاء.',
    
    // AI Demo Playground
    aiDemoTitle: 'تجربة مباشرة لمحرك رتقاء الذكي',
    aiDemoSub: 'اختر سيناريو أدناه أو اكتب استفسارك الخاص لتجربة كيف يعالج محرك رتقاء المهام التعليمية في الوقت الفعلي.',
    runPromptBtn: 'توليد الاستجابة الذكية',
    samplePrompts: [
      'توليد تحضير درس تفاعلي لمادة الفيزياء مدته 45 دقيقة حول قوانين نيوتن مع جدول التقييم',
      'تحليل حالات غياب طلاب الصف العاشر واقتراح خطوات دعم أكاديمي ونفسي استباقية',
      'إنشاء اختبار سقراطي تدريبي حول الدوال التربيعية للطلاب الذين يحتاجون تقوية',
      'صياغة التقرير الأسبوعي الملخص لأولياء الأمور يوضح إنجازات الفصل والمشاريع القادمة'
    ],
    
    // Footer & Misc
    footerDesc: 'شركة رتقاء (Rtiqa) هي شركة تقنية عالمية تبني نظام التشغيل الذكي للتعليم والبنية الرقمية للمؤسسات التعليمية.',
    allRightsReserved: '© 2026 رتقاء (Rtiqa). جميع الحقوق محفوظة.',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة',
    securitySovereignty: 'الأمان والسيادة الرقمية',
    developerPortal: 'بوابة المطورين',
    subscribeNewsletter: 'اشترك في النشرة البريدية التقنية',
    emailPlaceholder: 'أدخل بريدك الإلكتروني المهني...',
    subscribeBtn: 'اشتراك',
    subscribedMsg: 'شكراً لاشتراكك في النشرة البريدية لشركة رتقاء.',
    
    // Modal & Forms
    demoModalTitle: 'جدولة عرض توضيحي لمنظومة رتقاء',
    demoModalSub: 'اكتشف كيف يمكن لـ رتقاء توحيد عملياتك المدرسية وتجربة التعلم بشكل كامل.',
    formName: 'الاسم الكامل',
    formEmail: 'البريد الإلكتروني المهني',
    formOrg: 'اسم المدرسة / المؤسسة التعليمية',
    formType: 'نوع المؤسسة',
    formRole: 'المسمى الوظيفي / الدور',
    formSubject: 'موضوع الاستفسار',
    formMessage: 'رسالتك / تفاصيل المشروع',
    formSend: 'إرسال الرسالة إلى فريق رتقاء',
    formSending: 'جاري إرسال الاستفسار...',
    formSuccessTitle: 'تم إرسال الرسالة بنجاح',
    formSuccessMsg: 'شكراً لتواصلك مع رتقاء. سيتواصل معك مستشار الحلول الرقمية في أقرب وقت.',
    closeModal: 'إغلاق النافذة',
    
    // Org Types Options
    orgTypes: [
      'مدرسة / مجمع مدارس K-12',
      'جامعة / مؤسسة تعليم عالي',
      'وزارة / جهة حكومية تعليمية',
      'شركة تقنية تعليمية / شريك تقني',
      'معلم / تربوي مستقل',
      'مستثمر / شريك استراتيجي'
    ]
  }
};
