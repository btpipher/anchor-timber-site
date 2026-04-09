import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://btpipher.github.io',
  base: '/anchor-timber-site',
  trailingSlash: 'always',
});
