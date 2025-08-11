# Aurum Circle Landing Page

A Next.js-based landing page for Aurum Circle, showcasing AI-powered social discovery features and collecting waitlist submissions.

## Overview

This landing page is part of the Aurum Circle monorepo and follows the standardized app structure. It features:

- Modern, responsive design built with Tailwind CSS
- Waitlist form with validation and submission handling
- Integration with shared types and configurations
- AI-powered social discovery messaging
- Multiple form submission storage methods for reliability

## Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Form Handling**: Robust form validation and submission with multiple storage backends
- **SEO Optimized**: Meta tags, Open Graph, and Twitter Card support
- **Type Safety**: Full TypeScript integration with shared types
- **Shared Configuration**: Extends monorepo-wide configurations

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Language**: TypeScript
- **Form Handling**: Custom API routes with validation
- **Storage**: Multi-backend approach (Cloudflare R2, local storage, notifications)

## Directory Structure

```
apps/landing-page/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── submit/        # Form submission endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main landing page
├── components/            # React components (future use)
├── public/               # Static assets
├── styles/               # Additional styles
├── tests/                # Test files
├── docs/                 # Documentation
├── .env.example          # Environment variables template
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies and scripts
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Development

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm

### Setup

1. Install dependencies from the root of the monorepo:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Configure environment variables in `.env.local`:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=aurum-circle-submittion

# Notification Webhook
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Environment
NODE_ENV=development
```

### Running Locally

```bash
# From the landing-page directory
npm run dev

# Or from the monorepo root
npm run dev --workspace=landing-page
```

The landing page will be available at `http://localhost:3000`

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## API Endpoints

### POST /api/submit

Handles waitlist form submissions with validation and multi-backend storage.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Optional message"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Thank you for joining our waitlist! We'll be in touch soon.",
  "data": {
    "id": "sub_1234567890_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Optional message",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Shared Packages Integration

This app integrates with the following shared packages:

- `@shared/types` - Common TypeScript type definitions
- `@shared/config` - Shared configuration files (TypeScript, ESLint, etc.)
- `@shared/utils` - Shared utility functions (if needed)

## Environment Variables

| Variable                   | Description                          | Required |
| -------------------------- | ------------------------------------ | -------- |
| `R2_ACCOUNT_ID`            | Cloudflare R2 account ID             | Yes      |
| `R2_ACCESS_KEY_ID`         | Cloudflare R2 access key             | Yes      |
| `R2_SECRET_ACCESS_KEY`     | Cloudflare R2 secret key             | Yes      |
| `R2_BUCKET_NAME`           | R2 bucket for storing submissions    | Yes      |
| `NOTIFICATION_WEBHOOK_URL` | Webhook for notifications            | No       |
| `NODE_ENV`                 | Environment (development/production) | No       |

## Deployment

### Production Build

```bash
npm run build
```

### Environment Setup

Ensure all required environment variables are configured in your deployment environment.

### Storage Configuration

The landing page uses multiple storage methods:

1. **Cloudflare R2**: Primary storage for form submissions
2. **Local Storage**: Backup storage method
3. **Webhook Notifications**: Real-time notifications to Slack/Discord

## Contributing

1. Follow the monorepo coding standards
2. Use the shared TypeScript and ESLint configurations
3. Add tests for new functionality
4. Update documentation as needed

## Migration Notes

This landing page was migrated from the root `landing-page/` directory to `apps/landing-page/` as part of the monorepo standardization. Key changes:

- **Structure**: Moved to standardized app directory structure
- **Dependencies**: Updated to use shared packages (`@shared/types`, `@shared/config`)
- **Configuration**: TypeScript config now extends shared configuration
- **API Consistency**: Form submission follows standardized API response format
- **Type Safety**: Integrated with monorepo-wide type definitions

## License

This project is part of the Aurum Circle ecosystem.
