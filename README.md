# ScholarSG — Singapore Scholarship Index

ScholarSG is a static, official-source-first Singapore scholarship discovery site for students and families.

## Features
- Instant keyword search
- Education, nationality and field filters
- Deadline and name sorting
- Transparent Smart Match scoring
- Scholarship detail pages
- Official provider links and verification dates
- Responsive mobile layout
- Custom 404, robots.txt and sitemap.xml
- GitHub Pages deployment with GitHub Actions
- No Vercel and no backend required

## Data quality
Each record points to an official provider source and includes a verification date. Scholarship information can change, so users should confirm the latest eligibility, deadline, documents, award terms, renewal conditions and bond/service obligations on the provider site before applying.

## Local preview
Serve the repository root with any static HTTP server and open `index.html`.

## Deployment
Pushes to `main` are published through `.github/workflows/pages.yml` using GitHub Pages.

Repository: https://github.com/AACHIEVERS/applus-smartmatch
