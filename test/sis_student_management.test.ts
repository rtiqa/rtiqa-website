import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server.ts';
import { db } from '../server/platform/db.ts';
import { closePostgresPool } from '../src/db/postgres.ts';

describe('Phase 2.3: Student Information System (SIS) & Lifecycle Test Suite', () => {
  let server: any;
  let baseUrl: string;
  let adminTokenOrg1: string;
  let adminTokenOrg2: string;
  let teacherTokenOrg1: string;
  let student1TokenOrg1: string;
  let student2TokenOrg1: string;
  let parentTokenOrg1: string;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.AUTH_SECRET = 'test_secret_key_32_characters_long_rtiqa_2026';
    const app = await createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = (server.address() as any).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closePostgresPool();
  });

  beforeEach(async () => {
    db.resetData();

    // 1. School A Admin
    const resAdminA = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'admin', tenantSlug: 'horizon' }),
    });
    const dataAdminA = await resAdminA.json();
    assert.strictEqual(resAdminA.status, 200);
    adminTokenOrg1 = dataAdminA.token;

    // 2. School B Admin (Isolated Tenant)
    const resAdminB = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'admin', tenantSlug: 'elite' }),
    });
    const dataAdminB = await resAdminB.json();
    assert.strictEqual(resAdminB.status, 200);
    adminTokenOrg2 = dataAdminB.token;

    // 3. School A Teacher
    const resTeacherA = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'teacher', tenantSlug: 'horizon' }),
    });
    const dataTeacherA = await resTeacherA.json();
    assert.strictEqual(resTeacherA.status, 200);
    teacherTokenOrg1 = dataTeacherA.token;

    // 4. School A Student 1 (Omar)
    const resStudent1 = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'student', tenantSlug: 'horizon' }),
    });
    const dataStudent1 = await resStudent1.json();
    assert.strictEqual(resStudent1.status, 200);
    student1TokenOrg1 = dataStudent1.token;

    // 5. School A Student 2 (Noura)
    const resStudent2 = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student2@horizon.edu.sa',
        password: 'Password@2026',
        tenantSlug: 'horizon',
      }),
    });
    const dataStudent2 = await resStudent2.json();
    assert.strictEqual(resStudent2.status, 200);
    student2TokenOrg1 = dataStudent2.token;

    // 6. School A Parent
    const resParent = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'parent', tenantSlug: 'horizon' }),
    });
    const dataParent = await resParent.json();
    assert.strictEqual(resParent.status, 200);
    parentTokenOrg1 = dataParent.token;
  });

  describe('1. Student Directory & Filtering (SIS Listing)', () => {
    it('allows School Admin to list all students with enriched SIS records', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.strictEqual(data.data.length, 4);

      const omar = data.data.find((s: any) => s.email === 'student@horizon.edu.sa');
      assert.ok(omar);
      assert.strictEqual(omar.fullName, 'عمر خالد السعيد');
      assert.strictEqual(omar.nationalId, '1098765432');
      assert.strictEqual(omar.status, 'ACTIVE');
      assert.strictEqual(omar.giftedProgram, true);
      assert.strictEqual(omar.behaviorPoints, 10); // Seeded merit record
    });

    it('allows Teacher to query students in the school', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students`, {
        headers: { Authorization: `Bearer ${teacherTokenOrg1}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.length, 4);
    });

    it('filters students by classroomId correctly', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students?classroomId=class_horizon_10a`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.length, 3);
      data.data.forEach((s: any) => {
        assert.strictEqual(s.classroomId, 'class_horizon_10a');
      });
    });

    it('filters students by search term across name, nationalId, and studentIdNumber', async () => {
      // Search by nationalId
      const res1 = await fetch(`${baseUrl}/api/v1/students?search=1098765432`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const data1 = await res1.json();
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(data1.data.length, 1);
      assert.strictEqual(data1.data[0].email, 'student@horizon.edu.sa');

      // Search by Arabic name fragment
      const res2 = await fetch(`${baseUrl}/api/v1/students?search=${encodeURIComponent('نورة')}`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const data2 = await res2.json();
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(data2.data.length, 1);
      assert.strictEqual(data2.data[0].fullName, 'نورة العتيبي');
    });

    it('denies direct student directory access to standard Student users', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students`, {
        headers: { Authorization: `Bearer ${student1TokenOrg1}` },
      });
      assert.strictEqual(res.status, 403);
    });
  });

  describe('2. Comprehensive Holistic Student Dossier', () => {
    it('returns complete 360-degree dossier for student including medical, attendance, and academics', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_omar/dossier`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);

      const dossier = data.data;
      assert.strictEqual(dossier.student.id, 'usr_horizon_s_omar');
      assert.strictEqual(dossier.record.nationalId, '1098765432');
      assert.strictEqual(dossier.record.bloodType, 'O+');
      assert.strictEqual(dossier.record.allergies, 'حساسية خفيفة من الفول السوداني');
      assert.strictEqual(dossier.record.giftedProgram, true);
      assert.strictEqual(dossier.behaviorPointsTotal, 10);
      assert.ok(dossier.attendanceStats);
      assert.ok(dossier.academicStats);
      assert.ok(Array.isArray(dossier.behaviorRecords));
      assert.ok(Array.isArray(dossier.lifecycleHistory));
      assert.strictEqual(dossier.lifecycleHistory.length, 1);
    });

    it('allows a student to view their OWN dossier', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_omar/dossier`, {
        headers: { Authorization: `Bearer ${student1TokenOrg1}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.data.student.id, 'usr_horizon_s_omar');
    });

    it('FORBIDS a student from viewing another student dossier (Strict Student Privacy)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_noura/dossier`, {
        headers: { Authorization: `Bearer ${student1TokenOrg1}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('allows a linked parent to view their child dossier', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_omar/dossier`, {
        headers: { Authorization: `Bearer ${parentTokenOrg1}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.data.student.id, 'usr_horizon_s_omar');
    });
  });

  describe('3. Atomic Student Registration & Profile Management', () => {
    it('creates new student with comprehensive demographics and medical records atomically', async () => {
      const newStudentPayload = {
        email: 'tariq.z@horizon.edu.sa',
        fullName: 'طارق زياد الغامدي',
        nationalId: '1055667788',
        dateOfBirth: '2010-07-14',
        gender: 'MALE',
        bloodType: 'B+',
        nationality: 'سعودي',
        emergencyContactName: 'زياد الغامدي (الأب)',
        emergencyContactPhone: '+966501199228',
        emergencyContactRelationship: 'FATHER',
        medicalConditions: 'لا توجد',
        allergies: 'لا توجد',
        specialDietaryNeeds: 'لا يوجد',
        previousSchool: 'مدارس المنار الأهلية',
        giftedProgram: true,
        classroomId: 'class_horizon_10a',
        academicYearId: 'ay_horizon_2026',
      };

      const res = await fetch(`${baseUrl}/api/v1/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify(newStudentPayload),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(data.success, true);
      assert.ok(data.data.student.id);
      assert.strictEqual(data.data.student.email, 'tariq.z@horizon.edu.sa');
      assert.strictEqual(data.data.record.nationalId, '1055667788');
      assert.strictEqual(data.data.record.giftedProgram, true);
      assert.strictEqual(data.data.enrollment.status, 'ACTIVE');

      // Verify searchable in directory
      const verifyRes = await fetch(`${baseUrl}/api/v1/students?search=1055667788`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const verifyData = await verifyRes.json();
      assert.strictEqual(verifyData.data.length, 1);
      assert.strictEqual(verifyData.data[0].fullName, 'طارق زياد الغامدي');
    });

    it('rejects registration when national ID is duplicate within the organization', async () => {
      const duplicatePayload = {
        email: 'another.student@horizon.edu.sa',
        fullName: 'طالب مكرر',
        nationalId: '1098765432', // Existing nationalId of Omar
        dateOfBirth: '2010-01-01',
        gender: 'MALE',
        emergencyContactName: 'ولي الأمر',
        emergencyContactPhone: '+966500000000',
      };

      const res = await fetch(`${baseUrl}/api/v1/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify(duplicatePayload),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.error, 'NATIONAL_ID_EXISTS');
    });

    it('updates student profile, emergency contacts, and medical alerts', async () => {
      const updates = {
        medicalConditions: 'تم تشخيص حساسية موسمية جديدة',
        allergies: 'غبار اللقاح والفول السوداني',
        emergencyContactPhone: '+966509998877',
        giftedProgram: true,
      };

      const res = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_noura/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.record.medicalConditions, 'تم تشخيص حساسية موسمية جديدة');
      assert.strictEqual(data.data.record.emergencyContactPhone, '+966509998877');
      assert.strictEqual(data.data.record.giftedProgram, true);
    });
  });

  describe('4. Student Lifecycle Transitions & Audit Logging', () => {
    it('executes formal student status transitions and generates audit history', async () => {
      const transitionPayload = {
        newStatus: 'PROBATION',
        reason: 'وضع الطالب تحت الملاحظة الأكاديمية لتحسين المعدل الفصلي',
        effectiveDate: '2026-10-01',
      };

      const res = await fetch(
        `${baseUrl}/api/v1/students/usr_horizon_s_faisal/status-transition`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminTokenOrg1}`,
          },
          body: JSON.stringify(transitionPayload),
        }
      );

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.record.status, 'PROBATION');
      assert.strictEqual(data.data.event.newStatus, 'PROBATION');

      // Verify dossier reflects the updated lifecycle history
      const dossierRes = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_faisal/dossier`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const dossierData = await dossierRes.json();
      assert.strictEqual(dossierData.data.record.status, 'PROBATION');
      const latestEvent = dossierData.data.lifecycleHistory[0];
      assert.strictEqual(latestEvent.newStatus, 'PROBATION');
      assert.strictEqual(latestEvent.reason, 'وضع الطالب تحت الملاحظة الأكاديمية لتحسين المعدل الفصلي');
    });

    it('rejects invalid lifecycle statuses', async () => {
      const res = await fetch(
        `${baseUrl}/api/v1/students/usr_horizon_s_faisal/status-transition`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminTokenOrg1}`,
          },
          body: JSON.stringify({ newStatus: 'UNKNOWN_STATUS', reason: 'اختبار' }),
        }
      );
      assert.strictEqual(res.status, 400);
    });
  });

  describe('5. Student Behavior, Merits & Disciplinary Records', () => {
    it('allows Teacher to log positive merits and negative infractions', async () => {
      // 1. Log merit
      const meritPayload = {
        type: 'MERIT',
        title: 'الفوز بالمركز الأول في معرض العلوم',
        description: 'ابتكار مشروع لتوليد الطاقة النظيفة باستخدام الخلايا الشمسية المصغرة',
        points: 8,
        actionTaken: 'منح وسام الابتكار العلمي',
        incidentDate: '2026-10-05',
      };

      const resMerit = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_noura/behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherTokenOrg1}`,
        },
        body: JSON.stringify(meritPayload),
      });
      const dataMerit = await resMerit.json();
      assert.strictEqual(resMerit.status, 201);
      assert.strictEqual(dataMerit.data.points, 8);
      assert.strictEqual(dataMerit.data.status, 'OPEN');

      // 2. Resolve behavior record
      const resResolve = await fetch(
        `${baseUrl}/api/v1/students/behavior/${dataMerit.data.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${teacherTokenOrg1}`,
          },
          body: JSON.stringify({ status: 'RESOLVED', actionTaken: 'تم تسليم الشهادة وإبلاغ ولي الأمر' }),
        }
      );
      const dataResolve = await resResolve.json();
      assert.strictEqual(resResolve.status, 200);
      assert.strictEqual(dataResolve.data.status, 'RESOLVED');

      // 3. Verify total points updated in student dossier
      const dossierRes = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_noura/dossier`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const dossierData = await dossierRes.json();
      assert.strictEqual(dossierData.data.behaviorPointsTotal, 13); // Seeded 5 + New 8 = 13
    });
  });

  describe('6. Batch Promotion & Grade Level Transitions', () => {
    it('promotes batch of students into a new classroom and academic year', async () => {
      const promotePayload = {
        studentIds: ['usr_horizon_s_omar', 'usr_horizon_s_noura'],
        targetClassroomId: 'class_horizon_10b',
        targetAcademicYearId: 'ay_horizon_2026',
        reason: 'إعادة توزيع أكاديمي للشعب',
      };

      const res = await fetch(`${baseUrl}/api/v1/students/promote-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify(promotePayload),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.promotedCount, 2);

      // Verify classroom update
      const omarRes = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_omar`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const omarData = await omarRes.json();
      assert.strictEqual(omarData.data.student.classroomId, 'class_horizon_10b');
    });
  });

  describe('7. Strict Multi-Tenant Isolation for Student Information', () => {
    it('prevents School B Admin from accessing School A student dossiers', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_omar/dossier`, {
        headers: { Authorization: `Bearer ${adminTokenOrg2}` },
      });
      // Student does not exist in Elite tenant
      assert.strictEqual(res.status, 404);
    });

    it('prevents School B Admin from updating School A student profiles', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_omar/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg2}`,
        },
        body: JSON.stringify({ fullName: 'محاولة اختراق عابرة للمستأجرين' }),
      });
      assert.strictEqual(res.status, 404);
    });

    it('prevents School B Admin from logging behavior on School A student', async () => {
      const res = await fetch(`${baseUrl}/api/v1/students/usr_horizon_s_omar/behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg2}`,
        },
        body: JSON.stringify({
          type: 'MAJOR_INFRACTION',
          title: 'غير مصرح',
          description: 'محاولة تسجيل سلوك عبر المدارس',
        }),
      });
      assert.strictEqual(res.status, 404);
    });
  });
});
