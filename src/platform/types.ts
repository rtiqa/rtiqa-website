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
}

export interface Lesson {
  id: string;
  organizationId: string;
  courseId: string;
  title: string;
  contentHtml: string;
  mediaUrl?: string;
  attachments?: { name: string; url: string; size: string }[];
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
  courseId?: string;
  classroomId: string;
  studentId: string;
  studentName?: string;
  recordedBy: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
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
  | 'academic'
  | 'courses'
  | 'course-detail'
  | 'lessons'
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
  | 'content_explainer';

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

