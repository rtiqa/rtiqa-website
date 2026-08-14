import { SafetyCheckResult } from '../types';

export class AISafetyService {
  public static readonly MAX_PROMPT_LENGTH = 32000;

  // Comprehensive prompt injection and jailbreak signatures
  private static injectionPatterns: RegExp[] = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
    /disregard\s+(all\s+)?(previous|prior)\s+(instructions|directives)/i,
    /reveal\s+(your\s+)?(system\s+prompt|base\s+instructions|hidden\s+instructions)/i,
    /show\s+me\s+(the\s+)?(system\s+prompt|raw\s+instructions)/i,
    /you\s+are\s+now\s+in\s+(developer|unrestricted|dan|jailbreak)\s+mode/i,
    /bypass\s+(safety|security|policy|restrictions|tenant\s+isolation)/i,
    /dump\s+(all\s+)?(database|users|tables|passwords|auth_tokens)/i,
    /select\s+\*\s+from\s+(users|organizations|passwords)/i,
    /تجاهل\s+(جميع|كل)?\s*(التعليمات|الأوامر)\s*(السابقة|الأصلية)/i,
    /اكشف\s+(لي\s+)?(التعليمات\s+السرية|نص\s+النظام|system\s+prompt)/i,
    /أنت\s+الآن\s+في\s+وضع\s+(المطور|بدون\s+قيود|كسر\s+الحماية)/i,
    /تجاوز\s+(الأمان|الحماية|العزل\s+المؤسسي|السياسات)/i,
  ];

  // PII & sensitive credential patterns (Arabic & English redaction)
  private static piiPatterns: { pattern: RegExp; replacement: string }[] = [
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, replacement: '[بريد إلكتروني محجوب]' },
    { pattern: /(?:\+?966|0)?5\d{8}\b/g, replacement: '[رقم هاتف محجوب]' },
    { pattern: /(?:password|secret|token|كلمة\s*المرور|الرمز\s*السري)\s*[:=]\s*['"]?[A-Za-z0-9_!@#$%^&*()\-+=]{6,}['"]?/gi, replacement: '[بيانات حساسة محجوبة]' },
    { pattern: /\b(?:1|2)\d{9}\b/g, replacement: '[رقم هوية/إقامة محجوب]' },
  ];

  public static inspectAndSanitize(prompt: string, isStudent: boolean = false): SafetyCheckResult {
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return { safe: false, sanitizedPrompt: '', violationReason: 'INVALID_PROMPT: Prompt is empty or not a valid string.', blocked: true };
    }

    if (prompt.length > this.MAX_PROMPT_LENGTH) {
      return {
        safe: false,
        sanitizedPrompt: '',
        violationReason: `PROMPT_TOO_LONG: Prompt exceeds maximum allowed length of ${this.MAX_PROMPT_LENGTH} characters.`,
        blocked: true,
      };
    }

    const trimmed = prompt.trim();

    // Check for prompt injection attacks
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(trimmed)) {
        return {
          safe: false,
          sanitizedPrompt: trimmed,
          violationReason: 'PROMPT_INJECTION_DETECTED: Prompt contains prohibited override or extraction instructions.',
          blocked: true,
        };
      }
    }

    // Check for direct cheating requests in student mode
    if (isStudent && this.isDirectCheatingRequest(trimmed)) {
      return {
        safe: false,
        sanitizedPrompt: trimmed,
        violationReason: 'ACADEMIC_INTEGRITY_VIOLATION: Direct homework or test answering is forbidden. The Socratic tutor requires step-by-step guidance.',
        blocked: true,
      };
    }

    // Sanitize PII
    let sanitized = trimmed;
    for (const { pattern, replacement } of this.piiPatterns) {
      sanitized = sanitized.replace(pattern, replacement);
    }

    return {
      safe: true,
      sanitizedPrompt: sanitized,
      blocked: false,
    };
  }

  private static isDirectCheatingRequest(prompt: string): boolean {
    const p = prompt.toLowerCase();
    return (
      p.includes('حل لي هذا الواجب فورا') ||
      p.includes('حل الواجب مباشرة') ||
      p.includes('أعطني حل الواجب مباشرة') ||
      p.includes('اعطني الاجابة فقط') ||
      p.includes('حل الاختبار فورا') ||
      p.includes('give me direct homework answer') ||
      p.includes('solve this test without explaining')
    );
  }
}
