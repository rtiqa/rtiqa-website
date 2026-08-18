import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth, requireRoles } from '../auth.ts';
import type {
  StudentLifecycleStatus,
  StudentGender,
  StudentBloodType,
  StudentBehaviorType,
} from '../types.ts';
import { sanitizeString, isValidEmail } from '../security.ts';

export const studentRouter = express.Router();

studentRouter.use(requireAuth);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_LIFECYCLE_STATUSES: StudentLifecycleStatus[] = [
  'ACTIVE',
  'PROBATION',
  'SUSPENDED',
  'WITHDRAWN',
  'TRANSFERRED',
  'GRADUATED',
];
const VALID_GENDERS: StudentGender[] = ['MALE', 'FEMALE'];
const VALID_BLOOD_TYPES: StudentBloodType[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'UNKNOWN',
];
const VALID_BEHAVIOR_TYPES: StudentBehaviorType[] = [
  'POSITIVE_PRAISE',
  'MERIT',
  'MINOR_INFRACTION',
  'MAJOR_INFRACTION',
  'COUNSELING_REFERRAL',
  'SUSPENSION_NOTICE',
];

// Helper to check if caller is authorized to view a specific student
function canAccessStudent(req: PlatformRequest, studentId: string): boolean {
  if (!req.user || !req.organization) return false;
  if (['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(req.user.role)) return true;
  if (req.user.role === 'STUDENT' && req.user.id === studentId) return true;
  if (req.user.role === 'PARENT') {
    const links = db.getParentStudentLinks(req.organization.id, {
      parentId: req.user.id,
      studentId,
    });
    return links.length > 0;
  }
  return false;
}

// 1. GET /api/v1/students (Directory & SIS Filter)
studentRouter.get(
  '/',
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const orgId = req.organization!.id;
      const classroomId = req.query.classroomId as string | undefined;
      const gradeLevelId = req.query.gradeLevelId as string | undefined;
      const status = req.query.status as StudentLifecycleStatus | undefined;
      const search = (req.query.search as string | undefined)?.toLowerCase().trim();

      // Retrieve all students belonging to the organization
      let studentUsers = db.getUsersByOrg(orgId, 'STUDENT');

      if (classroomId) {
        studentUsers = studentUsers.filter((s) => s.classroomId === classroomId);
      }

      const allRecords = db.getStudentRecords(orgId);
      const recordsMap = new Map(allRecords.map((r) => [r.studentId, r]));

      const allEnrollments = db.getStudentEnrollments(orgId);
      const enrollmentsByStudent = new Map<string, typeof allEnrollments>();
      for (const enr of allEnrollments) {
        const list = enrollmentsByStudent.get(enr.studentId) || [];
        list.push(enr);
        enrollmentsByStudent.set(enr.studentId, list);
      }

      const allBehaviors = db.getStudentBehaviorRecords(orgId);
      const pointsByStudent = new Map<string, number>();
      for (const beh of allBehaviors) {
        const cur = pointsByStudent.get(beh.studentId) || 0;
        pointsByStudent.set(beh.studentId, cur + (beh.points || 0));
      }

      // Build enriched student SIS item
      let results = studentUsers.map((u) => {
        const rec = recordsMap.get(u.id);
        const enrollments = enrollmentsByStudent.get(u.id) || [];
        const activeEnrollment = enrollments.find((e) => e.status === 'ACTIVE') || enrollments[0];
        const classroom = u.classroomId ? db.getClassroomById(u.classroomId, orgId) : undefined;
        const gradeLevel = classroom
          ? db.getGradeLevelById(classroom.gradeLevelId, orgId)
          : undefined;

        return {
          id: u.id,
          studentUserId: u.id,
          email: u.email,
          fullName: u.fullName,
          studentIdNumber: u.studentIdNumber,
          phone: u.phone,
          avatarUrl: u.avatarUrl,
          isActive: u.isActive,
          classroomId: u.classroomId,
          classroomName: classroom?.name || activeEnrollment?.classroomName,
          gradeLevelId: classroom?.gradeLevelId || activeEnrollment?.gradeLevelId,
          gradeLevelName: gradeLevel?.name || activeEnrollment?.gradeLevelName,
          record: rec,
          status: rec?.status || (u.isActive ? 'ACTIVE' : 'WITHDRAWN'),
          nationalId: rec?.nationalId,
          dateOfBirth: rec?.dateOfBirth,
          gender: rec?.gender,
          bloodType: rec?.bloodType,
          emergencyContactName: rec?.emergencyContactName,
          emergencyContactPhone: rec?.emergencyContactPhone,
          giftedProgram: rec?.giftedProgram || false,
          behaviorPoints: pointsByStudent.get(u.id) || 0,
          createdAt: u.createdAt,
        };
      });

      // Filter by grade level
      if (gradeLevelId) {
        results = results.filter((s) => s.gradeLevelId === gradeLevelId);
      }

      // Filter by lifecycle status
      if (status) {
        results = results.filter((s) => s.status === status);
      }

      // Filter by search term (name, email, studentIdNumber, nationalId)
      if (search) {
        results = results.filter(
          (s) =>
            s.fullName.toLowerCase().includes(search) ||
            s.email.toLowerCase().includes(search) ||
            (s.studentIdNumber && s.studentIdNumber.toLowerCase().includes(search)) ||
            (s.nationalId && s.nationalId.toLowerCase().includes(search))
        );
      }

      res.json({
        success: true,
        data: results,
      });
    } catch {
      res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// 2. GET /api/v1/students/:studentId (Individual Record)
studentRouter.get('/:studentId', (req: PlatformRequest, res: express.Response) => {
  try {
    const { studentId } = req.params;
    const orgId = req.organization!.id;

    if (!canAccessStudent(req, studentId)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بالوصول لهذا السجل' });
    }

    const studentUser = db.getUserById(studentId, orgId);
    if (!studentUser || studentUser.role !== 'STUDENT') {
      return res.status(404).json({ success: false, error: 'STUDENT_NOT_FOUND', message: 'الطالب غير موجود' });
    }

    const record = db.getStudentRecordByStudentId(studentId, orgId);
    const enrollments = db.getStudentEnrollments(orgId, { studentId });
    const parents = db.getParentStudentLinks(orgId, { studentId });

    res.json({
      success: true,
      data: {
        student: studentUser,
        record,
        enrollments,
        parents,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// 3. GET /api/v1/students/:studentId/dossier (Complete Holistic SIS Profile)
studentRouter.get('/:studentId/dossier', (req: PlatformRequest, res: express.Response) => {
  try {
    const { studentId } = req.params;
    const orgId = req.organization!.id;

    if (!canAccessStudent(req, studentId)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بالوصول لهذا الملف' });
    }

    const dossier = db.getStudentDossier(studentId, orgId);
    if (!dossier) {
      return res.status(404).json({ success: false, error: 'STUDENT_NOT_FOUND', message: 'الملف الشامل للطالب غير موجود' });
    }

    res.json({
      success: true,
      data: dossier,
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// 4. POST /api/v1/students (Atomic SIS Student Registration)
studentRouter.post(
  '/',
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const orgId = req.organization!.id;
      const {
        email,
        fullName,
        nationalId,
        dateOfBirth,
        gender,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
        studentIdNumber,
        phone,
        bloodType,
        nationality,
        admissionDate,
        medicalConditions,
        allergies,
        specialDietaryNeeds,
        previousSchool,
        specialNeedsNotes,
        giftedProgram,
        classroomId,
        academicYearId,
      } = req.body;

      if (!email || !fullName || !nationalId || !dateOfBirth || !gender || !emergencyContactName || !emergencyContactPhone) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'البيانات الأساسية (الاسم، البريد، الهوية، تاريخ الميلاد، الجنس، جهة الاتصال للطوارئ) إلزامية',
        });
      }

      const normalizedEmail = sanitizeString(email).toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ success: false, error: 'INVALID_EMAIL', message: 'صيغة البريد الإلكتروني غير صحيحة' });
      }

      if (db.findUserByEmail(normalizedEmail, orgId)) {
        return res.status(400).json({ success: false, error: 'EMAIL_EXISTS', message: 'البريد الإلكتروني مسجل مسبقاً في هذه المدرسة' });
      }

      const cleanNationalId = sanitizeString(nationalId).trim();
      if (!cleanNationalId) {
        return res.status(400).json({ success: false, error: 'INVALID_NATIONAL_ID', message: 'رقم الهوية الوطنية أو الإقامة غير صالح' });
      }

      if (db.getStudentRecordByNationalId(cleanNationalId, orgId)) {
        return res.status(400).json({ success: false, error: 'NATIONAL_ID_EXISTS', message: 'رقم الهوية الوطنية مسجل مسبقاً لطالب آخر' });
      }

      if (!DATE_REGEX.test(dateOfBirth)) {
        return res.status(400).json({ success: false, error: 'INVALID_DOB', message: 'صيغة تاريخ الميلاد يجب أن تكون YYYY-MM-DD' });
      }

      if (!VALID_GENDERS.includes(gender as StudentGender)) {
        return res.status(400).json({ success: false, error: 'INVALID_GENDER', message: 'الجنس المحدد غير صالح' });
      }

      if (bloodType && !VALID_BLOOD_TYPES.includes(bloodType as StudentBloodType)) {
        return res.status(400).json({ success: false, error: 'INVALID_BLOOD_TYPE', message: 'فصيلة الدم المحددة غير صالحة' });
      }

      if (classroomId && !db.getClassroomById(classroomId, orgId)) {
        return res.status(400).json({ success: false, error: 'INVALID_CLASSROOM', message: 'الشعبة الدراسية غير موجودة' });
      }

      // 1. Create Student User
      const autoStdId = studentIdNumber
        ? sanitizeString(studentIdNumber)
        : `STD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const studentUser = db.createUser({
        organizationId: orgId,
        email: normalizedEmail,
        fullName: sanitizeString(fullName),
        role: 'STUDENT',
        phone: phone ? sanitizeString(phone) : undefined,
        studentIdNumber: autoStdId,
        classroomId: classroomId || undefined,
        isActive: true,
      });

      // 2. Create Student SIS Record
      const admission = admissionDate && DATE_REGEX.test(admissionDate) ? admissionDate : new Date().toISOString().split('T')[0];
      const record = db.createStudentRecord({
        organizationId: orgId,
        studentId: studentUser.id,
        nationalId: cleanNationalId,
        dateOfBirth,
        gender: gender as StudentGender,
        bloodType: (bloodType as StudentBloodType) || 'UNKNOWN',
        nationality: nationality ? sanitizeString(nationality) : 'سعودي',
        admissionDate: admission,
        status: 'ACTIVE',
        medicalConditions: medicalConditions ? sanitizeString(medicalConditions) : undefined,
        allergies: allergies ? sanitizeString(allergies) : undefined,
        specialDietaryNeeds: specialDietaryNeeds ? sanitizeString(specialDietaryNeeds) : undefined,
        emergencyContactName: sanitizeString(emergencyContactName),
        emergencyContactPhone: sanitizeString(emergencyContactPhone),
        emergencyContactRelationship: emergencyContactRelationship ? sanitizeString(emergencyContactRelationship) : 'GUARDIAN',
        previousSchool: previousSchool ? sanitizeString(previousSchool) : undefined,
        specialNeedsNotes: specialNeedsNotes ? sanitizeString(specialNeedsNotes) : undefined,
        giftedProgram: Boolean(giftedProgram),
      });

      // 3. Optional initial enrollment if classroom & academic year provided
      let enrollment;
      if (classroomId) {
        const currentYear = academicYearId
          ? db.getAcademicYearById(academicYearId, orgId)
          : db.getCurrentAcademicYear(orgId);

        if (currentYear) {
          enrollment = db.createStudentEnrollment({
            organizationId: orgId,
            studentId: studentUser.id,
            classroomId,
            academicYearId: currentYear.id,
            status: 'ACTIVE',
          });
        }
      }

      // 4. Log lifecycle admission event
      db.createStudentLifecycleEvent({
        organizationId: orgId,
        studentId: studentUser.id,
        previousStatus: 'ACTIVE',
        newStatus: 'ACTIVE',
        reason: 'تسجيل وقبول جديد في النظام المدرسي (SIS)',
        actionBy: req.user!.id,
        effectiveDate: admission,
      });

      // 5. System Audit Log
      db.logAction(
        orgId,
        req.user!.id,
        req.user!.email,
        'CREATE_STUDENT_SIS_RECORD',
        'StudentRecord',
        record.id,
        { studentId: studentUser.id, nationalId: cleanNationalId, fullName: studentUser.fullName },
        req.ip
      );

      res.status(201).json({
        success: true,
        data: {
          student: studentUser,
          record,
          enrollment,
        },
      });
    } catch {
      res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// 5. PUT /api/v1/students/:studentId/profile (Update SIS Profile & Medical Info)
studentRouter.put(
  '/:studentId/profile',
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const { studentId } = req.params;
      const orgId = req.organization!.id;

      const studentUser = db.getUserById(studentId, orgId);
      if (!studentUser || studentUser.role !== 'STUDENT') {
        return res.status(404).json({ success: false, error: 'STUDENT_NOT_FOUND', message: 'الطالب غير موجود' });
      }

      const {
        fullName,
        phone,
        studentIdNumber,
        nationalId,
        dateOfBirth,
        gender,
        bloodType,
        nationality,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
        medicalConditions,
        allergies,
        specialDietaryNeeds,
        previousSchool,
        specialNeedsNotes,
        giftedProgram,
        classroomId,
      } = req.body;

      // Check nationalId conflict if changed
      if (nationalId) {
        const cleanNationalId = sanitizeString(nationalId).trim();
        const existing = db.getStudentRecordByNationalId(cleanNationalId, orgId);
        if (existing && existing.studentId !== studentId) {
          return res.status(400).json({ success: false, error: 'NATIONAL_ID_EXISTS', message: 'رقم الهوية الوطنية مستخدم من قبل طالب آخر' });
        }
      }

      // Update User object fields
      const userUpdates: Partial<typeof studentUser> = {};
      if (fullName) userUpdates.fullName = sanitizeString(fullName);
      if (phone !== undefined) userUpdates.phone = phone ? sanitizeString(phone) : undefined;
      if (studentIdNumber) userUpdates.studentIdNumber = sanitizeString(studentIdNumber);
      if (classroomId !== undefined) {
        if (classroomId && !db.getClassroomById(classroomId, orgId)) {
          return res.status(400).json({ success: false, error: 'INVALID_CLASSROOM', message: 'الشعبة الدراسية غير موجودة' });
        }
        userUpdates.classroomId = classroomId || undefined;
      }
      if (Object.keys(userUpdates).length > 0) {
        db.updateUser(studentId, orgId, userUpdates);
      }

      // Update Record fields
      let record = db.getStudentRecordByStudentId(studentId, orgId);
      if (!record) {
        // Lazily create if not present
        record = db.createStudentRecord({
          organizationId: orgId,
          studentId,
          nationalId: nationalId ? sanitizeString(nationalId) : (studentUser.studentIdNumber || 'N/A'),
          dateOfBirth: dateOfBirth && DATE_REGEX.test(dateOfBirth) ? dateOfBirth : '2010-01-01',
          gender: gender && VALID_GENDERS.includes(gender) ? gender : 'MALE',
          bloodType: bloodType && VALID_BLOOD_TYPES.includes(bloodType) ? bloodType : 'UNKNOWN',
          admissionDate: new Date().toISOString().split('T')[0],
          status: 'ACTIVE',
          emergencyContactName: emergencyContactName ? sanitizeString(emergencyContactName) : 'ولي الأمر',
          emergencyContactPhone: emergencyContactPhone ? sanitizeString(emergencyContactPhone) : '+966500000000',
          emergencyContactRelationship: emergencyContactRelationship ? sanitizeString(emergencyContactRelationship) : 'GUARDIAN',
          giftedProgram: Boolean(giftedProgram),
        });
      } else {
        const recordUpdates: Partial<typeof record> = {};
        if (nationalId) recordUpdates.nationalId = sanitizeString(nationalId);
        if (dateOfBirth && DATE_REGEX.test(dateOfBirth)) recordUpdates.dateOfBirth = dateOfBirth;
        if (gender && VALID_GENDERS.includes(gender)) recordUpdates.gender = gender;
        if (bloodType && VALID_BLOOD_TYPES.includes(bloodType)) recordUpdates.bloodType = bloodType;
        if (nationality !== undefined) recordUpdates.nationality = sanitizeString(nationality);
        if (emergencyContactName) recordUpdates.emergencyContactName = sanitizeString(emergencyContactName);
        if (emergencyContactPhone) recordUpdates.emergencyContactPhone = sanitizeString(emergencyContactPhone);
        if (emergencyContactRelationship) recordUpdates.emergencyContactRelationship = sanitizeString(emergencyContactRelationship);
        if (medicalConditions !== undefined) recordUpdates.medicalConditions = sanitizeString(medicalConditions);
        if (allergies !== undefined) recordUpdates.allergies = sanitizeString(allergies);
        if (specialDietaryNeeds !== undefined) recordUpdates.specialDietaryNeeds = sanitizeString(specialDietaryNeeds);
        if (previousSchool !== undefined) recordUpdates.previousSchool = sanitizeString(previousSchool);
        if (specialNeedsNotes !== undefined) recordUpdates.specialNeedsNotes = sanitizeString(specialNeedsNotes);
        if (giftedProgram !== undefined) recordUpdates.giftedProgram = Boolean(giftedProgram);

        record = db.updateStudentRecord(studentId, orgId, recordUpdates);
      }

      db.logAction(
        orgId,
        req.user!.id,
        req.user!.email,
        'UPDATE_STUDENT_PROFILE',
        'StudentRecord',
        record?.id || studentId,
        { studentId },
        req.ip
      );

      res.json({
        success: true,
        data: {
          student: db.getUserById(studentId, orgId),
          record,
        },
      });
    } catch {
      res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// 6. POST /api/v1/students/:studentId/status-transition (Lifecycle Status Changes)
studentRouter.post(
  '/:studentId/status-transition',
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const { studentId } = req.params;
      const orgId = req.organization!.id;
      const { newStatus, reason, effectiveDate } = req.body;

      if (!newStatus || !reason) {
        return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'الحالة الجديدة وسبب التغيير إلزاميان' });
      }

      if (!VALID_LIFECYCLE_STATUSES.includes(newStatus as StudentLifecycleStatus)) {
        return res.status(400).json({ success: false, error: 'INVALID_STATUS', message: 'الحالة المحددة غير صالحة' });
      }

      const studentUser = db.getUserById(studentId, orgId);
      if (!studentUser || studentUser.role !== 'STUDENT') {
        return res.status(404).json({ success: false, error: 'STUDENT_NOT_FOUND', message: 'الطالب غير موجود' });
      }

      let record = db.getStudentRecordByStudentId(studentId, orgId);
      const previousStatus = record?.status || (studentUser.isActive ? 'ACTIVE' : 'WITHDRAWN');

      const effDate = effectiveDate && DATE_REGEX.test(effectiveDate) ? effectiveDate : new Date().toISOString().split('T')[0];

      // Update record
      if (!record) {
        record = db.createStudentRecord({
          organizationId: orgId,
          studentId,
          nationalId: studentUser.studentIdNumber || 'N/A',
          dateOfBirth: '2010-01-01',
          gender: 'MALE',
          admissionDate: effDate,
          status: newStatus as StudentLifecycleStatus,
          statusReason: sanitizeString(reason),
          emergencyContactName: 'ولي الأمر',
          emergencyContactPhone: '+966500000000',
          emergencyContactRelationship: 'GUARDIAN',
          giftedProgram: false,
        });
      } else {
        record = db.updateStudentRecord(studentId, orgId, {
          status: newStatus as StudentLifecycleStatus,
          statusReason: sanitizeString(reason),
          graduationDate: newStatus === 'GRADUATED' ? effDate : record.graduationDate,
        });
      }

      // Sync active state on user
      const isStillActive = newStatus === 'ACTIVE' || newStatus === 'PROBATION';
      db.updateUser(studentId, orgId, { isActive: isStillActive });

      // Update active enrollments if withdrawn/suspended/graduated
      if (!isStillActive) {
        const enrollments = db.getStudentEnrollments(orgId, { studentId, status: 'ACTIVE' });
        for (const enr of enrollments) {
          db.updateStudentEnrollment(enr.id, orgId, {
            status: newStatus === 'GRADUATED' ? 'GRADUATED' : newStatus === 'TRANSFERRED' ? 'TRANSFERRED' : 'SUSPENDED',
          });
        }
      }

      // Record Lifecycle Event
      const event = db.createStudentLifecycleEvent({
        organizationId: orgId,
        studentId,
        previousStatus: previousStatus as StudentLifecycleStatus,
        newStatus: newStatus as StudentLifecycleStatus,
        reason: sanitizeString(reason),
        actionBy: req.user!.id,
        effectiveDate: effDate,
      });

      db.logAction(
        orgId,
        req.user!.id,
        req.user!.email,
        'STUDENT_LIFECYCLE_TRANSITION',
        'StudentRecord',
        record?.id || studentId,
        { studentId, previousStatus, newStatus, reason },
        req.ip
      );

      res.json({
        success: true,
        data: {
          record,
          event,
        },
      });
    } catch {
      res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// 7. GET /api/v1/students/:studentId/behavior (Behavior Records)
studentRouter.get('/:studentId/behavior', (req: PlatformRequest, res: express.Response) => {
  try {
    const { studentId } = req.params;
    const orgId = req.organization!.id;

    if (!canAccessStudent(req, studentId)) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بالوصول لسجل السلوك' });
    }

    const records = db.getStudentBehaviorRecords(orgId, { studentId });
    res.json({
      success: true,
      data: records,
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// 8. POST /api/v1/students/:studentId/behavior (Add Behavior / Merit Incident)
studentRouter.post(
  '/:studentId/behavior',
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const { studentId } = req.params;
      const orgId = req.organization!.id;
      const { type, title, description, points, actionTaken, incidentDate } = req.body;

      if (!type || !title || !description) {
        return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'النوع والعنوان والوصف حقول إلزامية' });
      }

      if (!VALID_BEHAVIOR_TYPES.includes(type as StudentBehaviorType)) {
        return res.status(400).json({ success: false, error: 'INVALID_TYPE', message: 'نوع السجل غير صالح' });
      }

      const studentUser = db.getUserById(studentId, orgId);
      if (!studentUser || studentUser.role !== 'STUDENT') {
        return res.status(404).json({ success: false, error: 'STUDENT_NOT_FOUND', message: 'الطالب غير موجود' });
      }

      const incDate = incidentDate && DATE_REGEX.test(incidentDate) ? incidentDate : new Date().toISOString().split('T')[0];

      const behavior = db.createStudentBehaviorRecord({
        organizationId: orgId,
        studentId,
        type: type as StudentBehaviorType,
        title: sanitizeString(title),
        description: sanitizeString(description),
        points: typeof points === 'number' ? points : 0,
        actionTaken: actionTaken ? sanitizeString(actionTaken) : undefined,
        incidentDate: incDate,
        recordedBy: req.user!.id,
        status: 'OPEN',
      });

      db.logAction(
        orgId,
        req.user!.id,
        req.user!.email,
        'LOG_STUDENT_BEHAVIOR',
        'StudentBehaviorRecord',
        behavior.id,
        { studentId, type, points },
        req.ip
      );

      res.status(201).json({
        success: true,
        data: behavior,
      });
    } catch {
      res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// 9. PUT /api/v1/students/behavior/:behaviorId (Update / Resolve Behavior Record)
studentRouter.put(
  '/behavior/:behaviorId',
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const { behaviorId } = req.params;
      const orgId = req.organization!.id;
      const { status, actionTaken } = req.body;

      const existing = db.getStudentBehaviorRecordById(behaviorId, orgId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'RECORD_NOT_FOUND', message: 'السجل السلوكي غير موجود' });
      }

      const updates: Partial<typeof existing> = {};
      if (status && ['OPEN', 'RESOLVED', 'UNDER_REVIEW'].includes(status)) {
        updates.status = status;
      }
      if (actionTaken !== undefined) {
        updates.actionTaken = sanitizeString(actionTaken);
      }

      const updated = db.updateStudentBehaviorRecord(behaviorId, orgId, updates);
      res.json({
        success: true,
        data: updated,
      });
    } catch {
      res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// 10. DELETE /api/v1/students/behavior/:behaviorId (Delete Behavior Record)
studentRouter.delete(
  '/behavior/:behaviorId',
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const { behaviorId } = req.params;
      const orgId = req.organization!.id;

      const existing = db.getStudentBehaviorRecordById(behaviorId, orgId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'RECORD_NOT_FOUND', message: 'السجل السلوكي غير موجود' });
      }

      db.deleteStudentBehaviorRecord(behaviorId, orgId);
      res.json({
        success: true,
        message: 'تم حذف السجل السلوكي بنجاح',
      });
    } catch {
      res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// 11. POST /api/v1/students/promote-batch (Bulk Promotion / Grade Transition)
studentRouter.post(
  '/promote-batch',
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const orgId = req.organization!.id;
      const { studentIds, targetClassroomId, targetAcademicYearId, reason } = req.body;

      if (!Array.isArray(studentIds) || studentIds.length === 0 || !targetClassroomId || !targetAcademicYearId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'يجب تحديد قائمة الطلاب، والشعبة المستهدفة، والعام الدراسي المستهدف',
        });
      }

      if (!db.getClassroomById(targetClassroomId, orgId)) {
        return res.status(400).json({ success: false, error: 'INVALID_CLASSROOM', message: 'الشعبة الدراسية المستهدفة غير موجودة' });
      }

      if (!db.getAcademicYearById(targetAcademicYearId, orgId)) {
        return res.status(400).json({ success: false, error: 'INVALID_ACADEMIC_YEAR', message: 'العام الدراسي المستهدف غير موجود' });
      }

      const targetClassroom = db.getClassroomById(targetClassroomId, orgId);
      const transitionReason = reason ? sanitizeString(reason) : `ترقية أكاديمية جماعية إلى ${targetClassroom?.name || 'الشعبة الجديدة'}`;
      const now = new Date().toISOString().split('T')[0];

      const promotedStudents: string[] = [];

      for (const stdId of studentIds) {
        const user = db.getUserById(stdId, orgId);
        if (!user || user.role !== 'STUDENT') continue;

        // 1. Update user classroom
        db.updateUser(stdId, orgId, { classroomId: targetClassroomId, isActive: true });

        // 2. Mark previous enrollments as TRANSFERRED/GRADUATED if any
        const existingEnrollments = db.getStudentEnrollments(orgId, { studentId: stdId });
        for (const enr of existingEnrollments) {
          if (enr.status === 'ACTIVE' && enr.academicYearId !== targetAcademicYearId) {
            db.updateStudentEnrollment(enr.id, orgId, { status: 'GRADUATED' });
          }
        }

        // 3. Create new Enrollment
        db.createStudentEnrollment({
          organizationId: orgId,
          studentId: stdId,
          classroomId: targetClassroomId,
          academicYearId: targetAcademicYearId,
          status: 'ACTIVE',
        });

        // 4. Update Student Record status to ACTIVE
        const rec = db.getStudentRecordByStudentId(stdId, orgId);
        if (rec) {
          db.updateStudentRecord(stdId, orgId, { status: 'ACTIVE', statusReason: transitionReason });
        }

        // 5. Create Lifecycle transition event
        db.createStudentLifecycleEvent({
          organizationId: orgId,
          studentId: stdId,
          previousStatus: rec?.status || 'ACTIVE',
          newStatus: 'ACTIVE',
          reason: transitionReason,
          actionBy: req.user!.id,
          effectiveDate: now,
        });

        promotedStudents.push(stdId);
      }

      db.logAction(
        orgId,
        req.user!.id,
        req.user!.email,
        'BATCH_PROMOTE_STUDENTS',
        'StudentEnrollment',
        targetClassroomId,
        { count: promotedStudents.length, studentIds: promotedStudents, targetClassroomId, targetAcademicYearId },
        req.ip
      );

      res.json({
        success: true,
        message: `تم ترقية ${promotedStudents.length} طالب بنجاح`,
        data: {
          promotedCount: promotedStudents.length,
          studentIds: promotedStudents,
        },
      });
    } catch {
      res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);
