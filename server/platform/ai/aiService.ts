import { db } from '../db';
import { User, Organization, AIFeatureType, AIConversation, AIMessage, AIMessageRole } from '../types';
import { providerRegistry } from './gateway/registry';
import { AISafetyService } from './safety/sanitizer';
import { AIContextBuilder } from './context/contextBuilder';
import { AIRateLimiterService } from './limits/rateLimiter';
import { RAGService } from './rag/ragService';

export interface ExecuteAIOptions {
  user: User;
  organization: Organization;
  feature: AIFeatureType;
  prompt: string;
  conversationId?: string;
  courseId?: string;
  lessonId?: string;
  customTopic?: string;
  questionCount?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  includeRAG?: boolean;
}

export interface ExecuteAIResult {
  text: string;
  conversationId: string;
  messageId: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  model: string;
  provider: string;
}

export class AIService {
  public static async execute(options: ExecuteAIOptions): Promise<ExecuteAIResult> {
    const { user, organization, feature, prompt, courseId, lessonId, customTopic, questionCount, difficulty } = options;

    // 1. Rate Limit Verification
    const rateCheck = AIRateLimiterService.checkRateLimit(organization.id, user.id);
    if (!rateCheck.allowed) {
      AIRateLimiterService.trackUsage({
        organizationId: organization.id,
        userId: user.id,
        provider: 'gemini',
        model: 'gemini-3.7-flash',
        featureName: feature,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        status: 'RATE_LIMITED',
      });
      const err = new Error(rateCheck.reason || 'RATE_LIMIT_EXCEEDED');
      (err as any).statusCode = 429;
      (err as any).retryAfter = rateCheck.retryAfterSeconds;
      throw err;
    }

    // 2. Safety & Prompt Injection Check
    const isStudent = user.role === 'STUDENT';
    const safety = AISafetyService.inspectAndSanitize(prompt, isStudent);
    if (safety.blocked) {
      AIRateLimiterService.trackUsage({
        organizationId: organization.id,
        userId: user.id,
        provider: 'gemini',
        model: 'gemini-3.7-flash',
        featureName: feature,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        status: 'BLOCKED',
      });
      const err = new Error(safety.violationReason || 'SAFETY_VIOLATION_BLOCKED');
      (err as any).statusCode = 400;
      throw err;
    }

    // 3. Build Tenant-Scoped Context (throws if cross-tenant course/lesson accessed)
    const context = await AIContextBuilder.buildContext({
      user,
      organization,
      feature,
      courseId,
      lessonId,
      customTopic,
      questionCount,
      difficulty,
    });

    // 4. Resolve or Create Conversation
    let convId = options.conversationId;
    let conversation: AIConversation | null = null;

    if (convId) {
      conversation = db.getAIConversationById(convId, organization.id, user.id);
      if (!conversation) {
        throw new Error('CONVERSATION_NOT_FOUND: Conversation does not exist or belongs to another user/tenant.');
      }
    } else {
      convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Generate clean title from prompt
      const title = prompt.length > 40 ? prompt.substring(0, 40) + '...' : prompt;
      conversation = db.createAIConversation({
        id: convId,
        organizationId: organization.id,
        userId: user.id,
        title: title || 'محادثة تعليمية ذكية',
        contextType: lessonId ? 'lesson' : courseId ? 'course' : feature === 'student_tutor' ? 'student_tutor' : 'general',
        contextId: lessonId || courseId,
        systemPromptType: feature,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 5. Load past messages for multi-turn conversational context
    const previousMessages = db.getAIMessages(convId, organization.id);
    let conversationHistoryText = '';
    if (previousMessages.length > 0) {
      conversationHistoryText = '\n\n[سجل المحادثة السابقة:]\n' +
        previousMessages.slice(-6).map((m) => `${m.role === 'user' ? 'المستخدم' : 'المرشد'}: ${m.content}`).join('\n');
    }

    // 6. Optional RAG context augmentation
    let ragContextText = '';
    if (options.includeRAG && (courseId || lessonId)) {
      try {
        const similarChunks = await RAGService.searchSimilarChunks({
          organizationId: organization.id,
          query: prompt,
          topK: 2,
        });
        if (similarChunks.length > 0) {
          ragContextText = '\n\n[مراجع معرفية مسترجعة من المقرر:]\n' +
            similarChunks.map((s, idx) => `مرجع ${idx + 1}: ${s.chunk.content}`).join('\n');
        }
      } catch {
        // Continue gracefully if RAG search is empty
      }
    }

    // Assemble final LLM prompt
    const fullPrompt = `${context.formattedContextText}${ragContextText}${conversationHistoryText}\n\nطلب المستخدم الحالي:\n${safety.sanitizedPrompt}`;

    // 7. Execute with AI Provider
    const provider = providerRegistry.getProvider('gemini');
    const result = await provider.generateContent({
      prompt: fullPrompt,
      systemInstruction: context.systemInstruction,
      temperature: feature === 'question_generator' ? 0.3 : 0.7,
      responseMimeType: feature === 'question_generator' ? 'application/json' : undefined,
    });

    // 8. Save User Message & Assistant Message to Database
    const userMsgId = `msg_${Date.now()}_u_${Math.random().toString(36).substring(2, 6)}`;
    db.createAIMessage({
      id: userMsgId,
      conversationId: convId,
      organizationId: organization.id,
      userId: user.id,
      role: 'user',
      content: safety.sanitizedPrompt,
      inputTokens: result.inputTokens,
      outputTokens: 0,
      createdAt: new Date().toISOString(),
    });

    const assistantMsgId = `msg_${Date.now()}_a_${Math.random().toString(36).substring(2, 6)}`;
    db.createAIMessage({
      id: assistantMsgId,
      conversationId: convId,
      organizationId: organization.id,
      userId: user.id,
      role: 'assistant',
      content: result.text,
      inputTokens: 0,
      outputTokens: result.outputTokens,
      createdAt: new Date().toISOString(),
    });

    // 9. Track Usage & Billing Metrics
    const usage = AIRateLimiterService.trackUsage({
      organizationId: organization.id,
      userId: user.id,
      provider: result.provider,
      model: result.model,
      featureName: feature,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
      status: 'SUCCESS',
    });

    return {
      text: result.text,
      conversationId: convId,
      messageId: assistantMsgId,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCost: usage.estimatedCost,
      model: result.model,
      provider: result.provider,
    };
  }
}
