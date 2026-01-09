# smart-shift-scheduler

AI-powered workforce management & shift scheduling platform for retail franchises (Next.js 16, TypeScript, Supabase).

## Requirements

- Node.js 18.17 or later
- npm or yarn
- Supabase account with a project

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/smart-shift-scheduler.git
cd smart-shift-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Enable basic authentication
ENABLE_AUTH=true
ADMIN_USER=your_admin_username
ADMIN_PASSWORD=your_admin_password
```

4. Set up your Supabase database with the required tables:
   - `employees` - Staff records with roles and hourly rates
   - `shifts` - Work assignments with start/end times
   - `time_off_requests` - Employee time off requests
   - `holidays` - Holiday dates

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
