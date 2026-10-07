// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sanity from '@sanity/astro';

const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = loadEnv(
  process.env.NODE_ENV ?? 'development',
  process.cwd(),
  '',
);

// Статическая сборка: контент читается из Content Lake на этапе build.
export default defineConfig({
  // Сайт живёт на GitHub Pages в подпути /sanity-field-notes.
  site: 'https://works-on-my-box.github.io',
  base: '/sanity-field-notes',
  integrations: [
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      useCdn: false,
      apiVersion: '2026-10-01',
    }),
  ],
});
