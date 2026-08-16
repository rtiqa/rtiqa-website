import { db } from '../../db.ts';
import type { AIUsageRecord, AIFeatureType } from '../../types.ts';

interface RateBucket {
  count: number;
  resetTime: number;
}

export class AIRateLimiterService {
  private static orgBuckets: Map<string, RateBucket> = new Map();
  private static userBuckets: Map<string, RateBucket> = new Map();

  // Pricing constants for Gemini 3.7 Flash
  private static INPUT_COST_PER_MILLION = 0.10; // $0.10 per 1M input tokens
  private static OUTPUT_COST_PER_MILLION = 0.40; // $0.40 per 1M output tokens

  // Limits
  private static ORG_REQ_PER_MINUTE = 100;
  private static USER_REQ_PER_MINUTE = 30;

  public static checkRateLimit(organizationId: string, userId: string): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute

    // Check User Rate Limit
    let userBucket = this.userBuckets.get(userId);
    if (!userBucket || now > userBucket.resetTime) {
      userBucket = { count: 1, resetTime: now + windowMs };
      this.userBuckets.set(userId, userBucket);
    } else {
      userBucket.count++;
      if (userBucket.count > this.USER_REQ_PER_MINUTE) {
        const retryAfter = Math.ceil((userBucket.resetTime - now) / 1000);
        return {
          allowed: false,
          retryAfterSeconds: retryAfter,
          reason: `USER_RATE_LIMIT_EXCEEDED: Maximum ${this.USER_REQ_PER_MINUTE} AI requests per minute reached.`,
        };
      }
    }

    // Check Organization Rate Limit
    let orgBucket = this.orgBuckets.get(organizationId);
    if (!orgBucket || now > orgBucket.resetTime) {
      orgBucket = { count: 1, resetTime: now + windowMs };
      this.orgBuckets.set(organizationId, orgBucket);
    } else {
      orgBucket.count++;
      if (orgBucket.count > this.ORG_REQ_PER_MINUTE) {
        const retryAfter = Math.ceil((orgBucket.resetTime - now) / 1000);
        return {
          allowed: false,
          retryAfterSeconds: retryAfter,
          reason: `ORG_RATE_LIMIT_EXCEEDED: Maximum ${this.ORG_REQ_PER_MINUTE} AI requests per minute reached for your school.`,
        };
      }
    }

    return { allowed: true };
  }

  public static calculateCost(inputTokens: number, outputTokens: number): number {
    const inCost = (inputTokens / 1_000_000) * this.INPUT_COST_PER_MILLION;
    const outCost = (outputTokens / 1_000_000) * this.OUTPUT_COST_PER_MILLION;
    return Number((inCost + outCost).toFixed(6));
  }

  public static trackUsage(params: {
    organizationId: string;
    userId: string;
    provider: string;
    model: string;
    featureName: AIFeatureType;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    status: 'SUCCESS' | 'ERROR' | 'RATE_LIMITED' | 'BLOCKED';
  }): AIUsageRecord {
    const cost = this.calculateCost(params.inputTokens, params.outputTokens);
    const usageId = `aiu_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const record: AIUsageRecord = {
      id: usageId,
      organizationId: params.organizationId,
      userId: params.userId,
      provider: params.provider,
      model: params.model,
      featureName: params.featureName,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      estimatedCost: cost,
      latencyMs: params.latencyMs,
      status: params.status,
      createdAt: new Date().toISOString(),
    };

    return db.recordAIUsage(record);
  }

  public static resetLimits(): void {
    this.orgBuckets.clear();
    this.userBuckets.clear();
  }

  public static resetAll(): void {
    this.resetLimits();
  }
}
