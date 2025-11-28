# Macroflows 
###  [![EN](https://img.shields.io/badge/lang-EN_(cur.)-lightgray)](docs/locale/pt-br/README.md) [![PT-BR](https://img.shields.io/badge/lang-PT--BR-blue)](README.md)


A modular, high-performance nutrition tracking platform built with SolidJS, strong typing, and clean architecture principles.

![Version](https://img.shields.io/badge/version-0.14.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![SolidJS](https://img.shields.io/badge/SolidJS-2c4f7c?logo=solid&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

---

## Screenshots
![Diet Page](docs/screenshots/diet-page.png)
![Food Search](docs/screenshots/food-search.png)
![Weight Tracking](docs/screenshots/weight-tracking.png)
![Macro Profile](docs/screenshots/macro-profile.png)

## Overview

Macroflows is a nutrition tracking system focused on strong typing, reactive UI, and modular domain-driven design. It follows clean architecture principles and integrates with modern backend and frontend tools.

For now, it is focused on being a personal project to track my own nutrition, but maybe in the future it will be a SaaS product.

---

## Features

### Nutrition & Progress
- Macro tracking (carbs, protein, fat)
- Real-time calorie and macro calculations
- Personalized macro profiles (g/kg)
- Daily progress visualization with charts

### Body Data
- Body fat estimation (U.S. Navy method)
- Weight logging with trend visualization

### Food Management
- EAN barcode scanning
- Searchable food database
- User recent searches, favorites, and history
- Custom recipe builder with automatic macro calculation
- Meal planning and reusable templates

### User Interface
- Responsive design
- Fine-grained real-time updates (SolidJS signals)
- Simple, fast navigation optimized for daily use

---

## Architecture

```
src/
└── modules/                
    ├── diet/               # Diet tracking module
    │   ├── application/    # Use cases and business logic
    │   ├── domain/         # Core domain entities and types
    │   ├── infrastructure/ # Data sources (API, DB)
    │   └── ui/             # UI components specific to diet module
    ├── body/               # Body data module
    │   ├── ...             # Similar structure as diet module
    ├── clipboard/          # Clipboard management module
    │   ├── ...             # Similar structure as diet module
    └── ...                 # Other modules (auth, recipes, food search, etc.)
```

---

## Tech Stack

- **Frontend:** SolidJS, TypeScript, TailwindCSS  
- **Backend:** Supabase (PostgreSQL, Realtime) 
  - Note: for simplicity, the backend is tightly coupled with the frontend in this project.
- **Validation & Charts:** Zod, ApexCharts  
- **Dev Tools:** ESLint, Prettier, html5-qrcode  

---

## Getting Started

### Requirements
- Node.js 20+
- Supabase account

### Setup

> **Environment Variables:**
> Copy `.env.example` to `.env.local` and fill in the required values. This file lists all environment variables needed to run the project.
> Do not commit secrets to version control.

```bash
git clone https://github.com/marcuscastelo/macroflows.git
cd macroflows
npm install

cp .env.example .env.local  # Add your Supabase credentials
npm run dev
```

---

## Roadmap

- OpenTelemetry integration
- PWA support
- ML-based food recognition
- Social features (sharing, collaboration)

---

## License

MIT — see [LICENSE](LICENSE) for details.
