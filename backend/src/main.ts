// Add crypto polyfill at the top of the file
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // Create Winston logger instance
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS',
          }),
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, context, ...meta }) => {
            // Format: [timestamp] {context} level: message {additional metadata}
            let formattedMessage = `[${timestamp}]`;

            // Place context immediately after timestamp
            if (context) {
              formattedMessage += ` ${context}`;
            }

            formattedMessage += ` ${level}: ${message}`;

            // Add any additional metadata
            const metaKeys = Object.keys(meta);
            if (metaKeys.length > 0) {
              const metaString = JSON.stringify(meta);
              formattedMessage += ` ${metaString}`;
            }

            return formattedMessage;
          }),
        ),
      }),
    ],
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });

  // Serve static files from videos directory
  // __dirname in compiled code is dist/src, so we need to go up twice to reach project root
  app.useStaticAssets(join(__dirname, '..', '..', 'videos'), {
    prefix: '/videos/',
  });

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API versioning
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder().setTitle('Hyperion API').setDescription('A secure NestJS backend application').setVersion('1.0').addBearerAuth().build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API documentation available at: http://localhost:${port}/api-docs`);
}

bootstrap();
