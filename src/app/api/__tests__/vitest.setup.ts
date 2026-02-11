import { vi } from 'vitest';

// Mock firebase-admin before anything else loads
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  cert: vi.fn(() => ({})),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      add: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
        })),
      })),
    })),
  })),
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
    increment: vi.fn((n: number) => ({ _type: 'increment', value: n })),
  },
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({})),
}));
