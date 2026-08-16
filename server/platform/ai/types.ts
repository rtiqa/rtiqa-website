import type { AIFeatureType, AIMessageRole, User, Organization, Course, Lesson } from '../types.ts';

export interface AIProviderGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
}

export interface AIProviderResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: string;
  latencyMs: number;
  raw?: unknown;
}

export interface AIProvider {
  name: string;
  generateContent(options: AIProviderGenerateOptions): Promise<AIProviderResult>;
  generateStream?(
    options: AIProviderGenerateOptions,
    onChunk: (text: string) => void
  ): Promise<AIProviderResult>;
  embedText?(text: string): Promise<number[]>;
  isAvailable?(): Promise<boolean> | boolean;
}

export interface AIRequestContext {
  user: User;
  organization: Organization;
  feature: AIFeatureType;
  course?: Course;
  lesson?: Lesson;
  conversationId?: string;
  prompt: string;
  systemInstruction?: string;
  extraContext?: string;
  history?: { role: AIMessageRole; content: string }[];
}

export interface SafetyCheckResult {
  safe: boolean;
  sanitizedPrompt: string;
  violationReason?: string;
  blocked: boolean;
}
