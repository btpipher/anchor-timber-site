import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://btp-arch.github.io',
  base: '/anchor-timber-site',
  trailingSlash: 'always',
});
