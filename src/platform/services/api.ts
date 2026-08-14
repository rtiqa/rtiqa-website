import {
  User,
  Organization,
  Course,
  Lesson,
  Assignment,
  Submission,
  AttendanceRecord,
  AcademicYear,
  Term,
  GradeLevel,
  Classroom,
  Subject,
  AuditLog,
  Invitation,
  AIConversation,
  AIMessage,
  AIUsageSummary,
  AIFeatureType,
} from '../types';

class PlatformApiClient {
  private token: string | null = null;
  private tenantSlug: string = 'horizon';

  constructor() {
    this.token = localStorage.getItem('rtiqa_platform_token');
    const savedSlug = localStorage.getItem('rtiqa_tenant_slug');
    if (savedSlug) this.tenantSlug = savedSlug;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('rtiqa_platform_token', token);
    } else {
      localStorage.removeItem('rtiqa_platform_token');
    }
  }

  setTenantSlug(slug: string) {
    this.tenantSlug = slug;
    localStorage.setItem('rtiqa_tenant_slug', slug);
  }

  getTenantSlug(): string {
    return this.tenantSlug;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Slug': this.tenantSlug,
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`/api/v1${endpoint}`, {
      ...options,
      headers,
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || json.error || 'فشلت معالجة الطلب');
    }

    return json;
  }

  // --- Auth APIs ---
  async login(email: string, password?: string, tenantSlug?: string) {
    const slug = tenantSlug || this.tenantSlug;
    const res = await this.request<{ success: boolean; token: string; user: User; organization: Organization }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, tenantSlug: slug }),
      }
    );
    this.setToken(res.token);
    this.setTenantSlug(res.organization.slug);
    return res;
  }

  async demoSwitch(persona: 'admin' | 'teacher' | 'teacher2' | 'student' | 'student2', tenantSlug?: string) {
    const slug = tenantSlug || this.tenantSlug;
    const res = await this.request<{ success: boolean; token: string; user: User; organization: Organization }>(
      '/auth/demo-switch',
      {
        method: 'POST',
        body: JSON.stringify({ persona, tenantSlug: slug }),
      }
    );
    this.setToken(res.token);
    this.setTenantSlug(res.organization.slug);
    return res;
  }

  async registerSchool(data: {
    schoolName: string;
    slug: string;
    legalName?: string;
    adminName: string;
    adminEmail: string;
    password?: string;
    countryCode?: string;
  }) {
    const res = await this.request<{
      success: boolean;
      token: string;
      user: User;
      organization: Organization;
      initialAcademicSetup?: any;
    }>('/auth/register-school', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.token);
    this.setTenantSlug(res.organization.slug);
    return res;
  }

  async getMe() {
    return this.request<{ success: boolean; user: User; organization: Organization }>('/auth/me');
  }

  async logout() {
    try {
      await this.request<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // --- Invitations APIs ---
  async createInvitation(data: {
    email: string;
    role: string;
    fullName?: string;
    classroomId?: string;
    teacherSpecialization?: string;
    studentIdNumber?: string;
    expiresInDays?: number;
  }) {
    return this.request<{ success: boolean; data: Invitation & { inviteLink: string } }>('/auth/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInvitations() {
    return this.request<{ success: boolean; data: Invitation[] }>('/auth/invitations');
  }

  async revokeInvitation(id: string) {
    return this.request<{ success: boolean; message: string }>(`/auth/invitations/${id}`, {
      method: 'DELETE',
    });
  }

  async verifyInvitation(code: string) {
    return this.request<{
      success: boolean;
      data: {
        code: string;
        email: string;
        fullName?: string;
        role: string;
        classroomName?: string;
        teacherSpecialization?: string;
        organization: { id: string; name: string; slug: string; logoUrl?: string };
        expiresAt: string;
      };
    }>(`/auth/invitations/verify?code=${encodeURIComponent(code)}`);
  }

  async acceptInvitation(data: { code: string; fullName?: string; password: string }) {
    const res = await this.request<{ success: boolean; token: string; user: User; organization: Organization }>(
      '/auth/invitations/accept',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    this.setToken(res.token);
    this.setTenantSlug(res.organization.slug);
    return res;
  }

  // --- Health & Diagnostic ---
  async getHealth() {
    const res = await fetch('/api/v1/health');
    return res.json();
  }

  // --- Dashboard Stats ---
  async getDashboardStats() {
    return this.request<{ success: boolean; data: any }>('/dashboard/stats');
  }

  // --- Academic Structure ---
  async getAcademicYears() {
    return this.request<{ success: boolean; data: AcademicYear[] }>('/academic/years');
  }

  async createAcademicYear(data: Partial<AcademicYear>) {
    return this.request<{ success: boolean; data: AcademicYear }>('/academic/years', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTerms(yearId?: string) {
    const q = yearId ? `?yearId=${yearId}` : '';
    return this.request<{ success: boolean; data: Term[] }>(`/academic/terms${q}`);
  }

  async createTerm(data: Partial<Term>) {
    return this.request<{ success: boolean; data: Term }>('/academic/terms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGradeLevels() {
    return this.request<{ success: boolean; data: GradeLevel[] }>('/academic/grades');
  }

  async createGradeLevel(data: Partial<GradeLevel>) {
    return this.request<{ success: boolean; data: GradeLevel }>('/academic/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClassrooms(gradeLevelId?: string) {
    const q = gradeLevelId ? `?gradeLevelId=${gradeLevelId}` : '';
    return this.request<{ success: boolean; data: Classroom[] }>(`/academic/classrooms${q}`);
  }

  async createClassroom(data: Partial<Classroom>) {
    return this.request<{ success: boolean; data: Classroom }>('/academic/classrooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSubjects() {
    return this.request<{ success: boolean; data: Subject[] }>('/academic/subjects');
  }

  async createSubject(data: Partial<Subject>) {
    return this.request<{ success: boolean; data: Subject }>('/academic/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Users & CSV Import ---
  async getUsers(params: { role?: string; classroomId?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.classroomId) query.set('classroomId', params.classroomId);
    if (params.search) query.set('search', params.search);
    return this.request<{ success: boolean; data: User[] }>(`/users?${query.toString()}`);
  }

  async createUser(data: Partial<User>) {
    return this.request<{ success: boolean; data: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(userId: string, data: Partial<User>) {
    return this.request<{ success: boolean; data: User }>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async previewImportCsv(csvContent: string, targetRole = 'STUDENT', targetClassroomId?: string) {
    return this.request<{
      success: boolean;
      summary: { totalRows: number; validCount: number; errorCount: number; targetRole: string };
      preview: Array<{
        row: number;
        fullName: string;
        email: string;
        identifier?: string;
        phone?: string;
        isValid: boolean;
        errorMessage?: string;
      }>;
    }>('/users/import-csv/preview', {
      method: 'POST',
      body: JSON.stringify({ csvContent, targetRole, targetClassroomId }),
    });
  }

  async importStudentsCsv(csvContent: string, targetClassroomId?: string, targetRole = 'STUDENT') {
    return this.request<{
      success: boolean;
      summary: { totalRows: number; importedCount: number; failedCount: number; errors: any[] };
      data: User[];
    }>('/users/import-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent, targetClassroomId, targetRole }),
    });
  }

  async deleteUser(userId: string) {
    return this.request<{ success: boolean; message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // --- Courses ---
  async getCourses() {
    return this.request<{ success: boolean; data: Course[] }>('/courses');
  }

  async getCourseById(courseId: string) {
    return this.request<{ success: boolean; data: Course }>(`/courses/${courseId}`);
  }

  async createCourse(data: Partial<Course>) {
    return this.request<{ success: boolean; data: Course }>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Lessons ---
  async getLessons(courseId: string) {
    return this.request<{ success: boolean; data: Lesson[] }>(`/lessons/course/${courseId}`);
  }

  async getLessonById(lessonId: string) {
    return this.request<{ success: boolean; data: Lesson }>(`/lessons/${lessonId}`);
  }

  async createLesson(data: Partial<Lesson>) {
    return this.request<{ success: boolean; data: Lesson }>('/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLesson(lessonId: string, updates: Partial<Lesson>) {
    return this.request<{ success: boolean; data: Lesson }>(`/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLesson(lessonId: string) {
    return this.request<{ success: boolean; message: string }>(`/lessons/${lessonId}`, {
      method: 'DELETE',
    });
  }

  // --- Assignments & Submissions ---
  async getAssignments(courseId?: string) {
    const q = courseId ? `?courseId=${courseId}` : '';
    return this.request<{ success: boolean; data: Assignment[] }>(`/assignments${q}`);
  }

  async getAssignmentById(id: string) {
    return this.request<{ success: boolean; data: Assignment }>(`/assignments/${id}`);
  }

  async createAssignment(data: Partial<Assignment>) {
    return this.request<{ success: boolean; data: Assignment }>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitAssignment(assignmentId: string, submissionText: string, fileAttachmentUrl?: string) {
    return this.request<{ success: boolean; data: Submission }>(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submissionText, fileAttachmentUrl }),
    });
  }

  async gradeSubmission(submissionId: string, score: number, teacherFeedback?: string) {
    return this.request<{ success: boolean; data: Submission }>(`/assignments/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify({ score, teacherFeedback }),
    });
  }

  // --- Attendance ---
  async getAttendance(params: { courseId?: string; classroomId?: string; date?: string } = {}) {
    const query = new URLSearchParams();
    if (params.courseId) query.set('courseId', params.courseId);
    if (params.classroomId) query.set('classroomId', params.classroomId);
    if (params.date) query.set('date', params.date);
    return this.request<{ success: boolean; data: AttendanceRecord[]; date: string }>(`/attendance?${query.toString()}`);
  }

  async getAttendanceRoster(classroomId: string, date: string) {
    return this.getAttendance({ classroomId, date });
  }

  async saveAttendanceBatch(data: {
    courseId?: string;
    classroomId?: string;
    date?: string;
    records: { studentId: string; status: string; notes?: string }[];
  }) {
    return this.request<{ success: boolean; data: AttendanceRecord[] }>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordBatchAttendance(data: {
    courseId?: string;
    classroomId?: string;
    date?: string;
    records: { studentId: string; status: string; notes?: string }[];
  }) {
    return this.saveAttendanceBatch(data);
  }

  async getAttendanceSummary(studentId?: string) {
    const q = studentId ? `?studentId=${studentId}` : '';
    return this.request<{ success: boolean; data: any }>(`/attendance/summary${q}`);
  }

  // --- Gradebook ---
  async getGradebook(courseId: string) {
    return this.request<{ success: boolean; data: any }>(`/gradebook?courseId=${courseId}`);
  }

  async getCourseGradebook(courseId: string) {
    return this.getGradebook(courseId);
  }

  async exportGradebookCsv(courseId: string) {
    return this.request<{ success: boolean; csv: string }>(`/gradebook/export-csv?courseId=${courseId}`);
  }

  async getMyGrades(studentId?: string) {
    const q = studentId ? `?studentId=${studentId}` : '';
    return this.request<{ success: boolean; data: any }>(`/gradebook/my-grades${q}`);
  }

  // --- Settings & Audit ---
  async getOrganization() {
    return this.request<{ success: boolean; data: Organization }>('/dashboard/organization');
  }

  async updateOrganization(data: Partial<Organization>) {
    return this.request<{ success: boolean; data: Organization }>('/dashboard/organization', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAuditLogs() {
    return this.request<{ success: boolean; data: AuditLog[] }>('/dashboard/audit-logs');
  }

  // --- Rtiqa AI Engine APIs ---
  async aiChat(params: {
    prompt: string;
    conversationId?: string;
    courseId?: string;
    lessonId?: string;
    feature?: AIFeatureType;
  }) {
    return this.request<{
      success: boolean;
      data: {
        text: string;
        conversationId: string;
        messageId: string;
        inputTokens: number;
        outputTokens: number;
        estimatedCost: number;
        model: string;
        provider: string;
      };
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async aiTeacherAssistant(params: {
    prompt: string;
    courseId?: string;
    lessonId?: string;
    topic?: string;
  }) {
    return this.request<{
      success: boolean;
      data: {
        text: string;
        conversationId: string;
        messageId: string;
        inputTokens: number;
        outputTokens: number;
        estimatedCost: number;
        model: string;
        provider: string;
      };
    }>('/ai/teacher-assistant', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async aiSummarize(params: { content?: string; lessonId?: string; courseId?: string }) {
    return this.request<{
      success: boolean;
      data: {
        text: string;
        conversationId: string;
        messageId: string;
        inputTokens: number;
        outputTokens: number;
        estimatedCost: number;
        model: string;
        provider: string;
      };
    }>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async aiGenerateQuestions(params: {
    topic?: string;
    courseId?: string;
    lessonId?: string;
    questionCount?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }) {
    return this.request<{
      success: boolean;
      data: {
        text: string;
        questions: any;
        conversationId: string;
        messageId: string;
        inputTokens: number;
        outputTokens: number;
        estimatedCost: number;
      };
    }>('/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getAIUsage() {
    return this.request<{
      success: boolean;
      data: {
        summary: AIUsageSummary;
        recentUserRequests: any[];
      };
    }>('/ai/usage');
  }

  async getAIConversations() {
    return this.request<{ success: boolean; data: AIConversation[] }>('/ai/conversations');
  }

  async getAIConversation(id: string) {
    return this.request<{
      success: boolean;
      data: {
        conversation: AIConversation;
        messages: AIMessage[];
      };
    }>(`/ai/conversations/${id}`);
  }

  async deleteAIConversation(id: string) {
    return this.request<{ success: boolean; message: string }>(`/ai/conversations/${id}`, {
      method: 'DELETE',
    });
  }
}

export const platformApi = new PlatformApiClient();

