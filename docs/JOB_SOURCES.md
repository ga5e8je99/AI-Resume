# Job Sources & Compliance Documentation (`JobMatch AI`)

This document describes every job source integrated into the **JobMatch AI** search engine (`/jobs` and `lib/jobs/*`), its integration method (**Official API** vs **Public Smart Deep-Link**), environment configuration, caching policy, attribution requirements, and Terms of Service (ToS) compliance.

---

## Core Compliance Principles

1. **Zero Unauthorized Scraping:** JobMatch AI **never** scrapes HTML pages, bypasses authentication/anti-bot controls, or extracts listings from platforms whose Terms of Service prohibit automated scraping.
2. **Official APIs Only for Aggregated Listings:** In-app job cards are fetched exclusively from providers that offer documented public JSON feeds or official partner REST APIs.
3. **Public Search Deep-Links for Closed Platforms:** For regional and global job boards without open public APIs (e.g., LinkedIn, Indeed, Wuzzuf, Bayt, Naukrigulf, GulfTalent), JobMatch AI generates verified **"Search on X"** outbound links pointing directly to each platform's public search URL with `rel="noopener noreferrer"`.
4. **Raw Result Caching Only:** Provider responses are cached for **6 hours** (`CACHE_TTL_HOURS = 6`) stripped of any user-specific data (`stripUserMatchDataFromJob`). Candidate `Match %` and skill gap analysis are computed dynamically per user after reading from cache.
5. **Direct Source Attribution & Outbound Apply:** Every aggregated job card displays its source badge, links directly to the original job posting when the user clicks **Apply**, and renders the provider attribution strip at the bottom of the results list.

---

## 1. Official API Providers (`lib/jobs/providers/*`)

| Provider | Status | Auth / Env Vars | Endpoint | Timeout | Attribution & ToS Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Remotive** | **Official Public API** | None required | `GET https://remotive.com/api/remote-jobs?search={query}&limit=25` | `8000ms` | Open public API for remote jobs. Requires linking back to `https://remotive.com` and attributing *"Powered by Remotive Remote Jobs API"*. Cached for 6 hours to respect fair-use rate limits. |
| **Arbeitnow** | **Official Public API** | None required | `GET https://www.arbeitnow.com/api/job-board-api?search={query}` | `8000ms` | Open public job board API covering European & remote roles. Requires linking to original posting URL and attributing *"Jobs provided via Arbeitnow Open Job Board API"*. |
| **RemoteOK** | **Official Public Feed** | None required | `GET https://remoteok.com/api?tag={tag}` | `8000ms` | Public JSON feed (`remoteok.com/api`). First array item contains legal license notice; requires direct backlink to the RemoteOK job URL and attribution *"Remote positions aggregated via RemoteOK Public Feed"*. |
| **The Muse** | **Official Public API** | None required | `GET https://www.themuse.com/api/public/jobs?page={page}&descending=true` | `8000ms` | Public career platform API. Links directly to `refs.landing_page` and attributes *"Job listings curated via The Muse Open Career Platform"*. |
| **Adzuna** | **Official Partner API** | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | `GET https://api.adzuna.com/v1/api/jobs/{country}/search/{page}` | `8000ms` | Enabled automatically when `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are configured; gracefully marked `skipped` when absent. Attributes *"Jobs powered by Adzuna Global Job Search API"*. |
| **Jooble** | **Official Partner API** | `JOOBLE_API_KEY` | `POST https://jooble.org/api/{apiKey}` | `8000ms` | Enabled automatically when `JOOBLE_API_KEY` is configured; gracefully marked `skipped` when absent. Attributes *"Jobs delivered via Jooble Search Engine API"*. |

---

## 2. Smart Deep-Link Platforms (`lib/jobs/smart-links.ts`)

For platforms that do **not** provide a free/open public JSON API or whose Terms of Service prohibit automated crawling, JobMatch AI provides one-click **Smart Deep-Links** (`generateSmartLinks`) using only official public search query parameters:

| Platform | Status | Region Focus | Public Search URL Pattern | ToS & Usage Policy |
| :--- | :--- | :--- | :--- | :--- |
| **LinkedIn Jobs** | **Link Only (No Scraping)** | Global | `https://www.linkedin.com/jobs/search/?keywords={query}&location={location}&f_WT=2` | LinkedIn User Agreement (§8.2) prohibits scraping. Outbound deep-link opens LinkedIn's public job search in a new tab. |
| **Indeed** | **Link Only (No Scraping)** | Global | `https://www.indeed.com/jobs?q={query}&l={location}&sc=0kf%3Aattr(DS3S6)%3B` | Indeed Terms of Service prohibit automated extraction. Uses public search URL parameters (`q`, `l`). |
| **Wuzzuf** | **Link Only (No Scraping)** | Egypt / MENA | `https://wuzzuf.net/search/jobs/?q={query}+{location}&a=hpb` | Wuzzuf ToS prohibits automated scraping. Directs candidates to Wuzzuf's public search page. |
| **Bayt** | **Link Only (No Scraping)** | Egypt / MENA | `https://www.bayt.com/en/international/jobs/?keyword={query}&location={location}` | Bayt.com Terms of Use prohibit scraping. Uses public international job search URL. |
| **Naukrigulf** | **Link Only (No Scraping)** | Gulf (UAE, KSA, Qatar) | `https://www.naukrigulf.com/{slug}-jobs` | Naukrigulf ToS prohibits automated crawling. Uses public role-slug search URL. |
| **GulfTalent** | **Link Only (No Scraping)** | Gulf / MENA | `https://www.gulftalent.com/jobs/search?pos_title={query}&country={location}` | GulfTalent Terms prohibit scraping. Uses public `pos_title` and `country` query parameters. |
| **Glassdoor** | **Link Only (No Scraping)** | Global | `https://www.glassdoor.com/Job/jobs.htm?sc.keyword={query}&locKeyword={location}` | Glassdoor Terms of Use prohibit scraping. Opens public keyword search page. |
| **Google Jobs** | **Link Only (No Scraping)** | Global | `https://www.google.com/search?q={query}+{location}+jobs&ibp=htl;jobs` | Google Terms of Service prohibit automated SERP scraping. Opens Google Jobs interactive search view in the user's browser. |
| **ZipRecruiter** | **Link Only (No Scraping)** | Global / US | `https://www.ziprecruiter.com/candidate/search?search={query}&location={location}` | ZipRecruiter Terms prohibit scraping. Uses public candidate search URL. |
| **Monster** | **Link Only (No Scraping)** | Global | `https://www.monster.com/jobs/search?q={query}&where={location}` | Monster Terms of Use prohibit scraping. Uses public `q` and `where` search URL parameters. |

---

## 3. Deduplication, Caching, & Quota Architecture

- **Fuzzy Deduplication (`lib/jobs/matcher.ts`):** Listings aggregated from the 6 API providers are deduplicated using normalized `title + company + location` fuzzy similarity (Levenshtein + Token Jaccard similarity >= 0.80) and canonical URL normalization (stripping `utm_*` and tracking parameters).
- **Raw Cache (`lib/jobs/cache.ts`):** Keyed strictly by `job_search:{query}:{location}:{remote}:{country}` for 6 hours. User skills and `matchScore` are never stored in cache.
- **Quota & Rate Limits (`app/api/jobs/search/route.ts`):**
  - **Free Search Mode (without CV Match):** Free for users, protected by per-user/per-IP rate limiting.
  - **CV Match Mode (`includeMatch: true`):** Computes personalized `Match %`, matched skills, and missing skills; includes **3 free searches** (`JOB_MATCH_FREE_QUOTA = 3`), after which each CV Match search consumes 1 credit (`JOB_MATCH_CREDIT_COST = 1`) or requires an active Pro plan.

