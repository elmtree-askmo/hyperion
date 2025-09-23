import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Application is running successfully',
  })
  getHealth(): { message: string; timestamp: string; status: string } {
    return this.appService.getHealth();
  }

  @Get('version')
  @ApiOperation({ summary: 'Get application version' })
  @ApiResponse({ status: 200, description: 'Returns application version' })
  getVersion(): { version: string; name: string } {
    return this.appService.getVersion();
  }
}
