import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from '../providers/provider.interface';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

/**
 * StorageModule — Provider Factory
 *
 * This is the Dependency Injection factory that reads STORAGE_PROVIDER
 * from environment and injects the correct implementation.
 *
 * Clean Architecture pattern:
 *   Business logic → depends on StorageProvider (abstract)
 *   Infrastructure → provides LocalStorageProvider | S3StorageProvider
 *   Switch → STORAGE_PROVIDER=local|s3
 *
 * This module is @Global so StorageProvider is available everywhere
 * without importing this module in each feature module.
 */
@Global()
@Module({
  providers: [
    {
      provide: StorageProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService): StorageProvider => {
        const provider = config.get<string>('STORAGE_PROVIDER', 'local');

        if (provider === 's3') {
          return new S3StorageProvider(config);
        }

        return new LocalStorageProvider(config);
      },
    },
  ],
  exports: [StorageProvider],
})
export class StorageModule {}
