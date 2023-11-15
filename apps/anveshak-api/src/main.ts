/**
 * Author: Govind
 * Date: 09-11-2023
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { env } from 'process';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule,{
      logger:env.NODE_ENV === 'development' ? ['error', 'warn', 'log', 'debug', 'verbose'] : ['error', 'warn', 'log', 'debug']
    });

    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    app.enableCors({
      origin: "*",
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: [
        'Authorization',
        'Accept',
        'Accept-Version',
        'Content-Type',
        'Api-Version',
        'Origin',
        'X-Requested-With',
        'access-token',
        'auth',
      ],
      exposedHeaders: [
        'Api-Version',
        'Request-Id',
        'Response-Time',
        'X-Count',
        'X-Items-Per-Page',
      ],
      maxAge: 5,
      credentials:true
    });

    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    if(env.NODE_ENV === 'development'){
      const config = new DocumentBuilder()
      .setTitle('Anveshak')
      .setDescription('Anveshak: Revolutionizing Supply Chain Traceability on the Algorand Blockchain')
      .setVersion('1.0')
      .addTag('General')
      .addTag('User')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'Authorization'
      )
      .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api', app, document);
    }else{
      app.use(helmet());
      app.use(helmet.hidePoweredBy());
    }

    const port = process.env.PORT || 6776;
    await app.listen(port);
    Logger.log(
      `🚀 Anveshak is running on: http://localhost:${port}/${globalPrefix}`
    );
  } catch (error) {
    Logger.error(
      ` Anveshak project failed to start inside bootstrap function.  error: ${JSON.stringify(
        error
      )}`
    );
  }
}

bootstrap().catch((error) => {
  Logger.error(
    ` Anveshak project failed to start.  error: ${JSON.stringify(error)}`
  );
});;
