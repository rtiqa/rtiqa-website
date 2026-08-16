import type { AIProvider } from '../types.ts';
import { GeminiProvider } from './geminiProvider.ts';

export class AIProviderRegistry {
  private static instance: AIProviderRegistry;
  private providers: Map<string, AIProvider> = new Map();
  private defaultProviderName = 'gemini';

  private constructor() {
    this.registerProvider(new GeminiProvider());
  }

  public static getInstance(): AIProviderRegistry {
    if (!AIProviderRegistry.instance) {
      AIProviderRegistry.instance = new AIProviderRegistry();
    }
    return AIProviderRegistry.instance;
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  public getProvider(name?: string): AIProvider {
    const targetName = (name || this.defaultProviderName).toLowerCase();
    const provider = this.providers.get(targetName);
    if (!provider) {
      // Fallback to gemini if requested provider is unknown
      const fallback = this.providers.get('gemini');
      if (fallback) return fallback;
      throw new Error(`AI Provider '${targetName}' not found.`);
    }
    return provider;
  }

  public listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

export const providerRegistry = AIProviderRegistry.getInstance();
