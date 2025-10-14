import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { message: string; timestamp: string; status: string } {
    return {
      message: 'Hyperion API is running',
      timestamp: new Date().toISOString(),
      status: 'healthy',
    };
  }

  getVersion(): { version: string; name: string } {
    return {
      name: 'Hyperion Backend',
      version: '1.0.0',
    };
  }
}
