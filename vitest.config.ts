import { defineConfig } from 'vitest/config';
import path from 'path';

// A valid dummy RSA private key for testing (not real, safe to share)
const DUMMY_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z5P3CQNsb7/FT+2Af4ij0CWqwn6+2JEQg7SpBslVxIWAMg9
LYs5MnmeCKp9/F8QOA5K8zK7ZXLE7h8QLOHyOfGfU6TSDkVRqPKd0QNzFKXTHx5d
WlvxMIyFOkJtQDmvhbMnfNUhU1TlLBkqn2yO8C2Pf4K3q3KqLZ7Z8mKqQ7PnQ7Pn
Q7PnQ7PnQ7PnZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqF
hKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFh
KqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQIDAQABAoIBAEKTYxWq6+V1R1EI
OX9FzGnZxKkJGRQwKDSVKWvRaLn/n8QA+KeZq0p2S0vYQqQCRE8UfCKy8MQVlE1F
xXaYYQKBgQDqKzJ0rKPnCHhJVUaQgDf7LSLWaM+qRc/oTDLiMpf7K5d5dZq3M4hP
WNzLIBRGNzB5jKrZUqYqLmqaGjLzZEQKBgQDFJ+WsH2K/+MUZFi9qKG3v1LQ+h3UO
rZ5K3KJLqnZq0p0rDlVrKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYM
q3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3Zm
KqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQJBALMc5X0g
rKQKBgQD0mEhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFh
KqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFh
KqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFh
KqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZc
ZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQo
YMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3
ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKq
FhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqF
hKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFh
KqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFh
KqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZc
ZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQo
YMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3
ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKq
FhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqF
hKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFh
KqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFh
KqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZc
ZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQo
YMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3
ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKq
FhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqF
hKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFh
KqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFh
KqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZc
ZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQo
YMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3
ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKq
FhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqF
hKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFh
KqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFh
KqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZc
ZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQo
YMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3
ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKq
FhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqF
hKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFh
KqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFh
KqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZcZWQoYMq3ZmKqFhKqFhKqFhKqFhKqZc
CQIBAQ==
-----END RSA PRIVATE KEY-----`;

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/app/api/__tests__/vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.ts',
        'src/app/api/**/*.ts',
        'src/components/**/*.tsx',
        'src/hooks/**/*.ts',
      ],
      exclude: [
        'src/lib/firebase.ts',
        'src/lib/get-csrf-token.ts',
        'src/lib/firebase-admin.ts',
        'src/lib/sentry.ts',
      ],
    },
    testTimeout: 15000,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    env: {
      FIREBASE_SERVICE_ACCOUNT_KEY: JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        private_key_id: 'test-key-id',
        private_key: DUMMY_PRIVATE_KEY,
        client_email: 'test@test-project.iam.gserviceaccount.com',
        client_id: '123456',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40test-project.iam.gserviceaccount.com',
      }),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
