import { defineConfig } from 'orval';

export default defineConfig({
  socialNetwork: {
    input: {
      // File openapi được dotnet build tự sinh, không cần backend chạy
      target: './SocialNetwork.Api.json',
    },
    output: {
      target: './src/api/api-generated.ts',
      // Dùng axios instance tuỳ chỉnh của mình (có JWT interceptor)
      client: 'axios',
      override: {
        mutator: {
          path: './src/api/mutator.ts',
          name: 'customMutator',
        },
      },
      // Gộp tất cả vào 1 file duy nhất
      mode: 'single',
      // Không sinh mock/test files
      mock: false,
    },
  },
});
