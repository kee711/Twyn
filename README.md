# Twyn

Twyn is the self-learning digital marketing twin that compresses social media research, creation, and orchestration into a single on-brand workflow. It helps creators move from ideation to verified on-chain outcomes in minutes instead of hours.

## Quick Links

- Live experience: https://www.twyn.sh/contents/topic-finder
- GitHub repository: https://github.com/kee711/Twyn

## Problem We Solve

Viral marketing is bottlenecked by hidden operations work. Ideation and research often consume more than half of a creator’s time. AI-generated copy frequently drifts off-brand and demands heavy edits. Publishing across channels is still a manual, error-prone process.

## Our Solution

Twyn unifies research → creation → orchestration and ties published results to verifiable on-chain actions on Base. The platform empowers users to:

- Run account-fit research that surfaces top-performing references, keyword clusters, and hook patterns.
- Generate hyper-personalized drafts that learn from every edit while preserving privacy via FLock.io.
- Publish everywhere in one click with analytics and on-chain attribution that prove impact.

The result is a shorter draft-to-publish cycle, fewer edits, and a measurable bridge from attention to provable on-chain value.

## Product Overview

- **Topic Finder workspace**: guided flow that gathers audience intel, surfaces reference insights, and drafts platform-ready posts.
- **Thinking process timeline**: transparent view into the research steps the agent took before generating copy.
- **Personalization loops**: edits feed a secure learning system that improves future drafts without exporting raw data.
- **Unified orchestration**: publish to multiple platforms, track analytics, and attribute conversions to on-chain actions.
- **Ownership safeguards**: Base Chain integration reinforces provenance and revenue share logic for creators.

## Key Features

- Account-fit social research with engagement analytics.
- Topic and keyword intelligence clustering.
- Reference and hook pattern analysis.
- Draft generation with structured editor feedback.
- One-click multi-channel publishing and scheduling.
- Wallet-aware ownership prompts and signature flows.
- On-chain attribution for outcomes and rewards.

## Challenges & What We Learned

Early onboarding was the toughest hurdle. Asking new users to connect multiple accounts and grasp the research → draft → orchestrate → on-chain loop at once caused drop-off. We introduced a guided, single-account-first setup and are adding one-click starter briefs plus curated reference packs to deliver faster “A-ha!” moments in the first session.

## Target Customers

- **Primary**: micro-creators with 3K–20K followers seeking leverage without large teams.
- **Secondary**: SMB marketing leads managing two to three channels who need proof of impact.

Validation to date includes user interviews, MVP test cycles, micro-creator cohorts, and a Day1 Company (KOSPI-listed) proof of concept that drove faster drafts, higher acceptance rates, and weekly retention.

## Unique Value Proposition

Twyn is the only self-learning, end-to-end marketing twin that learns from edits, keeps workflows on-brand, and anchors ownership on-chain. One unified flow cuts time-to-first-draft by 30%+ while turning attention into verifiable on-chain outcomes.

### Alpha Validation Plan

We are running a four-week program with micro-creators (3K–20K followers) to measure improvements in:

- Time to first draft.
- Accepted draft percentage (edit distance).
- Reach, saves, and click-through rate per post.
- On-chain actions per 1K reach.

Success looks like a materially faster publish path (>30% time saved), visible learning effects, and defensible on-chain attribution.

## Competitive Landscape

| Competitor | Focus | How Twyn Differs |
| --- | --- | --- |
| [Hootsuite](https://www.hootsuite.com) | Scheduling & analytics | Lacks AI learning loop and on-chain attribution. |
| [Buffer](https://buffer.com) | Lightweight publishing | No integrated research or ownership signals. |
| [Jasper](https://www.jasper.ai) | Generic AI copy | Doesn’t tie research, creation, and orchestration together. |

Twyn unifies research, hyper-personalized generation, and one-click orchestration with on-chain attribution, keeping the entire flow creator-owned.

## Distribution Strategy

- **Community cohorts & ambassadors**: trust-based onboarding with low acquisition cost.
- **Ecosystem partnerships**: Base Batch, Farcaster, and creator networks provide concentrated reach.
- **Product-led loops**: free tier, shareable research packs, and “Made with Twyn” tags amplify organic growth.
- **SMB/agency land → expand**: start self-serve, then layer multi-seat offerings once ROI is proven.

These motions match how creators adopt tools—peer recommendations, ecosystem endorsements, and visible outcomes.

## Architecture & Stack

- Next.js 15, React 19, and TypeScript for the application shell.
- Tailwind CSS and shadcn/ui for design system components.
- Supabase for auth, database, and edge functions.
- OpenAI and LangGraph-powered research & generation agents.
- Base Chain integrations for on-chain verification and payouts.
- WalletConnect-driven wallet experiences plus Farcaster relay endpoints.

## Getting Started

### Prerequisites

Create a `.env.local` at the project root and populate it with the required secrets:

```
# Supabase (server)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase (client)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_db_url

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_DEBUG=true

# Threads OAuth
THREADS_CLIENT_ID=your_threads_client_id
THREADS_CLIENT_SECRET=your_threads_client_secret
NEXT_PUBLIC_THREADS_ACCESS_TOKEN=your_threads_access_token

# WalletConnect & Farcaster
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_FARCASTER_RELAY_URL=/api/farcaster/relay
FARCASTER_API_KEY=your_farcaster_relay_api_key
# FARCASTER_RELAY_ORIGIN=https://relay.farcaster.xyz

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cron
CRON_SECRET=your_cron_secret
```

### Install & Run

```bash
npm install
npm run dev

# Production
npm run build
npm start
```

## Roadmap

- Guided starter briefs and sample reference packs for immediate value.
- Deeper learning loops that adapt to brand voice faster.
- Expanded analytics for cross-channel lift and on-chain contribution.
- Multi-seat collaboration for SMB teams and agencies.

## License

This project is licensed under the MIT License.
