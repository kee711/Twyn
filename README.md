<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>
<!--
*** This README follows the structure and style defined in reference.md.
*** Replace placeholders before public distribution.
-->



<!-- PROJECT SHIELDS -->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://www.twyn.sh/contents/topic-finder">
    <!-- Placeholder: replace with the official brandmark asset -->
    <img src="PLACEHOLDER_LOGO_PATH" alt="Twyn logo" width="80" height="80">
  </a>

  <h3 align="center">Twyn</h3>

  <p align="center">
    The self-learning digital marketing twin that compresses research, creation, and orchestration into one on-brand workflow.
    <br />
    <a href="https://github.com/kee711/Twyn"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://www.twyn.sh/contents/topic-finder">Live Experience</a>
    &middot;
    <!-- Placeholder: wire the issue template links once GitHub workflows are ready -->
    <a href="PLACEHOLDER_BUG_URL">Report Bug</a>
    &middot;
    <a href="PLACEHOLDER_FEATURE_URL">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

[![Product Screenshot][product-screenshot]](https://www.twyn.sh/contents/topic-finder)
<!-- Placeholder: swap the screenshot reference once a marketing-quality capture is available -->

Twyn is the self-learning digital marketing twin that compresses social media research, creation, and orchestration into a single on-brand workflow. It helps creators move from ideation to verified on-chain outcomes in minutes instead of hours.

Twyn exists because:
* Viral marketing is bottlenecked by hidden operations work. Research and ideation routinely consume more than half a creator’s time.
* AI-generated copy often drifts off-brand and demands heavy edits once multiple channels enter the mix.
* Publishing everywhere is still a manual, error-prone process with limited visibility into on-chain outcomes.

Twyn unifies research → creation → orchestration and ties published results to verifiable on-chain actions on Base. The result is a shorter draft-to-publish cycle, fewer edits, and a measurable bridge from attention to provable on-chain value.

Key highlights include:
* Guided Topic Finder workspace that gathers audience intel, surfaces reference insights, and drafts platform-ready posts.
* Thinking process timeline that exposes the agent’s research trail before draft generation.
* Personalization loops that learn from every edit via privacy-preserving FLock.io workflows.
* One-click multi-channel publishing with analytics and Base Chain attribution that prove impact.
* Ownership safeguards with wallet-aware prompts and signature flows reinforcing provenance and revenue sharing.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

This stack keeps Twyn fast, privacy-aware, and extensible.

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![Tailwind CSS][TailwindCSS]][TailwindCSS-url]
* [![Supabase][Supabase]][Supabase-url]
* [![LangGraph][LangGraph]][LangGraph-url]
* [![OpenAI][OpenAI]][OpenAI-url]
* [![Base][Base]][Base-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

Follow the steps below to stand up a local Twyn environment that mirrors the production workflow.

### Prerequisites

Create a `.env.local` file at the project root and populate it with the required secrets:

```bash
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

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Installation

1. Clone the repo
   ```bash
   git clone https://github.com/kee711/Twyn.git
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Launch the local environment
   ```bash
   npm run dev
   ```
4. Create a production build (optional)
   ```bash
   npm run build
   npm start
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

Twyn compresses social research, drafting, and orchestration into a repeatable workflow:

* Spin up the Topic Finder workspace to map audience segments, hook patterns, and keyword clusters.
* Use the guided editor to generate draft sequences that adapt instantly to your edits.
* Orchestrate multi-channel publishing and monitor Base Chain attribution to prove on-chain value.

See the [Live experience](https://www.twyn.sh/contents/topic-finder) for an end-to-end walkthrough.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ ] Guided starter briefs and curated reference packs for faster "A-ha!" moments.
- [ ] Deeper personalization loops that adapt to brand voice in fewer edits.
- [ ] Expanded analytics covering cross-channel lift and on-chain contribution.
- [ ] Multi-seat collaboration modes for SMB teams and agencies.

See the [open issues](https://github.com/kee711/Twyn/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions help Twyn learn faster. We welcome issues, pull requests, and feedback from creators and operators.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

### Top Contributors

<!-- Placeholder: replace with contrib.rocks image once repository is public -->
<a href="https://github.com/kee711/Twyn/graphs/contributors">
  <img src="PLACEHOLDER_CONTRIBUTOR_IMAGE_URL" alt="Contributor overview" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the Business Source License (BSL) 1.1. See `LICENSE.txt` for terms, usage limits, and the change date.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Twyn team – PLACEHOLDER_CONTACT_EMAIL  
Project Link: [https://github.com/kee711/Twyn](https://github.com/kee711/Twyn)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Choose an Open Source License](https://choosealicense.com)
* [Img Shields](https://shields.io)
* [LangGraph](https://langchain-ai.github.io/langgraph/)
* [FLock.io](https://flock.io)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/kee711/Twyn.svg?style=for-the-badge
[contributors-url]: https://github.com/kee711/Twyn/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/kee711/Twyn.svg?style=for-the-badge
[forks-url]: https://github.com/kee711/Twyn/network/members
[stars-shield]: https://img.shields.io/github/stars/kee711/Twyn.svg?style=for-the-badge
[stars-url]: https://github.com/kee711/Twyn/stargazers
[issues-shield]: https://img.shields.io/github/issues/kee711/Twyn.svg?style=for-the-badge
[issues-url]: https://github.com/kee711/Twyn/issues
[license-shield]: https://img.shields.io/badge/license-BSL%201.1-blue.svg?style=for-the-badge
[license-url]: LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: PLACEHOLDER_LINKEDIN_URL
[product-screenshot]: PLACEHOLDER_SCREENSHOT_PATH
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-0f172a?style=for-the-badge&logo=tailwindcss&logoColor=06b6d4
[TailwindCSS-url]: https://tailwindcss.com/
[Supabase]: https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white
[Supabase-url]: https://supabase.com/
[LangGraph]: https://img.shields.io/badge/LangGraph-1b1f24?style=for-the-badge&logo=langchain&logoColor=white
[LangGraph-url]: https://langchain-ai.github.io/langgraph/
[OpenAI]: https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white
[OpenAI-url]: https://platform.openai.com/
[Base]: https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=coinbase&logoColor=white
[Base-url]: https://www.base.org/
