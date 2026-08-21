import type {
  Organization,
  User,
  AcademicYear,
  Term,
  GradeLevel,
  Classroom,
  Subject,
  Course,
  Lesson,
  Assignment,
  Submission,
  AttendanceRecord,
  AttendanceSession,
  AttendanceSessionStatus,
  Assessment,
  AssessmentCategory,
  AssessmentStatus,
  AssessmentGrade,
  StudentAssessmentItem,
  StudentCoursePerformance,
  StudentAcademicPerformanceSummary,
  GradebookMatrix,
  GradebookMatrixRow,
  GradebookMatrixStudentScore,
  AuditLog,
  Invitation,
  OrganizationMembership,
  PasswordResetToken,
  EmailVerificationToken,
  PhoneVerificationOtp,
  AuthProviderType,
  AIConversation,
  AIMessage,
  AIUsageRecord,
  AIDocumentChunk,
  AIUsageSummary,
  TeacherAssignment,
  StudentEnrollment,
  ParentStudentLink,
  TeacherAssignmentRole,
  StudentEnrollmentStatus,
  StudentRecord,
  StudentBehaviorRecord,
  StudentLifecycleEvent,
  StudentDossier,
  StudentLifecycleStatus,
  StudentBehaviorType,
  StudentGender,
  StudentBloodType,
  StorageObjectMetadata,
  StorageResourceType,
  StorageObjectStatus,
} from './types.ts';
import { checkPostgresConnection, getPostgresPool, withTenantClient } from '../../src/db/postgres.ts';
import type { PostgresStatus } from '../../src/db/postgres.ts';
import { hashPassword } from './security.ts';

// In-Memory & PostgreSQL Dual Storage Engine
class PlatformDatabase {
  private organizations: Map<string, Organization> = new Map();
  private users: Map<string, User> = new Map();
  private academicYears: Map<string, AcademicYear> = new Map();
  private terms: Map<string, Term> = new Map();
  private gradeLevels: Map<string, GradeLevel> = new Map();
  private classrooms: Map<string, Classroom> = new Map();
  private subjects: Map<string, Subject> = new Map();
  private courses: Map<string, Course> = new Map();
  private lessons: Map<string, Lesson> = new Map();
  private assignments: Map<string, Assignment> = new Map();
  private submissions: Map<string, Submission> = new Map();
  private attendanceSessions: Map<string, AttendanceSession> = new Map();
  private attendanceRecords: Map<string, AttendanceRecord> = new Map();
  private assessments: Map<string, Assessment> = new Map();
  private assessmentGrades: Map<string, AssessmentGrade> = new Map();
  private storageObjects: Map<string, StorageObjectMetadata> = new Map();
  private auditLogs: Map<string, AuditLog> = new Map();
  private invitations: Map<string, Invitation> = new Map();
  private organizationMemberships: Map<string, OrganizationMembership> = new Map();
  private passwordResetTokens: Map<string, PasswordResetToken> = new Map();
  private emailVerificationTokens: Map<string, EmailVerificationToken> = new Map();
  private phoneVerificationOtps: Map<string, PhoneVerificationOtp> = new Map();
  private aiConversations: Map<string, AIConversation> = new Map();
  private aiMessages: Map<string, AIMessage> = new Map();
  private aiUsageRecords: Map<string, AIUsageRecord> = new Map();
  private aiDocumentChunks: Map<string, AIDocumentChunk> = new Map();
  private teacherAssignments: Map<string, TeacherAssignment> = new Map();
  private studentEnrollments: Map<string, StudentEnrollment> = new Map();
  private parentStudentLinks: Map<string, ParentStudentLink> = new Map();
  private studentRecords: Map<string, StudentRecord> = new Map();
  private studentBehaviorRecords: Map<string, StudentBehaviorRecord> = new Map();
  private studentLifecycleEvents: Map<string, StudentLifecycleEvent> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // --- Engine Status Check ---
  async getEngineStatus(): Promise<PostgresStatus> {
    return checkPostgresConnection();
  }

  // --- Seed realistic Multi-Tenant Data ---
  private seedInitialData() {
    // 1. School A: Horizon Smart Schools
    const schoolAId = 'org_horizon_001';
    const schoolA: Organization = {
      id: schoolAId,
      slug: 'horizon',
      name: 'مدارس الأفق الذكية (Horizon Smart Schools)',
      legalName: 'شركة مدارس الأفق للتعليم والتربية الذكية',
      countryCode: 'SA',
      timezone: 'Asia/Riyadh',
      locale: 'ar',
      logoUrl: '',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.organizations.set(schoolAId, schoolA);

    // 2. School B: Elite Model Schools (To verify tenant isolation)
    const schoolBId = 'org_elite_002';
    const schoolB: Organization = {
      id: schoolBId,
      slug: 'elite',
      name: 'أكاديمية النخبة الدولية (Elite International Academy)',
      legalName: 'شركة النخبة الدولية للتعليم المتقدم',
      countryCode: 'SA',
      timezone: 'Asia/Riyadh',
      locale: 'ar',
      logoUrl: '',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.organizations.set(schoolBId, schoolB);

    // School A: Academic Year & Term
    const yearAId = 'ay_horizon_2026';
    this.academicYears.set(yearAId, {
      id: yearAId,
      organizationId: schoolAId,
      name: 'العام الدراسي 2026-2027',
      startDate: '2026-08-20',
      endDate: '2027-06-15',
      isCurrent: true,
    });

    const termAId = 'term_horizon_t1';
    this.terms.set(termAId, {
      id: termAId,
      organizationId: schoolAId,
      academicYearId: yearAId,
      name: 'الفصل الدراسي الأول (الخريف)',
      startDate: '2026-08-20',
      endDate: '2026-11-25',
      isCurrent: true,
    });

    const termA2Id = 'term_horizon_t2';
    this.terms.set(termA2Id, {
      id: termA2Id,
      organizationId: schoolAId,
      academicYearId: yearAId,
      name: 'الفصل الدراسي الثاني (الربيع)',
      startDate: '2026-12-05',
      endDate: '2027-03-10',
      isCurrent: false,
    });

    // School A: Grade Level & Classrooms
    const grade10Id = 'grd_horizon_g10';
    this.gradeLevels.set(grade10Id, {
      id: grade10Id,
      organizationId: schoolAId,
      name: 'الصف العاشر (الأول ثانوي)',
      sequenceOrder: 10,
    });

    const grade11Id = 'grd_horizon_g11';
    this.gradeLevels.set(grade11Id, {
      id: grade11Id,
      organizationId: schoolAId,
      name: 'الصف الحادي عشر (الثاني ثانوي)',
      sequenceOrder: 11,
    });

    const class10AId = 'class_horizon_10a';
    this.classrooms.set(class10AId, {
      id: class10AId,
      organizationId: schoolAId,
      gradeLevelId: grade10Id,
      name: 'شعبة 10-أ (علمي)',
      capacity: 32,
    });

    const class10BId = 'class_horizon_10b';
    this.classrooms.set(class10BId, {
      id: class10BId,
      organizationId: schoolAId,
      gradeLevelId: grade10Id,
      name: 'شعبة 10-ب (عام)',
      capacity: 30,
    });

    // School A: Subjects
    const mathSubId = 'sub_horizon_math';
    this.subjects.set(mathSubId, {
      id: mathSubId,
      organizationId: schoolAId,
      name: 'الرياضيات العامة والتحليل',
      code: 'MATH-101',
      color: '#10b981',
      description: 'منهج الجبر، التفاضل والتكامل للمرحلة الثانوية',
    });

    const physicsSubId = 'sub_horizon_phys';
    this.subjects.set(physicsSubId, {
      id: physicsSubId,
      organizationId: schoolAId,
      name: 'الفيزياء التجريبية والميكانيكا',
      code: 'PHYS-101',
      color: '#3b82f6',
      description: 'قوانين الحركة والميكانيكا الكلاسيكية',
    });

    const arabicSubId = 'sub_horizon_arab';
    this.subjects.set(arabicSubId, {
      id: arabicSubId,
      organizationId: schoolAId,
      name: 'اللغة العربية والأدب',
      code: 'ARAB-101',
      color: '#f59e0b',
      description: 'البلاغة، النحو، وقراءة النصوص التراثية',
    });

    // School A: Users (Admin, 2 Teachers, 4 Students)
    const adminA: User = {
      id: 'usr_horizon_admin',
      organizationId: schoolAId,
      email: 'admin@horizon.edu.sa',
      fullName: 'د. عبد الله المنصور (مدير المدرسة)',
      role: 'ORG_ADMIN',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(adminA.id, adminA);

    const teacherMath: User = {
      id: 'usr_horizon_teacher',
      organizationId: schoolAId,
      email: 'teacher@horizon.edu.sa',
      fullName: 'أ. أحمد الشمري (معلم الرياضيات)',
      role: 'TEACHER',
      teacherSpecialization: 'الرياضيات والفيزياء المتقدمة',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(teacherMath.id, teacherMath);

    const teacherArabic: User = {
      id: 'usr_horizon_t_sarah',
      organizationId: schoolAId,
      email: 'teacher2@horizon.edu.sa',
      fullName: 'أ. سارة الغامدي (معلمة اللغة العربية)',
      role: 'TEACHER',
      teacherSpecialization: 'اللغة العربية والبلاغة',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(teacherArabic.id, teacherArabic);

    const student1: User = {
      id: 'usr_horizon_s_omar',
      organizationId: schoolAId,
      email: 'student@horizon.edu.sa',
      fullName: 'عمر خالد السعيد',
      role: 'STUDENT',
      studentIdNumber: 'STD-2026-001',
      classroomId: class10AId,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(student1.id, student1);

    const student2: User = {
      id: 'usr_horizon_s_noura',
      organizationId: schoolAId,
      email: 'student2@horizon.edu.sa',
      fullName: 'نورة العتيبي',
      role: 'STUDENT',
      studentIdNumber: 'STD-2026-002',
      classroomId: class10AId,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(student2.id, student2);

    const student3: User = {
      id: 'usr_horizon_s_faisal',
      organizationId: schoolAId,
      email: 'faisal.m@horizon.edu.sa',
      fullName: 'فيصل المطيري',
      role: 'STUDENT',
      studentIdNumber: 'STD-2026-003',
      classroomId: class10AId,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(student3.id, student3);

    const student4: User = {
      id: 'usr_horizon_s_reem',
      organizationId: schoolAId,
      email: 'reem.k@horizon.edu.sa',
      fullName: 'ريم القحطاني',
      role: 'STUDENT',
      studentIdNumber: 'STD-2026-004',
      classroomId: class10BId,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(student4.id, student4);

    const parent1: User = {
      id: 'usr_horizon_p_khalid',
      organizationId: schoolAId,
      email: 'parent@horizon.edu.sa',
      fullName: 'خالد السعيد (ولي أمر)',
      role: 'PARENT',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(parent1.id, parent1);

    // School A: Courses
    const courseMath10AId = 'crs_horizon_math_10a';
    this.courses.set(courseMath10AId, {
      id: courseMath10AId,
      organizationId: schoolAId,
      subjectId: mathSubId,
      termId: termAId,
      teacherId: teacherMath.id,
      classroomId: class10AId,
      title: 'الرياضيات - الصف العاشر (شعبة أ)',
      description: 'شرح شامل للمصفوفات والدوال اللوغاريتمية وحساب المثلثات',
      subjectName: 'الرياضيات العامة والتحليل',
      teacherName: teacherMath.fullName,
      classroomName: 'شعبة 10-أ (علمي)',
    });

    const coursePhy10AId = 'crs_horizon_phys_10a';
    this.courses.set(coursePhy10AId, {
      id: coursePhy10AId,
      organizationId: schoolAId,
      subjectId: physicsSubId,
      termId: termAId,
      teacherId: teacherMath.id,
      classroomId: class10AId,
      title: 'الفيزياء - الصف العاشر (شعبة أ)',
      description: 'مقرر الفيزياء التفاعلي والتجارب المعملية الرقمية',
      subjectName: 'الفيزياء التجريبية والميكانيكا',
      teacherName: teacherMath.fullName,
      classroomName: 'شعبة 10-أ (علمي)',
    });

    const courseArabic10AId = 'crs_horizon_arab_10a';
    this.courses.set(courseArabic10AId, {
      id: courseArabic10AId,
      organizationId: schoolAId,
      subjectId: arabicSubId,
      termId: termAId,
      teacherId: teacherArabic.id,
      classroomId: class10AId,
      title: 'اللغة العربية والبلاغة - الصف العاشر (شعبة أ)',
      description: 'مقرر اللغة العربية والأدب والبلاغة والنقد',
      subjectName: 'اللغة العربية والأدب',
      teacherName: teacherArabic.fullName,
      classroomName: 'شعبة 10-أ (علمي)',
    });

    // School A: Lessons
    const lesson1Id = 'lsn_horizon_math_01';
    this.lessons.set(lesson1Id, {
      id: lesson1Id,
      organizationId: schoolAId,
      courseId: courseMath10AId,
      title: 'مقدمة في الدوال الأسية واللوغاريتمات',
      contentHtml: `
        <h3>مقدمة في الدوال الأسية</h3>
        <p>في هذا الدرس سنتعرف على خصائص الدوال الأسية، كيفية تحويل المعادلات الأسية إلى لوغاريتمية، وتطبيقاتها في النمو السكاني والحسابات المالية.</p>
        <h4>الأهداف التعليمية للدرس:</h4>
        <ul>
          <li>فهم المفهوم الهندسي لميل الخط المستقيم ومعدل التغير.</li>
          <li>تمثيل المعادلات الخطية بيانياً على المستوى الإحداثي.</li>
          <li>حل أنظمة المعادلات الخطية بطريقة الحذف والتعويض.</li>
        </ul>
      `,
      mediaUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
      attachments: [
        { name: 'ملخص_الدوال_الخطية.pdf', url: '#', size: '1.4 MB' },
        { name: 'تمارين_تطبيقية_محلولة.pdf', url: '#', size: '850 KB' },
      ],
      orderIndex: 1,
      isPublished: true,
      createdAt: '2026-09-02T08:00:00Z',
      updatedAt: '2026-09-02T08:00:00Z',
    });

    const lesson2Id = 'lsn_horizon_math_02';
    this.lessons.set(lesson2Id, {
      id: lesson2Id,
      organizationId: schoolAId,
      courseId: courseMath10AId,
      title: 'المصفوفات والعمليات الجبرية الخطية',
      contentHtml: `
        <h3>المصفوفات وتطبيقاتها في الحوسبة</h3>
        <p>المصفوفة هي جدول مستطيل من الأعداد مرتبة في صفوف وأعمدة. تُستخدم المصفوفات كأساس لمعالجة الصور وخوارزميات الذكاء الاصطناعي.</p>
      `,
      orderIndex: 2,
      isPublished: true,
      createdAt: '2026-09-09T08:00:00Z',
      updatedAt: '2026-09-09T08:00:00Z',
    });

    // School A: Assignments
    const assign1Id = 'asg_horizon_math_01';
    this.assignments.set(assign1Id, {
      id: assign1Id,
      organizationId: schoolAId,
      courseId: courseMath10AId,
      title: 'الواجب الأول: حل معادلات اللوغاريتمات المركبة',
      description: 'حل المسائل من 1 إلى 8 في صفحة 42، مع كتابة خطوات التحويل والتبسيط كاملة.',
      maxScore: 20,
      dueDate: '2026-10-15T23:59:00Z',
      createdAt: '2026-09-03T10:00:00Z',
    });

    const assign2Id = 'asg_horizon_math_02';
    this.assignments.set(assign2Id, {
      id: assign2Id,
      organizationId: schoolAId,
      courseId: courseMath10AId,
      title: 'المهمة الأدائية: ضرب المصفوفات والتطبيقات الواقعية',
      description: 'تصميم مسألة واقعية وتطبيق مصفوفة 3x3 لحلها.',
      maxScore: 30,
      dueDate: '2026-10-30T23:59:00Z',
      createdAt: '2026-09-10T10:00:00Z',
    });

    // School A: Submissions & Grades
    const sub1Id = 'sub_omar_01';
    this.submissions.set(sub1Id, {
      id: sub1Id,
      organizationId: schoolAId,
      assignmentId: assign1Id,
      studentId: student1.id,
      studentName: student1.fullName,
      submissionText: 'تم حل جميع المسائل الثمانية وتدوين خطوات التحويل بالتفصيل في المرفق.',
      fileAttachmentUrl: 'حل_عمر_السعيد_رياضيات.pdf',
      score: 19.5,
      teacherFeedback: 'إجابة نموذجية ومنظمة جداً يا عمر. أحسنت!',
      submittedAt: '2026-10-14T15:30:00Z',
      gradedAt: '2026-10-15T10:00:00Z',
    });

    const sub2Id = 'sub_noura_01';
    this.submissions.set(sub2Id, {
      id: sub2Id,
      organizationId: schoolAId,
      assignmentId: assign1Id,
      studentId: student2.id,
      studentName: student2.fullName,
      submissionText: 'مرفق حلول المعادلات الستة الأولى والمسألة الإضافية.',
      fileAttachmentUrl: 'حل_نورة_الفهد_رياضيات.pdf',
      score: 18.0,
      teacherFeedback: 'عمل ممتاز، راجعي فقط إشارة الحد الأخير في المسألة 5.',
      submittedAt: '2026-10-14T18:45:00Z',
      gradedAt: '2026-10-15T11:20:00Z',
    });

    // School A: Attendance Records
    const today = new Date().toISOString().split('T')[0];
    this.attendanceRecords.set(`att_${courseMath10AId}_${student1.id}_${today}`, {
      id: `att_${courseMath10AId}_${student1.id}_${today}`,
      organizationId: schoolAId,
      courseId: courseMath10AId,
      classroomId: class10AId,
      studentId: student1.id,
      studentName: student1.fullName,
      recordedBy: teacherMath.id,
      date: today,
      status: 'PRESENT',
      createdAt: new Date().toISOString(),
    });

    this.attendanceRecords.set(`att_${courseMath10AId}_${student2.id}_${today}`, {
      id: `att_${courseMath10AId}_${student2.id}_${today}`,
      organizationId: schoolAId,
      courseId: courseMath10AId,
      classroomId: class10AId,
      studentId: student2.id,
      studentName: student2.fullName,
      recordedBy: teacherMath.id,
      date: today,
      status: 'PRESENT',
      createdAt: new Date().toISOString(),
    });

    this.attendanceRecords.set(`att_${courseMath10AId}_${student3.id}_${today}`, {
      id: `att_${courseMath10AId}_${student3.id}_${today}`,
      organizationId: schoolAId,
      courseId: courseMath10AId,
      classroomId: class10AId,
      studentId: student3.id,
      studentName: student3.fullName,
      recordedBy: teacherMath.id,
      date: today,
      status: 'LATE',
      notes: 'تأخر 10 دقائق بعذر مقبول',
      createdAt: new Date().toISOString(),
    });

    // --- School B: Elite Model Schools (Isolated Tenant) ---
    const adminB: User = {
      id: 'usr_elite_admin',
      organizationId: schoolBId,
      email: 'admin@elite.edu.sa',
      fullName: 'Dr. Sarah Jenkins (Elite Admin)',
      role: 'ORG_ADMIN',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(adminB.id, adminB);

    const teacherB: User = {
      id: 'usr_elite_teacher',
      organizationId: schoolBId,
      email: 'teacher.sara@elite.edu.sa',
      fullName: 'Prof. Marcus Vance (Elite Teacher)',
      role: 'TEACHER',
      teacherSpecialization: 'Advanced Physics & AI',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(teacherB.id, teacherB);

    const studentB: User = {
      id: 'usr_elite_student',
      organizationId: schoolBId,
      email: 'student@elite.edu.sa',
      fullName: 'Zaid Al-Harbi (Elite Student)',
      role: 'STUDENT',
      studentIdNumber: 'ELT-2026-099',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.users.set(studentB.id, studentB);

    // School B: Academic Structure & Courses
    const yearBId = 'year_elite_1448';
    this.academicYears.set(yearBId, {
      id: yearBId,
      organizationId: schoolBId,
      name: 'Academic Year 2026-2027 (1448H)',
      startDate: '2026-09-01',
      endDate: '2027-06-30',
      isCurrent: true,
    });

    const termBId = 'term_elite_t1';
    this.terms.set(termBId, {
      id: termBId,
      organizationId: schoolBId,
      academicYearId: yearBId,
      name: 'Trimester 1',
      startDate: '2026-09-01',
      endDate: '2026-11-30',
      isCurrent: true,
    });

    const gradeBId = 'grd_elite_10';
    this.gradeLevels.set(gradeBId, {
      id: gradeBId,
      organizationId: schoolBId,
      name: 'Grade 10 (Advanced)',
      sequenceOrder: 10,
    });

    const classBId = 'cls_elite_10a';
    this.classrooms.set(classBId, {
      id: classBId,
      organizationId: schoolBId,
      gradeLevelId: gradeBId,
      name: 'Section 10-Alpha',
      capacity: 25,
    });

    const physSubId = 'sbj_elite_phys';
    this.subjects.set(physSubId, {
      id: physSubId,
      organizationId: schoolBId,
      name: 'Advanced Physics',
      code: 'PHY-101',
    });

    const coursePhys10AId = 'crs_elite_phys_10a';
    this.courses.set(coursePhys10AId, {
      id: coursePhys10AId,
      organizationId: schoolBId,
      subjectId: physSubId,
      termId: termBId,
      teacherId: teacherB.id,
      classroomId: classBId,
      title: 'Advanced Physics - Grade 10',
      description: 'Quantum mechanics and classical kinematics',
      subjectName: 'Advanced Physics',
      teacherName: teacherB.fullName,
      classroomName: 'Section 10-Alpha',
    });

    // School A: Teacher Assignments
    const taMathAId = 'ta_horizon_math_10a';
    this.teacherAssignments.set(taMathAId, {
      id: taMathAId,
      organizationId: schoolAId,
      teacherId: teacherMath.id,
      teacherName: teacherMath.fullName,
      teacherEmail: teacherMath.email,
      courseId: courseMath10AId,
      courseTitle: 'الرياضيات المتقدمة - الصف العاشر',
      subjectId: mathSubId,
      subjectName: 'الرياضيات العامة والتحليل',
      classroomId: class10AId,
      classroomName: 'شعبة 10-أ (علمي)',
      academicYearId: yearAId,
      academicYearName: 'العام الدراسي 2026-2027',
      role: 'PRIMARY_TEACHER',
      weeklyHours: 5,
      status: 'ACTIVE',
      createdAt: '2026-08-20T00:00:00Z',
      updatedAt: '2026-08-20T00:00:00Z',
    });

    const taArabAId = 'ta_horizon_arab_10a';
    this.teacherAssignments.set(taArabAId, {
      id: taArabAId,
      organizationId: schoolAId,
      teacherId: teacherArabic.id,
      teacherName: teacherArabic.fullName,
      teacherEmail: teacherArabic.email,
      courseId: courseArabic10AId,
      courseTitle: 'اللغة العربية والبلاغة - الصف العاشر',
      subjectId: arabicSubId,
      subjectName: 'اللغة العربية والأدب',
      classroomId: class10AId,
      classroomName: 'شعبة 10-أ (علمي)',
      academicYearId: yearAId,
      academicYearName: 'العام الدراسي 2026-2027',
      role: 'PRIMARY_TEACHER',
      weeklyHours: 4,
      status: 'ACTIVE',
      createdAt: '2026-08-20T00:00:00Z',
      updatedAt: '2026-08-20T00:00:00Z',
    });

    // School A: Student Enrollments
    const studentsListA = [
      { user: student1, roll: '10A-01' },
      { user: student2, roll: '10A-02' },
      { user: student3, roll: '10A-03' },
      { user: student4, roll: '10A-04' },
    ];
    for (const item of studentsListA) {
      const enrId = `enr_horizon_${item.user.id}`;
      this.studentEnrollments.set(enrId, {
        id: enrId,
        organizationId: schoolAId,
        studentId: item.user.id,
        studentName: item.user.fullName,
        studentEmail: item.user.email,
        studentIdNumber: item.user.studentIdNumber,
        classroomId: class10AId,
        classroomName: 'شعبة 10-أ (علمي)',
        gradeLevelId: grade10Id,
        gradeLevelName: 'الصف العاشر (الأول الثانوي)',
        academicYearId: yearAId,
        academicYearName: 'العام الدراسي 2026-2027',
        rollNumber: item.roll,
        status: 'ACTIVE',
        enrolledAt: '2026-08-20T00:00:00Z',
        updatedAt: '2026-08-20T00:00:00Z',
      });
    }

    // School B: Teacher Assignment & Student Enrollment
    const taPhysBId = 'ta_elite_phys_10a';
    this.teacherAssignments.set(taPhysBId, {
      id: taPhysBId,
      organizationId: schoolBId,
      teacherId: teacherB.id,
      teacherName: teacherB.fullName,
      teacherEmail: teacherB.email,
      courseId: coursePhys10AId,
      courseTitle: 'Advanced Physics - Grade 10',
      subjectId: physSubId,
      subjectName: 'Advanced Physics',
      classroomId: classBId,
      classroomName: 'Section 10-Alpha',
      academicYearId: yearBId,
      academicYearName: 'Academic Year 2026-2027 (1448H)',
      role: 'PRIMARY_TEACHER',
      weeklyHours: 6,
      status: 'ACTIVE',
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    });

    const enrBId = `enr_elite_${studentB.id}`;
    this.studentEnrollments.set(enrBId, {
      id: enrBId,
      organizationId: schoolBId,
      studentId: studentB.id,
      studentName: studentB.fullName,
      studentEmail: studentB.email,
      studentIdNumber: studentB.studentIdNumber,
      classroomId: classBId,
      classroomName: 'Section 10-Alpha',
      gradeLevelId: gradeBId,
      gradeLevelName: 'Grade 10 (Advanced)',
      academicYearId: yearBId,
      academicYearName: 'Academic Year 2026-2027 (1448H)',
      rollNumber: 'ELT-10A-01',
      status: 'ACTIVE',
      enrolledAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    });

    // School A: Student Records (Comprehensive SIS Profiles)
    const stdRec1: StudentRecord = {
      id: `std_rec_${student1.id}`,
      organizationId: schoolAId,
      studentId: student1.id,
      nationalId: '1098765432',
      dateOfBirth: '2010-04-15',
      gender: 'MALE',
      bloodType: 'O+',
      nationality: 'سعودي',
      admissionDate: '2024-09-01',
      status: 'ACTIVE',
      medicalConditions: 'لا توجد حالات مزمنة',
      allergies: 'حساسية خفيفة من الفول السوداني',
      specialDietaryNeeds: 'وجبات خالية من المكسرات',
      emergencyContactName: 'خالد السعيد (الأب)',
      emergencyContactPhone: '+966501234567',
      emergencyContactRelationship: 'FATHER',
      previousSchool: 'مدارس الرواد النموذجية',
      giftedProgram: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.studentRecords.set(stdRec1.id, stdRec1);

    const stdRec2: StudentRecord = {
      id: `std_rec_${student2.id}`,
      organizationId: schoolAId,
      studentId: student2.id,
      nationalId: '1087654321',
      dateOfBirth: '2010-08-22',
      gender: 'FEMALE',
      bloodType: 'A+',
      nationality: 'سعودية',
      admissionDate: '2024-09-01',
      status: 'ACTIVE',
      emergencyContactName: 'فاطمة العتيبي (الأم)',
      emergencyContactPhone: '+966507654321',
      emergencyContactRelationship: 'MOTHER',
      previousSchool: 'مدارس المستقبل الأهلية',
      giftedProgram: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.studentRecords.set(stdRec2.id, stdRec2);

    const stdRec3: StudentRecord = {
      id: `std_rec_${student3.id}`,
      organizationId: schoolAId,
      studentId: student3.id,
      nationalId: '1076543210',
      dateOfBirth: '2010-11-03',
      gender: 'MALE',
      bloodType: 'B+',
      nationality: 'سعودي',
      admissionDate: '2024-09-01',
      status: 'ACTIVE',
      medicalConditions: 'ربو تحسسي خفيف عند ممارسة المجهود الشديد',
      allergies: 'غبار الطلع والأتربة',
      emergencyContactName: 'محمد المطيري (الأب)',
      emergencyContactPhone: '+966509988776',
      emergencyContactRelationship: 'FATHER',
      giftedProgram: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.studentRecords.set(stdRec3.id, stdRec3);

    const stdRec4: StudentRecord = {
      id: `std_rec_${student4.id}`,
      organizationId: schoolAId,
      studentId: student4.id,
      nationalId: '1065432109',
      dateOfBirth: '2010-02-18',
      gender: 'FEMALE',
      bloodType: 'AB+',
      nationality: 'سعودية',
      admissionDate: '2024-09-01',
      status: 'ACTIVE',
      emergencyContactName: 'سلطان القحطاني (الأب)',
      emergencyContactPhone: '+966505544332',
      emergencyContactRelationship: 'FATHER',
      giftedProgram: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.studentRecords.set(stdRec4.id, stdRec4);

    // School B Student Record (Elite)
    const stdRecB: StudentRecord = {
      id: `std_rec_${studentB.id}`,
      organizationId: schoolBId,
      studentId: studentB.id,
      nationalId: '2098765432',
      dateOfBirth: '2010-06-10',
      gender: 'MALE',
      bloodType: 'O+',
      nationality: 'سعودي',
      admissionDate: '2024-09-01',
      status: 'ACTIVE',
      emergencyContactName: 'James Hayes (Father)',
      emergencyContactPhone: '+966551122334',
      emergencyContactRelationship: 'FATHER',
      giftedProgram: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    this.studentRecords.set(stdRecB.id, stdRecB);

    // School A: Student Behavior & Merit Records
    const beh1: StudentBehaviorRecord = {
      id: `beh_horizon_001`,
      organizationId: schoolAId,
      studentId: student1.id,
      studentName: student1.fullName,
      type: 'MERIT',
      title: 'التفوق في أولمبياد الرياضيات المدرسي',
      description: 'حقق المركز الأول على مستوى المدرسة في مسابقة حل المسائل المتقدمة',
      points: 10,
      actionTaken: 'منح شهادة تفوق مع إشعار ولي الأمر',
      incidentDate: '2026-09-15',
      recordedBy: teacherMath.id,
      recordedByName: teacherMath.fullName,
      status: 'RESOLVED',
      createdAt: '2026-09-15T10:00:00Z',
    };
    this.studentBehaviorRecords.set(beh1.id, beh1);

    const beh2: StudentBehaviorRecord = {
      id: `beh_horizon_002`,
      organizationId: schoolAId,
      studentId: student2.id,
      studentName: student2.fullName,
      type: 'POSITIVE_PRAISE',
      title: 'مشاركة متميزة في الإذاعة المدرسية',
      description: 'إلقاء مميز وإعداد محتوى ثقافي هادف للإذاعة المدرسية الصباحية',
      points: 5,
      actionTaken: 'تسجيل بطاقة تميز سلوكي',
      incidentDate: '2026-09-20',
      recordedBy: teacherArabic.id,
      recordedByName: teacherArabic.fullName,
      status: 'RESOLVED',
      createdAt: '2026-09-20T08:30:00Z',
    };
    this.studentBehaviorRecords.set(beh2.id, beh2);

    const beh3: StudentBehaviorRecord = {
      id: `beh_horizon_003`,
      organizationId: schoolAId,
      studentId: student3.id,
      studentName: student3.fullName,
      type: 'MINOR_INFRACTION',
      title: 'تأخر متكرر عن الحصة الأولى',
      description: 'تأخر 3 مرات خلال الأسبوع دون إحضار عذر مسبق',
      points: -2,
      actionTaken: 'تنبيه شفهي والتواصل مع ولي الأمر',
      incidentDate: '2026-09-28',
      recordedBy: teacherMath.id,
      recordedByName: teacherMath.fullName,
      status: 'RESOLVED',
      createdAt: '2026-09-28T09:00:00Z',
    };
    this.studentBehaviorRecords.set(beh3.id, beh3);

    // School A: Student Lifecycle Events
    const lce1: StudentLifecycleEvent = {
      id: `lce_horizon_001`,
      organizationId: schoolAId,
      studentId: student1.id,
      studentName: student1.fullName,
      previousStatus: 'ACTIVE',
      newStatus: 'ACTIVE',
      reason: 'القبول والتسجيل الأكاديمي للعام الدراسي 2026-2027',
      actionBy: adminA.id,
      actionByName: adminA.fullName,
      effectiveDate: '2026-08-20',
      timestamp: '2026-08-20T08:00:00Z',
    };
    this.studentLifecycleEvents.set(lce1.id, lce1);

    // School A: Parent Student Links
    const psl1: ParentStudentLink = {
      id: `psl_horizon_001`,
      organizationId: schoolAId,
      parentId: parent1.id,
      parentName: parent1.fullName,
      studentId: student1.id,
      studentName: student1.fullName,
      relationship: 'FATHER',
      isEmergencyContact: true,
      createdAt: '2026-01-01T00:00:00Z',
    };
    this.parentStudentLinks.set(psl1.id, psl1);

    const psl2: ParentStudentLink = {
      id: `psl_horizon_002`,
      organizationId: schoolAId,
      parentId: parent1.id,
      parentName: parent1.fullName,
      studentId: student3.id,
      studentName: student3.fullName,
      relationship: 'FATHER',
      isEmergencyContact: true,
      createdAt: '2026-01-01T00:00:00Z',
    };
    this.parentStudentLinks.set(psl2.id, psl2);

    // School A: Attendance Sessions
    const sess1Id = 'att_sess_horizon_001';
    this.attendanceSessions.set(sess1Id, {
      id: sess1Id,
      organizationId: schoolAId,
      classroomId: class10AId,
      classroomName: 'شعبة 10-أ (علمي)',
      courseId: courseMath10AId,
      courseTitle: 'الرياضيات - الصف العاشر (شعبة أ)',
      date: today,
      periodNumber: 1,
      title: 'جلسة تحضير الحصة الأولى - الجبر الخطي',
      status: 'COMPLETED',
      openedBy: teacherMath.id,
      openedByName: teacherMath.fullName,
      presentCount: 2,
      absentCount: 0,
      lateCount: 1,
      excusedCount: 0,
      totalStudents: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update existing attendance records with sessionId
    const attRec1 = this.attendanceRecords.get(`att_${courseMath10AId}_${student1.id}_${today}`);
    if (attRec1) {
      attRec1.sessionId = sess1Id;
      attRec1.classroomName = 'شعبة 10-أ (علمي)';
      attRec1.studentIdNumber = student1.studentIdNumber;
      attRec1.recordedByName = teacherMath.fullName;
    }
    const attRec2 = this.attendanceRecords.get(`att_${courseMath10AId}_${student2.id}_${today}`);
    if (attRec2) {
      attRec2.sessionId = sess1Id;
      attRec2.classroomName = 'شعبة 10-أ (علمي)';
      attRec2.studentIdNumber = student2.studentIdNumber;
      attRec2.recordedByName = teacherMath.fullName;
    }
    const attRec3 = this.attendanceRecords.get(`att_${courseMath10AId}_${student3.id}_${today}`);
    if (attRec3) {
      attRec3.sessionId = sess1Id;
      attRec3.classroomName = 'شعبة 10-أ (علمي)';
      attRec3.studentIdNumber = student3.studentIdNumber;
      attRec3.recordedByName = teacherMath.fullName;
    }

    // Additional historic attendance for student1 (to show rich summary)
    const histDates = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-07'];
    for (let i = 0; i < histDates.length; i++) {
      const d = histDates[i];
      const recKey = `att_${courseMath10AId}_${student1.id}_${d}`;
      this.attendanceRecords.set(recKey, {
        id: recKey,
        organizationId: schoolAId,
        courseId: courseMath10AId,
        classroomId: class10AId,
        classroomName: 'شعبة 10-أ (علمي)',
        studentId: student1.id,
        studentName: student1.fullName,
        studentIdNumber: student1.studentIdNumber,
        recordedBy: teacherMath.id,
        recordedByName: teacherMath.fullName,
        date: d,
        status: i === 3 ? 'EXCUSED' : 'PRESENT',
        notes: i === 3 ? 'إجازة مرضية معتمدة' : undefined,
        createdAt: `${d}T08:00:00Z`,
      });
    }

    // School A: Assessments (Course-based evaluations)
    const assMathMidterm: Assessment = {
      id: 'ass_math_midterm_10a',
      organizationId: schoolAId,
      courseId: courseMath10AId,
      courseTitle: 'الرياضيات - الصف العاشر (شعبة أ)',
      subjectId: mathSubId,
      subjectName: 'الرياضيات العامة والتحليل',
      classroomId: class10AId,
      classroomName: 'شعبة 10-أ (علمي)',
      termId: termAId,
      title: 'اختبار منتصف الفصل الأول في الرياضيات',
      description: 'يشمل وحدات الدوال والمصفوفات والمتجهات',
      category: 'MIDTERM',
      maxScore: 100,
      weightPercentage: 30,
      dueDate: '2026-10-15T12:00:00Z',
      assessmentDate: '2026-10-15',
      status: 'PUBLISHED',
      createdBy: teacherMath.id,
      createdByName: teacherMath.fullName,
      createdAt: '2026-09-01T08:00:00Z',
      updatedAt: '2026-09-01T08:00:00Z',
    };
    this.assessments.set(assMathMidterm.id, assMathMidterm);

    const assMathQuiz1: Assessment = {
      id: 'ass_math_quiz1_10a',
      organizationId: schoolAId,
      courseId: courseMath10AId,
      courseTitle: 'الرياضيات - الصف العاشر (شعبة أ)',
      subjectId: mathSubId,
      subjectName: 'الرياضيات العامة والتحليل',
      classroomId: class10AId,
      classroomName: 'شعبة 10-أ (علمي)',
      termId: termAId,
      title: 'اختبار قصير (1): الدوال واللوغاريتمات',
      description: 'تقييم سريع على فهم التحويل اللوغاريتمي',
      category: 'QUIZ',
      maxScore: 20,
      weightPercentage: 10,
      dueDate: '2026-09-25T10:00:00Z',
      assessmentDate: '2026-09-25',
      status: 'PUBLISHED',
      createdBy: teacherMath.id,
      createdByName: teacherMath.fullName,
      createdAt: '2026-09-05T08:00:00Z',
      updatedAt: '2026-09-05T08:00:00Z',
    };
    this.assessments.set(assMathQuiz1.id, assMathQuiz1);

    const assMathProject: Assessment = {
      id: 'ass_math_project_10a',
      organizationId: schoolAId,
      courseId: courseMath10AId,
      courseTitle: 'الرياضيات - الصف العاشر (شعبة أ)',
      subjectId: mathSubId,
      subjectName: 'الرياضيات العامة والتحليل',
      classroomId: class10AId,
      classroomName: 'شعبة 10-أ (علمي)',
      termId: termAId,
      title: 'مشروع الفصل: التطبيقات الواقعية للجبر',
      description: 'بحث جماعي عن استخدام الخوارزميات المصفوفية في الرسوم الحاسوبية',
      category: 'PROJECT',
      maxScore: 50,
      weightPercentage: 20,
      dueDate: '2026-11-10T23:59:00Z',
      assessmentDate: '2026-11-10',
      status: 'PUBLISHED',
      createdBy: teacherMath.id,
      createdByName: teacherMath.fullName,
      createdAt: '2026-09-10T08:00:00Z',
      updatedAt: '2026-09-10T08:00:00Z',
    };
    this.assessments.set(assMathProject.id, assMathProject);

    const assArabExam: Assessment = {
      id: 'ass_arab_exam_10a',
      organizationId: schoolAId,
      courseId: courseArabic10AId,
      courseTitle: 'اللغة العربية والبلاغة - الصف العاشر (شعبة أ)',
      subjectId: arabicSubId,
      subjectName: 'اللغة العربية والأدب',
      classroomId: class10AId,
      classroomName: 'شعبة 10-أ (علمي)',
      termId: termAId,
      title: 'اختبار النحو والبلاغة التحليلي',
      description: 'إعراب نصوص شعرية وتحليل الاستعارة والمجاز',
      category: 'EXAM',
      maxScore: 100,
      weightPercentage: 40,
      dueDate: '2026-10-20T11:00:00Z',
      assessmentDate: '2026-10-20',
      status: 'PUBLISHED',
      createdBy: teacherArabic.id,
      createdByName: teacherArabic.fullName,
      createdAt: '2026-09-02T08:00:00Z',
      updatedAt: '2026-09-02T08:00:00Z',
    };
    this.assessments.set(assArabExam.id, assArabExam);

    // School A: Assessment Grades
    // Student 1 (عمر خالد السعيد)
    const gr1_1: AssessmentGrade = {
      id: `grd_${assMathMidterm.id}_${student1.id}`,
      organizationId: schoolAId,
      assessmentId: assMathMidterm.id,
      assessmentTitle: assMathMidterm.title,
      assessmentCategory: assMathMidterm.category,
      maxScore: assMathMidterm.maxScore,
      studentId: student1.id,
      studentName: student1.fullName,
      studentIdNumber: student1.studentIdNumber,
      score: 96,
      percentage: 96,
      feedback: 'أداء ممتاز وتحليل رياضي دقيق جداً',
      gradedBy: teacherMath.id,
      gradedByName: teacherMath.fullName,
      gradedAt: '2026-10-16T10:00:00Z',
      updatedAt: '2026-10-16T10:00:00Z',
    };
    this.assessmentGrades.set(gr1_1.id, gr1_1);

    const gr1_2: AssessmentGrade = {
      id: `grd_${assMathQuiz1.id}_${student1.id}`,
      organizationId: schoolAId,
      assessmentId: assMathQuiz1.id,
      assessmentTitle: assMathQuiz1.title,
      assessmentCategory: assMathQuiz1.category,
      maxScore: assMathQuiz1.maxScore,
      studentId: student1.id,
      studentName: student1.fullName,
      studentIdNumber: student1.studentIdNumber,
      score: 19.5,
      percentage: 97.5,
      feedback: 'إجابة نموذجية وسريعة',
      gradedBy: teacherMath.id,
      gradedByName: teacherMath.fullName,
      gradedAt: '2026-09-26T11:00:00Z',
      updatedAt: '2026-09-26T11:00:00Z',
    };
    this.assessmentGrades.set(gr1_2.id, gr1_2);

    const gr1_3: AssessmentGrade = {
      id: `grd_${assArabExam.id}_${student1.id}`,
      organizationId: schoolAId,
      assessmentId: assArabExam.id,
      assessmentTitle: assArabExam.title,
      assessmentCategory: assArabExam.category,
      maxScore: assArabExam.maxScore,
      studentId: student1.id,
      studentName: student1.fullName,
      studentIdNumber: student1.studentIdNumber,
      score: 93,
      percentage: 93,
      feedback: 'أسلوب لغوي رصين وإعراب دقيق',
      gradedBy: teacherArabic.id,
      gradedByName: teacherArabic.fullName,
      gradedAt: '2026-10-21T09:00:00Z',
      updatedAt: '2026-10-21T09:00:00Z',
    };
    this.assessmentGrades.set(gr1_3.id, gr1_3);

    // Student 2 (نورة العتيبي)
    const gr2_1: AssessmentGrade = {
      id: `grd_${assMathMidterm.id}_${student2.id}`,
      organizationId: schoolAId,
      assessmentId: assMathMidterm.id,
      assessmentTitle: assMathMidterm.title,
      assessmentCategory: assMathMidterm.category,
      maxScore: assMathMidterm.maxScore,
      studentId: student2.id,
      studentName: student2.fullName,
      studentIdNumber: student2.studentIdNumber,
      score: 91,
      percentage: 91,
      feedback: 'مستوى رائع ومتقن',
      gradedBy: teacherMath.id,
      gradedByName: teacherMath.fullName,
      gradedAt: '2026-10-16T10:30:00Z',
      updatedAt: '2026-10-16T10:30:00Z',
    };
    this.assessmentGrades.set(gr2_1.id, gr2_1);

    const gr2_2: AssessmentGrade = {
      id: `grd_${assMathQuiz1.id}_${student2.id}`,
      organizationId: schoolAId,
      assessmentId: assMathQuiz1.id,
      assessmentTitle: assMathQuiz1.title,
      assessmentCategory: assMathQuiz1.category,
      maxScore: assMathQuiz1.maxScore,
      studentId: student2.id,
      studentName: student2.fullName,
      studentIdNumber: student2.studentIdNumber,
      score: 18,
      percentage: 90,
      feedback: 'أحسنتِ يا نورة',
      gradedBy: teacherMath.id,
      gradedByName: teacherMath.fullName,
      gradedAt: '2026-09-26T11:30:00Z',
      updatedAt: '2026-09-26T11:30:00Z',
    };
    this.assessmentGrades.set(gr2_2.id, gr2_2);

    // Student 3 (فيصل المطيري)
    const gr3_1: AssessmentGrade = {
      id: `grd_${assMathMidterm.id}_${student3.id}`,
      organizationId: schoolAId,
      assessmentId: assMathMidterm.id,
      assessmentTitle: assMathMidterm.title,
      assessmentCategory: assMathMidterm.category,
      maxScore: assMathMidterm.maxScore,
      studentId: student3.id,
      studentName: student3.fullName,
      studentIdNumber: student3.studentIdNumber,
      score: 82,
      percentage: 82,
      feedback: 'جهد طيب مع الحاجة لمزيد من التمرن على المصفوفات',
      gradedBy: teacherMath.id,
      gradedByName: teacherMath.fullName,
      gradedAt: '2026-10-16T11:00:00Z',
      updatedAt: '2026-10-16T11:00:00Z',
    };
    this.assessmentGrades.set(gr3_1.id, gr3_1);

    // School B: Assessments & Grades (Tenant Isolation Test Verification)
    const assPhysB: Assessment = {
      id: 'ass_elite_phys_midterm',
      organizationId: schoolBId,
      courseId: coursePhys10AId,
      courseTitle: 'Advanced Physics - Grade 10',
      subjectId: physSubId,
      subjectName: 'Advanced Physics',
      classroomId: classBId,
      classroomName: 'Section 10-Alpha',
      termId: termBId,
      title: 'Midterm Exam - Classical & Modern Physics',
      description: 'Kinematics, dynamics, and quantum fundamentals',
      category: 'MIDTERM',
      maxScore: 100,
      weightPercentage: 35,
      dueDate: '2026-10-25T14:00:00Z',
      assessmentDate: '2026-10-25',
      status: 'PUBLISHED',
      createdBy: teacherB.id,
      createdByName: teacherB.fullName,
      createdAt: '2026-09-05T08:00:00Z',
      updatedAt: '2026-09-05T08:00:00Z',
    };
    this.assessments.set(assPhysB.id, assPhysB);

    const grB_1: AssessmentGrade = {
      id: `grd_${assPhysB.id}_${studentB.id}`,
      organizationId: schoolBId,
      assessmentId: assPhysB.id,
      assessmentTitle: assPhysB.title,
      assessmentCategory: assPhysB.category,
      maxScore: assPhysB.maxScore,
      studentId: studentB.id,
      studentName: studentB.fullName,
      studentIdNumber: studentB.studentIdNumber,
      score: 95,
      percentage: 95,
      feedback: 'Outstanding analytical rigor',
      gradedBy: teacherB.id,
      gradedByName: teacherB.fullName,
      gradedAt: '2026-10-26T10:00:00Z',
      updatedAt: '2026-10-26T10:00:00Z',
    };
    this.assessmentGrades.set(grB_1.id, grB_1);

    const sessBId = 'att_sess_elite_001';
    this.attendanceSessions.set(sessBId, {
      id: sessBId,
      organizationId: schoolBId,
      classroomId: classBId,
      classroomName: 'Section 10-Alpha',
      courseId: coursePhys10AId,
      courseTitle: 'Advanced Physics - Grade 10',
      date: today,
      periodNumber: 2,
      title: 'Morning Lab Session Roll Call',
      status: 'COMPLETED',
      openedBy: teacherB.id,
      openedByName: teacherB.fullName,
      presentCount: 1,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      totalStudents: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const attRecB: AttendanceRecord = {
      id: `att_${coursePhys10AId}_${studentB.id}_${today}`,
      organizationId: schoolBId,
      sessionId: sessBId,
      courseId: coursePhys10AId,
      classroomId: classBId,
      classroomName: 'Section 10-Alpha',
      studentId: studentB.id,
      studentName: studentB.fullName,
      studentIdNumber: studentB.studentIdNumber,
      recordedBy: teacherB.id,
      recordedByName: teacherB.fullName,
      date: today,
      status: 'PRESENT',
      createdAt: new Date().toISOString(),
    };
    this.attendanceRecords.set(attRecB.id, attRecB);

    // Populate Organization Memberships & default auth providers for all seeded users
    for (const user of Array.from(this.users.values())) {
      user.emailVerified = true;
      user.phoneVerified = true;
      user.authProviders = ['email'];
      if (!user.passwordHash) {
        user.passwordHash = hashPassword('Password@2026');
      }
      this.addMembership({
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
        isDefault: true,
        status: 'ACTIVE',
        classroomId: user.classroomId,
        studentIdNumber: user.studentIdNumber,
        teacherSpecialization: user.teacherSpecialization,
      });
    }
  }

  // --- Multi-Tenant Query Helpers (Row-Level Security Enforcement) ---

  // Organizations
  getOrganizationById(orgId: string): Organization | undefined {
    return this.organizations.get(orgId);
  }

  getOrganizationBySlug(slug: string): Organization | undefined {
    return Array.from(this.organizations.values()).find((o) => o.slug === slug || o.id === slug);
  }

  getAllOrganizations(): Organization[] {
    return Array.from(this.organizations.values());
  }

  createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Organization {
    const id = `org_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const org: Organization = { ...data, id, createdAt: now, updatedAt: now };
    this.organizations.set(id, org);
    return org;
  }

  // Users (RLS Enforced by tenant organizationId)
  findUserByEmail(email: string, organizationId?: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    const all = Array.from(this.users.values());
    if (organizationId) {
      return all.find((u) => u.email.toLowerCase() === normalized && u.organizationId === organizationId);
    }
    return all.find((u) => u.email.toLowerCase() === normalized);
  }

  findUserByPhone(phone: string, organizationId?: string): User | undefined {
    const normalized = phone.trim();
    const all = Array.from(this.users.values());
    if (organizationId) {
      return all.find((u) => u.phone && u.phone.trim() === normalized && u.organizationId === organizationId);
    }
    return all.find((u) => u.phone && u.phone.trim() === normalized);
  }

  findUserByGoogleId(googleId: string): User | undefined {
    const trimmed = googleId.trim();
    return Array.from(this.users.values()).find((u) => u.googleId === trimmed);
  }

  getUserById(userId: string, organizationId?: string): User | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;
    if (organizationId && user.organizationId !== organizationId) return undefined;
    return user;
  }

  getUsersByOrg(organizationId: string, role?: string): User[] {
    return Array.from(this.users.values()).filter((u) => {
      if (u.organizationId !== organizationId) return false;
      if (role && u.role !== role) return false;
      return true;
    });
  }

  createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): User {
    const id = data.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const user: User = {
      ...data,
      id,
      emailVerified: data.emailVerified ?? false,
      phoneVerified: data.phoneVerified ?? false,
      authProviders: data.authProviders || (data.email ? ['email'] : []),
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);

    // Auto-create default OrganizationMembership if organizationId is present
    if (user.organizationId) {
      const existingMembership = this.getMembership(user.id, user.organizationId);
      if (!existingMembership) {
        this.addMembership({
          userId: user.id,
          organizationId: user.organizationId,
          role: user.role,
          isDefault: true,
          status: 'ACTIVE',
          classroomId: user.classroomId,
          studentIdNumber: user.studentIdNumber,
          teacherSpecialization: user.teacherSpecialization,
        });
      }
    }

    return user;
  }

  updateUser(id: string, organizationId?: string, updates: Partial<User> = {}): User | undefined {
    const user = organizationId ? this.getUserById(id, organizationId) : this.users.get(id);
    if (!user) return undefined;
    const updated: User = { ...user, ...updates, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    return updated;
  }

  deleteUser(id: string, organizationId: string): boolean {
    const user = this.getUserById(id, organizationId);
    if (!user) return false;
    this.users.delete(id);
    // Delete memberships
    for (const [mId, mem] of this.organizationMemberships.entries()) {
      if (mem.userId === id) {
        this.organizationMemberships.delete(mId);
      }
    }
    return true;
  }

  // --- Account Linking & Identity Management ---
  linkAccountProvider(
    userId: string,
    provider: AuthProviderType,
    details?: { googleId?: string; phone?: string; email?: string }
  ): User | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const currentProviders = new Set<AuthProviderType>(user.authProviders || []);
    currentProviders.add(provider);

    const updates: Partial<User> = {
      authProviders: Array.from(currentProviders),
    };

    if (provider === 'google' && details?.googleId) {
      updates.googleId = details.googleId;
    }
    if (provider === 'phone' && details?.phone) {
      updates.phone = details.phone;
      updates.phoneVerified = true;
    }
    if (provider === 'email' && details?.email) {
      updates.email = details.email.toLowerCase().trim();
      updates.emailVerified = true;
    }

    return this.updateUser(userId, undefined, updates);
  }

  unlinkAccountProvider(userId: string, provider: AuthProviderType): { success: boolean; user?: User; error?: string } {
    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'USER_NOT_FOUND' };

    const currentProviders = user.authProviders || ['email'];
    if (currentProviders.length <= 1) {
      return { success: false, error: 'CANNOT_UNLINK_LAST_PROVIDER', user };
    }

    const updatedProviders = currentProviders.filter((p) => p !== provider);
    const updates: Partial<User> = {
      authProviders: updatedProviders,
    };

    if (provider === 'google') {
      updates.googleId = undefined;
    }

    const updatedUser = this.updateUser(userId, undefined, updates);
    return { success: true, user: updatedUser };
  }

  // --- Organization Memberships (Multi-Tenant User Roles) ---
  getMembershipsByUserId(userId: string): OrganizationMembership[] {
    return Array.from(this.organizationMemberships.values())
      .filter((m) => m.userId === userId && m.status !== 'REVOKED')
      .map((m) => {
        const org = this.getOrganizationById(m.organizationId);
        return {
          ...m,
          organizationName: org?.name,
          organizationSlug: org?.slug,
        };
      });
  }

  getMembership(userId: string, organizationId: string): OrganizationMembership | undefined {
    return Array.from(this.organizationMemberships.values()).find(
      (m) => m.userId === userId && m.organizationId === organizationId && m.status !== 'REVOKED'
    );
  }

  addMembership(data: Omit<OrganizationMembership, 'id' | 'joinedAt'>): OrganizationMembership {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const membership: OrganizationMembership = {
      ...data,
      id,
      joinedAt: new Date().toISOString(),
    };
    this.organizationMemberships.set(id, membership);
    return membership;
  }

  createMembership(data: Omit<OrganizationMembership, 'id' | 'joinedAt'>): OrganizationMembership {
    return this.addMembership(data);
  }

  updateMembership(id: string, updates: Partial<OrganizationMembership>): OrganizationMembership | undefined {
    const mem = this.organizationMemberships.get(id);
    if (!mem) return undefined;
    const updated = { ...mem, ...updates };
    this.organizationMemberships.set(id, updated);
    return updated;
  }

  removeMembership(id: string): boolean {
    return this.organizationMemberships.delete(id);
  }

  // --- Password Reset Tokens ---
  createPasswordResetToken(userId: string, email: string, tokenHash: string, expiresInMinutes = 60): PasswordResetToken {
    this.invalidatePasswordResetTokensForUser(userId);
    const id = `prt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    const token: PasswordResetToken = {
      id,
      userId,
      email: email.toLowerCase().trim(),
      tokenHash,
      expiresAt,
      isUsed: false,
      createdAt: new Date().toISOString(),
    };
    this.passwordResetTokens.set(id, token);
    return token;
  }

  getPasswordResetTokenByHash(tokenHash: string): PasswordResetToken | undefined {
    return Array.from(this.passwordResetTokens.values()).find(
      (t) => t.tokenHash === tokenHash && !t.isUsed && new Date(t.expiresAt).getTime() > Date.now()
    );
  }

  markPasswordResetTokenUsed(id: string): void {
    const token = this.passwordResetTokens.get(id);
    if (token) {
      token.isUsed = true;
      token.usedAt = new Date().toISOString();
      this.passwordResetTokens.set(id, token);
    }
  }

  invalidatePasswordResetTokensForUser(userId: string): void {
    for (const [id, token] of this.passwordResetTokens.entries()) {
      if (token.userId === userId && !token.isUsed) {
        token.isUsed = true;
        this.passwordResetTokens.set(id, token);
      }
    }
  }

  // --- Email Verification Tokens ---
  createEmailVerificationToken(userId: string, email: string, tokenHash: string, expiresInMinutes = 24 * 60): EmailVerificationToken {
    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    const token: EmailVerificationToken = {
      id,
      userId,
      email: email.toLowerCase().trim(),
      tokenHash,
      expiresAt,
      isUsed: false,
      createdAt: new Date().toISOString(),
    };
    this.emailVerificationTokens.set(id, token);
    return token;
  }

  getEmailVerificationTokenByHash(tokenHash: string): EmailVerificationToken | undefined {
    return Array.from(this.emailVerificationTokens.values()).find(
      (t) => t.tokenHash === tokenHash && !t.isUsed && new Date(t.expiresAt).getTime() > Date.now()
    );
  }

  markEmailVerificationTokenUsed(id: string): void {
    const token = this.emailVerificationTokens.get(id);
    if (token) {
      token.isUsed = true;
      token.usedAt = new Date().toISOString();
      this.emailVerificationTokens.set(id, token);
    }
  }

  // --- Phone Verification OTPs ---
  createPhoneOtp(phone: string, otpHash: string, userId?: string, expiresInMinutes = 10): PhoneVerificationOtp {
    const id = `otp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    const record: PhoneVerificationOtp = {
      id,
      userId,
      phone: phone.trim(),
      otpHash,
      attemptsCount: 0,
      maxAttempts: 5,
      expiresAt,
      isUsed: false,
      createdAt: new Date().toISOString(),
    };
    this.phoneVerificationOtps.set(id, record);
    return record;
  }

  getLatestActivePhoneOtp(phone: string): PhoneVerificationOtp | undefined {
    const normalized = phone.trim();
    const matches = Array.from(this.phoneVerificationOtps.values())
      .filter((o) => o.phone === normalized && !o.isUsed && new Date(o.expiresAt).getTime() > Date.now())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return matches[0];
  }

  incrementPhoneOtpAttempts(id: string): number {
    const record = this.phoneVerificationOtps.get(id);
    if (!record) return 0;
    record.attemptsCount += 1;
    if (record.attemptsCount >= record.maxAttempts) {
      record.isUsed = true; // Invalidate after exceeding max attempts to protect against brute force
    }
    this.phoneVerificationOtps.set(id, record);
    return record.attemptsCount;
  }

  markPhoneOtpUsed(id: string): void {
    const record = this.phoneVerificationOtps.get(id);
    if (record) {
      record.isUsed = true;
      record.usedAt = new Date().toISOString();
      this.phoneVerificationOtps.set(id, record);
    }
  }

  // Academic Structure
  getAcademicYears(organizationId: string): AcademicYear[] {
    return Array.from(this.academicYears.values()).filter((y) => y.organizationId === organizationId);
  }

  getCurrentAcademicYear(organizationId: string): AcademicYear | undefined {
    return Array.from(this.academicYears.values()).find((y) => y.organizationId === organizationId && y.isCurrent);
  }

  getCoursesByClassroom(classroomId: string, organizationId: string): Course[] {
    return Array.from(this.courses.values()).filter(
      (c) => c.organizationId === organizationId && c.classroomId === classroomId
    );
  }

  getAcademicYearById(id: string, organizationId: string): AcademicYear | undefined {
    const item = this.academicYears.get(id);
    if (!item || item.organizationId !== organizationId) return undefined;
    return item;
  }

  createAcademicYear(data: Omit<AcademicYear, 'id'>): AcademicYear {
    const id = `year_${Date.now()}`;
    const item: AcademicYear = { ...data, id };
    if (item.isCurrent) {
      // Set all other academic years in this org to isCurrent = false
      for (const [yId, year] of this.academicYears.entries()) {
        if (year.organizationId === data.organizationId && yId !== id) {
          year.isCurrent = false;
        }
      }
    }
    this.academicYears.set(id, item);
    return item;
  }

  updateAcademicYear(id: string, organizationId: string, updates: Partial<AcademicYear>): AcademicYear | undefined {
    const item = this.getAcademicYearById(id, organizationId);
    if (!item) return undefined;
    if (updates.isCurrent) {
      for (const [yId, year] of this.academicYears.entries()) {
        if (year.organizationId === organizationId && yId !== id) {
          year.isCurrent = false;
        }
      }
    }
    const updated: AcademicYear = { ...item, ...updates };
    this.academicYears.set(id, updated);
    return updated;
  }

  deleteAcademicYear(id: string, organizationId: string): boolean {
    const item = this.getAcademicYearById(id, organizationId);
    if (!item) return false;
    this.academicYears.delete(id);
    return true;
  }

  getTerms(organizationId: string, academicYearId?: string): Term[] {
    return Array.from(this.terms.values()).filter((t) => {
      if (t.organizationId !== organizationId) return false;
      if (academicYearId && t.academicYearId !== academicYearId) return false;
      return true;
    });
  }

  getTermById(id: string, organizationId: string): Term | undefined {
    const item = this.terms.get(id);
    if (!item || item.organizationId !== organizationId) return undefined;
    return item;
  }

  createTerm(data: Omit<Term, 'id'>): Term {
    const id = `term_${Date.now()}`;
    const item: Term = { ...data, id };
    if (item.isCurrent) {
      for (const [tId, term] of this.terms.entries()) {
        if (term.organizationId === data.organizationId && tId !== id) {
          term.isCurrent = false;
        }
      }
    }
    this.terms.set(id, item);
    return item;
  }

  updateTerm(id: string, organizationId: string, updates: Partial<Term>): Term | undefined {
    const item = this.getTermById(id, organizationId);
    if (!item) return undefined;
    if (updates.isCurrent) {
      for (const [tId, term] of this.terms.entries()) {
        if (term.organizationId === organizationId && tId !== id) {
          term.isCurrent = false;
        }
      }
    }
    const updated: Term = { ...item, ...updates };
    this.terms.set(id, updated);
    return updated;
  }

  deleteTerm(id: string, organizationId: string): boolean {
    const item = this.getTermById(id, organizationId);
    if (!item) return false;
    this.terms.delete(id);
    return true;
  }

  getGradeLevels(organizationId: string): GradeLevel[] {
    return Array.from(this.gradeLevels.values())
      .filter((g) => g.organizationId === organizationId)
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }

  getGradeLevelById(id: string, organizationId: string): GradeLevel | undefined {
    const gl = this.gradeLevels.get(id);
    if (!gl || gl.organizationId !== organizationId) return undefined;
    return gl;
  }

  createGradeLevel(data: Omit<GradeLevel, 'id'>): GradeLevel {
    const id = `grade_${Date.now()}`;
    const item: GradeLevel = { ...data, id };
    this.gradeLevels.set(id, item);
    return item;
  }

  updateGradeLevel(id: string, organizationId: string, updates: Partial<GradeLevel>): GradeLevel | undefined {
    const gl = this.getGradeLevelById(id, organizationId);
    if (!gl) return undefined;
    const updated: GradeLevel = { ...gl, ...updates };
    this.gradeLevels.set(id, updated);
    return updated;
  }

  deleteGradeLevel(id: string, organizationId: string): boolean {
    const gl = this.getGradeLevelById(id, organizationId);
    if (!gl) return false;
    this.gradeLevels.delete(id);
    return true;
  }

  getClassrooms(organizationId: string, gradeLevelId?: string): Classroom[] {
    return Array.from(this.classrooms.values()).filter((c) => {
      if (c.organizationId !== organizationId) return false;
      if (gradeLevelId && c.gradeLevelId !== gradeLevelId) return false;
      return true;
    });
  }

  getClassroomById(id: string, organizationId: string): Classroom | undefined {
    const c = this.classrooms.get(id);
    if (!c || c.organizationId !== organizationId) return undefined;
    return c;
  }

  createClassroom(data: Omit<Classroom, 'id'>): Classroom {
    const id = `class_${Date.now()}`;
    const item: Classroom = { ...data, id };
    this.classrooms.set(id, item);
    return item;
  }

  updateClassroom(id: string, organizationId: string, updates: Partial<Classroom>): Classroom | undefined {
    const c = this.getClassroomById(id, organizationId);
    if (!c) return undefined;
    const updated: Classroom = { ...c, ...updates };
    this.classrooms.set(id, updated);
    return updated;
  }

  deleteClassroom(id: string, organizationId: string): boolean {
    const c = this.getClassroomById(id, organizationId);
    if (!c) return false;
    this.classrooms.delete(id);
    return true;
  }

  getSubjects(organizationId: string): Subject[] {
    return Array.from(this.subjects.values()).filter((s) => s.organizationId === organizationId);
  }

  getSubjectById(id: string, organizationId: string): Subject | undefined {
    const s = this.subjects.get(id);
    if (!s || s.organizationId !== organizationId) return undefined;
    return s;
  }

  createSubject(data: Omit<Subject, 'id'>): Subject {
    const id = `sub_${Date.now()}`;
    const item: Subject = { ...data, id };
    this.subjects.set(id, item);
    return item;
  }

  updateSubject(id: string, organizationId: string, updates: Partial<Subject>): Subject | undefined {
    const s = this.getSubjectById(id, organizationId);
    if (!s) return undefined;
    const updated: Subject = { ...s, ...updates };
    this.subjects.set(id, updated);
    return updated;
  }

  deleteSubject(id: string, organizationId: string): boolean {
    const s = this.getSubjectById(id, organizationId);
    if (!s) return false;
    this.subjects.delete(id);
    return true;
  }

  // Courses
  getCourses(organizationId: string, teacherId?: string, classroomId?: string): Course[] {
    return Array.from(this.courses.values()).filter((c) => {
      if (c.organizationId !== organizationId) return false;
      if (teacherId && c.teacherId !== teacherId) return false;
      if (classroomId && c.classroomId !== classroomId) return false;
      return true;
    });
  }

  getCourseById(courseId: string, organizationId: string): Course | undefined {
    const course = this.courses.get(courseId);
    if (!course || course.organizationId !== organizationId) return undefined;
    return course;
  }

  createCourse(data: Omit<Course, 'id'>): Course {
    const id = `crs_${Date.now()}`;
    const subject = data.subjectId ? this.subjects.get(data.subjectId) : undefined;
    const teacher = data.teacherId ? this.users.get(data.teacherId) : undefined;
    const classroom = data.classroomId ? this.classrooms.get(data.classroomId) : undefined;

    const course: Course = {
      ...data,
      id,
      subjectName: subject?.name,
      teacherName: teacher?.fullName,
      classroomName: classroom?.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.courses.set(id, course);
    return course;
  }

  updateCourse(id: string, organizationId: string, updates: Partial<Course>): Course | undefined {
    const course = this.getCourseById(id, organizationId);
    if (!course) return undefined;
    const subject = updates.subjectId ? this.subjects.get(updates.subjectId) : undefined;
    const teacher = updates.teacherId ? this.users.get(updates.teacherId) : undefined;
    const classroom = updates.classroomId ? this.classrooms.get(updates.classroomId) : undefined;

    const updated: Course = {
      ...course,
      ...updates,
      subjectName: subject ? subject.name : course.subjectName,
      teacherName: teacher ? teacher.fullName : course.teacherName,
      classroomName: classroom ? classroom.name : course.classroomName,
      updatedAt: new Date().toISOString(),
    };
    this.courses.set(id, updated);
    return updated;
  }

  deleteCourse(id: string, organizationId: string): boolean {
    const course = this.getCourseById(id, organizationId);
    if (!course) return false;
    this.courses.delete(id);
    return true;
  }

  // --- Teacher Assignments ---
  getTeacherAssignments(
    organizationId: string,
    filters?: { teacherId?: string; courseId?: string; classroomId?: string; academicYearId?: string; subjectId?: string }
  ): TeacherAssignment[] {
    return Array.from(this.teacherAssignments.values()).filter((ta) => {
      if (ta.organizationId !== organizationId) return false;
      if (filters?.teacherId && ta.teacherId !== filters.teacherId) return false;
      if (filters?.courseId && ta.courseId !== filters.courseId) return false;
      if (filters?.classroomId && ta.classroomId !== filters.classroomId) return false;
      if (filters?.academicYearId && ta.academicYearId !== filters.academicYearId) return false;
      if (filters?.subjectId && ta.subjectId !== filters.subjectId) return false;
      return true;
    });
  }

  getTeacherAssignmentById(id: string, organizationId: string): TeacherAssignment | undefined {
    const ta = this.teacherAssignments.get(id);
    if (!ta || ta.organizationId !== organizationId) return undefined;
    return ta;
  }

  createTeacherAssignment(
    data: Omit<TeacherAssignment, 'id' | 'createdAt' | 'updatedAt'>
  ): TeacherAssignment {
    const id = `ta_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const teacher = this.getUserById(data.teacherId, data.organizationId);
    const subject = this.getSubjectById(data.subjectId, data.organizationId);
    const classroom = this.getClassroomById(data.classroomId, data.organizationId);
    const course = data.courseId ? this.getCourseById(data.courseId, data.organizationId) : undefined;
    const year = data.academicYearId ? this.getAcademicYearById(data.academicYearId, data.organizationId) : undefined;

    const now = new Date().toISOString();
    const assignment: TeacherAssignment = {
      ...data,
      id,
      teacherName: teacher?.fullName,
      teacherEmail: teacher?.email,
      subjectName: subject?.name,
      classroomName: classroom?.name,
      courseTitle: course?.title,
      academicYearName: year?.name,
      createdAt: now,
      updatedAt: now,
    };
    this.teacherAssignments.set(id, assignment);
    return assignment;
  }

  updateTeacherAssignment(
    id: string,
    organizationId: string,
    updates: Partial<TeacherAssignment>
  ): TeacherAssignment | undefined {
    const ta = this.getTeacherAssignmentById(id, organizationId);
    if (!ta) return undefined;
    const teacher = updates.teacherId ? this.getUserById(updates.teacherId, organizationId) : undefined;
    const subject = updates.subjectId ? this.getSubjectById(updates.subjectId, organizationId) : undefined;
    const classroom = updates.classroomId ? this.getClassroomById(updates.classroomId, organizationId) : undefined;

    const updated: TeacherAssignment = {
      ...ta,
      ...updates,
      teacherName: teacher ? teacher.fullName : ta.teacherName,
      teacherEmail: teacher ? teacher.email : ta.teacherEmail,
      subjectName: subject ? subject.name : ta.subjectName,
      classroomName: classroom ? classroom.name : ta.classroomName,
      updatedAt: new Date().toISOString(),
    };
    this.teacherAssignments.set(id, updated);
    return updated;
  }

  deleteTeacherAssignment(id: string, organizationId: string): boolean {
    const ta = this.getTeacherAssignmentById(id, organizationId);
    if (!ta) return false;
    this.teacherAssignments.delete(id);
    return true;
  }

  // --- Student Enrollments ---
  getStudentEnrollments(
    organizationId: string,
    filters?: { classroomId?: string; studentId?: string; academicYearId?: string; status?: StudentEnrollmentStatus }
  ): StudentEnrollment[] {
    return Array.from(this.studentEnrollments.values()).filter((enr) => {
      if (enr.organizationId !== organizationId) return false;
      if (filters?.classroomId && enr.classroomId !== filters.classroomId) return false;
      if (filters?.studentId && enr.studentId !== filters.studentId) return false;
      if (filters?.academicYearId && enr.academicYearId !== filters.academicYearId) return false;
      if (filters?.status && enr.status !== filters.status) return false;
      return true;
    });
  }

  getStudentEnrollmentById(id: string, organizationId: string): StudentEnrollment | undefined {
    const enr = this.studentEnrollments.get(id);
    if (!enr || enr.organizationId !== organizationId) return undefined;
    return enr;
  }

  createStudentEnrollment(
    data: Omit<StudentEnrollment, 'id' | 'enrolledAt' | 'updatedAt'>
  ): StudentEnrollment {
    const id = `enr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const student = this.getUserById(data.studentId, data.organizationId);
    const classroom = this.getClassroomById(data.classroomId, data.organizationId);
    const gradeLevel = classroom ? this.getGradeLevelById(classroom.gradeLevelId, data.organizationId) : undefined;
    const year = this.getAcademicYearById(data.academicYearId, data.organizationId);

    const now = new Date().toISOString();
    const enrollment: StudentEnrollment = {
      ...data,
      id,
      studentName: student?.fullName,
      studentEmail: student?.email,
      studentIdNumber: student?.studentIdNumber,
      classroomName: classroom?.name,
      gradeLevelId: classroom?.gradeLevelId,
      gradeLevelName: gradeLevel?.name,
      academicYearName: year?.name,
      enrolledAt: now,
      updatedAt: now,
    };
    this.studentEnrollments.set(id, enrollment);

    // Sync classroomId onto student user if active
    if (student && data.classroomId) {
      this.updateUser(student.id, data.organizationId, { classroomId: data.classroomId });
    }

    return enrollment;
  }

  updateStudentEnrollment(
    id: string,
    organizationId: string,
    updates: Partial<StudentEnrollment>
  ): StudentEnrollment | undefined {
    const enr = this.getStudentEnrollmentById(id, organizationId);
    if (!enr) return undefined;
    const classroom = updates.classroomId ? this.getClassroomById(updates.classroomId, organizationId) : undefined;
    const gradeLevel = classroom ? this.getGradeLevelById(classroom.gradeLevelId, organizationId) : undefined;

    const updated: StudentEnrollment = {
      ...enr,
      ...updates,
      classroomName: classroom ? classroom.name : enr.classroomName,
      gradeLevelId: classroom ? classroom.gradeLevelId : enr.gradeLevelId,
      gradeLevelName: gradeLevel ? gradeLevel.name : enr.gradeLevelName,
      updatedAt: new Date().toISOString(),
    };
    this.studentEnrollments.set(id, updated);
    return updated;
  }

  deleteStudentEnrollment(id: string, organizationId: string): boolean {
    const enr = this.getStudentEnrollmentById(id, organizationId);
    if (!enr) return false;
    this.studentEnrollments.delete(id);
    return true;
  }

  getStudentsByClassroom(classroomId: string, organizationId: string): User[] {
    const enrollments = this.getStudentEnrollments(organizationId, { classroomId, status: 'ACTIVE' });
    const students: User[] = [];
    for (const enr of enrollments) {
      const u = this.getUserById(enr.studentId, organizationId);
      if (u) students.push(u);
    }
    // Also include any users directly tagged with classroomId
    const directUsers = Array.from(this.users.values()).filter(
      (u) => u.organizationId === organizationId && u.role === 'STUDENT' && u.classroomId === classroomId
    );
    for (const du of directUsers) {
      if (!students.some((s) => s.id === du.id)) {
        students.push(du);
      }
    }
    return students;
  }

  // --- Parent Student Links ---
  getParentStudentLinks(
    organizationId: string,
    filters?: { parentId?: string; studentId?: string }
  ): ParentStudentLink[] {
    return Array.from(this.parentStudentLinks.values()).filter((link) => {
      if (link.organizationId !== organizationId) return false;
      if (filters?.parentId && link.parentId !== filters.parentId) return false;
      if (filters?.studentId && link.studentId !== filters.studentId) return false;
      return true;
    });
  }

  createParentStudentLink(
    data: Omit<ParentStudentLink, 'id' | 'createdAt'>
  ): ParentStudentLink {
    const id = `psl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const parent = this.getUserById(data.parentId, data.organizationId);
    const student = this.getUserById(data.studentId, data.organizationId);

    const link: ParentStudentLink = {
      ...data,
      id,
      parentName: parent?.fullName,
      studentName: student?.fullName,
      createdAt: new Date().toISOString(),
    };
    this.parentStudentLinks.set(id, link);
    return link;
  }

  deleteParentStudentLink(id: string, organizationId: string): boolean {
    const link = this.parentStudentLinks.get(id);
    if (!link || link.organizationId !== organizationId) return false;
    this.parentStudentLinks.delete(id);
    return true;
  }

  // --- Student Records (Full SIS Profile, Demographics, Medical & Emergency) ---
  getStudentRecords(
    organizationId: string,
    filters?: { status?: StudentLifecycleStatus; search?: string; studentId?: string }
  ): StudentRecord[] {
    return Array.from(this.studentRecords.values()).filter((rec) => {
      if (rec.organizationId !== organizationId) return false;
      if (filters?.status && rec.status !== filters.status) return false;
      if (filters?.studentId && rec.studentId !== filters.studentId) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase().trim();
        const user = this.getUserById(rec.studentId, organizationId);
        const matchName = user?.fullName.toLowerCase().includes(q);
        const matchEmail = user?.email.toLowerCase().includes(q);
        const matchNationalId = rec.nationalId.toLowerCase().includes(q);
        const matchStdId = user?.studentIdNumber?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchNationalId && !matchStdId) return false;
      }
      return true;
    });
  }

  getStudentRecordById(id: string, organizationId: string): StudentRecord | undefined {
    const rec = this.studentRecords.get(id);
    if (!rec || rec.organizationId !== organizationId) return undefined;
    return rec;
  }

  getStudentRecordByStudentId(studentId: string, organizationId: string): StudentRecord | undefined {
    return Array.from(this.studentRecords.values()).find(
      (rec) => rec.organizationId === organizationId && rec.studentId === studentId
    );
  }

  getStudentRecordByNationalId(nationalId: string, organizationId: string): StudentRecord | undefined {
    return Array.from(this.studentRecords.values()).find(
      (rec) => rec.organizationId === organizationId && rec.nationalId === nationalId
    );
  }

  createStudentRecord(
    data: Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): StudentRecord {
    const id = `std_rec_${data.studentId}`;
    const now = new Date().toISOString();
    const record: StudentRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.studentRecords.set(id, record);
    return record;
  }

  updateStudentRecord(
    studentId: string,
    organizationId: string,
    updates: Partial<StudentRecord>
  ): StudentRecord | undefined {
    const rec = this.getStudentRecordByStudentId(studentId, organizationId);
    if (!rec) return undefined;

    const updated: StudentRecord = {
      ...rec,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.studentRecords.set(rec.id, updated);
    return updated;
  }

  deleteStudentRecord(studentId: string, organizationId: string): boolean {
    const rec = this.getStudentRecordByStudentId(studentId, organizationId);
    if (!rec) return false;
    this.studentRecords.delete(rec.id);
    return true;
  }

  // --- Student Behavior & Merit Records ---
  getStudentBehaviorRecords(
    organizationId: string,
    filters?: { studentId?: string; type?: StudentBehaviorType; status?: string }
  ): StudentBehaviorRecord[] {
    return Array.from(this.studentBehaviorRecords.values())
      .filter((beh) => {
        if (beh.organizationId !== organizationId) return false;
        if (filters?.studentId && beh.studentId !== filters.studentId) return false;
        if (filters?.type && beh.type !== filters.type) return false;
        if (filters?.status && beh.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
  }

  getStudentBehaviorRecordById(id: string, organizationId: string): StudentBehaviorRecord | undefined {
    const beh = this.studentBehaviorRecords.get(id);
    if (!beh || beh.organizationId !== organizationId) return undefined;
    return beh;
  }

  createStudentBehaviorRecord(
    data: Omit<StudentBehaviorRecord, 'id' | 'createdAt'>
  ): StudentBehaviorRecord {
    const id = `beh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const student = this.getUserById(data.studentId, data.organizationId);
    const recordedByUser = this.getUserById(data.recordedBy, data.organizationId);

    const record: StudentBehaviorRecord = {
      ...data,
      id,
      studentName: student?.fullName,
      recordedByName: recordedByUser?.fullName,
      createdAt: new Date().toISOString(),
    };
    this.studentBehaviorRecords.set(id, record);
    return record;
  }

  updateStudentBehaviorRecord(
    id: string,
    organizationId: string,
    updates: Partial<StudentBehaviorRecord>
  ): StudentBehaviorRecord | undefined {
    const beh = this.getStudentBehaviorRecordById(id, organizationId);
    if (!beh) return undefined;

    const updated: StudentBehaviorRecord = {
      ...beh,
      ...updates,
    };
    this.studentBehaviorRecords.set(id, updated);
    return updated;
  }

  deleteStudentBehaviorRecord(id: string, organizationId: string): boolean {
    const beh = this.getStudentBehaviorRecordById(id, organizationId);
    if (!beh) return false;
    this.studentBehaviorRecords.delete(id);
    return true;
  }

  // --- Student Lifecycle Events ---
  getStudentLifecycleEvents(organizationId: string, studentId?: string): StudentLifecycleEvent[] {
    return Array.from(this.studentLifecycleEvents.values())
      .filter((ev) => {
        if (ev.organizationId !== organizationId) return false;
        if (studentId && ev.studentId !== studentId) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  createStudentLifecycleEvent(
    data: Omit<StudentLifecycleEvent, 'id' | 'timestamp'>
  ): StudentLifecycleEvent {
    const id = `lce_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const student = this.getUserById(data.studentId, data.organizationId);
    const actionUser = this.getUserById(data.actionBy, data.organizationId);

    const event: StudentLifecycleEvent = {
      ...data,
      id,
      studentName: student?.fullName,
      actionByName: actionUser?.fullName,
      timestamp: new Date().toISOString(),
    };
    this.studentLifecycleEvents.set(id, event);
    return event;
  }

  // --- Comprehensive Student Dossier (Holistic SIS Record) ---
  getStudentDossier(studentId: string, organizationId: string): StudentDossier | null {
    const student = this.getUserById(studentId, organizationId);
    if (!student || student.role !== 'STUDENT') return null;

    const record = this.getStudentRecordByStudentId(studentId, organizationId);
    const enrollments = this.getStudentEnrollments(organizationId, { studentId });
    const currentEnrollment = enrollments.find((e) => e.status === 'ACTIVE') || enrollments[0];
    const parents = this.getParentStudentLinks(organizationId, { studentId });
    const behaviorRecords = this.getStudentBehaviorRecords(organizationId, { studentId });
    const behaviorPointsTotal = behaviorRecords.reduce((acc, r) => acc + (r.points || 0), 0);

    // Attendance stats
    const studentAttendance = Array.from(this.attendanceRecords.values()).filter(
      (a) => a.organizationId === organizationId && a.studentId === studentId
    );
    const totalDays = studentAttendance.length;
    const presentDays = studentAttendance.filter((a) => a.status === 'PRESENT').length;
    const absentDays = studentAttendance.filter((a) => a.status === 'ABSENT').length;
    const lateDays = studentAttendance.filter((a) => a.status === 'LATE').length;
    const excusedDays = studentAttendance.filter((a) => a.status === 'EXCUSED').length;
    const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays + excusedDays) / totalDays) * 100) : 100;

    // Academic performance stats
    const submissions = this.getSubmissionsByStudent(studentId, organizationId);
    const courses = student.classroomId ? this.getCoursesByClassroom(student.classroomId, organizationId) : [];
    let scoreSum = 0;
    let gradedCount = 0;
    for (const sub of submissions) {
      if (typeof sub.score === 'number') {
        const assignment = this.getAssignmentById(sub.assignmentId, organizationId);
        const maxScore = assignment?.maxScore || 100;
        scoreSum += (sub.score / maxScore) * 100;
        gradedCount++;
      }
    }
    const averageScore = gradedCount > 0 ? Math.round(scoreSum / gradedCount) : 92;

    const lifecycleHistory = this.getStudentLifecycleEvents(organizationId, studentId);

    return {
      student,
      record,
      enrollments,
      currentEnrollment,
      parents,
      behaviorRecords,
      behaviorPointsTotal,
      attendanceStats: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendanceRate,
      },
      academicStats: {
        enrolledCoursesCount: courses.length,
        submissionsCount: submissions.length,
        averageScore,
      },
      lifecycleHistory,
    };
  }

  // Lessons
  getLessonsByCourse(courseId: string, organizationId: string): Lesson[] {
    return Array.from(this.lessons.values())
      .filter((l) => l.organizationId === organizationId && l.courseId === courseId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  getLessonById(lessonId: string, organizationId: string): Lesson | undefined {
    const lesson = this.lessons.get(lessonId);
    if (!lesson || lesson.organizationId !== organizationId) return undefined;
    return lesson;
  }

  createLesson(data: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Lesson {
    const id = `les_${Date.now()}`;
    const now = new Date().toISOString();
    const lesson: Lesson = { ...data, id, createdAt: now, updatedAt: now };
    this.lessons.set(id, lesson);
    return lesson;
  }

  updateLesson(id: string, organizationId: string, updates: Partial<Lesson>): Lesson | undefined {
    const lesson = this.getLessonById(id, organizationId);
    if (!lesson) return undefined;
    const updated: Lesson = { ...lesson, ...updates, updatedAt: new Date().toISOString() };
    this.lessons.set(id, updated);
    return updated;
  }

  deleteLesson(id: string, organizationId: string): boolean {
    const lesson = this.getLessonById(id, organizationId);
    if (!lesson) return false;
    this.lessons.delete(id);
    return true;
  }

  // Assignments
  getAssignmentsByCourse(courseId: string, organizationId: string): Assignment[] {
    return Array.from(this.assignments.values()).filter(
      (a) => a.organizationId === organizationId && a.courseId === courseId
    );
  }

  getAssignmentsByOrg(organizationId: string): Assignment[] {
    return Array.from(this.assignments.values()).filter((a) => a.organizationId === organizationId);
  }

  getAssignmentById(id: string, organizationId: string): Assignment | undefined {
    const asg = this.assignments.get(id);
    if (!asg || asg.organizationId !== organizationId) return undefined;
    return asg;
  }

  createAssignment(data: Omit<Assignment, 'id' | 'createdAt'>): Assignment {
    const id = `asg_${Date.now()}`;
    const asg: Assignment = { ...data, id, createdAt: new Date().toISOString() };
    this.assignments.set(id, asg);
    return asg;
  }

  // Submissions
  getSubmissionsByAssignment(assignmentId: string, organizationId: string): Submission[] {
    return Array.from(this.submissions.values()).filter(
      (s) => s.organizationId === organizationId && s.assignmentId === assignmentId
    );
  }

  getSubmissionByStudent(assignmentId: string, studentId: string, organizationId: string): Submission | undefined {
    return Array.from(this.submissions.values()).find(
      (s) => s.organizationId === organizationId && s.assignmentId === assignmentId && s.studentId === studentId
    );
  }

  getSubmissionsByStudent(studentId: string, organizationId: string): Submission[] {
    return Array.from(this.submissions.values()).filter(
      (s) => s.organizationId === organizationId && s.studentId === studentId
    );
  }

  submitAssignment(data: Omit<Submission, 'id' | 'submittedAt'>): Submission {
    const existing = this.getSubmissionByStudent(data.assignmentId, data.studentId, data.organizationId);
    const now = new Date().toISOString();
    const student = this.getUserById(data.studentId, data.organizationId);

    if (existing) {
      const updated: Submission = {
        ...existing,
        submissionText: data.submissionText,
        fileAttachmentUrl: data.fileAttachmentUrl,
        submittedAt: now,
      };
      this.submissions.set(existing.id, updated);
      return updated;
    }

    const id = `sub_${Date.now()}`;
    const sub: Submission = {
      ...data,
      id,
      studentName: student?.fullName,
      submittedAt: now,
    };
    this.submissions.set(id, sub);
    return sub;
  }

  gradeSubmission(
    submissionId: string,
    organizationId: string,
    score: number,
    teacherFeedback?: string
  ): Submission | undefined {
    const sub = this.submissions.get(submissionId);
    if (!sub || sub.organizationId !== organizationId) return undefined;
    const updated: Submission = {
      ...sub,
      score,
      teacherFeedback,
      gradedAt: new Date().toISOString(),
    };
    this.submissions.set(submissionId, updated);
    return updated;
  }

  // --- Attendance Sessions & Roll Calls ---
  async syncAcademicDataFromPostgres(organizationId?: string): Promise<void> {
    const pool = getPostgresPool();
    if (!pool) return;

    try {
      // 1. Sync Attendance Sessions
      let sessionsQuery = 'SELECT * FROM attendance_sessions';
      const sessionsParams: any[] = [];
      if (organizationId) {
        sessionsQuery += ' WHERE organization_id = $1';
        sessionsParams.push(organizationId);
      }
      const sessRes = await pool.query(sessionsQuery, sessionsParams);
      for (const row of sessRes.rows) {
        const classroom = this.getClassroomById(row.classroom_id, row.organization_id);
        const course = row.course_id ? this.getCourseById(row.course_id, row.organization_id) : undefined;
        const openedUser = this.getUserById(row.opened_by, row.organization_id);
        const session: AttendanceSession = {
          id: row.id,
          organizationId: row.organization_id,
          classroomId: row.classroom_id,
          classroomName: classroom?.name,
          courseId: row.course_id || undefined,
          courseTitle: course?.title,
          date: row.date ? new Date(row.date).toISOString().split('T')[0] : row.date,
          periodNumber: row.period_number || undefined,
          title: row.title || undefined,
          status: row.status,
          openedBy: row.opened_by,
          openedByName: openedUser?.fullName,
          presentCount: Number(row.present_count) || 0,
          absentCount: Number(row.absent_count) || 0,
          lateCount: Number(row.late_count) || 0,
          excusedCount: Number(row.excused_count) || 0,
          totalStudents: Number(row.total_students) || 0,
          createdAt: row.created_at?.toISOString ? row.created_at.toISOString() : (row.created_at || new Date().toISOString()),
          updatedAt: row.updated_at?.toISOString ? row.updated_at.toISOString() : (row.updated_at || new Date().toISOString()),
        };
        this.attendanceSessions.set(session.id, session);
      }

      // 2. Sync Attendance Records
      let recordsQuery = 'SELECT * FROM attendance_records';
      const recordsParams: any[] = [];
      if (organizationId) {
        recordsQuery += ' WHERE organization_id = $1';
        recordsParams.push(organizationId);
      }
      const recsRes = await pool.query(recordsQuery, recordsParams);
      for (const row of recsRes.rows) {
        const student = this.getUserById(row.student_id, row.organization_id);
        const classroom = this.getClassroomById(row.classroom_id, row.organization_id);
        const recordedUser = row.recorded_by ? this.getUserById(row.recorded_by, row.organization_id) : undefined;
        const record: AttendanceRecord = {
          id: row.id,
          organizationId: row.organization_id,
          sessionId: row.session_id || undefined,
          courseId: row.course_id || undefined,
          classroomId: row.classroom_id,
          classroomName: classroom?.name,
          studentId: row.student_id,
          studentName: student?.fullName,
          studentIdNumber: student?.studentIdNumber,
          recordedBy: row.recorded_by || undefined,
          recordedByName: recordedUser?.fullName,
          date: row.date ? new Date(row.date).toISOString().split('T')[0] : row.date,
          status: row.status,
          notes: row.notes || undefined,
          createdAt: row.created_at?.toISOString ? row.created_at.toISOString() : (row.created_at || new Date().toISOString()),
          updatedAt: row.updated_at?.toISOString ? row.updated_at.toISOString() : (row.updated_at || new Date().toISOString()),
        };
        this.attendanceRecords.set(record.id, record);
      }

      // 3. Sync Assessments
      let assessmentsQuery = 'SELECT * FROM assessments';
      const assessmentsParams: any[] = [];
      if (organizationId) {
        assessmentsQuery += ' WHERE organization_id = $1';
        assessmentsParams.push(organizationId);
      }
      const assRes = await pool.query(assessmentsQuery, assessmentsParams);
      for (const row of assRes.rows) {
        const course = this.getCourseById(row.course_id, row.organization_id);
        const subject = row.subject_id ? this.getSubjectById(row.subject_id, row.organization_id) : course ? this.getSubjectById(course.subjectId, row.organization_id) : undefined;
        const classroom = row.classroom_id ? this.getClassroomById(row.classroom_id, row.organization_id) : course?.classroomId ? this.getClassroomById(course.classroomId, row.organization_id) : undefined;
        const term = row.term_id ? this.getTermById(row.term_id, row.organization_id) : course?.termId ? this.getTermById(course.termId, row.organization_id) : undefined;
        const creator = row.created_by ? this.getUserById(row.created_by, row.organization_id) : undefined;

        const assessment: Assessment = {
          id: row.id,
          organizationId: row.organization_id,
          courseId: row.course_id,
          courseTitle: course?.title,
          subjectId: row.subject_id || course?.subjectId,
          subjectName: subject?.name || course?.subjectName,
          classroomId: row.classroom_id || course?.classroomId,
          classroomName: classroom?.name || course?.classroomName,
          termId: row.term_id || course?.termId,
          termName: term?.name,
          academicYearId: row.academic_year_id || undefined,
          title: row.title,
          description: row.description || undefined,
          category: row.category,
          maxScore: Number(row.max_score) || 100,
          weightPercentage: Number(row.weight_percentage) || 100,
          dueDate: row.due_date?.toISOString ? row.due_date.toISOString() : row.due_date,
          assessmentDate: row.assessment_date ? new Date(row.assessment_date).toISOString().split('T')[0] : row.assessment_date,
          status: row.status,
          createdBy: row.created_by || undefined,
          createdByName: creator?.fullName,
          createdAt: row.created_at?.toISOString ? row.created_at.toISOString() : (row.created_at || new Date().toISOString()),
          updatedAt: row.updated_at?.toISOString ? row.updated_at.toISOString() : (row.updated_at || new Date().toISOString()),
        };
        this.assessments.set(assessment.id, assessment);
      }

      // 4. Sync Assessment Grades
      let gradesQuery = 'SELECT * FROM assessment_grades';
      const gradesParams: any[] = [];
      if (organizationId) {
        gradesQuery += ' WHERE organization_id = $1';
        gradesParams.push(organizationId);
      }
      const gradesRes = await pool.query(gradesQuery, gradesParams);
      for (const row of gradesRes.rows) {
        const student = this.getUserById(row.student_id, row.organization_id);
        const assessment = this.getAssessmentById(row.assessment_id, row.organization_id);
        const grader = row.graded_by ? this.getUserById(row.graded_by, row.organization_id) : undefined;
        const maxScore = assessment?.maxScore || 100;
        const score = Number(row.score) || 0;
        const percentage = maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0;

        const grade: AssessmentGrade = {
          id: row.id,
          organizationId: row.organization_id,
          assessmentId: row.assessment_id,
          assessmentTitle: assessment?.title,
          studentId: row.student_id,
          studentName: student?.fullName,
          studentIdNumber: student?.studentIdNumber,
          score,
          maxScore,
          percentage,
          feedback: row.feedback || undefined,
          gradedBy: row.graded_by || undefined,
          gradedByName: grader?.fullName,
          gradedAt: row.graded_at?.toISOString ? row.graded_at.toISOString() : (row.graded_at || new Date().toISOString()),
          updatedAt: row.updated_at?.toISOString ? row.updated_at.toISOString() : (row.updated_at || new Date().toISOString()),
        };
        this.assessmentGrades.set(grade.id, grade);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.error('[PostgreSQL Academic Sync Warning]:', (err as Error).message);
    }
  }

  private persistAttendanceSessionToPostgres(session: AttendanceSession): void {
    const pool = getPostgresPool();
    if (!pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PostgreSQL is required in production environment.');
      }
      return;
    }
    pool.query(
      `INSERT INTO attendance_sessions (
        id, organization_id, classroom_id, course_id, date, period_number, title, status, opened_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        classroom_id = EXCLUDED.classroom_id,
        course_id = EXCLUDED.course_id,
        date = EXCLUDED.date,
        period_number = EXCLUDED.period_number,
        title = EXCLUDED.title,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at;`,
      [
        session.id,
        session.organizationId,
        session.classroomId,
        session.courseId || null,
        session.date,
        session.periodNumber || 1,
        session.title || null,
        session.status,
        session.openedBy,
        session.createdAt,
        session.updatedAt,
      ]
    ).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist attendance session', err);
        throw err;
      }
      console.error('[PostgreSQL Session Persist Warning]:', (err as Error).message);
    });
  }

  private deleteAttendanceSessionFromPostgres(id: string, organizationId: string): void {
    const pool = getPostgresPool();
    if (!pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PostgreSQL is required in production environment.');
      }
      return;
    }
    pool.query('DELETE FROM attendance_sessions WHERE id = $1 AND organization_id = $2', [id, organizationId]).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.error('[PostgreSQL Delete Session Warning]:', (err as Error).message);
    });
  }

  private persistAttendanceRecordToPostgres(rec: AttendanceRecord): void {
    const pool = getPostgresPool();
    if (!pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PostgreSQL is required in production environment.');
      }
      return;
    }
    pool.query(
      `INSERT INTO attendance_records (
        id, organization_id, session_id, course_id, classroom_id, student_id, recorded_by, date, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        session_id = EXCLUDED.session_id,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        recorded_by = EXCLUDED.recorded_by,
        updated_at = EXCLUDED.updated_at;`,
      [
        rec.id,
        rec.organizationId,
        rec.sessionId || null,
        rec.courseId || null,
        rec.classroomId,
        rec.studentId,
        rec.recordedBy || null,
        rec.date,
        rec.status,
        rec.notes || null,
        rec.createdAt,
        rec.updatedAt,
      ]
    ).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist attendance record', err);
        throw err;
      }
      console.error('[PostgreSQL Record Persist Warning]:', (err as Error).message);
    });
  }

  private persistAssessmentToPostgres(assessment: Assessment): void {
    const pool = getPostgresPool();
    if (!pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PostgreSQL is required in production environment.');
      }
      return;
    }
    pool.query(
      `INSERT INTO assessments (
        id, organization_id, course_id, subject_id, classroom_id, term_id, academic_year_id,
        title, description, category, max_score, weight_percentage, due_date, assessment_date,
        status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        max_score = EXCLUDED.max_score,
        weight_percentage = EXCLUDED.weight_percentage,
        due_date = EXCLUDED.due_date,
        assessment_date = EXCLUDED.assessment_date,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at;`,
      [
        assessment.id,
        assessment.organizationId,
        assessment.courseId,
        assessment.subjectId || null,
        assessment.classroomId || null,
        assessment.termId || null,
        assessment.academicYearId || null,
        assessment.title,
        assessment.description || null,
        assessment.category,
        assessment.maxScore,
        assessment.weightPercentage,
        assessment.dueDate || null,
        assessment.assessmentDate || null,
        assessment.status,
        assessment.createdBy || null,
        assessment.createdAt,
        assessment.updatedAt,
      ]
    ).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist assessment', err);
        throw err;
      }
      console.error('[PostgreSQL Assessment Persist Warning]:', (err as Error).message);
    });
  }

  private deleteAssessmentFromPostgres(id: string, organizationId: string): void {
    const pool = getPostgresPool();
    if (!pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PostgreSQL is required in production environment.');
      }
      return;
    }
    pool.query('DELETE FROM assessments WHERE id = $1 AND organization_id = $2', [id, organizationId]).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.error('[PostgreSQL Delete Assessment Warning]:', (err as Error).message);
    });
  }

  private persistAssessmentGradeToPostgres(grade: AssessmentGrade): void {
    const pool = getPostgresPool();
    if (!pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PostgreSQL is required in production environment.');
      }
      return;
    }
    pool.query(
      `INSERT INTO assessment_grades (
        id, organization_id, assessment_id, student_id, score, feedback, graded_by, graded_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        score = EXCLUDED.score,
        feedback = EXCLUDED.feedback,
        graded_by = EXCLUDED.graded_by,
        graded_at = EXCLUDED.graded_at,
        updated_at = EXCLUDED.updated_at;`,
      [
        grade.id,
        grade.organizationId,
        grade.assessmentId,
        grade.studentId,
        grade.score,
        grade.feedback || null,
        grade.gradedBy || null,
        grade.gradedAt,
        grade.updatedAt,
      ]
    ).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist assessment grade', err);
        throw err;
      }
      console.error('[PostgreSQL Grade Persist Warning]:', (err as Error).message);
    });
  }

  private deleteAssessmentGradeFromPostgres(id: string, organizationId: string): void {
    const pool = getPostgresPool();
    if (!pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PostgreSQL is required in production environment.');
      }
      return;
    }
    pool.query('DELETE FROM assessment_grades WHERE id = $1 AND organization_id = $2', [id, organizationId]).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      console.error('[PostgreSQL Delete Grade Warning]:', (err as Error).message);
    });
  }

  getAttendanceSessions(
    organizationId: string,
    filters?: { classroomId?: string; courseId?: string; date?: string; status?: AttendanceSessionStatus }
  ): AttendanceSession[] {
    return Array.from(this.attendanceSessions.values())
      .filter((s) => {
        if (s.organizationId !== organizationId) return false;
        if (filters?.classroomId && s.classroomId !== filters.classroomId) return false;
        if (filters?.courseId && s.courseId !== filters.courseId) return false;
        if (filters?.date && s.date !== filters.date) return false;
        if (filters?.status && s.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getAttendanceSessionById(id: string, organizationId: string): AttendanceSession | undefined {
    const s = this.attendanceSessions.get(id);
    if (!s || s.organizationId !== organizationId) return undefined;
    return s;
  }

  createAttendanceSession(
    data: Omit<AttendanceSession, 'id' | 'createdAt' | 'updatedAt'>
  ): AttendanceSession {
    const id = `att_sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const classroom = this.getClassroomById(data.classroomId, data.organizationId);
    const course = data.courseId ? this.getCourseById(data.courseId, data.organizationId) : undefined;
    const openedUser = this.getUserById(data.openedBy, data.organizationId);

    const now = new Date().toISOString();
    const session: AttendanceSession = {
      ...data,
      id,
      classroomName: classroom?.name,
      courseTitle: course?.title,
      openedByName: openedUser?.fullName,
      presentCount: data.presentCount || 0,
      absentCount: data.absentCount || 0,
      lateCount: data.lateCount || 0,
      excusedCount: data.excusedCount || 0,
      totalStudents: data.totalStudents || 0,
      createdAt: now,
      updatedAt: now,
    };
    this.attendanceSessions.set(id, session);
    this.persistAttendanceSessionToPostgres(session);
    return session;
  }

  updateAttendanceSession(
    id: string,
    organizationId: string,
    updates: Partial<AttendanceSession>
  ): AttendanceSession | undefined {
    const s = this.getAttendanceSessionById(id, organizationId);
    if (!s) return undefined;

    const updated: AttendanceSession = {
      ...s,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.attendanceSessions.set(id, updated);
    this.persistAttendanceSessionToPostgres(updated);
    return updated;
  }

  deleteAttendanceSession(id: string, organizationId: string): boolean {
    const s = this.getAttendanceSessionById(id, organizationId);
    if (!s) return false;
    this.attendanceSessions.delete(id);
    this.deleteAttendanceSessionFromPostgres(id, organizationId);
    // Delete linked attendance records or unlink them
    for (const [recId, rec] of this.attendanceRecords.entries()) {
      if (rec.organizationId === organizationId && rec.sessionId === id) {
        this.attendanceRecords.delete(recId);
      }
    }
    return true;
  }

  // --- Attendance Records ---
  getAttendanceRecords(
    organizationId: string,
    filters?: { sessionId?: string; courseId?: string; classroomId?: string; studentId?: string; date?: string; status?: string }
  ): AttendanceRecord[] {
    return Array.from(this.attendanceRecords.values()).filter((r) => {
      if (r.organizationId !== organizationId) return false;
      if (filters?.sessionId && r.sessionId !== filters.sessionId) return false;
      if (filters?.courseId && r.courseId !== filters.courseId) return false;
      if (filters?.classroomId && r.classroomId !== filters.classroomId) return false;
      if (filters?.studentId && r.studentId !== filters.studentId) return false;
      if (filters?.date && r.date !== filters.date) return false;
      if (filters?.status && r.status !== filters.status) return false;
      return true;
    });
  }

  // Legacy alias
  getAttendance(organizationId: string, courseId?: string, classroomId?: string, date?: string): AttendanceRecord[] {
    return this.getAttendanceRecords(organizationId, { courseId, classroomId, date });
  }

  getAttendanceRecordById(id: string, organizationId: string): AttendanceRecord | undefined {
    const r = this.attendanceRecords.get(id);
    if (!r || r.organizationId !== organizationId) return undefined;
    return r;
  }

  recordAttendanceBatch(
    organizationId: string,
    records: Omit<AttendanceRecord, 'id' | 'createdAt'>[],
    sessionId?: string
  ): AttendanceRecord[] {
    const saved: AttendanceRecord[] = [];
    const now = new Date().toISOString();

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const rec of records) {
      const key = `att_${rec.courseId || rec.classroomId}_${rec.studentId}_${rec.date}`;
      const student = this.getUserById(rec.studentId, organizationId);
      const classroom = this.getClassroomById(rec.classroomId, organizationId);
      const recordedUser = rec.recordedBy ? this.getUserById(rec.recordedBy, organizationId) : undefined;

      const entry: AttendanceRecord = {
        ...rec,
        id: key,
        organizationId,
        sessionId: sessionId || rec.sessionId,
        studentName: student?.fullName || rec.studentName,
        studentIdNumber: student?.studentIdNumber || rec.studentIdNumber,
        classroomName: classroom?.name || rec.classroomName,
        recordedByName: recordedUser?.fullName || rec.recordedByName,
        createdAt: now,
        updatedAt: now,
      };
      this.attendanceRecords.set(key, entry);
      this.persistAttendanceRecordToPostgres(entry);
      saved.push(entry);

      if (rec.status === 'PRESENT') present++;
      else if (rec.status === 'ABSENT') absent++;
      else if (rec.status === 'LATE') late++;
      else if (rec.status === 'EXCUSED') excused++;
    }

    // If linked to a session, update session stats
    const activeSessionId = sessionId || records[0]?.sessionId;
    if (activeSessionId) {
      const session = this.getAttendanceSessionById(activeSessionId, organizationId);
      if (session) {
        session.presentCount = present;
        session.absentCount = absent;
        session.lateCount = late;
        session.excusedCount = excused;
        session.totalStudents = records.length;
        session.updatedAt = now;
        this.attendanceSessions.set(activeSessionId, session);
        this.persistAttendanceSessionToPostgres(session);
      }
    }

    return saved;
  }

  updateAttendanceRecord(
    id: string,
    organizationId: string,
    updates: Partial<AttendanceRecord>
  ): AttendanceRecord | undefined {
    const r = this.getAttendanceRecordById(id, organizationId);
    if (!r) return undefined;

    const updated: AttendanceRecord = {
      ...r,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.attendanceRecords.set(id, updated);
    this.persistAttendanceRecordToPostgres(updated);
    return updated;
  }

  getAttendanceSummaryForStudent(studentId: string, organizationId: string) {
    const records = this.getAttendanceRecords(organizationId, { studentId });
    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === 'PRESENT').length;
    const absentDays = records.filter((r) => r.status === 'ABSENT').length;
    const lateDays = records.filter((r) => r.status === 'LATE').length;
    const excusedDays = records.filter((r) => r.status === 'EXCUSED').length;
    const attendanceRate =
      totalDays > 0 ? Math.round(((presentDays + lateDays + excusedDays) / totalDays) * 100) : 100;

    return {
      studentId,
      totalDays,
      total: totalDays,
      presentDays,
      present: presentDays,
      absentDays,
      absent: absentDays,
      lateDays,
      late: lateDays,
      excusedDays,
      excused: excusedDays,
      attendanceRate,
      records: records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }

  // --- Assessments (Academic Evaluations & Gradebook) ---
  getAssessments(
    organizationId: string,
    filters?: { courseId?: string; classroomId?: string; termId?: string; category?: string; status?: string }
  ): Assessment[] {
    return Array.from(this.assessments.values())
      .filter((a) => {
        if (a.organizationId !== organizationId) return false;
        if (filters?.courseId && a.courseId !== filters.courseId) return false;
        if (filters?.classroomId && a.classroomId !== filters.classroomId) return false;
        if (filters?.termId && a.termId !== filters.termId) return false;
        if (filters?.category && a.category !== filters.category) return false;
        if (filters?.status && a.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAssessmentById(id: string, organizationId: string): Assessment | undefined {
    const a = this.assessments.get(id);
    if (!a || a.organizationId !== organizationId) return undefined;
    return a;
  }

  createAssessment(data: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Assessment {
    const id = `ass_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const course = this.getCourseById(data.courseId, data.organizationId);
    const subject = data.subjectId ? this.getSubjectById(data.subjectId, data.organizationId) : course ? this.getSubjectById(course.subjectId, data.organizationId) : undefined;
    const classroom = data.classroomId ? this.getClassroomById(data.classroomId, data.organizationId) : course?.classroomId ? this.getClassroomById(course.classroomId, data.organizationId) : undefined;
    const term = data.termId ? this.getTermById(data.termId, data.organizationId) : course?.termId ? this.getTermById(course.termId, data.organizationId) : undefined;
    const creator = data.createdBy ? this.getUserById(data.createdBy, data.organizationId) : undefined;

    const now = new Date().toISOString();
    const assessment: Assessment = {
      ...data,
      id,
      courseTitle: course?.title,
      subjectId: subject?.id || course?.subjectId,
      subjectName: subject?.name || course?.subjectName,
      classroomId: classroom?.id || course?.classroomId,
      classroomName: classroom?.name || course?.classroomName,
      termId: term?.id || course?.termId,
      termName: term?.name,
      createdByName: creator?.fullName,
      createdAt: now,
      updatedAt: now,
    };
    this.assessments.set(id, assessment);
    this.persistAssessmentToPostgres(assessment);
    return assessment;
  }

  updateAssessment(
    id: string,
    organizationId: string,
    updates: Partial<Assessment>
  ): Assessment | undefined {
    const a = this.getAssessmentById(id, organizationId);
    if (!a) return undefined;

    const updated: Assessment = {
      ...a,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.assessments.set(id, updated);
    this.persistAssessmentToPostgres(updated);
    return updated;
  }

  deleteAssessment(id: string, organizationId: string): boolean {
    const a = this.getAssessmentById(id, organizationId);
    if (!a) return false;
    this.assessments.delete(id);
    this.deleteAssessmentFromPostgres(id, organizationId);
    // Delete linked student grades
    for (const [gid, gr] of this.assessmentGrades.entries()) {
      if (gr.organizationId === organizationId && gr.assessmentId === id) {
        this.assessmentGrades.delete(gid);
        this.deleteAssessmentGradeFromPostgres(gid, organizationId);
      }
    }
    return true;
  }

  // --- Assessment Grades ---
  getAssessmentGrades(
    organizationId: string,
    filters?: { assessmentId?: string; studentId?: string }
  ): AssessmentGrade[] {
    return Array.from(this.assessmentGrades.values()).filter((g) => {
      if (g.organizationId !== organizationId) return false;
      if (filters?.assessmentId && g.assessmentId !== filters.assessmentId) return false;
      if (filters?.studentId && g.studentId !== filters.studentId) return false;
      return true;
    });
  }

  getAssessmentGradeById(id: string, organizationId: string): AssessmentGrade | undefined {
    const g = this.assessmentGrades.get(id);
    if (!g || g.organizationId !== organizationId) return undefined;
    return g;
  }

  deleteAssessmentGrade(id: string, organizationId: string): boolean {
    const g = this.getAssessmentGradeById(id, organizationId);
    if (!g) return false;
    this.assessmentGrades.delete(id);
    this.deleteAssessmentGradeFromPostgres(id, organizationId);
    return true;
  }

  getAssessmentGradeByStudentAndAssessment(
    assessmentId: string,
    studentId: string,
    organizationId: string
  ): AssessmentGrade | undefined {
    return Array.from(this.assessmentGrades.values()).find(
      (g) => g.organizationId === organizationId && g.assessmentId === assessmentId && g.studentId === studentId
    );
  }

  recordAssessmentGrade(
    data: Omit<AssessmentGrade, 'id' | 'gradedAt' | 'updatedAt'>
  ): AssessmentGrade {
    const assessment = this.getAssessmentById(data.assessmentId, data.organizationId);
    const student = this.getUserById(data.studentId, data.organizationId);
    const grader = data.gradedBy ? this.getUserById(data.gradedBy, data.organizationId) : undefined;
    const maxScore = assessment?.maxScore || data.maxScore || 100;
    const percentage = Number(((data.score / maxScore) * 100).toFixed(2));
    const now = new Date().toISOString();

    const existing = this.getAssessmentGradeByStudentAndAssessment(
      data.assessmentId,
      data.studentId,
      data.organizationId
    );

    if (existing) {
      const updated: AssessmentGrade = {
        ...existing,
        score: data.score,
        percentage,
        feedback: data.feedback !== undefined ? data.feedback : existing.feedback,
        gradedBy: data.gradedBy || existing.gradedBy,
        gradedByName: grader?.fullName || existing.gradedByName,
        updatedAt: now,
      };
      this.assessmentGrades.set(existing.id, updated);
      this.persistAssessmentGradeToPostgres(updated);
      return updated;
    }

    const id = `grd_${data.assessmentId}_${data.studentId}`;
    const grade: AssessmentGrade = {
      ...data,
      id,
      assessmentTitle: assessment?.title,
      assessmentCategory: assessment?.category,
      maxScore,
      percentage,
      studentName: student?.fullName,
      studentIdNumber: student?.studentIdNumber,
      gradedByName: grader?.fullName,
      gradedAt: now,
      updatedAt: now,
    };
    this.assessmentGrades.set(id, grade);
    this.persistAssessmentGradeToPostgres(grade);
    return grade;
  }

  recordAssessmentGradesBatch(
    organizationId: string,
    grades: Omit<AssessmentGrade, 'id' | 'gradedAt' | 'updatedAt'>[]
  ): AssessmentGrade[] {
    const recorded: AssessmentGrade[] = [];
    for (const g of grades) {
      recorded.push(this.recordAssessmentGrade({ ...g, organizationId }));
    }
    return recorded;
  }

  // --- Gradebook Matrix Calculation (Course-Level Holistic Gradebook) ---
  getGradebookMatrix(courseId: string, organizationId: string): (GradebookMatrix & { matrix: any[] }) | undefined {
    const course = this.getCourseById(courseId, organizationId);
    if (!course) return undefined;

    const assessments = this.getAssessments(organizationId, { courseId });
    const assignments = this.getAssignmentsByCourse(courseId, organizationId);

    // Build unified evaluation items
    const evalItems = [
      ...assessments.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        maxScore: a.maxScore,
        weightPercentage: a.weightPercentage,
        dueDate: a.dueDate,
        isAssignment: false,
      })),
      ...assignments.map((asg) => ({
        id: asg.id,
        title: asg.title,
        category: 'ASSIGNMENT',
        maxScore: asg.maxScore || 100,
        weightPercentage: 0,
        dueDate: asg.dueDate,
        isAssignment: true,
      })),
    ];

    // Find enrolled students for this course / classroom
    let students: User[] = [];
    if (course.classroomId) {
      students = this.getStudentsByClassroom(course.classroomId, organizationId);
    } else {
      // Fallback to students enrolled in the course directly or in org
      students = this.getUsersByOrg(organizationId, 'STUDENT');
    }

    let classTotalEarned = 0;
    let classTotalMax = 0;

    const matrixRows = students.map((student) => {
      const scoresRecord: Record<string, GradebookMatrixStudentScore> = {};
      let studentEarned = 0;
      let studentMax = 0;

      for (const item of evalItems) {
        if (item.isAssignment) {
          const sub = this.getSubmissionsByAssignment(item.id, organizationId).find((s) => s.studentId === student.id);
          if (sub && sub.score !== undefined) {
            const percentage = item.maxScore > 0 ? Number(((sub.score / item.maxScore) * 100).toFixed(2)) : 0;
            scoresRecord[item.id] = {
              score: sub.score,
              maxScore: item.maxScore,
              percentage,
              feedback: sub.teacherFeedback,
              gradedAt: sub.submittedAt,
              status: 'GRADED',
            };
            studentEarned += sub.score;
            studentMax += item.maxScore;
          } else {
            scoresRecord[item.id] = {
              maxScore: item.maxScore,
              status: 'PENDING',
            };
          }
        } else {
          const grade = this.getAssessmentGradeByStudentAndAssessment(item.id, student.id, organizationId);
          if (grade) {
            scoresRecord[item.id] = {
              score: grade.score,
              maxScore: item.maxScore,
              percentage: grade.percentage,
              feedback: grade.feedback,
              gradedAt: grade.gradedAt,
              status: 'GRADED',
            };
            studentEarned += grade.score;
            studentMax += item.maxScore;
          } else {
            scoresRecord[item.id] = {
              maxScore: item.maxScore,
              status: 'PENDING',
            };
          }
        }
      }

      const percentage = studentMax > 0 ? Number(((studentEarned / studentMax) * 100).toFixed(1)) : 0;
      classTotalEarned += studentEarned;
      classTotalMax += studentMax;

      const letterGrade = this.computeLetterGrade(percentage);

      return {
        studentId: student.id,
        studentName: student.fullName,
        studentIdNumber: student.studentIdNumber,
        classroomName: course.classroomName,
        scores: scoresRecord,
        totalEarned: Number(studentEarned.toFixed(1)),
        totalMax: studentMax,
        percentage,
        averagePercent: percentage,
        letterGrade,
      };
    });

    const classAveragePercentage =
      classTotalMax > 0 ? Number(((classTotalEarned / classTotalMax) * 100).toFixed(1)) : 0;

    return {
      course,
      assessments: evalItems.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        maxScore: a.maxScore,
        weightPercentage: a.weightPercentage,
        dueDate: a.dueDate,
      })),
      students: matrixRows,
      matrix: matrixRows,
      classAveragePercentage,
    };
  }

  // --- Student Academic Performance Summary (Student & Parent Views) ---
  getStudentAcademicPerformance(
    studentId: string,
    organizationId: string
  ): StudentAcademicPerformanceSummary & { breakdown: any[] } {
    const student = this.getUserById(studentId, organizationId);
    const classroomName = student?.classroomId
      ? this.getClassroomById(student.classroomId, organizationId)?.name
      : undefined;

    // Determine enrolled courses
    let courses: Course[] = [];
    if (student?.classroomId) {
      courses = this.getCoursesByClassroom(student.classroomId, organizationId);
    } else {
      courses = this.getCourses(organizationId);
    }

    let overallEarned = 0;
    let overallMax = 0;
    let totalAssessmentsCount = 0;
    let completedAssessmentsCount = 0;
    let pendingAssessmentsCount = 0;

    const coursePerformances = courses.map((c) => {
      const assessments = this.getAssessments(organizationId, { courseId: c.id });
      const assignments = this.getAssignmentsByCourse(c.id, organizationId);
      const evalItems = [
        ...assessments.map((a) => ({
          id: a.id,
          title: a.title,
          category: a.category,
          maxScore: a.maxScore,
          weightPercentage: a.weightPercentage,
          dueDate: a.dueDate,
          isAssignment: false,
        })),
        ...assignments.map((asg) => ({
          id: asg.id,
          title: asg.title,
          category: 'ASSIGNMENT',
          maxScore: asg.maxScore || 100,
          weightPercentage: 0,
          dueDate: asg.dueDate,
          isAssignment: true,
        })),
      ];

      let cEarned = 0;
      let cMax = 0;
      let cGradedCount = 0;
      let cPendingCount = 0;

      const items: StudentAssessmentItem[] = evalItems.map((evalItem) => {
        totalAssessmentsCount++;
        let isGraded = false;
        let score: number | undefined;
        let feedback: string | undefined;
        let gradedAt: string | undefined;

        if (evalItem.isAssignment) {
          const sub = this.getSubmissionsByAssignment(evalItem.id, organizationId).find((s) => s.studentId === studentId);
          if (sub && sub.score !== undefined) {
            isGraded = true;
            score = sub.score;
            feedback = sub.teacherFeedback;
            gradedAt = sub.submittedAt;
          }
        } else {
          const grade = this.getAssessmentGradeByStudentAndAssessment(evalItem.id, studentId, organizationId);
          if (grade) {
            isGraded = true;
            score = grade.score;
            feedback = grade.feedback;
            gradedAt = grade.gradedAt;
          }
        }

        if (isGraded && score !== undefined) {
          completedAssessmentsCount++;
          cGradedCount++;
          cEarned += score;
          cMax += evalItem.maxScore;
          const percentage = evalItem.maxScore > 0 ? Number(((score / evalItem.maxScore) * 100).toFixed(2)) : 0;
          return {
            assessmentId: evalItem.id,
            title: evalItem.title,
            category: evalItem.category,
            maxScore: evalItem.maxScore,
            weightPercentage: evalItem.weightPercentage,
            score,
            percentage,
            feedback,
            gradedAt,
            dueDate: evalItem.dueDate,
            status: 'GRADED',
          };
        } else {
          pendingAssessmentsCount++;
          cPendingCount++;
          const isOverdue = evalItem.dueDate && new Date(evalItem.dueDate).getTime() < Date.now();
          return {
            assessmentId: evalItem.id,
            title: evalItem.title,
            category: evalItem.category,
            maxScore: evalItem.maxScore,
            weightPercentage: evalItem.weightPercentage,
            dueDate: evalItem.dueDate,
            status: isOverdue ? 'MISSED' : 'PENDING',
          };
        }
      });

      overallEarned += cEarned;
      overallMax += cMax;

      const cPercent = cMax > 0 ? Number(((cEarned / cMax) * 100).toFixed(1)) : 0;
      const letterGrade = this.computeLetterGrade(cPercent);

      return {
        courseId: c.id,
        courseTitle: c.title,
        subjectId: c.subjectId,
        subjectName: c.subjectName,
        teacherName: c.teacherName,
        classroomName: c.classroomName,
        totalAssessments: evalItems.length,
        gradedAssessments: cGradedCount,
        pendingAssessments: cPendingCount,
        earnedPoints: Number(cEarned.toFixed(1)),
        earned: Number(cEarned.toFixed(1)),
        maxPossiblePoints: cMax,
        max: cMax,
        percentage: cPercent,
        average: cPercent,
        letterGrade,
        assessments: items,
      };
    });

    const overallGpaPercent =
      overallMax > 0 ? Number(((overallEarned / overallMax) * 100).toFixed(1)) : 0;
    const letterGrade = this.computeLetterGrade(overallGpaPercent);

    return {
      studentId,
      studentName: student?.fullName || 'الطالب',
      studentIdNumber: student?.studentIdNumber,
      classroomName,
      enrolledCoursesCount: courses.length,
      totalAssessmentsCount,
      completedAssessmentsCount,
      pendingAssessmentsCount,
      overallGpaPercent,
      letterGrade,
      courses: coursePerformances,
      breakdown: coursePerformances,
    };
  }

  computeLetterGrade(percentage: number): string {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    if (percentage > 0) return 'F';
    return 'N/A';
  }

  // Audit Logging
  logAction(organizationId: string, userId: string | undefined, userEmail: string | undefined, action: string, resourceType: string, resourceId: string, details?: Record<string, unknown>, ipAddress?: string): AuditLog {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const log: AuditLog = {
      id,
      organizationId,
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.set(id, log);
    return log;
  }

  getAuditLogs(organizationId: string, limit = 50): AuditLog[] {
    return Array.from(this.auditLogs.values())
      .filter((l) => l.organizationId === organizationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // --- Invitations Management ---
  createInvitation(data: Omit<Invitation, 'id' | 'createdAt' | 'isUsed'>): Invitation {
    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const classroom = data.classroomId ? this.classrooms.get(data.classroomId) : undefined;
    const creator = data.createdBy ? this.users.get(data.createdBy) : undefined;

    const inv: Invitation = {
      id,
      ...data,
      classroomName: classroom?.name,
      createdByName: creator?.fullName,
      isUsed: false,
      createdAt: new Date().toISOString(),
    };
    this.invitations.set(id, inv);
    return inv;
  }

  getInvitationByCode(code: string): Invitation | undefined {
    const normalized = code.trim().toUpperCase();
    for (const inv of this.invitations.values()) {
      if (inv.inviteCode.toUpperCase() === normalized) {
        return inv;
      }
    }
    return undefined;
  }

  getPendingInvitationsByEmail(email: string): Invitation[] {
    const normalized = email.toLowerCase().trim();
    const now = Date.now();
    return Array.from(this.invitations.values())
      .filter((inv) => inv.email.toLowerCase().trim() === normalized && !inv.isUsed && new Date(inv.expiresAt).getTime() > now)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getInvitationsByOrg(organizationId: string): Invitation[] {
    return Array.from(this.invitations.values())
      .filter((inv) => inv.organizationId === organizationId)
      .map((inv) => {
        const classroom = inv.classroomId ? this.classrooms.get(inv.classroomId) : undefined;
        const creator = inv.createdBy ? this.users.get(inv.createdBy) : undefined;
        return {
          ...inv,
          classroomName: classroom?.name || inv.classroomName,
          createdByName: creator?.fullName || inv.createdByName,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  revokeInvitation(id: string, organizationId: string): boolean {
    const inv = this.invitations.get(id);
    if (!inv || inv.organizationId !== organizationId) return false;
    return this.invitations.delete(id);
  }

  markInvitationUsed(id: string, organizationId: string): boolean {
    const inv = this.invitations.get(id);
    if (!inv || inv.organizationId !== organizationId) return false;
    inv.isUsed = true;
    inv.usedAt = new Date().toISOString();
    this.invitations.set(id, inv);
    return true;
  }

  // ==========================================
  // Rtiqa AI Engine Database Methods (Multi-Tenant)
  // ==========================================

  // --- AI Conversations ---
  getAIConversations(organizationId: string, userId?: string): AIConversation[] {
    return Array.from(this.aiConversations.values())
      .filter((c) => c.organizationId === organizationId && (!userId || c.userId === userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getAIConversationById(id: string, organizationId: string, userId?: string): AIConversation | null {
    const conv = this.aiConversations.get(id);
    if (!conv || conv.organizationId !== organizationId) return null;
    if (userId && conv.userId !== userId) return null;
    return conv;
  }

  createAIConversation(conv: AIConversation): AIConversation {
    this.aiConversations.set(conv.id, conv);
    return conv;
  }

  updateAIConversation(id: string, organizationId: string, updates: Partial<AIConversation>): AIConversation | null {
    const conv = this.getAIConversationById(id, organizationId);
    if (!conv) return null;
    const updated = {
      ...conv,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.aiConversations.set(id, updated);
    return updated;
  }

  deleteAIConversation(id: string, organizationId: string, userId?: string): boolean {
    const conv = this.getAIConversationById(id, organizationId, userId);
    if (!conv) return false;
    this.aiConversations.delete(id);
    // Cascade delete conversation messages
    for (const [msgId, msg] of this.aiMessages.entries()) {
      if (msg.conversationId === id) {
        this.aiMessages.delete(msgId);
      }
    }
    return true;
  }

  // --- AI Messages ---
  getAIMessages(conversationId: string, organizationId: string): AIMessage[] {
    // Validate conversation belongs to organization first
    const conv = this.getAIConversationById(conversationId, organizationId);
    if (!conv) return [];

    return Array.from(this.aiMessages.values())
      .filter((m) => m.conversationId === conversationId && m.organizationId === organizationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  createAIMessage(msg: AIMessage): AIMessage {
    this.aiMessages.set(msg.id, msg);
    // Touch conversation updated_at
    const conv = this.aiConversations.get(msg.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
      this.aiConversations.set(conv.id, conv);
    }
    return msg;
  }

  // --- AI Usage & Quotas ---
  recordAIUsage(usage: AIUsageRecord): AIUsageRecord {
    this.aiUsageRecords.set(usage.id, usage);
    return usage;
  }

  getAIUsage(organizationId: string, userId?: string): AIUsageRecord[] {
    return Array.from(this.aiUsageRecords.values())
      .filter((u) => u.organizationId === organizationId && (!userId || u.userId === userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAIUsageSummary(organizationId: string): AIUsageSummary {
    const records = this.getAIUsage(organizationId);
    const monthlyQuotaTokens = 1000000; // 1M tokens monthly default quota per school
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;
    const featureBreakdown: Record<string, { requests: number; tokens: number; cost: number }> = {};

    for (const r of records) {
      totalInputTokens += r.inputTokens || 0;
      totalOutputTokens += r.outputTokens || 0;
      totalCostUsd += Number(r.estimatedCost) || 0;

      const feat = r.featureName || 'other';
      if (!featureBreakdown[feat]) {
        featureBreakdown[feat] = { requests: 0, tokens: 0, cost: 0 };
      }
      featureBreakdown[feat].requests += 1;
      featureBreakdown[feat].tokens += (r.inputTokens || 0) + (r.outputTokens || 0);
      featureBreakdown[feat].cost += Number(r.estimatedCost) || 0;
    }

    const totalTokens = totalInputTokens + totalOutputTokens;
    const usedQuotaPercentage = Math.min(100, Math.round((totalTokens / monthlyQuotaTokens) * 100));

    return {
      organizationId,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(6)),
      monthlyQuotaTokens,
      usedQuotaPercentage,
      requestsCount: records.length,
      featureBreakdown,
    };
  }

  // --- AI Document Chunks (RAG Foundation) ---
  createAIDocumentChunk(chunk: AIDocumentChunk): AIDocumentChunk {
    this.aiDocumentChunks.set(chunk.id, chunk);
    return chunk;
  }

  getAIDocumentChunks(organizationId: string, documentId?: string): AIDocumentChunk[] {
    return Array.from(this.aiDocumentChunks.values())
      .filter((c) => c.organizationId === organizationId && (!documentId || c.documentId === documentId))
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  // ==========================================
  // Object Storage Metadata Methods (Multi-Tenant)
  // ==========================================

  createStorageObject(
    data: Omit<StorageObjectMetadata, 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }
  ): StorageObjectMetadata {
    const now = new Date().toISOString();
    const obj: StorageObjectMetadata = {
      ...data,
      id: data.id || `obj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    this.storageObjects.set(obj.id, obj);
    this.persistStorageObjectToPostgres(obj);
    return obj;
  }

  getStorageObjectById(id: string, organizationId: string): StorageObjectMetadata | undefined {
    const obj = this.storageObjects.get(id);
    if (!obj || obj.organizationId !== organizationId) return undefined;
    return obj;
  }

  getStorageObjectsByResource(
    resourceType: StorageResourceType,
    resourceId: string,
    organizationId: string
  ): StorageObjectMetadata[] {
    return Array.from(this.storageObjects.values())
      .filter(
        (o) =>
          o.organizationId === organizationId &&
          o.resourceType === resourceType &&
          o.resourceId === resourceId &&
          o.status !== 'DELETED'
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getStorageObjectsByOrg(organizationId: string): StorageObjectMetadata[] {
    return Array.from(this.storageObjects.values())
      .filter((o) => o.organizationId === organizationId && o.status !== 'DELETED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  updateStorageObject(
    id: string,
    organizationId: string,
    updates: Partial<StorageObjectMetadata>
  ): StorageObjectMetadata | undefined {
    const obj = this.getStorageObjectById(id, organizationId);
    if (!obj) return undefined;

    const updated: StorageObjectMetadata = {
      ...obj,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.storageObjects.set(id, updated);
    this.persistStorageObjectToPostgres(updated);
    return updated;
  }

  deleteStorageObject(id: string, organizationId: string, hardDelete = false): boolean {
    const obj = this.getStorageObjectById(id, organizationId);
    if (!obj) return false;

    if (hardDelete) {
      this.storageObjects.delete(id);
      this.deleteStorageObjectFromPostgres(id, organizationId, true);
    } else {
      const now = new Date().toISOString();
      const updated: StorageObjectMetadata = {
        ...obj,
        status: 'DELETED',
        deletedAt: now,
        updatedAt: now,
      };
      this.storageObjects.set(id, updated);
      this.persistStorageObjectToPostgres(updated);
    }
    return true;
  }

  private persistStorageObjectToPostgres(obj: StorageObjectMetadata): void {
    const pool = getPostgresPool();
    if (!pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PostgreSQL is required in production environment.');
      }
      return;
    }
    pool.query(
      `INSERT INTO storage_objects (
        id, organization_id, object_key, original_filename, content_type, size_bytes,
        checksum, resource_type, resource_id, uploaded_by, status, metadata,
        created_at, updated_at, deleted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        object_key = EXCLUDED.object_key,
        original_filename = EXCLUDED.original_filename,
        content_type = EXCLUDED.content_type,
        size_bytes = EXCLUDED.size_bytes,
        checksum = EXCLUDED.checksum,
        resource_type = EXCLUDED.resource_type,
        resource_id = EXCLUDED.resource_id,
        status = EXCLUDED.status,
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at;`,
      [
        obj.id,
        obj.organizationId,
        obj.objectKey,
        obj.originalFilename,
        obj.contentType,
        obj.sizeBytes,
        obj.checksum || null,
        obj.resourceType,
        obj.resourceId,
        obj.uploadedBy,
        obj.status,
        JSON.stringify(obj.metadata || {}),
        obj.createdAt,
        obj.updatedAt,
        obj.deletedAt || null,
      ]
    ).catch((err) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('[PostgreSQL Critical Error]: Failed to persist storage object', err);
        throw err;
      }
      console.error('[PostgreSQL Storage Object Persist Warning]:', (err as Error).message);
    });
  }

  private deleteStorageObjectFromPostgres(id: string, organizationId: string, hardDelete = false): void {
    const pool = getPostgresPool();
    if (!pool) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('PostgreSQL is required in production environment.');
      }
      return;
    }
    if (hardDelete) {
      pool.query('DELETE FROM storage_objects WHERE id = $1 AND organization_id = $2', [id, organizationId]).catch((err) => {
        if (process.env.NODE_ENV === 'production') throw err;
        console.error('[PostgreSQL Delete Storage Object Warning]:', (err as Error).message);
      });
    } else {
      pool.query(
        "UPDATE storage_objects SET status = 'DELETED', deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND organization_id = $2",
        [id, organizationId]
      ).catch((err) => {
        if (process.env.NODE_ENV === 'production') throw err;
        console.error('[PostgreSQL Soft Delete Storage Object Warning]:', (err as Error).message);
      });
    }
  }

  async syncStorageObjectsFromPostgres(organizationId?: string): Promise<void> {
    const pool = getPostgresPool();
    if (!pool) return;

    try {
      let query = 'SELECT * FROM storage_objects';
      const params: any[] = [];
      if (organizationId) {
        query += ' WHERE organization_id = $1';
        params.push(organizationId);
      }
      const res = await pool.query(query, params);
      for (const row of res.rows) {
        const obj: StorageObjectMetadata = {
          id: row.id,
          organizationId: row.organization_id,
          objectKey: row.object_key,
          originalFilename: row.original_filename,
          contentType: row.content_type,
          sizeBytes: Number(row.size_bytes) || 0,
          checksum: row.checksum || undefined,
          resourceType: row.resource_type as StorageResourceType,
          resourceId: row.resource_id,
          uploadedBy: row.uploaded_by,
          status: row.status as StorageObjectStatus,
          metadata: row.metadata || {},
          createdAt: row.created_at?.toISOString ? row.created_at.toISOString() : (row.created_at || new Date().toISOString()),
          updatedAt: row.updated_at?.toISOString ? row.updated_at.toISOString() : (row.updated_at || new Date().toISOString()),
          deletedAt: row.deleted_at?.toISOString ? row.deleted_at.toISOString() : (row.deleted_at || undefined),
        };
        this.storageObjects.set(obj.id, obj);
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err;
      console.error('[PostgreSQL Storage Sync Warning]:', (err as Error).message);
    }
  }

  // Reset database state (useful for automated tests)
  resetData(): void {
    this.organizations.clear();
    this.users.clear();
    this.academicYears.clear();
    this.terms.clear();
    this.gradeLevels.clear();
    this.classrooms.clear();
    this.subjects.clear();
    this.courses.clear();
    this.lessons.clear();
    this.assignments.clear();
    this.submissions.clear();
    this.attendanceSessions.clear();
    this.attendanceRecords.clear();
    this.assessments.clear();
    this.assessmentGrades.clear();
    this.storageObjects.clear();
    this.auditLogs.clear();
    this.invitations.clear();
    this.organizationMemberships.clear();
    this.passwordResetTokens.clear();
    this.emailVerificationTokens.clear();
    this.phoneVerificationOtps.clear();
    this.aiConversations.clear();
    this.aiMessages.clear();
    this.aiUsageRecords.clear();
    this.aiDocumentChunks.clear();
    this.teacherAssignments.clear();
    this.studentEnrollments.clear();
    this.parentStudentLinks.clear();
    this.studentRecords.clear();
    this.studentBehaviorRecords.clear();
    this.studentLifecycleEvents.clear();
    this.seedInitialData();
  }

  // Verification helpers
  isSubjectInOrg(subjectId: string, orgId: string): boolean {
    const s = this.subjects.get(subjectId);
    return Boolean(s && s.organizationId === orgId);
  }

  isTermInOrg(termId: string, orgId: string): boolean {
    const t = this.terms.get(termId);
    return Boolean(t && t.organizationId === orgId);
  }

  isClassroomInOrg(classroomId: string, orgId: string): boolean {
    const c = this.classrooms.get(classroomId);
    return Boolean(c && c.organizationId === orgId);
  }

  isGradeLevelInOrg(gradeId: string, orgId: string): boolean {
    const g = this.gradeLevels.get(gradeId);
    return Boolean(g && g.organizationId === orgId);
  }

  isAcademicYearInOrg(yearId: string, orgId: string): boolean {
    const y = this.academicYears.get(yearId);
    return Boolean(y && y.organizationId === orgId);
  }
}

export const db = new PlatformDatabase();
