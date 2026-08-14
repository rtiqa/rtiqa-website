import { getPostgresPool, checkPostgresConnection } from './postgres';

export async function seedDatabase(): Promise<{ success: boolean; message: string; seededSummary?: Record<string, number> }> {
  const status = await checkPostgresConnection();
  if (!status.connected) {
    return {
      success: false,
      message: `Cannot seed database: PostgreSQL is not connected (${status.error})`,
    };
  }

  const pool = getPostgresPool();
  if (!pool) return { success: false, message: 'Pool not available' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Organizations
    await client.query(`
      INSERT INTO organizations (id, slug, name, legal_name, country_code, timezone, locale, logo_url, is_active)
      VALUES 
        ('org_horizon_001', 'horizon', 'مدارس الأفق الذكية (Horizon Smart Schools)', 'شركة مدارس الأفق للتعليم والتربية الذكية', 'SA', 'Asia/Riyadh', 'ar', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&auto=format&fit=crop&q=80', true),
        ('org_elite_002', 'elite', 'أكاديمية النخبة الدولية (Elite International Academy)', 'شركة النخبة الدولية للتعليم المتقدم', 'SA', 'Asia/Riyadh', 'ar', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&auto=format&fit=crop&q=80', true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        legal_name = EXCLUDED.legal_name;
    `);

    // 2. Academic Years
    await client.query(`
      INSERT INTO academic_years (id, organization_id, name, start_date, end_date, is_current)
      VALUES
        ('ay_horizon_2026', 'org_horizon_001', 'العام الدراسي 2026-2027', '2026-08-20', '2027-06-15', true),
        ('ay_elite_2026', 'org_elite_002', 'Academic Year 2026-2027', '2026-09-01', '2027-06-30', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Terms
    await client.query(`
      INSERT INTO terms (id, organization_id, academic_year_id, name, start_date, end_date, is_current)
      VALUES
        ('term_horizon_t1', 'org_horizon_001', 'ay_horizon_2026', 'الفصل الدراسي الأول (الخريف)', '2026-08-20', '2026-11-25', true),
        ('term_horizon_t2', 'org_horizon_001', 'ay_horizon_2026', 'الفصل الدراسي الثاني (الربيع)', '2026-12-05', '2027-03-10', false),
        ('term_elite_t1', 'org_elite_002', 'ay_elite_2026', 'Term 1 (Fall Semester)', '2026-09-01', '2026-12-15', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 4. Grade Levels
    await client.query(`
      INSERT INTO grade_levels (id, organization_id, name, sequence_order)
      VALUES
        ('grd_horizon_g10', 'org_horizon_001', 'الصف العاشر (الأول ثانوي)', 1),
        ('grd_horizon_g11', 'org_horizon_001', 'الصف الحادي عشر (الثاني ثانوي)', 2),
        ('grd_elite_g10', 'org_elite_002', 'Grade 10 (Secondary Year 1)', 1)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 5. Classrooms
    await client.query(`
      INSERT INTO classrooms (id, organization_id, grade_level_id, name, capacity)
      VALUES
        ('class_horizon_10a', 'org_horizon_001', 'grd_horizon_g10', 'شعبة 10-أ (علمي)', 32),
        ('class_horizon_10b', 'org_horizon_001', 'grd_horizon_g10', 'شعبة 10-ب (عام)', 30),
        ('class_elite_10a', 'org_elite_002', 'grd_elite_g10', 'Class 10-A (STEM)', 28)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 6. Users (Admins, Teachers, Students)
    await client.query(`
      INSERT INTO users (id, organization_id, email, full_name, role, phone, student_id_number, teacher_specialization, classroom_id, is_active)
      VALUES
        -- Horizon School
        ('usr_horizon_admin', 'org_horizon_001', 'admin@horizon.edu.sa', 'د. عبد الله المنصور', 'ORG_ADMIN', '0551234567', NULL, NULL, NULL, true),
        ('usr_horizon_teacher', 'org_horizon_001', 'teacher.ahmed@horizon.edu.sa', 'أ. أحمد الشمري', 'TEACHER', '0552345678', NULL, 'الرياضيات والفيزياء المتقدمة', NULL, true),
        ('usr_horizon_t_sarah', 'org_horizon_001', 'sarah.alghamdi@horizon.edu.sa', 'أ. سارة الغامدي', 'TEACHER', '0553456789', NULL, 'اللغة العربية والبلاغة', NULL, true),
        ('usr_horizon_s_omar', 'org_horizon_001', 'student@horizon.edu.sa', 'عمر خالد السعيد', 'STUDENT', '0554567890', 'STD-2026-001', NULL, 'class_horizon_10a', true),
        ('usr_horizon_s_noura', 'org_horizon_001', 'noura.a@horizon.edu.sa', 'نورة العتيبي', 'STUDENT', '0555678901', 'STD-2026-002', NULL, 'class_horizon_10a', true),
        ('usr_horizon_s_faisal', 'org_horizon_001', 'faisal.m@horizon.edu.sa', 'فيصل المطيري', 'STUDENT', '0556789012', 'STD-2026-003', NULL, 'class_horizon_10a', true),
        ('usr_horizon_s_reem', 'org_horizon_001', 'reem.k@horizon.edu.sa', 'ريم القحطاني', 'STUDENT', '0557890123', 'STD-2026-004', NULL, 'class_horizon_10b', true),
        
        -- Elite School
        ('usr_elite_admin', 'org_elite_002', 'admin@elite.edu.sa', 'Dr. Sarah Jenkins', 'ORG_ADMIN', '0501112222', NULL, NULL, NULL, true),
        ('usr_elite_teacher', 'org_elite_002', 'teacher.sara@elite.edu.sa', 'Prof. Marcus Vance', 'TEACHER', '0502223333', NULL, 'Advanced Physics & AI', NULL, true),
        ('usr_elite_student', 'org_elite_002', 'student@elite.edu.sa', 'Zaid Al-Harbi', 'STUDENT', '0503334444', 'ELT-2026-099', NULL, 'class_elite_10a', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 7. Subjects
    await client.query(`
      INSERT INTO subjects (id, organization_id, name, code, color, description)
      VALUES
        ('sub_horizon_math', 'org_horizon_001', 'الرياضيات العامة والتحليل', 'MATH-101', '#10b981', 'منهج الجبر، التفاضل والتكامل للمرحلة الثانوية'),
        ('sub_horizon_phys', 'org_horizon_001', 'الفيزياء التجريبية والميكانيكا', 'PHYS-101', '#3b82f6', 'قوانين الحركة والميكانيكا الكلاسيكية'),
        ('sub_horizon_arab', 'org_horizon_001', 'اللغة العربية والأدب', 'ARAB-101', '#f59e0b', 'البلاغة، النحو، وقراءة النصوص التراثية'),
        ('sub_elite_cs', 'org_elite_002', 'Computer Science & AI Foundations', 'CS-201', '#8b5cf6', 'Algorithm design, Python data structures, and ML models')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 8. Courses
    await client.query(`
      INSERT INTO courses (id, organization_id, subject_id, term_id, teacher_id, classroom_id, title, description)
      VALUES
        ('crs_horizon_math_10a', 'org_horizon_001', 'sub_horizon_math', 'term_horizon_t1', 'usr_horizon_teacher', 'class_horizon_10a', 'الرياضيات - الصف العاشر (شعبة أ)', 'شرح شامل للمصفوفات والدوال اللوغاريتمية وحساب المثلثات'),
        ('crs_horizon_phys_10a', 'org_horizon_001', 'sub_horizon_phys', 'term_horizon_t1', 'usr_horizon_teacher', 'class_horizon_10a', 'الفيزياء - الصف العاشر (شعبة أ)', 'مقرر الفيزياء التفاعلي والتجارب المعملية الرقمية'),
        ('crs_elite_cs_10a', 'org_elite_002', 'sub_elite_cs', 'term_elite_t1', 'usr_elite_teacher', 'class_elite_10a', 'Computer Science 10A', 'Interactive programming and algorithmic fundamentals')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 9. Lessons
    await client.query(`
      INSERT INTO lessons (id, organization_id, course_id, title, content_html, order_index, is_published)
      VALUES
        ('lsn_horizon_math_01', 'org_horizon_001', 'crs_horizon_math_10a', 'مقدمة في الدوال الأسية واللوغاريتمات', '<p>في هذا الدرس سنتعرف على خصائص الدوال الأسية، كيفية تحويل المعادلات الأسية إلى لوغاريتمية، وتطبيقاتها في النمو السكاني والحسابات المالية.</p>', 1, true),
        ('lsn_horizon_math_02', 'org_horizon_001', 'crs_horizon_math_10a', 'المصفوفات والعمليات الجبرية الخطية', '<p>شرح جمع وطرح وضرب المصفوفات وإيجاد المحددات ونظم المعادلات الخطية بطريقة كرامر.</p>', 2, true),
        ('lsn_elite_cs_01', 'org_elite_002', 'crs_elite_cs_10a', 'Introduction to Big-O and Complexity Analysis', '<p>Understanding asymptotic analysis, time and space complexity with practical Python examples.</p>', 1, true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 10. Assignments
    await client.query(`
      INSERT INTO assignments (id, organization_id, course_id, title, description, max_score, due_date)
      VALUES
        ('asg_horizon_math_01', 'org_horizon_001', 'crs_horizon_math_10a', 'الواجب الأول: حل معادلات اللوغاريتمات المركبة', 'حل المسائل من 1 إلى 8 في صفحة 42، مع كتابة خطوات التحويل والتبسيط كاملة.', 20.00, '2026-10-15 23:59:59+03'),
        ('asg_horizon_math_02', 'org_horizon_001', 'crs_horizon_math_10a', 'المهمة الأدائية: ضرب المصفوفات والتطبيقات الواقعية', 'تصميم مسألة واقعية وتطبيق مصفوفة 3x3 لحلها.', 30.00, '2026-10-30 23:59:59+03'),
        ('asg_elite_cs_01', 'org_elite_002', 'crs_elite_cs_10a', 'Lab 1: Implementing Binary Search Trees', 'Submit Python script with traversal and lookup functions.', 25.00, '2026-10-20 23:59:59+03')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 11. Submissions & Grades
    await client.query(`
      INSERT INTO submissions (id, organization_id, assignment_id, student_id, submission_text, score, teacher_feedback, submitted_at, graded_at)
      VALUES
        ('sub_omar_01', 'org_horizon_001', 'asg_horizon_math_01', 'usr_horizon_s_omar', 'تم حل جميع المسائل الثمانية وتدوين خطوات التحويل بالتفصيل في المرفق.', 19.50, 'إجابة نموذجية ومنظمة جداً يا عمر. أحسنت!', '2026-10-14 15:30:00+03', '2026-10-15 10:00:00+03'),
        ('sub_noura_01', 'org_horizon_001', 'asg_horizon_math_01', 'usr_horizon_s_noura', 'مرفق حلول المعادلات الستة الأولى والمسألة الإضافية.', 18.00, 'عمل ممتاز، راجعي فقط إشارة الحد الأخير في المسألة 5.', '2026-10-14 18:45:00+03', '2026-10-15 11:20:00+03')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 12. Attendance Records
    await client.query(`
      INSERT INTO attendance_records (id, organization_id, course_id, classroom_id, student_id, recorded_by, date, status, notes)
      VALUES
        ('att_horizon_20260901_omar', 'org_horizon_001', 'crs_horizon_math_10a', 'class_horizon_10a', 'usr_horizon_s_omar', 'usr_horizon_teacher', '2026-09-01', 'PRESENT', ''),
        ('att_horizon_20260901_noura', 'org_horizon_001', 'crs_horizon_math_10a', 'class_horizon_10a', 'usr_horizon_s_noura', 'usr_horizon_teacher', '2026-09-01', 'PRESENT', ''),
        ('att_horizon_20260901_faisal', 'org_horizon_001', 'crs_horizon_math_10a', 'class_horizon_10a', 'usr_horizon_s_faisal', 'usr_horizon_teacher', '2026-09-01', 'LATE', 'تأخر 10 دقائق بسبب الازدحام')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 13. Audit Logs
    await client.query(`
      INSERT INTO audit_logs (id, organization_id, user_id, user_email, action, resource_type, resource_id, details)
      VALUES
        ('log_init_horizon', 'org_horizon_001', 'usr_horizon_admin', 'admin@horizon.edu.sa', 'SEED_TENANT', 'Organization', 'org_horizon_001', '{"initialized": true}'),
        ('log_init_elite', 'org_elite_002', 'usr_elite_admin', 'admin@elite.edu.sa', 'SEED_TENANT', 'Organization', 'org_elite_002', '{"initialized": true}')
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Seed data inserted successfully for Horizon Smart Schools and Elite International Academy.',
      seededSummary: {
        organizations: 2,
        academicYears: 2,
        terms: 3,
        gradeLevels: 3,
        classrooms: 3,
        users: 10,
        subjects: 4,
        courses: 3,
        lessons: 3,
        assignments: 3,
        submissions: 2,
        attendance: 3,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return {
      success: false,
      message: `Database seeding failed: ${(err as Error).message}`,
    };
  } finally {
    client.release();
  }
}

// CLI execution check
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase().then((res) => {
    console.log('[Seed Result]:', res);
    process.exit(res.success ? 0 : 1);
  });
}
