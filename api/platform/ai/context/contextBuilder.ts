import { db } from '../../db';
import { User, Organization, Course, Lesson, AIFeatureType } from '../../types';
import { AIPromptTemplates, PromptTemplateOptions } from '../prompts/templates';

export interface BuiltAIContext {
  systemInstruction: string;
  course?: Course;
  lesson?: Lesson;
  formattedContextText: string;
}

export class AIContextBuilder {
  public static async buildContext(params: {
    user: User;
    organization: Organization;
    feature: AIFeatureType;
    courseId?: string;
    lessonId?: string;
    customTopic?: string;
    questionCount?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }): Promise<BuiltAIContext> {
    const { user, organization, feature, courseId, lessonId, customTopic, questionCount, difficulty } = params;

    let targetCourse: Course | undefined;
    let targetLesson: Lesson | undefined;
    let subjectName: string | undefined;
    let gradeLevelName: string | undefined;

    // 1. Verify Course Tenant Isolation
    if (courseId) {
      const course = db.getCourseById(courseId, organization.id);
      if (!course) {
        throw new Error('COURSE_NOT_FOUND_OR_ACCESS_DENIED: The specified course does not exist in your organization.');
      }
      targetCourse = course;
      subjectName = course.subjectName;
    }

    // 2. Verify Lesson Tenant Isolation
    if (lessonId) {
      const lesson = db.getLessonById(lessonId, organization.id);
      if (!lesson) {
        throw new Error('LESSON_NOT_FOUND_OR_ACCESS_DENIED: The specified lesson does not exist in your organization.');
      }
      targetLesson = lesson;

      // If course wasn't already loaded, load it from lesson
      if (!targetCourse && lesson.courseId) {
        const parentCourse = db.getCourseById(lesson.courseId, organization.id);
        if (parentCourse) {
          targetCourse = parentCourse;
          subjectName = parentCourse.subjectName;
        }
      }
    }

    // 3. Resolve student classroom & grade level if available
    if (user.classroomId) {
      const classroom = db.getClassroomById(user.classroomId, organization.id);
      if (classroom) {
        const gradeLevel = db.getGradeLevelById(classroom.gradeLevelId, organization.id);
        if (gradeLevel) {
          gradeLevelName = `${gradeLevel.name} (${classroom.name})`;
        }
      }
    }

    // 4. Generate scoped system instruction
    const promptOptions: PromptTemplateOptions = {
      userRole: user.role,
      userName: user.fullName,
      orgName: organization.name,
      courseTitle: targetCourse?.title,
      lessonTitle: targetLesson?.title,
      subjectName: subjectName,
      gradeLevel: gradeLevelName,
      topic: customTopic || targetLesson?.title || targetCourse?.title,
      questionCount,
      difficulty,
    };

    const systemInstruction = AIPromptTemplates.getSystemInstruction(feature, promptOptions);

    // 5. Build structured context text
    let formattedContextText = `[سياق الجلسة الأكاديمية: المؤسسة: ${organization.name} | المستخدم: ${user.fullName} (${user.role})]`;
    if (targetCourse) {
      formattedContextText += `\n[المقرر: ${targetCourse.title}]`;
    }
    if (targetLesson) {
      // Strip HTML tags for clean AI prompt injection
      const cleanContent = targetLesson.contentHtml.replace(/<[^>]*>?/gm, ' ').substring(0, 4000);
      formattedContextText += `\n[عنوان الدرس: ${targetLesson.title}]\n[محتوى الدرس: ${cleanContent}]`;
    }

    return {
      systemInstruction,
      course: targetCourse,
      lesson: targetLesson,
      formattedContextText,
    };
  }
}
