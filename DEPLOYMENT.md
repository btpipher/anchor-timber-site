# Vercel Deployment

This project is a standard static Astro site deployed from the repository root.

## Vercel Dashboard Settings

- Framework Preset: `Astro`
- Root Directory: `.`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

## Notes

- Do not set a custom Astro `base` path for Vercel unless you are intentionally deploying the site under a subpath.
- No Astro Vercel adapter is required for this project.
- No `vercel.json` file is required for the normal deployment.
- The current Astro config builds static output with trailing slashes, which Vercel serves correctly.

## Deploy Checklist

1. Import the repository into Vercel.
2. Keep the project root at the repository root.
3. Leave the framework preset as `Astro`.
4. Confirm the commands and output directory match the settings above.
5. Deploy.

## When To Change This

Only add an Astro Vercel adapter if the project is later changed to use SSR or other server-only Astro features.
