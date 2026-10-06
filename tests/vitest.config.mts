import { defineConfig } from 'vitest/config';

// Node tarafında çalışan testler (Angular dışı):
//   npm run test:release  -> yayın/gelir hazırlığı kontrolleri
//   npm run test:rules    -> Firestore güvenlik kuralları (emülatör ile)
export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
