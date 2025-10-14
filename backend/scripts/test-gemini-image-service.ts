#!/usr/bin/env ts-node

/**
 * Node.js 20+ optimized test script for Gemini Image Service
 */

import { GeminiImageService } from '../src/video-transform/services/gemini-image.service';
import { ProxyConfigService } from '../src/video-transform/services/proxy-config.service';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

// Load environment variables
dotenv.config();

async function testGeminiNode20() {
  console.log('🚀 Node.js 20+ Optimized Gemini Image Service Test\n');

  // Check Node.js version
  const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
  console.log(`📊 Node.js version: ${process.version}`);

  if (nodeVersion < 20) {
    console.log(`❌ This test requires Node.js 20+. Current: ${process.version}`);
    console.log(`   Please upgrade Node.js and try again.`);
    process.exit(1);
  }

  console.log(`✅ Excellent! Using Node.js ${nodeVersion} with enhanced features\n`);

  // Test undici features
  console.log('🔧 Testing Node.js 20+ Features:');
  try {
    const undici = require('undici');
    console.log(`✅ Undici loaded successfully`);
    console.log(`   Available features: ProxyAgent, setGlobalDispatcher, fetch`);
  } catch (error) {
    console.log(`❌ Undici not available: ${error.message}`);
    process.exit(1);
  }

  // Test modern fetch API
  if (typeof globalThis.fetch === 'function') {
    console.log(`✅ Global fetch API available`);
  } else {
    console.log(`⚠️  Global fetch API not available`);
  }

  console.log();

  // Check environment
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  const apiKey = process.env.GEMINI_API_KEY;

  console.log('🔍 Environment Check:');
  console.log(`   GEMINI_API_KEY: ${apiKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`   HTTP_PROXY: ${process.env.HTTP_PROXY || 'Not set'}`);
  console.log(`   HTTPS_PROXY: ${process.env.HTTPS_PROXY || 'Not set'}`);
  console.log(`   Proxy detected: ${proxyUrl ? '✅ Yes' : 'ℹ️  No'}`);

  if (!apiKey) {
    console.log('\n❌ GEMINI_API_KEY is required. Please set it and try again.');
    process.exit(1);
  }

  console.log();

  try {
    // Initialize Gemini service
    console.log('🔧 Initializing optimized Gemini Image Service...');
    const geminiService = new GeminiImageService(new ProxyConfigService());
    console.log('✅ Service initialized with Node.js 20+ optimizations\n');

    // Test image generation
    const prompt = 'Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme';
    console.log('🖼️ Testing image generation...');
    console.log(`   Prompt: "${prompt}"`);
    console.log('   ⏳ Please wait, this may take 30-60 seconds...\n');

    const startTime = Date.now();
    const filePath = path.join(process.cwd(), 'scripts/test-image.png');
    const imagePath = await geminiService.generateImage(prompt, filePath);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`🎉 SUCCESS! Image generated in ${duration}s`);
    console.log(`📂 Saved to: ${imagePath}`);
    console.log('\n✨ Gemini Image Service is working optimally with Node.js 20+!');
  } catch (error) {
    this.logger.error('\n❌ Error during Gemini test:');
    this.logger.error(`   Type: ${error.constructor.name}`);
    this.logger.error(`   Message: ${error.message}`);

    if (error.message.includes('fetch failed')) {
      console.log('\n💡 Network Error Solutions:');
      console.log('   1. If behind corporate firewall, set proxy:');
      console.log('      export HTTPS_PROXY=https://proxy.company.com:8080');
      console.log('   2. Test proxy with: curl -x $HTTPS_PROXY https://generativelanguage.googleapis.com');
      console.log('   3. Check firewall/VPN settings');
    } else if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 API Key Error Solutions:');
      console.log('   1. Verify API key is correct');
      console.log('   2. Enable Gemini API in Google Cloud Console');
      console.log('   3. Check billing is enabled');
    }

    process.exit(1);
  }
}

// Run the Node.js 20+ optimized test
testGeminiNode20().catch(console.error);
