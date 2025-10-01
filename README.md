# Macroflows

**A nutrition tracking platform built with modular architecture and modern web technologies.**

![Version](https://img.shields.io/badge/version-0.14.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![SolidJS](https://img.shields.io/badge/SolidJS-2c4f7c?logo=solid&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)

---

## Overview

Macroflows is a nutrition tracking system focused on strong typing, reactive UI, and modular domain-driven design. It follows clean architecture principles and integrates with modern backend and frontend tools.

For now, it is focused on being a personal project to track my own nutrition, but maybe in the future it will be a SaaS product.

---

## Features

### Nutrition & Progress
- Macro tracking: carbs, protein, and fat
- Real-time calorie calculation
- Personalized macro profiles (grams per kg)
- Daily goal visualization with charts

### Body Data
- Body fat estimation (U.S. Navy method)
- Weight tracking with trends

### Food Management
- EAN scanning for quick entry
- Searchable food database
- Custom recipe builder with automatic macros
- Meal planning and reusable templates

### User Interface
- Responsive design
- Real-time updates via SolidJS signals
- Simplified navigation

---

## Architecture

```
src/
├── modules/           # Domain logic and business entities
├── sections/          # UI and presentation layer
├── legacy/            # Utility and legacy code (under migration)
└── shared/            # Common logic (e.g. error handling)
```

### Design Principles
- **Domain-Driven Design + Clean Architecture**
- **Repository Pattern with Supabase**

---

## Tech Stack

- **Frontend**: SolidJS, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Realtime), Vercel
- **Validation & Visualization**: Zod, ApexCharts
- **Dev Tools**: ESLint, Prettier, html5-qrcode

---

## Getting Started

### Requirements
- Node.js 18+
- Supabase account

### Setup

> **Environment Variables:**
> Copy `.env.example` to `.env.local` and fill in the required values. This file lists all environment variables needed to run the project. Do not commit secrets to version control.

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

## Contributing

Contributions are welcome. Please maintain consistency with the codebase’s structure and quality standards.

---

## License

MIT — see [LICENSE](LICENSE) for details.
