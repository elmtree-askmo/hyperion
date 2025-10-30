import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { ProxyConfigService } from './proxy-config.service';

export type LLMClient = ChatOpenAI | ChatGroq | null;

export interface LLMConfig {
  temperature?: number;
  model?: {
    openai?: string;
    openrouter?: string;
    groq?: string;
    modelscope?: string;
  };
}

@Injectable()
export class LLMConfigService {
  private readonly logger = new Logger(LLMConfigService.name);
  private openaiClient: ChatOpenAI;
  private openrouterClient: ChatOpenAI;
  private modelscopeClient: ChatOpenAI;
  private groqClient: ChatGroq;
  private readonly selectedLLM: LLMClient;
  private readonly llmProvider: string;

  constructor(private readonly proxyConfigService: ProxyConfigService) {
    this.llmProvider = process.env.LLM_PROVIDER || 'openai';

    this.initializeClients();
    this.selectedLLM = this.selectLLMProvider();
  }

  private initializeClients(): void {
    this.openaiClient = new ChatOpenAI({
      model: 'gpt-5', // Updated to available model
      temperature: 1,
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Groq client
    this.groqClient = new ChatGroq({
      model: 'openai/gpt-oss-120b',
      temperature: 0,
      apiKey: process.env.GROQ_API_KEY,
    });

    // Initialize OpenRouter client
    this.openrouterClient = new ChatOpenAI({
      model: 'deepseek/deepseek-chat-v3.1:free',
      temperature: 0,
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    this.modelscopeClient = new ChatOpenAI({
      model: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
      temperature: 0,
      apiKey: process.env.MODELSCOPE_API_KEY,
      configuration: {
        baseURL: 'https://api-inference.modelscope.cn/v1/',
      },
      modelKwargs: {
        enable_thinking: false,
      },
    });
  }

  private selectLLMProvider(): LLMClient {
    try {
      switch (this.llmProvider.toLowerCase()) {
        case 'openai':
          if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not found');
          }
          this.logger.log('🤖 Using OpenAI LLM provider');
          return this.openaiClient;

        case 'groq':
          if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY not found');
          }
          this.logger.log('🤖 Using Groq LLM provider');
          return this.groqClient;

        case 'openrouter':
          if (!process.env.OPENROUTER_API_KEY) {
            console.warn('⚠️  OPENROUTER_API_KEY not found, LLM features will be disabled');
            return null;
          }
          this.logger.log('🤖 Using OpenRouter LLM provider');
          return this.openrouterClient;
        case 'modelscope':
          if (!process.env.MODELSCOPE_API_KEY) {
            throw new Error('MODELSCOPE_API_KEY not found');
          }
          this.logger.log('🤖 Using ModelScope LLM provider');
          return this.modelscopeClient;
        default:
          throw new Error(`Unsupported LLM provider: ${this.llmProvider}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to initialize LLM provider (${this.llmProvider}): ${error.message}`);
      console.warn('🔄 LLM features will be disabled');
      return null;
    }
  }

  /**
   * Get the selected LLM client
   */
  getLLM(): LLMClient {
    return this.selectedLLM;
  }

  /**
   * Get a specific LLM client with custom configuration
   */
  getLLMWithConfig(config: LLMConfig): LLMClient {
    if (!this.selectedLLM) {
      return null;
    }

    const temperature = config.temperature ?? 0;

    switch (this.llmProvider.toLowerCase()) {
      case 'openai':
        return new ChatOpenAI({
          model: config.model?.openai || 'gpt-5',
          temperature: config.model?.openai == 'gpt-5' ? 1 : temperature,
          apiKey: process.env.OPENAI_API_KEY,
        });

      case 'groq':
        return new ChatGroq({
          model: config.model?.groq || 'openai/gpt-oss-120b',
          temperature,
          apiKey: process.env.GROQ_API_KEY,
        });

      case 'openrouter':
        return new ChatOpenAI({
          model: config.model?.openrouter || 'deepseek/deepseek-chat-v3.1:free',
          temperature,
          apiKey: process.env.OPENROUTER_API_KEY,
          configuration: {
            baseURL: 'https://openrouter.ai/api/v1',
          },
        });
      case 'modelscope':
        return new ChatOpenAI({
          model: config.model?.modelscope || 'Qwen/Qwen3-235B-A22B-Instruct-2507',
          temperature,
          apiKey: process.env.MODELSCOPE_API_KEY,
          configuration: {
            baseURL: 'https://api-inference.modelscope.cn/v1/',
          },
          modelKwargs: {
            enable_thinking: false,
          },
        });
      default:
        throw new Error(`Unsupported LLM provider: ${this.llmProvider}`);
    }
  }

  /**
   * Get the current LLM provider name
   */
  getLLMProvider(): string {
    return this.llmProvider;
  }

  /**
   * Check if LLM is available
   */
  isLLMAvailable(): boolean {
    return this.selectedLLM !== null;
  }

  /**
   * Get all available LLM clients
   */
  getAllClients(): {
    openai: ChatOpenAI;
    openrouter: ChatOpenAI;
    groq: ChatGroq;
  } {
    return {
      openai: this.openaiClient,
      openrouter: this.openrouterClient,
      groq: this.groqClient,
    };
  }
}
