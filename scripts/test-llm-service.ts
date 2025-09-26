import * as dotenv from 'dotenv';
import { LLMConfigService } from '../src/video-transform/services/llm-config.service';
import { ProxyConfigService } from '../src/video-transform/services/proxy-config.service';

// Load environment variables
dotenv.config();

async function testLLMService() {
  console.log('🚀 Testing LLM Service with Proxy Configuration...');
  console.log('='.repeat(60));

  try {
    // Initialize LLM service
    const llmService = new LLMConfigService(new ProxyConfigService());

    console.log(`📊 LLM Provider: ${llmService.getLLMProvider()}`);
    console.log(`✅ LLM Available: ${llmService.isLLMAvailable()}`);

    if (!llmService.isLLMAvailable()) {
      throw new Error('LLM service is not available');
    }

    // Get LLM client
    const llm = llmService.getLLM();

    if (!llm) {
      throw new Error('Failed to get LLM client');
    }

    console.log('🤖 Testing LLM client...');

    // Test LLM with a simple prompt
    const response = await llm.invoke('Tell me who you are and what version number it is and when your knowledge was last updated?');

    console.log('✅ LLM Response:', response.content);
    console.log('🎉 LLM Service test passed!');
  } catch (error) {
    console.error('❌ LLM Service test failed:', error.message);
    process.exit(1);
  }
}

// Run test
testLLMService()
  .then(() => {
    console.log('='.repeat(60));
    console.log('🏁 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
