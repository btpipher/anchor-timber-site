# Pipher Forest Products Site

Astro static site for Pipher Forest Products (Crawford, CO).

## Development
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`

## Content editor

The custom editor is available at `/admin/`. Supabase provides password authentication, content storage, and image uploads. Until Supabase is configured, the public site continues to use the JSON files in `src/content`.

Required public build variables are listed in `.env.example`. The database and storage policies are defined in `supabase/migrations/20260914000000_site_editor.sql`.

## Deployment
GitHub Pages is configured via `.github/workflows/deploy.yml`.
