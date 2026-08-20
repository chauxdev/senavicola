import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    bodyParser: false, // <-- Deshabilita el parser por defecto para usar el nuestro con mayor límite
  });

  // Seguridad: Cabeceras HTTP
  app.use(helmet());

  // Aumentar el límite de tamaño para permitir imágenes en base64
  const express = require('express');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Validación global de DTOs
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

  // Filtro global de excepciones
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Interceptor de respuesta uniforme
  app.useGlobalInterceptors(new ResponseInterceptor());

  // CORS configurable (dinámico para permitir desarrollo local sin fricciones)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('SenaVicola API')
    .setDescription('Documentación de la API para el sistema de granja avícola SenaVicola.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Servidor corriendo en http://localhost:${port}`);
  logger.log(`📚 Documentación Swagger en http://localhost:${port}/api/docs`);
}
bootstrap();
