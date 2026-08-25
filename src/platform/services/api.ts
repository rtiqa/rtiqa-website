import {
  User,
  Organization,
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
  GradebookMatrix,
  StudentAcademicPerformanceSummary,
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
  TeacherAssignment,
  StudentEnrollment,
  ParentStudentLink,
  TeacherAssignmentRole,
  StudentEnrollmentStatus,
  StorageObject,
  StorageResourceType,
  UploadUrlResponse,
  DownloadUrlResponse,
  NotificationItem,
  NotificationType,
  AcademicAnalyticsSummary,
  CurriculumUnit,
  LibraryResource,
  ResourceActivity,
  LibraryStats,
  LibraryResourceType,
  LibraryResourceVisibility,
  LibraryResourceStatus,
  ResourceActivityAction,
  ActiveContext,
  StudentProfile,
  ParentLinkToken,
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

  hasToken(): boolean {
    return Boolean(this.token);
  }

  getToken(): string | null {
    return this.token;
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
  async login(emailOrIdentifier: string, password?: string, tenantSlug?: string) {
    const slug = tenantSlug || this.tenantSlug;
    const res = await this.request<{ success: boolean; token: string; user: User; organization: Organization }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ identifier: emailOrIdentifier, email: emailOrIdentifier, password, tenantSlug: slug }),
      }
    );
    this.setToken(res.token);
    this.setTenantSlug(res.organization.slug);
    return res;
  }

  async register(data: {
    fullName: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
    tenantSlug?: string;
  }) {
    const slug = data.tenantSlug || this.tenantSlug;
    const res = await this.request<{
      success: boolean;
      token: string;
      user: User;
      organization: Organization;
      verificationSent?: boolean;
      message: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, tenantSlug: slug }),
    });
    this.setToken(res.token);
    this.setTenantSlug(res.organization.slug);
    return res;
  }

  async sendPhoneOtp(phone: string, purpose: string = 'login') {
    return this.request<{
      success: boolean;
      phone: string;
      provider: string;
      isSimulated?: boolean;
      expiresInSeconds: number;
      cooldownSeconds: number;
      message: string;
      devOtpCode?: string;
    }>('/auth/phone/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone, purpose }),
    });
  }

  async verifyPhoneOtp(phone: string, code: string, fullName?: string, tenantSlug?: string) {
    const slug = tenantSlug || this.tenantSlug;
    const res = await this.request<{
      success: boolean;
      token: string;
      user: User;
      organization: Organization;
      message: string;
    }>('/auth/phone/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, fullName, tenantSlug: slug }),
    });
    this.setToken(res.token);
    this.setTenantSlug(res.organization.slug);
    return res;
  }

  async getGoogleAuthUrl(tenantSlug?: string) {
    const slug = tenantSlug || this.tenantSlug;
    return this.request<{
      success: boolean;
      url: string;
      clientId?: string;
      state: string;
      isConfigured: boolean;
      redirectUri: string;
    }>(`/auth/google/url?tenantSlug=${encodeURIComponent(slug)}`);
  }

  async verifyGoogleCredential(credential: string, tenantSlug?: string) {
    const slug = tenantSlug || this.tenantSlug;
    const res = await this.request<{
      success: boolean;
      token: string;
      user: User;
      organization: Organization;
      message: string;
    }>('/auth/google/verify-credential', {
      method: 'POST',
      body: JSON.stringify({ credential, tenantSlug: slug }),
    });
    this.setToken(res.token);
    this.setTenantSlug(res.organization.slug);
    return res;
  }

  async forgotPassword(email: string) {
    return this.request<{ success: boolean; message: string; devResetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string; user?: User }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async sendEmailVerification() {
    return this.request<{ success: boolean; message: string; alreadyVerified?: boolean; devVerificationToken?: string }>(
      '/auth/verify-email/send',
      { method: 'POST' }
    );
  }

  async confirmEmailVerification(token: string) {
    return this.request<{ success: boolean; message: string; user?: User }>('/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async linkGoogle(data: { credential?: string; code?: string }) {
    return this.request<{ success: boolean; message: string; user?: User }>('/auth/link/google', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async linkPhone(phone: string, code: string) {
    return this.request<{ success: boolean; message: string; user?: User }>('/auth/link/phone', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  async unlinkProvider(provider: string) {
    return this.request<{ success: boolean; message: string; user?: User }>(`/auth/unlink/${encodeURIComponent(provider)}`, {
      method: 'DELETE',
    });
  }

  async getProfile() {
    return this.request<{ success: boolean; user: User; organization: Organization; activeContext?: ActiveContext; activeRole?: string }>('/auth/profile');
  }

  async updateProfile(data: { fullName?: string; avatarUrl?: string; phone?: string }) {
    return this.request<{ success: boolean; message: string; user?: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async switchOrganization(organizationId?: string, organizationSlug?: string) {
    const res = await this.request<{
      success: boolean;
      token: string;
      organization: Organization;
      activeRole: string;
      message: string;
      activeContext?: ActiveContext;
    }>('/auth/switch-organization', {
      method: 'POST',
      body: JSON.stringify({ organizationId, organizationSlug }),
    });
    this.setToken(res.token);
    if (res.organization?.slug) {
      this.setTenantSlug(res.organization.slug);
    }
    return res;
  }

  async switchContext(params: {
    membershipId?: string;
    contextType?: 'PERSONAL' | 'ORGANIZATION';
    organizationId?: string;
    organizationSlug?: string;
  }) {
    const res = await this.request<{
      success: boolean;
      token: string;
      activeContext: ActiveContext;
      organization?: Organization;
      activeRole: string;
      message: string;
      user?: User;
    }>('/auth/switch-context', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    this.setToken(res.token);
    if (res.organization?.slug) {
      this.setTenantSlug(res.organization.slug);
    } else if (res.activeContext?.type === 'PERSONAL') {
      this.setTenantSlug('');
    }
    return res;
  }

  async demoSwitch(persona: 'admin' | 'teacher' | 'teacher2' | 'student' | 'student2' | 'parent', tenantSlug?: string) {
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
    return this.request<{ success: boolean; user: User; organization: Organization; activeContext?: ActiveContext; activeRole?: string }>('/auth/me');
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

  async updateAcademicYear(id: string, data: Partial<AcademicYear>) {
    return this.request<{ success: boolean; data: AcademicYear }>(`/academic/years/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAcademicYear(id: string) {
    return this.request<{ success: boolean; message: string }>(`/academic/years/${id}`, {
      method: 'DELETE',
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

  async updateTerm(id: string, data: Partial<Term>) {
    return this.request<{ success: boolean; data: Term }>(`/academic/terms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTerm(id: string) {
    return this.request<{ success: boolean; message: string }>(`/academic/terms/${id}`, {
      method: 'DELETE',
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

  async updateGradeLevel(id: string, data: Partial<GradeLevel>) {
    return this.request<{ success: boolean; data: GradeLevel }>(`/academic/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGradeLevel(id: string) {
    return this.request<{ success: boolean; message: string }>(`/academic/grades/${id}`, {
      method: 'DELETE',
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

  async updateClassroom(id: string, data: Partial<Classroom>) {
    return this.request<{ success: boolean; data: Classroom }>(`/academic/classrooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClassroom(id: string) {
    return this.request<{ success: boolean; message: string }>(`/academic/classrooms/${id}`, {
      method: 'DELETE',
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

  async updateSubject(id: string, data: Partial<Subject>) {
    return this.request<{ success: boolean; data: Subject }>(`/academic/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSubject(id: string) {
    return this.request<{ success: boolean; message: string }>(`/academic/subjects/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Teacher Assignments ---
  async getTeacherAssignments(filters: { teacherId?: string; classroomId?: string; courseId?: string; academicYearId?: string; subjectId?: string } = {}) {
    const query = new URLSearchParams();
    if (filters.teacherId) query.set('teacherId', filters.teacherId);
    if (filters.classroomId) query.set('classroomId', filters.classroomId);
    if (filters.courseId) query.set('courseId', filters.courseId);
    if (filters.academicYearId) query.set('academicYearId', filters.academicYearId);
    if (filters.subjectId) query.set('subjectId', filters.subjectId);
    return this.request<{ success: boolean; data: TeacherAssignment[] }>(`/academic/teacher-assignments?${query.toString()}`);
  }

  async createTeacherAssignment(data: Partial<TeacherAssignment>) {
    return this.request<{ success: boolean; data: TeacherAssignment }>('/academic/teacher-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeacherAssignment(id: string, data: Partial<TeacherAssignment>) {
    return this.request<{ success: boolean; data: TeacherAssignment }>(`/academic/teacher-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTeacherAssignment(id: string) {
    return this.request<{ success: boolean; message: string }>(`/academic/teacher-assignments/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Student Enrollments ---
  async getStudentEnrollments(filters: { classroomId?: string; studentId?: string; academicYearId?: string; status?: StudentEnrollmentStatus } = {}) {
    const query = new URLSearchParams();
    if (filters.classroomId) query.set('classroomId', filters.classroomId);
    if (filters.studentId) query.set('studentId', filters.studentId);
    if (filters.academicYearId) query.set('academicYearId', filters.academicYearId);
    if (filters.status) query.set('status', filters.status);
    return this.request<{ success: boolean; data: StudentEnrollment[] }>(`/academic/enrollments?${query.toString()}`);
  }

  async createStudentEnrollment(data: Partial<StudentEnrollment>) {
    return this.request<{ success: boolean; data: StudentEnrollment }>('/academic/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStudentEnrollment(id: string, data: Partial<StudentEnrollment>) {
    return this.request<{ success: boolean; data: StudentEnrollment }>(`/academic/enrollments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStudentEnrollment(id: string) {
    return this.request<{ success: boolean; message: string }>(`/academic/enrollments/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Parent-Student Links & Student Dossier ---
  async getParentStudentLinks(filters: { parentId?: string; studentId?: string } = {}) {
    const query = new URLSearchParams();
    if (filters.parentId) query.set('parentId', filters.parentId);
    if (filters.studentId) query.set('studentId', filters.studentId);
    return this.request<{ success: boolean; data: ParentStudentLink[] }>(`/academic/parent-links?${query.toString()}`);
  }

  async createParentStudentLink(data: Partial<ParentStudentLink>) {
    return this.request<{ success: boolean; data: ParentStudentLink }>('/academic/parent-links', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteParentStudentLink(id: string) {
    return this.request<{ success: boolean; message: string }>(`/academic/parent-links/${id}`, {
      method: 'DELETE',
    });
  }

  async getStudentDossier(studentId: string) {
    return this.request<{ success: boolean; data: any }>(`/students/${studentId}/dossier`);
  }

  async getStudentBehavior(studentId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/students/${studentId}/behavior`);
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

  async updateCourse(id: string, data: Partial<Course>) {
    return this.request<{ success: boolean; data: Course }>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: string) {
    return this.request<{ success: boolean; message: string }>(`/courses/${id}`, {
      method: 'DELETE',
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
  async getAttendance(params: { courseId?: string; classroomId?: string; date?: string; studentId?: string } = {}) {
    const query = new URLSearchParams();
    if (params.courseId) query.set('courseId', params.courseId);
    if (params.classroomId) query.set('classroomId', params.classroomId);
    if (params.date) query.set('date', params.date);
    if (params.studentId) query.set('studentId', params.studentId);
    return this.request<{ success: boolean; data: AttendanceRecord[]; date: string }>(`/attendance?${query.toString()}`);
  }

  async getAttendanceSessions(params: { classroomId?: string; courseId?: string; date?: string; status?: AttendanceSessionStatus } = {}) {
    const query = new URLSearchParams();
    if (params.classroomId) query.set('classroomId', params.classroomId);
    if (params.courseId) query.set('courseId', params.courseId);
    if (params.date) query.set('date', params.date);
    if (params.status) query.set('status', params.status);
    return this.request<{ success: boolean; data: AttendanceSession[] }>(`/attendance/sessions?${query.toString()}`);
  }

  async getAttendanceSessionById(id: string) {
    return this.request<{
      success: boolean;
      data: {
        session: AttendanceSession;
        roster: Array<{
          studentId: string;
          studentName: string;
          studentIdNumber?: string;
          status: string;
          notes?: string;
          recordId?: string;
        }>;
        records: AttendanceRecord[];
      };
    }>(`/attendance/sessions/${id}`);
  }

  async createAttendanceSession(data: {
    classroomId: string;
    courseId?: string;
    date?: string;
    periodNumber?: number;
    title?: string;
    notes?: string;
  }) {
    return this.request<{ success: boolean; data: AttendanceSession }>('/attendance/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitSessionRollCall(sessionId: string, records: { studentId: string; status: string; notes?: string }[]) {
    return this.request<{ success: boolean; data: AttendanceRecord[]; message: string }>(`/attendance/sessions/${sessionId}/roll-call`, {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  }

  async deleteAttendanceSession(id: string) {
    return this.request<{ success: boolean; message: string }>(`/attendance/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  async getAttendanceRoster(classroomId: string, date: string) {
    return this.getAttendance({ classroomId, date });
  }

  async saveAttendanceBatch(data: {
    courseId?: string;
    classroomId?: string;
    date?: string;
    sessionId?: string;
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
    sessionId?: string;
    records: { studentId: string; status: string; notes?: string }[];
  }) {
    return this.saveAttendanceBatch(data);
  }

  async getStudentAttendanceSummary(studentId: string) {
    return this.request<{
      success: boolean;
      data: {
        studentId: string;
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        excusedDays: number;
        attendanceRate: number;
        records: AttendanceRecord[];
      };
    }>(`/attendance/student/${studentId}`);
  }

  async getAttendanceSummary(studentId?: string) {
    const q = studentId ? `?studentId=${studentId}` : '';
    return this.request<{ success: boolean; data: any }>(`/attendance/summary${q}`);
  }

  // --- Assessments & Gradebook ---
  async getAssessments(params: { courseId?: string; classroomId?: string; termId?: string; category?: AssessmentCategory; status?: AssessmentStatus } = {}) {
    const query = new URLSearchParams();
    if (params.courseId) query.set('courseId', params.courseId);
    if (params.classroomId) query.set('classroomId', params.classroomId);
    if (params.termId) query.set('termId', params.termId);
    if (params.category) query.set('category', params.category);
    if (params.status) query.set('status', params.status);
    return this.request<{ success: boolean; data: Assessment[] }>(`/gradebook/assessments?${query.toString()}`);
  }

  async getAssessmentById(id: string) {
    return this.request<{ success: boolean; data: Assessment }>(`/gradebook/assessments/${id}`);
  }

  async createAssessment(data: Partial<Assessment>) {
    return this.request<{ success: boolean; data: Assessment }>('/gradebook/assessments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssessment(id: string, data: Partial<Assessment>) {
    return this.request<{ success: boolean; data: Assessment }>(`/gradebook/assessments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAssessment(id: string) {
    return this.request<{ success: boolean; message: string }>(`/gradebook/assessments/${id}`, {
      method: 'DELETE',
    });
  }

  async getAssessmentGrades(assessmentId: string) {
    return this.request<{
      success: boolean;
      data: {
        assessment: Assessment;
        roster: Array<{
          studentId: string;
          studentName: string;
          studentIdNumber?: string;
          score?: number;
          percentage?: number;
          feedback?: string;
          gradedAt?: string;
          gradedByName?: string;
          status: 'GRADED' | 'UNGRADED';
        }>;
      };
    }>(`/gradebook/assessments/${assessmentId}/grades`);
  }

  async recordAssessmentGradesBatch(assessmentId: string, grades: { studentId: string; score: number; feedback?: string }[]) {
    return this.request<{ success: boolean; data: AssessmentGrade[]; message: string }>(`/gradebook/assessments/${assessmentId}/grades`, {
      method: 'POST',
      body: JSON.stringify({ grades }),
    });
  }

  async getGradebook(courseId: string) {
    return this.request<{ success: boolean; data: GradebookMatrix }>(`/gradebook?courseId=${courseId}`);
  }

  async getCourseGradebook(courseId: string) {
    return this.getGradebook(courseId);
  }

  async exportGradebookCsv(courseId: string) {
    return this.request<{ success: boolean; csv: string; fileName: string }>(`/gradebook/export-csv?courseId=${courseId}`);
  }

  async getStudentAcademicPerformance(studentId: string) {
    return this.request<{ success: boolean; data: StudentAcademicPerformanceSummary }>(`/gradebook/student/${studentId}/performance`);
  }

  async getMyGrades(studentId?: string) {
    const q = studentId ? `?studentId=${studentId}` : '';
    return this.request<{ success: boolean; data: StudentAcademicPerformanceSummary }>(`/gradebook/my-grades${q}`);
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

  // ====================================================================
  // STORAGE API (Presigned S3/R2 3-step lifecycle)
  // ====================================================================

  async getStorageUploadUrl(params: {
    resourceType: StorageResourceType;
    resourceId: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
    customMetadata?: Record<string, unknown>;
  }) {
    return this.request<{ success: boolean; data: UploadUrlResponse }>('/storage/upload-url', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async finalizeStorageUpload(storageObjectId: string) {
    return this.request<{ success: boolean; data: StorageObject }>(`/storage/finalize/${storageObjectId}`, {
      method: 'POST',
    });
  }

  async getStorageDownloadUrl(storageObjectId: string, filename?: string) {
    const query = filename ? `?filename=${encodeURIComponent(filename)}` : '';
    return this.request<{ success: boolean; data: DownloadUrlResponse }>(`/storage/download-url/${storageObjectId}${query}`);
  }

  async getResourceStorageObjects(resourceType: StorageResourceType, resourceId: string) {
    return this.request<{ success: boolean; data: StorageObject[] }>(`/storage/resource/${resourceType}/${resourceId}`);
  }

  async deleteStorageObject(storageObjectId: string) {
    return this.request<{ success: boolean; message: string }>(`/storage/object/${storageObjectId}`, {
      method: 'DELETE',
    });
  }

  /**
   * High-level client helper to execute the full 3-step presigned upload lifecycle:
   * 1. POST /api/v1/storage/upload-url
   * 2. PUT binary file directly to presigned S3/R2 URL
   * 3. POST /api/v1/storage/finalize/:id
   */
  async uploadFileToStorage(options: {
    file: File;
    resourceType: StorageResourceType;
    resourceId: string;
    customMetadata?: Record<string, unknown>;
    onProgress?: (percent: number) => void;
  }): Promise<StorageObject> {
    const { file, resourceType, resourceId, customMetadata, onProgress } = options;

    // Step 1: Request presigned upload URL
    const urlRes = await this.getStorageUploadUrl({
      resourceType,
      resourceId,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      customMetadata,
    });

    if (!urlRes.success || !urlRes.data) {
      throw new Error((urlRes as any).message || 'فشل في إنشاء رابط الرفع الآمن');
    }

    const { storageObjectId, uploadUrl } = urlRes.data;

    // Step 2: PUT directly to presigned URL
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`فشل رفع الملف إلى التخزين السحابي (كود الاستجابة: ${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error('حدث خطأ في الاتصال بالشبكة أثناء رفع الملف'));
      xhr.send(file);
    });

    // Step 3: Finalize upload
    const finalRes = await this.finalizeStorageUpload(storageObjectId);
    if (!finalRes.success || !finalRes.data) {
      throw new Error((finalRes as any).message || 'فشل في تثبيت الملف في النظام');
    }

    return finalRes.data;
  }

  // --- Notification APIs ---
  async getNotifications(unreadOnly?: boolean, limit?: number) {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unreadOnly', 'true');
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ success: boolean; data: NotificationItem[]; meta: { total: number; unreadCount: number } }>(
      `/notifications${query}`
    );
  }

  async getUnreadNotificationCount() {
    return this.request<{ success: boolean; data: { unreadCount: number } }>('/notifications/unread-count');
  }

  async markNotificationAsRead(id: string) {
    return this.request<{ success: boolean; data: { unreadCount: number } }>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<{ success: boolean; data: { updatedCount: number; unreadCount: number } }>(
      '/notifications/read-all',
      { method: 'POST' }
    );
  }

  async broadcastNotification(payload: {
    title: string;
    body: string;
    targetRole?: string;
    classroomId?: string;
    channels?: string[];
  }) {
    return this.request<{ success: boolean; data: { recipientsCount: number; message: string } }>(
      '/notifications/broadcast',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  // --- Phase 4 AI APIs ---
  async askParentAdvisor(studentId: string | undefined, question: string, includePerformance = true) {
    return this.request<{
      success: boolean;
      data: {
        text: string;
        structuredData?: any;
        sources?: any[];
        usage: { promptTokens: number; completionTokens: number; totalTokens: number };
      };
    }>('/ai/parent-advisor', {
      method: 'POST',
      body: JSON.stringify({ studentId, question, includePerformance }),
    });
  }

  async generateLessonPlan(payload: {
    topic: string;
    courseId?: string;
    gradeLevel?: string;
    durationMinutes?: number;
    learningObjectives?: string;
  }) {
    return this.request<{
      success: boolean;
      data: {
        text: string;
        structuredData?: any;
        sources?: any[];
        usage: { promptTokens: number; completionTokens: number; totalTokens: number };
      };
    }>('/ai/lesson-plan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async generateAssignmentFeedback(payload: {
    assignmentTitle?: string;
    studentAnswer: string;
    score?: number;
    maxScore?: number;
    rubricCriteria?: string;
  }) {
    return this.request<{
      success: boolean;
      data: {
        text: string;
        structuredData?: any;
        sources?: any[];
        usage: { promptTokens: number; completionTokens: number; totalTokens: number };
      };
    }>('/ai/assignment-feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getLearningRecommendations(studentId?: string) {
    return this.request<{
      success: boolean;
      data: {
        text: string;
        structuredData?: any;
        sources?: any[];
        usage: { promptTokens: number; completionTokens: number; totalTokens: number };
      };
    }>('/ai/recommendations', {
      method: 'POST',
      body: JSON.stringify({ studentId }),
    });
  }

  // --- Academic Analytics API ---
  async getAcademicAnalytics() {
    return this.request<{ success: boolean; data: AcademicAnalyticsSummary }>('/dashboard/analytics');
  }

  // ==========================================
  // Phase 5.1: Curriculum Units API
  // ==========================================
  async getUnitsByCourse(courseId: string) {
    return this.request<{ units: CurriculumUnit[] }>(`/library/units/course/${courseId}`);
  }

  async getUnitById(unitId: string) {
    return this.request<{ unit: CurriculumUnit }>(`/library/units/${unitId}`);
  }

  async createUnit(payload: { courseId: string; title: string; description?: string; orderIndex?: number; isPublished?: boolean }) {
    return this.request<{ unit: CurriculumUnit }>('/library/units', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateUnit(unitId: string, payload: Partial<CurriculumUnit>) {
    return this.request<{ unit: CurriculumUnit }>(`/library/units/${unitId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteUnit(unitId: string) {
    return this.request<{ success: boolean }>(`/library/units/${unitId}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // Phase 5.1: Digital Learning Library Resources API
  // ==========================================
  async getLibraryStats() {
    return this.request<{ stats: LibraryStats }>('/library/resources/stats');
  }

  async getLibraryResources(filter?: {
    subjectId?: string;
    gradeLevelId?: string;
    courseId?: string;
    unitId?: string;
    lessonId?: string;
    resourceType?: string;
    status?: string;
    visibility?: string;
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          params.append(key, val);
        }
      });
    }
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ resources: LibraryResource[] }>(`/library/resources${queryStr}`);
  }

  async getLibraryResourceById(id: string) {
    return this.request<{ resource: LibraryResource }>(`/library/resources/${id}`);
  }

  async getLibraryResource(id: string) {
    return this.getLibraryResourceById(id);
  }

  async createLibraryResource(payload: Partial<LibraryResource>) {
    return this.request<{ resource: LibraryResource }>('/library/resources', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateLibraryResource(id: string, payload: Partial<LibraryResource>) {
    return this.request<{ resource: LibraryResource }>(`/library/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteLibraryResource(id: string) {
    return this.request<{ success: boolean }>(`/library/resources/${id}`, {
      method: 'DELETE',
    });
  }

  async recordResourceActivity(resourceId: string, action: ResourceActivityAction, details?: { courseId?: string; lessonId?: string }) {
    return this.request<{ activity: ResourceActivity; resource: LibraryResource }>(`/library/resources/${resourceId}/activity`, {
      method: 'POST',
      body: JSON.stringify({ action, ...details }),
    });
  }
}

export const platformApi = new PlatformApiClient();


