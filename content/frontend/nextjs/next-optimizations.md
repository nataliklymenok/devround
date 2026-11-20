---
id: next-optimizations
module: next-data
order: 4
title: Images, fonts, metadata and scripts
description: next/image, next/font, the Metadata API and next/script — the built-in optimizations interviewers ask about.
levels: [junior, middle, senior]
estimatedMinutes: 20
topics: [next-optimizations]
reviewed: 2026-11-20
references:
  - { title: 'Next.js Docs — Image Optimization', url: 'https://nextjs.org/docs/app/getting-started/images' }
  - { title: 'Next.js Docs — Font Optimization', url: 'https://nextjs.org/docs/app/getting-started/fonts' }
  - { title: 'Next.js Docs — Metadata and OG images', url: 'https://nextjs.org/docs/app/getting-started/metadata-and-og-images' }
keyTakeaways:
  - next/image serves resized, modern-format images, lazy-loads by default and reserves space to avoid layout shift.
  - Mark the LCP image with priority (preload) — never lazy-load it.
  - next/font self-hosts fonts at build time with size-adjusted fallbacks, removing layout shift and third-party requests.
  - Export metadata or generateMetadata from layouts and pages for titles, descriptions and Open Graph tags.
interviewQuestions:
  - question: What does next/image do for you?
    answer: |
      It generates responsive `srcset` sizes, converts to modern formats such as WebP or AVIF, lazy-loads
      images below the fold, requires dimensions (or `fill` with a sized parent) to prevent layout
      shift, and caches optimized variants. You still need correct `sizes` for responsive layouts and
      `priority` (or `fetchPriority`) for the hero image.
  - question: How does next/font improve performance?
    answer: |
      Fonts are downloaded at build time and served from your domain, so there is no extra connection to
      Google Fonts and no privacy leak. Next.js generates fallback fonts with adjusted metrics so text
      does not jump when the web font loads, and you can subset and preload only what you use.
  - question: How do you set per-page SEO metadata?
    answer: |
      Export a `metadata` object or an async `generateMetadata` function from `layout.tsx` or
      `page.tsx`. Metadata merges from root to leaf, so the root layout sets defaults (`title.template`,
      Open Graph site name) and pages override title, description, canonical URL and images. Special
      files like `opengraph-image.tsx`, `sitemap.ts` and `robots.ts` generate the rest.
quiz:
  - id: q1
    question: How should the hero (LCP) image be rendered with next/image?
    options: ["With loading lazy", "With priority so it is preloaded", "As a CSS background", "Without width and height"]
    correct: 1
    explanation: The LCP image must load as early as possible.
  - id: q2
    question: What problem does next/font's fallback adjustment solve?
    options: ["Bundle size", "Layout shift when the web font swaps in", "SEO ranking", "CORS"]
    correct: 1
    explanation: Size-adjusted fallbacks keep text metrics stable.
  - id: q3
    question: Where do you define a page's title in the App Router?
    options: ["In the head element manually", "export const metadata or generateMetadata in page.tsx", "In next.config.js", "In middleware"]
    correct: 1
    explanation: The Metadata API generates head tags.
---

## Images

```tsx
import Image from 'next/image'
import hero from './hero.jpg' // static import → width/height known

export function Hero() {
  return <Image src={hero} alt="Team at work" priority sizes="100vw" placeholder="blur" />
}

// Remote images need width/height (or fill) and an allow-listed host in next.config
<Image src={user.avatarUrl} alt="" width={48} height={48} />
```

## Fonts

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin', 'cyrillic'], display: 'swap' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

## Metadata

```tsx
// app/layout.tsx
export const metadata = {
  title: { default: 'DevRound', template: '%s · DevRound' },
  description: 'Interview preparation for developers',
}

// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug)
  return { title: post.title, description: post.excerpt, openGraph: { images: [post.cover] } }
}
```

## Third-party scripts

```tsx
import Script from 'next/script'

<Script src="https://analytics.example.com/script.js" strategy="afterInteractive" />
// strategies: beforeInteractive, afterInteractive (default), lazyOnload, worker (experimental)
```
