# GitHub Pages Deployment

This project is a standard static Astro site deployed to GitHub Pages from the repository root.

## Current Astro Pages Config

- Site URL: `https://btpipher.github.io`
- Base Path: `/anchor-timber-site`
- Output: static

The `base` value is required for project pages on GitHub Pages so CSS, images, and internal links resolve under the repository path.

## Deploy Method

Deployment is handled by the GitHub Actions workflow at `.github/workflows/deploy.yml`.

On each push to `main`, GitHub Actions builds the Astro site and deploys it to GitHub Pages.

## GitHub Settings

In the GitHub repository:

1. Open `Settings` -> `Pages`.
2. Set `Source` to `GitHub Actions`.
3. Keep the default branch as `main`.

## Notes

- Do not remove the Astro `base` setting while using GitHub Pages for this repository.
- If the repository name changes, update the Astro `base` path to match it.
- If the GitHub username or organization changes, update the Astro `site` URL.
