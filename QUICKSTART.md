# 🚀 Quick Start Guide

## Prerequisites Setup

1. **Install Node.js** (v18 or higher)
2. **Create Supabase Project** at https://supabase.com
3. **Run SQL Schema**: Copy and execute `supabase/schema.sql` in Supabase SQL Editor

## Installation

```bash
# Install all dependencies
npm run install:all

# Or manually:
cd backend && npm install
cd ../frontend && npm install
```

## Configuration

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=any_random_string
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit http://localhost:5173

## Testing

```bash
cd backend
npm test
```

## API Documentation

Once backend is running, visit: http://localhost:3001/api-docs

