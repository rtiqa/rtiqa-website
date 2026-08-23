import express from 'express';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth, requireRoles } from '../auth.ts';
import { db } from '../db.ts';
import { AIService } from '../ai/aiService.ts';
import { RAGService } from '../ai/rag/ragService.ts';

export const aiRouter = express.Router();

// Require platform authentication for all AI endpoints
aiRouter.use(requireAuth);

/**
 * POST /api/v1/ai/chat
 * Multi-turn conversational AI assistant with course/lesson context
 */
aiRouter.post('/chat', async (req: PlatformRequest, res: express.Response) => {
  try {
    const { prompt, conversationId, courseId, lessonId, feature } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PROMPT',
        message: 'Prompt is required.',
      });
    }

    const targetFeature = feature || (req.user!.role === 'STUDENT' ? 'student_tutor' : 'chat');

    const result = await AIService.execute({
      user: req.user!,
      organization: req.organization!,
      feature: targetFeature,
      prompt,
      conversationId,
      courseId,
      lessonId,
      includeRAG: true,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'AI_EXECUTION_ERROR',
    });
  }
});

/**
 * POST /api/v1/ai/teacher-assistant
 * Pedagogical assistance, lesson planning, rubrics (Teachers & Admins only)
 */
aiRouter.post(
  '/teacher-assistant',
  requireRoles(['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER']),
  async (req: PlatformRequest, res: express.Response) => {
    try {
      const { prompt, courseId, lessonId, topic } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PROMPT',
          message: 'Prompt or instructions required for teacher assistant.',
        });
      }

      const result = await AIService.execute({
        user: req.user!,
        organization: req.organization!,
        feature: 'teacher_assistant',
        prompt,
        courseId,
        lessonId,
        customTopic: topic,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: err.message || 'TEACHER_ASSISTANT_ERROR',
      });
    }
  }
);

/**
 * POST /api/v1/ai/summarize
 * Educational lesson and text summarization
 */
aiRouter.post('/summarize', async (req: PlatformRequest, res: express.Response) => {
  try {
    const { content, lessonId, courseId } = req.body;

    if (!content && !lessonId) {
      return res.status(400).json({
        success: false,
        error: 'CONTENT_OR_LESSON_REQUIRED',
        message: 'Provide text content or a lessonId to summarize.',
      });
    }

    const prompt = content ? `يرجى تلخيص هذا المحتوى التعليمي بدقة:\n\n${content}` : 'يرجى تلخيص محتوى هذا الدرس المحدد بدقة واستخراج المفاهيم الأساسية.';

    const result = await AIService.execute({
      user: req.user!,
      organization: req.organization!,
      feature: 'lesson_summary',
      prompt,
      lessonId,
      courseId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'SUMMARIZATION_ERROR',
    });
  }
});

/**
 * POST /api/v1/ai/generate-questions
 * Assessment & Question Generator (Teachers & Admins only)
 */
aiRouter.post(
  '/generate-questions',
  requireRoles(['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER']),
  async (req: PlatformRequest, res: express.Response) => {
    try {
      const { topic, courseId, lessonId, questionCount, difficulty } = req.body;

      if (!topic && !lessonId && !courseId) {
        return res.status(400).json({
          success: false,
          error: 'TOPIC_REQUIRED',
          message: 'Topic, courseId, or lessonId is required to generate questions.',
        });
      }

      const prompt = `أنشئ أسئلة اختبار تقييمية معيارية حول: ${topic || 'محتوى الدرس'}.`;

      const result = await AIService.execute({
        user: req.user!,
        organization: req.organization!,
        feature: 'question_generator',
        prompt,
        courseId,
        lessonId,
        customTopic: topic,
        questionCount: questionCount || 5,
        difficulty: difficulty || 'intermediate',
      });

      // Parse JSON if returned
      let parsedQuestions = null;
      try {
        parsedQuestions = JSON.parse(result.text);
      } catch {
        parsedQuestions = { rawText: result.text };
      }

      res.json({
        success: true,
        data: {
          ...result,
          questions: parsedQuestions,
        },
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: err.message || 'QUESTION_GENERATION_ERROR',
      });
    }
  }
);

/**
 * GET /api/v1/ai/usage
 * Usage metrics & token limits
 */
aiRouter.get('/usage', async (req: PlatformRequest, res: express.Response) => {
  try {
    const summary = db.getAIUsageSummary(req.user!.organizationId);
    const userRecords = db.getAIUsage(req.user!.organizationId, req.user!.id);

    res.json({
      success: true,
      data: {
        summary,
        recentUserRequests: userRecords.slice(0, 20),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'USAGE_QUERY_ERROR',
    });
  }
});

/**
 * GET /api/v1/ai/conversations
 * Get user's conversation history
 */
aiRouter.get('/conversations', async (req: PlatformRequest, res: express.Response) => {
  try {
    const conversations = db.getAIConversations(req.user!.organizationId, req.user!.id);
    res.json({
      success: true,
      data: conversations,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'CONVERSATIONS_FETCH_ERROR',
    });
  }
});

/**
 * GET /api/v1/ai/conversations/:id
 * Get specific conversation messages
 */
aiRouter.get('/conversations/:id', async (req: PlatformRequest, res: express.Response) => {
  try {
    const conversation = db.getAIConversationById(req.params.id, req.user!.organizationId, req.user!.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
      });
    }

    const messages = db.getAIMessages(req.params.id, req.user!.organizationId);
    res.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'CONVERSATION_FETCH_ERROR',
    });
  }
});

/**
 * DELETE /api/v1/ai/conversations/:id
 * Delete a conversation
 */
aiRouter.delete('/conversations/:id', async (req: PlatformRequest, res: express.Response) => {
  try {
    const deleted = db.deleteAIConversation(req.params.id, req.user!.organizationId, req.user!.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'CONVERSATION_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'DELETE_ERROR',
    });
  }
});

/**
 * POST /api/v1/ai/index-document
 * RAG Document Indexing (Teachers and Admins only)
 */
aiRouter.post(
  '/index-document',
  requireRoles(['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER']),
  async (req: PlatformRequest, res: express.Response) => {
    try {
      const { documentId, title, content, metadata } = req.body;

      if (!documentId || !title || !content) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'documentId, title, and content are required.',
        });
      }

      const chunks = await RAGService.indexDocument({
        organizationId: req.user!.organizationId,
        documentId,
        title,
        content,
        metadata,
      });

      res.json({
        success: true,
        data: {
          chunksCount: chunks.length,
          chunks,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'INDEXING_ERROR',
      });
    }
  }
);

/**
 * POST /api/v1/ai/parent-advisor
 * Smart Parent Advisory & Progress Interpretation (Parents, Teachers, Admins)
 */
aiRouter.post('/parent-advisor', async (req: PlatformRequest, res: express.Response) => {
  try {
    const { studentId, question, includePerformance } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'QUESTION_REQUIRED',
        message: 'Question or inquiry is required.',
      });
    }

    let extraContext = '';
    if (studentId) {
      // Validate that parent is actually linked to this student if role is PARENT
      if (req.user!.role === 'PARENT') {
        const links = db.getParentStudentLinks(req.user!.organizationId, { parentId: req.user!.id, studentId });
        if (links.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'ACCESS_DENIED',
            message: 'You are not linked to this student.',
          });
        }
      }

      const student = db.getUserById(studentId, req.user!.organizationId);
      if (student && includePerformance !== false) {
        const perf = db.getStudentAcademicPerformance(studentId, req.user!.organizationId);
        const att = db.getAttendanceSummaryForStudent(studentId, req.user!.organizationId);
        const behavior = db.getStudentBehaviorRecords(req.user!.organizationId, { studentId });

        extraContext = `بيانات أداء الطالب الحالي:\n- اسم الطالب: ${student.fullName}\n- المعدل العام: ${perf.overallGpaPercent}% (التقدير: ${perf.letterGrade})\n- نسبة الحضور: ${att.attendanceRate}%\n- عدد المواد المسجل بها: ${perf.enrolledCoursesCount}\n- نقاط السلوك التراكمية: ${behavior.reduce((s, b) => s + b.points, 0)}`;
      }
    }

    const fullPrompt = extraContext
      ? `[معلومات وسياق الطالب]:\n${extraContext}\n\n[استفسار ولي الأمر]:\n${question}`
      : question;

    const result = await AIService.execute({
      user: req.user!,
      organization: req.organization!,
      feature: 'parent_assistant',
      prompt: fullPrompt,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'PARENT_ADVISOR_ERROR',
    });
  }
});

/**
 * POST /api/v1/ai/lesson-plan
 * Structured 5-Stage Lesson Planner (Teachers & Admins)
 */
aiRouter.post(
  '/lesson-plan',
  requireRoles(['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER']),
  async (req: PlatformRequest, res: express.Response) => {
    try {
      const { topic, courseId, gradeLevel, durationMinutes, learningObjectives } = req.body;

      if (!topic) {
        return res.status(400).json({
          success: false,
          error: 'TOPIC_REQUIRED',
          message: 'Lesson topic is required.',
        });
      }

      const prompt = `يرجى إعداد خطة درس نموذجية واحترافية حول موضوع: "${topic}".\n${
        gradeLevel ? `المرحلة الدراسية: ${gradeLevel}\n` : ''
      }${durationMinutes ? `مدة الحصة: ${durationMinutes} دقيقة\n` : ''}${
        learningObjectives ? `الأهداف المقترحة:\n${learningObjectives}` : ''
      }`;

      const result = await AIService.execute({
        user: req.user!,
        organization: req.organization!,
        feature: 'lesson_planner',
        prompt,
        courseId,
        customTopic: topic,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'LESSON_PLANNER_ERROR',
      });
    }
  }
);

/**
 * POST /api/v1/ai/assignment-feedback
 * Rubric-based Student Assignment Feedback Generator (Teachers & Admins)
 */
aiRouter.post(
  '/assignment-feedback',
  requireRoles(['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER']),
  async (req: PlatformRequest, res: express.Response) => {
    try {
      const { assignmentTitle, studentAnswer, score, maxScore, rubricCriteria } = req.body;

      if (!studentAnswer) {
        return res.status(400).json({
          success: false,
          error: 'ANSWER_REQUIRED',
          message: 'Student answer/submission is required to generate feedback.',
        });
      }

      const prompt = `صغ تغذية راجعة تربوية بناءة لعمل الطالب:\n- عنوان التكليف: ${
        assignmentTitle || 'واجب دراسي'
      }\n- إجابة الطالب:\n${studentAnswer}\n${
        score !== undefined && maxScore ? `- الدرجة المرصودة: ${score} من ${maxScore}\n` : ''
      }${rubricCriteria ? `- معايير التقييم:\n${rubricCriteria}` : ''}`;

      const result = await AIService.execute({
        user: req.user!,
        organization: req.organization!,
        feature: 'feedback_generator',
        prompt,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'FEEDBACK_GENERATION_ERROR',
      });
    }
  }
);

/**
 * POST /api/v1/ai/recommendations
 * Personalized Learning Path & Recommendations Engine
 */
aiRouter.post('/recommendations', async (req: PlatformRequest, res: express.Response) => {
  try {
    const targetStudentId = req.body.studentId || (req.user!.role === 'STUDENT' ? req.user!.id : undefined);

    if (!targetStudentId) {
      return res.status(400).json({
        success: false,
        error: 'STUDENT_ID_REQUIRED',
        message: 'Student ID is required.',
      });
    }

    // Role checks
    if (req.user!.role === 'STUDENT' && targetStudentId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
    }
    if (req.user!.role === 'PARENT') {
      const links = db.getParentStudentLinks(req.user!.organizationId, {
        parentId: req.user!.id,
        studentId: targetStudentId,
      });
      if (links.length === 0) {
        return res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
      }
    }

    const student = db.getUserById(targetStudentId, req.user!.organizationId);
    const perf = db.getStudentAcademicPerformance(targetStudentId, req.user!.organizationId);
    const att = db.getAttendanceSummaryForStudent(targetStudentId, req.user!.organizationId);

    const prompt = `حلل هذا السجل الأكاديمي وقدم توصيات مخصصة للطالب: ${student?.fullName || 'الطالب'}\n- المعدل العام: ${
      perf.overallGpaPercent
    }%\n- نسبة الحضور: ${att.attendanceRate}%\n- المواد والدرجات:\n${perf.courses
      .map((c) => `  * ${c.courseTitle}: ${c.percentage}% (${c.letterGrade})`)
      .join('\n')}`;

    const result = await AIService.execute({
      user: req.user!,
      organization: req.organization!,
      feature: 'learning_recommendations',
      prompt,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'RECOMMENDATIONS_ERROR',
    });
  }
});

