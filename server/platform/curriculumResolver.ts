import { db } from './db.ts';
import type { Course, CurriculumUnit, Lesson } from './types.ts';

export interface ResolvedUnit extends CurriculumUnit {
  lessons: Lesson[];
}

export interface ResolvedCourseHierarchy {
  course: Course;
  units: ResolvedUnit[];
}

export class CurriculumResolver {
  /**
   * Fetches a course hierarchy. If the course is local and references a global blueprint,
   * it merges the global lessons with any local overrides.
   * If orgId is 'platform', it directly fetches the global content.
   */
  static getResolvedCourseHierarchy(courseId: string, orgId: string): ResolvedCourseHierarchy | null {
    // 1. Fetch the course
    let course = db.getCourseById(courseId, orgId);

    // Allow fetching global course directly (e.g. for preview)
    if (!course && orgId === 'platform') {
      course = db.getCourseById(courseId, 'platform');
    }

    if (!course) return null;

    // 2. Fetch units
    const localUnits = db.getUnitsByCourse(course.id, course.organizationId);

    // 3. Fetch local lessons
    const localLessons = db.getLessonsByCourse(course.id, course.organizationId);

    // 4. Fetch global lessons if this course has a global blueprint
    let globalLessons: Lesson[] = [];
    if (course.globalReferenceId) {
      globalLessons = db.getLessonsByCourse(course.globalReferenceId, 'platform');
    }

    // 5. Merge logic
    // Track overridden global lessons
    const overriddenGlobalLessonIds = new Set<string>();
    for (const lLesson of localLessons) {
      if (lLesson.globalReferenceId) {
        overriddenGlobalLessonIds.add(lLesson.globalReferenceId);
      }
    }

    const resolvedLessons: Lesson[] = [];

    // Add global lessons that are NOT overridden
    for (const gLesson of globalLessons) {
      if (!overriddenGlobalLessonIds.has(gLesson.id)) {
        let targetUnitId = gLesson.unitId;
        if (gLesson.unitId) {
          const mappedUnit = localUnits.find((u) => u.globalReferenceId === gLesson.unitId);
          if (mappedUnit) {
            targetUnitId = mappedUnit.id;
          }
        }

        resolvedLessons.push({
          ...gLesson,
          courseId: course.id,
          unitId: targetUnitId,
          // We keep the ID as gLesson.id because it's unmodified global content.
        });
      }
    }

    // Add all local lessons (overrides + pure local additions)
    resolvedLessons.push(...localLessons);

    // 6. Group into units
    const resolvedUnitsMap = new Map<string, ResolvedUnit>();

    for (const unit of localUnits) {
      resolvedUnitsMap.set(unit.id, {
        ...unit,
        lessons: [],
      });
    }

    const unassignedLessons: Lesson[] = [];

    for (const lesson of resolvedLessons) {
      if (lesson.unitId && resolvedUnitsMap.has(lesson.unitId)) {
        resolvedUnitsMap.get(lesson.unitId)!.lessons.push(lesson);
      } else {
        unassignedLessons.push(lesson);
      }
    }

    for (const unit of resolvedUnitsMap.values()) {
      unit.lessons.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    const units = Array.from(resolvedUnitsMap.values()).sort((a, b) => a.orderIndex - b.orderIndex);

    return {
      course,
      units,
    };
  }

  /**
   * Adopts a global course for a specific tenant.
   * Creates local Course and CurriculumUnits (Forked Spine).
   * Lessons remain global until overridden.
   */
  static adoptGlobalCourse(globalCourseId: string, orgId: string, classroomId: string, termId: string): Course {
    if (orgId === 'platform') throw new Error('Cannot adopt a global course into the platform itself');

    const globalCourse = db.getCourseById(globalCourseId, 'platform');
    if (!globalCourse) throw new Error('Global course not found');

    const globalUnits = db.getUnitsByCourse(globalCourseId, 'platform');

    const localCourse = db.createCourse({
      organizationId: orgId,
      subjectId: globalCourse.subjectId,
      termId: termId,
      classroomId: classroomId,
      title: globalCourse.title,
      description: globalCourse.description,
      isGlobal: false,
      globalReferenceId: globalCourse.id,
    });

    for (const gUnit of globalUnits) {
      db.createUnit({
        organizationId: orgId,
        courseId: localCourse.id,
        title: gUnit.title,
        description: gUnit.description,
        orderIndex: gUnit.orderIndex,
        isPublished: gUnit.isPublished,
        isGlobal: false,
        globalReferenceId: gUnit.id,
      });
    }

    return localCourse;
  }

  /**
   * Overrides a global lesson with local content.
   */
  static createLessonOverride(
    globalLessonId: string,
    orgId: string,
    localCourseId: string,
    localUnitId: string,
    updates: Partial<Lesson>
  ): Lesson {
    if (orgId === 'platform') throw new Error('Cannot create overrides in the platform context');

    // 1. Verify Global Lesson exists and get it
    const globalLesson = db.getLessonById(globalLessonId, 'platform');
    if (!globalLesson) throw new Error('Global lesson not found');

    // 2. Verify Local Course belongs to org and matches global source
    const localCourse = db.getCourseById(localCourseId, orgId);
    if (!localCourse) throw new Error('Local course not found in this organization');
    if (localCourse.globalReferenceId !== globalLesson.courseId) {
      throw new Error('Lesson does not belong to the global course associated with this local course');
    }

    // 3. Verify Local Unit belongs to org and local course
    const localUnit = db.getUnitById(localUnitId, orgId);
    if (!localUnit) throw new Error('Local unit not found in this organization');
    if (localUnit.courseId !== localCourseId) {
      throw new Error('Local unit does not belong to the specified local course');
    }

    // 4. Prevent multiple overrides for the same global lesson in this course
    const localLessons = db.getLessonsByCourse(localCourseId, orgId);
    if (localLessons.some((l) => l.globalReferenceId === globalLessonId)) {
      throw new Error('An override already exists for this lesson in this course');
    }

    const localLesson = db.createLesson({
      organizationId: orgId,
      courseId: localCourseId,
      unitId: localUnitId,
      title: updates.title || globalLesson.title,
      contentHtml: updates.contentHtml !== undefined ? updates.contentHtml : globalLesson.contentHtml,
      mediaUrl: updates.mediaUrl !== undefined ? updates.mediaUrl : globalLesson.mediaUrl,
      orderIndex: updates.orderIndex !== undefined ? updates.orderIndex : globalLesson.orderIndex,
      isPublished: updates.isPublished !== undefined ? updates.isPublished : globalLesson.isPublished,
      isGlobal: false,
      globalReferenceId: globalLesson.id,
    });

    return localLesson;
  }
}
