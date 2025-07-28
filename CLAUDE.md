# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a Next.js 14 project for the Aurum Circle landing page located in the `landing-page/` directory. The project uses:

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **3D Graphics**: React Three Fiber (@react-three/fiber) with @react-three/drei
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Fonts**: Montserrat (primary), EB Garamond (serif headings)
- **Package Manager**: pnpm

## Development Commands

All commands should be run from the `landing-page/` directory:

```bash
# Development server
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

## Architecture Overview

### Component Structure

- **Page**: `app/page.tsx` - Main landing page with 3D background scene
- **Layout**: `app/layout.tsx` - Root layout with font configuration
- **Core Components**:
  - `hero-section.tsx` - Main title and tagline with staggered animations
  - `floating-love-scene.tsx` - 3D background with Three.js hearts, roses, and arrows
  - `countdown-timer.tsx` - Launch countdown component
  - `invite-form.tsx` - User invitation form
  - `footer-note.tsx` - Footer content
- **UI Components**: Complete shadcn/ui component library in `components/ui/`

### Styling System

- **Design Tokens**: CSS variables defined in `app/globals.css`
- **Color Scheme**: Dark background (#121212) with crimson accents (#8B0000, #A52A2A)
- **Responsive**: Mobile-first approach with different 3D elements for desktop/mobile
- **Animations**: Framer Motion for page transitions and component animations

### 3D Scene Architecture

The `FloatingLoveScene` component renders floating 3D objects:
- **Hearts**: Made from two spheres and a rotated cube
- **Roses**: Simple cylinder geometry
- **Arrows**: Cylinder shaft with cone head
- **Lighting**: Ambient + directional + point lights with crimson tones
- **Performance**: Simplified elements for mobile devices

## Configuration Details

### Next.js Config

- ESLint and TypeScript errors ignored during builds
- Image optimization disabled
- Standard App Router configuration

### Tailwind Setup

- Uses CSS variables for theming
- Custom color palette for brand consistency
- shadcn/ui integration with custom radius values
- Animation utilities for accordions

### Path Aliases

- `@/components` → `./components`
- `@/lib` → `./lib`
- `@/hooks` → `./hooks`
- `@/app` → `./app`

## Key Patterns

- All interactive components use `"use client"` directive
- Animations use staggered delays for orchestrated entrances
- 3D components wrapped in `<Suspense>` for better loading experience
- Responsive design with different complexity levels for mobile/desktop
- Form validation using React Hook Form + Zod schema
- CSS-in-JS styling with Tailwind utility classes

## Testing and Development

- No test framework currently configured
- Development focuses on visual and animation polish
- 3D performance optimization for various device capabilities
- Cross-browser compatibility for WebGL features