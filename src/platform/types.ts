export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
export type AuthProviderType = 'email' | 'phone' | 'google';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  legalName?: string;
  countryCode: string;
  timezone: string;
  locale: 'ar' | 'en';
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  isDefault: boolean;
  status: 'ACTIVE' | 'PENDING' | 'REVOKED';
  classroomId?: string;
  studentIdNumber?: string;
  teacherSpecialization?: string;
  organizationName?: string;
  organizationSlug?: string;
  joinedAt: string;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  studentIdNumber?: string;
  teacherSpecialization?: string;
  classroomId?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  authProviders?: AuthProviderType[];
  googleId?: string;
  memberships?: OrganizationMembership[];
  isActive: boolean;
  createdAt: string;
}

export interface AcademicYear {
  id: string;
  organizationId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Term {
  id: string;
  organizationId: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface GradeLevel {
  id: string;
  organizationId: string;
  name: string;
  sequenceOrder: number;
}

export interface Classroom {
  id: string;
  organizationId: string;
  gradeLevelId: string;
  name: string;
  capacity?: number;
}

export interface Subject {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  color?: string;
  description?: string;
}

export interface Course {
  id: string;
  organizationId: string;
  subjectId: string;
  termId: string;
  teacherId?: string;
  classroomId: string;
  title: string;
  description?: string;
  subjectName?: string;
  teacherName?: string;
  classroomName?: string;
  lessons?: Lesson[];
  assignments?: Assignment[];
  studentsCount?: number;
  students?: { id: string; fullName: string; studentIdNumber?: string; email: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export type TeacherAssignmentRole = 'PRIMARY_TEACHER' | 'ASSISTANT_TEACHER' | 'ASSISTANT' | 'CO_TEACHER' | 'SUBSTITUTE';

export interface TeacherAssignment {
  id: string;
  organizationId: string;
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
  courseId?: string;
  courseTitle?: string;
  subjectId: string;
  subjectName?: string;
  classroomId: string;
  classroomName?: string;
  academicYearId?: string;
  academicYearName?: string;
  role: TeacherAssignmentRole;
  weeklyHours: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export type StudentEnrollmentStatus = 'ACTIVE' | 'TRANSFERRED' | 'SUSPENDED' | 'GRADUATED';

export type StudentLifecycleStatus = 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'WITHDRAWN' | 'TRANSFERRED' | 'GRADUATED';

export type StudentGender = 'MALE' | 'FEMALE';

export type StudentBloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';

export interface StudentRecord {
  id: string;
  organizationId: string;
  studentId: string;
  nationalId: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: StudentGender;
  bloodType?: StudentBloodType;
  nationality?: string;
  admissionDate: string; // YYYY-MM-DD
  graduationDate?: string; // YYYY-MM-DD
  status: StudentLifecycleStatus;
  statusReason?: string;
  medicalConditions?: string;
  allergies?: string;
  specialDietaryNeeds?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  previousSchool?: string;
  specialNeedsNotes?: string;
  giftedProgram: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StudentBehaviorType =
  | 'POSITIVE_PRAISE'
  | 'MERIT'
  | 'MINOR_INFRACTION'
  | 'MAJOR_INFRACTION'
  | 'COUNSELING_REFERRAL'
  | 'SUSPENSION_NOTICE';

export interface StudentBehaviorRecord {
  id: string;
  organizationId: string;
  studentId: string;
  studentName?: string;
  type: StudentBehaviorType;
  title: string;
  description: string;
  points: number;
  actionTaken?: string;
  incidentDate: string;
  recordedBy: string;
  recordedByName?: string;
  status: 'OPEN' | 'RESOLVED' | 'UNDER_REVIEW';
  createdAt: string;
}

export interface StudentLifecycleEvent {
  id: string;
  organizationId: string;
  studentId: string;
  studentName?: string;
  previousStatus: StudentLifecycleStatus;
  newStatus: StudentLifecycleStatus;
  reason: string;
  actionBy: string;
  actionByName?: string;
  effectiveDate: string;
  timestamp: string;
}

export interface StudentDossier {
  student: User;
  record?: StudentRecord;
  enrollments: StudentEnrollment[];
  currentEnrollment?: StudentEnrollment;
  parents: ParentStudentLink[];
  behaviorRecords: StudentBehaviorRecord[];
  behaviorPointsTotal: number;
  attendanceStats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    attendanceRate: number;
  };
  academicStats: {
    enrolledCoursesCount: number;
    submissionsCount: number;
    averageScore: number;
  };
  lifecycleHistory: StudentLifecycleEvent[];
}

export interface StudentEnrollment {
  id: string;
  organizationId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentIdNumber?: string;
  classroomId: string;
  classroomName?: string;
  gradeLevelId?: string;
  gradeLevelName?: string;
  academicYearId: string;
  academicYearName?: string;
  rollNumber?: string;
  status: StudentEnrollmentStatus;
  enrolledAt: string;
  updatedAt: string;
}

export type ParentRelationshipType = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';

export interface ParentStudentLink {
  id: string;
  organizationId: string;
  parentId: string;
  parentName?: string;
  studentId: string;
  studentName?: string;
  relationship: ParentRelationshipType;
  isEmergencyContact: boolean;
  createdAt: string;
}

export interface Lesson {
  id: string;
  organizationId: string;
  courseId: string;
  unitId?: string;
  unitTitle?: string;
  title: string;
  contentHtml: string;
  mediaUrl?: string;
  attachments?: { name: string; url: string; size: string }[];
  resourceIds?: string[];
  orderIndex: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  organizationId: string;
  courseId: string;
  title: string;
  description: string;
  maxScore: number;
  dueDate: string;
  attachments?: { name: string; url: string }[];
  createdAt: string;
  submissionsCount?: number;
  gradedCount?: number;
  mySubmission?: Submission | null;
  submissions?: Submission[];
}

export interface Submission {
  id: string;
  organizationId: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submissionText: string;
  fileAttachmentUrl?: string;
  score?: number;
  teacherFeedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  sessionId?: string;
  courseId?: string;
  classroomId: string;
  classroomName?: string;
  studentId: string;
  studentName?: string;
  studentIdNumber?: string;
  recordedBy: string;
  recordedByName?: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceSessionStatus = 'OPEN' | 'COMPLETED' | 'LOCKED';

export interface AttendanceSession {
  id: string;
  organizationId: string;
  classroomId: string;
  classroomName?: string;
  courseId?: string;
  courseTitle?: string;
  date: string;
  periodNumber?: number;
  title?: string;
  status: AttendanceSessionStatus;
  openedBy: string;
  openedByName?: string;
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  excusedCount?: number;
  totalStudents?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentCategory =
  | 'EXAM'
  | 'QUIZ'
  | 'HOMEWORK'
  | 'PROJECT'
  | 'PARTICIPATION'
  | 'MIDTERM'
  | 'FINAL'
  | 'PRACTICAL'
  | 'ASSIGNMENT'
  | 'OTHER'
  | string;

export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export interface Assessment {
  id: string;
  organizationId: string;
  courseId: string;
  courseTitle?: string;
  subjectId?: string;
  subjectName?: string;
  classroomId?: string;
  classroomName?: string;
  termId?: string;
  termName?: string;
  academicYearId?: string;
  title: string;
  description?: string;
  category: AssessmentCategory;
  maxScore: number;
  weightPercentage?: number;
  dueDate?: string;
  assessmentDate?: string;
  status: AssessmentStatus;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentGrade {
  id: string;
  organizationId: string;
  assessmentId: string;
  assessmentTitle?: string;
  assessmentCategory?: AssessmentCategory;
  maxScore?: number;
  studentId: string;
  studentName?: string;
  studentIdNumber?: string;
  score: number;
  percentage?: number;
  feedback?: string;
  gradedBy?: string;
  gradedByName?: string;
  gradedAt: string;
  updatedAt: string;
}

export interface StudentAssessmentItem {
  assessmentId: string;
  title: string;
  category: AssessmentCategory;
  maxScore: number;
  weightPercentage?: number;
  score?: number;
  percentage?: number;
  feedback?: string;
  gradedAt?: string;
  dueDate?: string;
  status: 'GRADED' | 'PENDING' | 'MISSED';
}

export interface StudentCoursePerformance {
  courseId: string;
  courseTitle: string;
  subjectId?: string;
  subjectName?: string;
  subjectCode?: string;
  teacherName?: string;
  classroomName?: string;
  totalAssessments: number;
  gradedAssessments: number;
  pendingAssessments: number;
  earnedPoints: number;
  maxPossiblePoints: number;
  percentage: number;
  letterGrade: string;
  assessments: StudentAssessmentItem[];
}

export interface StudentAcademicPerformanceSummary {
  studentId: string;
  studentName: string;
  studentIdNumber?: string;
  classroomName?: string;
  enrolledCoursesCount: number;
  totalAssessmentsCount: number;
  completedAssessmentsCount: number;
  pendingAssessmentsCount: number;
  overallGpaPercent: number;
  letterGrade: string;
  courses: StudentCoursePerformance[];
}

export interface GradebookMatrixStudentScore {
  score?: number;
  maxScore: number;
  percentage?: number;
  feedback?: string;
  gradedAt?: string;
  status: 'GRADED' | 'PENDING';
}

export interface GradebookMatrixRow {
  studentId: string;
  studentName: string;
  studentIdNumber?: string;
  classroomName?: string;
  scores: Record<string, GradebookMatrixStudentScore>;
  totalEarned: number;
  totalMax: number;
  percentage: number;
  letterGrade: string;
}

export interface GradebookMatrix {
  course: Course;
  assessments: Array<{
    id: string;
    title: string;
    category: AssessmentCategory;
    maxScore: number;
    weightPercentage?: number;
    dueDate?: string;
  }>;
  students: GradebookMatrixRow[];
  classAveragePercentage: number;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  inviteCode: string;
  tokenHash?: string;
  fullName?: string;
  classroomId?: string;
  classroomName?: string;
  teacherSpecialization?: string;
  studentIdNumber?: string;
  createdBy?: string;
  createdByName?: string;
  expiresAt: string;
  usedAt?: string;
  isUsed: boolean;
  createdAt: string;
}

export type PlatformPage =
  | 'dashboard'
  | 'onboarding'
  | 'users'
  | 'students'
  | 'academic'
  | 'courses'
  | 'course-detail'
  | 'lessons'
  | 'library'
  | 'assignments'
  | 'gradebook'
  | 'attendance'
  | 'ai-assistant'
  | 'settings';

export type AIFeatureType =
  | 'chat'
  | 'teacher_assistant'
  | 'lesson_summary'
  | 'question_generator'
  | 'student_tutor'
  | 'content_explainer'
  | 'parent_assistant'
  | 'feedback_generator'
  | 'learning_recommendations'
  | 'lesson_planner'
  | 'quiz_generator'
  | 'diagnostic_intervention';

export type AIMessageRole = 'system' | 'user' | 'assistant';

export interface AIConversation {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  contextType: 'general' | 'course' | 'lesson' | 'student_tutor' | 'teacher_assistant';
  contextId?: string;
  systemPromptType: AIFeatureType;
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  organizationId: string;
  userId: string;
  role: AIMessageRole;
  content: string;
  inputTokens: number;
  outputTokens: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AIUsageSummary {
  organizationId: string;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  monthlyQuotaTokens: number;
  usedQuotaPercentage: number;
  requestsCount: number;
  featureBreakdown: Record<string, { requests: number; tokens: number; cost: number }>;
}

export type StorageResourceType =
  | 'assignment_attachment'
  | 'submission_attachment'
  | 'lesson_attachment'
  | 'curriculum_document'
  | 'student_avatar'
  | 'school_logo'
  | 'general_asset';

export type StorageObjectStatus = 'PENDING' | 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export interface StorageObject {
  id: string;
  organizationId: string;
  resourceType: StorageResourceType;
  resourceId: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  storageProvider: string;
  storageKey: string;
  bucketName: string;
  checksum?: string;
  status: StorageObjectStatus;
  uploadedBy: string;
  customMetadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  storageObjectId: string;
  uploadUrl: string;
  key: string;
  bucket: string;
  expiresIn: number;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

export interface DownloadUrlResponse {
  storageObjectId: string;
  downloadUrl: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  expiresIn: number;
}

// ==========================================
// Rtiqa Notification Architecture
// ==========================================

export type NotificationType =
  | 'ASSIGNMENT_CREATED'
  | 'SUBMISSION_GRADED'
  | 'ATTENDANCE_ABSENT'
  | 'ATTENDANCE_LATE'
  | 'BEHAVIOR_LOGGED'
  | 'PARENT_LINK_CREATED'
  | 'ANNOUNCEMENT'
  | 'AI_RECOMMENDATION'
  | 'SYSTEM_ALERT';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface NotificationItem {
  id: string;
  organizationId: string;
  recipientId: string;
  recipientRole?: UserRole;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channels: NotificationChannel[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AcademicAnalyticsSummary {
  organizationId: string;
  averageGpa: number;
  averageAttendanceRate: number;
  totalStudents: number;
  atRiskCount: number;
  highAchieversCount: number;
  gradeDistribution: {
    excellent: number; // >= 90%
    veryGood: number;  // 80-89%
    good: number;      // 70-79%
    acceptable: number;// 60-69%
    atRisk: number;    // < 60%
  };
  atRiskStudents: Array<{
    studentId: string;
    studentName: string;
    classroomName?: string;
    gpaPercent: number;
    attendanceRate: number;
    riskFactors: string[];
    recommendedIntervention: string;
  }>;
  highAchieverStudents: Array<{
    studentId: string;
    studentName: string;
    classroomName?: string;
    gpaPercent: number;
    behaviorPoints: number;
  }>;
}

// ==========================================
// Rtiqa Phase 5.1: Digital Learning Library & Curriculum Content
// ==========================================

export type LibraryResourceType =
  | 'DOCUMENT'
  | 'PRESENTATION'
  | 'SPREADSHEET'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'EXTERNAL_LINK'
  | 'INTERACTIVE';

export type LibraryResourceFormat = 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'mp4' | 'youtube' | 'web_link' | 'image' | 'audio' | string;

export type LibraryResourceVisibility = 'PUBLIC_SCHOOL' | 'COURSE_STUDENTS' | 'TEACHERS_ONLY' | 'PRIVATE';

export type LibraryResourceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CurriculumUnit {
  id: string;
  organizationId: string;
  courseId: string;
  courseTitle?: string;
  title: string;
  description?: string;
  orderIndex: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryResource {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  resourceType: LibraryResourceType;
  format: LibraryResourceFormat;
  subjectId?: string;
  subjectName?: string;
  gradeLevelId?: string;
  gradeLevelName?: string;
  courseId?: string;
  courseTitle?: string;
  unitId?: string;
  unitTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  storageObjectId?: string;
  externalUrl?: string;
  fileSize?: number;
  fileType?: string;
  tags: string[];
  uploadedBy: string;
  authorName?: string;
  visibility: LibraryResourceVisibility;
  status: LibraryResourceStatus;
  viewCount: number;
  downloadCount: number;
  completionCount: number;
  aiSearchable: boolean;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export type ResourceActivityAction = 'VIEWED' | 'DOWNLOADED' | 'COMPLETED' | 'ATTACHED';

export interface ResourceActivity {
  id: string;
  organizationId: string;
  resourceId: string;
  userId: string;
  userName?: string;
  userRole: UserRole;
  action: ResourceActivityAction;
  courseId?: string;
  lessonId?: string;
  timestamp: string;
}

export interface LibraryStats {
  totalResources: number;
  totalViews: number;
  totalDownloads: number;
  totalCompletions: number;
  byType: Record<LibraryResourceType, number>;
  bySubject: Array<{ subjectId: string; subjectName: string; count: number }>;
  byGrade: Array<{ gradeLevelId: string; gradeLevelName: string; count: number }>;
}




