import { Injectable, Logger } from '@nestjs/common';
import { HttpsProxyAgent } from 'https-proxy-agent';

@Injectable()
export class ProxyConfigService {
  private readonly logger = new Logger(ProxyConfigService.name);
  private static isProxyConfigured = false;

  constructor() {
    // Only setup proxy once when the service is first instantiated
    if (!ProxyConfigService.isProxyConfigured) {
      this.setupGlobalProxy();
      ProxyConfigService.isProxyConfigured = true;
    }
  }

  private setupGlobalProxy(): void {
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

    if (proxyUrl) {
      this.logger.log(`🌐 Setting up optimized proxy (Node.js ${process.version}): ${proxyUrl}`);

      try {
        // Use undici for Node.js 20+ (optimal for fetch API)
        const { setGlobalDispatcher, ProxyAgent } = require('undici');
        const proxyAgent = new ProxyAgent({
          uri: proxyUrl,
        });
        setGlobalDispatcher(proxyAgent);
        this.logger.log(`✅ Undici proxy agent configured with enhanced options for Node.js 20+`);
      } catch (error) {
        console.warn(`⚠️  Failed to configure proxy: ${error.message}`);
        // Fallback to basic proxy setup
        this.setupBasicProxy(proxyUrl);
      }
    }
  }

  private setupBasicProxy(proxyUrl: string): void {
    try {
      const https = require('https');
      const http = require('http');
      const agent = new HttpsProxyAgent(proxyUrl);

      https.globalAgent = agent;
      http.globalAgent = agent;
      this.logger.log(`✅ Basic proxy fallback configured`);
    } catch (error) {
      console.warn(`⚠️  Even basic proxy setup failed: ${error.message}`);
    }
  }

  /**
   * Check if proxy is configured
   */
  static isConfigured(): boolean {
    return ProxyConfigService.isProxyConfigured;
  }

  /**
   * Get proxy URL if configured
   */
  getProxyUrl(): string | undefined {
    return process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  }
}
