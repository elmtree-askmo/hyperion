import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration?: number;
}

class OpenAIConnectivityTest {
  private openai: OpenAI;
  private results: TestResult[] = [];

  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private log(message: string, type: 'INFO' | 'SUCCESS' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    const colors = {
      INFO: '\x1b[36m', // Cyan
      SUCCESS: '\x1b[32m', // Green
      ERROR: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';

    console.log(`${colors[type]}[${timestamp}] ${type}: ${message}${reset}`);
  }

  private addResult(test: string, status: 'PASS' | 'FAIL', message: string, duration?: number) {
    this.results.push({ test, status, message, duration });
  }

  // Test 1: Check API Key Configuration
  async testApiKeyConfiguration(): Promise<void> {
    const startTime = Date.now();

    try {
      this.log('Testing API Key Configuration...');

      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }

      if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
        throw new Error('OPENAI_API_KEY does not appear to be a valid OpenAI API key format');
      }

      const duration = Date.now() - startTime;
      this.addResult('API Key Configuration', 'PASS', 'API key is properly configured', duration);
      this.log('✓ API Key Configuration test passed', 'SUCCESS');
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('API Key Configuration', 'FAIL', message, duration);
      this.log(`✗ API Key Configuration test failed: ${message}`, 'ERROR');
    }
  }

  // Test 2: Test Basic API Connection
  async testBasicConnection(): Promise<void> {
    const startTime = Date.now();

    try {
      this.log('Testing basic API connection...');

      const response = await this.openai.models.list();

      if (!response.data || response.data.length === 0) {
        throw new Error('No models returned from API');
      }

      const duration = Date.now() - startTime;
      this.addResult('Basic Connection', 'PASS', `Successfully connected. Found ${response.data.length} models`, duration);
      this.log(`✓ Basic Connection test passed. Found ${response.data.length} models`, 'SUCCESS');
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('Basic Connection', 'FAIL', message, duration);
      this.log(`✗ Basic Connection test failed: ${message}`, 'ERROR');
    }
  }

  // Test 3: Test Chat Completions
  async testChatCompletion(): Promise<void> {
    const startTime = Date.now();

    try {
      this.log('Testing Chat Completions API...');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, World!" to test the API connection.',
          },
        ],
        max_tokens: 10,
        temperature: 0,
      });

      if (!completion.choices || completion.choices.length === 0) {
        throw new Error('No completion choices returned');
      }

      const content = completion.choices[0].message?.content;
      if (!content) {
        throw new Error('No content returned in completion');
      }

      const duration = Date.now() - startTime;
      this.addResult('Chat Completion', 'PASS', `Response: "${content.trim()}"`, duration);
      this.log(`✓ Chat Completion test passed. Response: "${content.trim()}"`, 'SUCCESS');
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('Chat Completion', 'FAIL', message, duration);
      this.log(`✗ Chat Completion test failed: ${message}`, 'ERROR');
    }
  }

  // Test 4: Test Model Availability
  async testModelAvailability(): Promise<void> {
    const startTime = Date.now();

    try {
      this.log('Testing model availability...');

      const models = await this.openai.models.list();
      const availableModels = models.data.map((model) => model.id);

      // Check for common models
      const commonModels = ['gpt-3.5-turbo', 'gpt-4', 'text-embedding-ada-002'];
      const foundModels = commonModels.filter((model) => availableModels.includes(model));

      const duration = Date.now() - startTime;
      this.addResult('Model Availability', 'PASS', `Found ${foundModels.length}/${commonModels.length} common models: ${foundModels.join(', ')}`, duration);
      this.log(`✓ Model Availability test passed. Found models: ${foundModels.join(', ')}`, 'SUCCESS');
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.addResult('Model Availability', 'FAIL', message, duration);
      this.log(`✗ Model Availability test failed: ${message}`, 'ERROR');
    }
  }

  // Test 5: Test Rate Limiting
  async testRateLimit(): Promise<void> {
    const startTime = Date.now();

    try {
      this.log('Testing rate limit handling...');

      // Make a few quick requests to test rate limiting
      const promises = Array.from({ length: 3 }, (_, i) =>
        this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: `Test message ${i + 1}` }],
          max_tokens: 5,
        }),
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      this.addResult('Rate Limit', 'PASS', 'Successfully handled multiple concurrent requests', duration);
      this.log('✓ Rate Limit test passed', 'SUCCESS');
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Rate limiting might be expected behavior
      if (message.includes('rate_limit') || message.includes('429')) {
        this.addResult('Rate Limit', 'PASS', 'Rate limiting is working as expected', duration);
        this.log('✓ Rate Limit test passed (rate limiting detected)', 'SUCCESS');
      } else {
        this.addResult('Rate Limit', 'FAIL', message, duration);
        this.log(`✗ Rate Limit test failed: ${message}`, 'ERROR');
      }
    }
  }

  // Run all tests
  async runAllTests(): Promise<void> {
    this.log('Starting OpenAI API Connectivity Tests...', 'INFO');
    this.log('='.repeat(60), 'INFO');

    const startTime = Date.now();

    // Run tests sequentially
    await this.testApiKeyConfiguration();
    await this.testBasicConnection();
    await this.testChatCompletion();
    await this.testModelAvailability();
    await this.testRateLimit();

    const totalDuration = Date.now() - startTime;

    // Print summary
    this.printSummary(totalDuration);
  }

  private printSummary(totalDuration: number): void {
    this.log('='.repeat(60), 'INFO');
    this.log('Test Summary:', 'INFO');
    this.log('='.repeat(60), 'INFO');

    const passed = this.results.filter((r) => r.status === 'PASS').length;
    const failed = this.results.filter((r) => r.status === 'FAIL').length;

    this.results.forEach((result) => {
      const status = result.status === 'PASS' ? '✓' : '✗';
      const color = result.status === 'PASS' ? 'SUCCESS' : 'ERROR';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      this.log(`${status} ${result.test}: ${result.message}${duration}`, color);
    });

    this.log('='.repeat(60), 'INFO');
    this.log(`Total Tests: ${this.results.length}`, 'INFO');
    this.log(`Passed: ${passed}`, passed > 0 ? 'SUCCESS' : 'INFO');
    this.log(`Failed: ${failed}`, failed > 0 ? 'ERROR' : 'INFO');
    this.log(`Total Duration: ${totalDuration}ms`, 'INFO');
    this.log('='.repeat(60), 'INFO');

    if (failed === 0) {
      this.log('🎉 All tests passed! OpenAI API connectivity is working correctly.', 'SUCCESS');
    } else {
      this.log(`⚠️  ${failed} test(s) failed. Please check your OpenAI API configuration.`, 'ERROR');
    }
  }
}

// Main execution
async function main() {
  try {
    const tester = new OpenAIConnectivityTest();
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

export { OpenAIConnectivityTest };
