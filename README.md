# Infinity: Mercenaries

A custom rules website for Infinity: Mercenaries, a campaign-focused mercenary framework built on Infinity N5.

## Development

```bash
npm install
npm run dev
```

### Google Drive Integration

To enable user data persistence on Google Drive:

1. Follow the setup guide in [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md)
2. Create `.env.local` with your `PUBLIC_GOOGLE_CLIENT_ID`
3. Visit http://localhost:3000/test-drive to test the integration

See [GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md) for detailed instructions.

## Deployment

This project is intended to deploy as a static Astro site on Cloudflare Pages.

Suggested Cloudflare Pages settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `20`

For production Google Drive OAuth, update `PUBLIC_GOOGLE_CLIENT_ID` in your deployment environment variables.
