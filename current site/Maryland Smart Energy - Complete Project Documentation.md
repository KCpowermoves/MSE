# Maryland Smart Energy - Complete Project Documentation

**Project Name:** mdsmartenergy-site  
**Version:** 1.0.0  
**Type:** Full-Stack React + Express + tRPC + MySQL Web Application  
**Last Updated:** March 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Environment Variables](#environment-variables)
6. [Setup & Installation](#setup--installation)
7. [API Routes & Procedures](#api-routes--procedures)
8. [Frontend Architecture](#frontend-architecture)
9. [Key Features](#key-features)
10. [Deployment Guide](#deployment-guide)
11. [File-by-File Code Reference](#file-by-file-code-reference)

---

## Project Overview

Maryland Smart Energy is a full-featured marketing and lead generation website for energy efficiency consulting services. The site includes:

- **Public-facing website** with service pages, blog, and contact forms
- **Admin dashboard** for managing blog posts, analytics, and leads
- **Lead capture system** with email notifications to multiple recipients
- **Analytics tracking** for page views and traffic monitoring
- **Blog management system** for creating and publishing articles
- **Password-protected admin area** for secure access

### Core Services Offered:
- HVAC Tune-Up
- Building Tune-Up
- Lighting Efficiency
- Energy Efficiency Programs
- Energy Benchmarking
- Community Solar
- Energy Supply

---

## Technology Stack

### Frontend
- **React 19.2.1** - UI framework
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 4.1.14** - Styling
- **Vite 7.1.7** - Build tool
- **wouter 3.3.5** - Lightweight routing
- **React Hook Form 7.64.0** - Form handling
- **Zod 4.1.12** - Schema validation
- **Framer Motion 12.23.22** - Animations
- **Recharts 2.15.2** - Data visualization
- **shadcn/ui** - Component library (pre-built components)

### Backend
- **Express 4.21.2** - Web server
- **tRPC 11.6.0** - Type-safe RPC framework
- **Drizzle ORM 0.44.5** - Database ORM
- **MySQL 3.15.0** - Database driver
- **Jose 6.1.0** - JWT handling
- **AWS SDK S3** - File storage

### Development
- **Vitest 2.1.4** - Testing framework
- **Prettier 3.6.2** - Code formatting
- **ESBuild 0.25.0** - Production bundling
- **tsx 4.19.1** - TypeScript execution

---

## Project Structure

```
mdsmartenergy-site/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── Home.tsx            # Homepage
│   │   │   ├── About.tsx           # About page
│   │   │   ├── Contact.tsx         # Contact page
│   │   │   ├── Blog.tsx            # Blog listing
│   │   │   ├── Article.tsx         # Individual article
│   │   │   ├── PrivacyPolicy.tsx   # Privacy policy
│   │   │   ├── TermsOfService.tsx  # Terms of service
│   │   │   ├── AdminDashboard.tsx  # Admin dashboard
│   │   │   ├── AdminBlogEditor.tsx # Blog editor
│   │   │   └── services/           # Service pages
│   │   │       ├── HvacTuneUp.tsx
│   │   │       ├── BuildingTuneUp.tsx
│   │   │       ├── Lighting.tsx
│   │   │       ├── EnergyEfficiency.tsx
│   │   │       ├── Benchmarking.tsx
│   │   │       ├── CommunitySolar.tsx
│   │   │       └── EnergySupply.tsx
│   │   ├── components/             # Reusable components
│   │   │   ├── Layout.tsx          # Main layout wrapper
│   │   │   ├── ServiceFormModal.tsx # Contact form modal
│   │   │   ├── DashboardLayout.tsx # Admin dashboard layout
│   │   │   ├── AIChatBox.tsx       # AI chat interface
│   │   │   ├── Map.tsx             # Google Maps integration
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── trpc.ts             # tRPC client setup
│   │   │   └── utils.ts            # Utility functions
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── contexts/               # React contexts
│   │   ├── _core/hooks/
│   │   │   └── useAuth.ts          # Authentication hook
│   │   ├── const.ts                # Constants
│   │   ├── App.tsx                 # Main app routes
│   │   ├── main.tsx                # React entry point
│   │   └── index.css               # Global styles
│   ├── public/                     # Static files (favicon, robots.txt)
│   └── index.html                  # HTML template
│
├── server/                          # Backend Express + tRPC server
│   ├── _core/                      # Core framework files
│   │   ├── index.ts                # Express server entry point
│   │   ├── context.ts              # tRPC context builder
│   │   ├── trpc.ts                 # tRPC router setup
│   │   ├── env.ts                  # Environment variables
│   │   ├── oauth.ts                # OAuth flow handling
│   │   ├── cookies.ts              # Cookie management
│   │   ├── notification.ts         # Owner notifications
│   │   ├── llm.ts                  # LLM integration
│   │   ├── imageGeneration.ts      # Image generation
│   │   ├── voiceTranscription.ts   # Voice to text
│   │   ├── map.ts                  # Maps API
│   │   ├── dataApi.ts              # Data API integration
│   │   ├── systemRouter.ts         # System procedures
│   │   └── vite.ts                 # Vite dev server bridge
│   ├── routers/                    # Feature routers
│   │   ├── serviceRequests.ts      # Contact form handling
│   │   ├── blog.ts                 # Blog management
│   │   ├── analytics.ts            # Analytics tracking
│   │   ├── admin.ts                # Admin procedures
│   │   └── adminAuth.ts            # Admin authentication
│   ├── db.ts                       # Database query helpers
│   ├── routers.ts                  # Main router aggregator
│   ├── storage.ts                  # S3 file storage helpers
│   └── auth.logout.test.ts         # Test example
│
├── drizzle/                         # Database schema & migrations
│   ├── schema.ts                   # Table definitions
│   ├── relations.ts                # Table relationships
│   ├── 0000_snapshot.json          # Migration snapshots
│   └── 0001_snapshot.json
│
├── shared/                          # Shared code between client & server
│   ├── const.ts                    # Shared constants
│   ├── types.ts                    # Shared types
│   └── _core/errors.ts             # Error definitions
│
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite build config
├── vitest.config.ts                # Test config
├── drizzle.config.ts               # Drizzle ORM config
├── tailwind.config.ts              # Tailwind CSS config
├── components.json                 # shadcn/ui config
└── README.md                       # Project readme
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Blog Posts Table
```sql
CREATE TABLE blog_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  author VARCHAR(255),
  featured INT DEFAULT 0,
  published INT DEFAULT 0,
  publishedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Page Views Table (Analytics)
```sql
CREATE TABLE page_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  referrer VARCHAR(255),
  userAgent TEXT,
  ipHash VARCHAR(64),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Contact Submissions Table (Leads)
```sql
CREATE TABLE contact_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  message TEXT,
  serviceName VARCHAR(255),
  affiliate VARCHAR(255),
  source VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Environment Variables

### Required System Variables (Auto-Injected)
```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-jwt-secret-key
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

### Custom Variables (Set via webdev_request_secrets)
```
ADMIN_PASSWORD=Mse2026^
CONTACT_FORM_EMAILS=admin@MdSmartEnergy.com,service@MdSmartEnergy.com,kevin@myutilityadvisor.com
VITE_APP_TITLE=Maryland Smart Energy
VITE_APP_LOGO=https://cdn.../logo.png
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

---

## Setup & Installation

### Prerequisites
- Node.js 22.13.0+
- pnpm 10.4.1+
- MySQL 8.0+ or compatible database

### Local Development Setup

1. **Clone and install dependencies:**
```bash
cd /home/ubuntu/mdsmartenergy-site
pnpm install
```

2. **Set up environment variables:**
Create a `.env.local` file with all required variables (see Environment Variables section).

3. **Initialize database:**
```bash
# Generate migrations from schema
pnpm drizzle-kit generate

# Apply migrations to database
pnpm drizzle-kit migrate
```

4. **Start development server:**
```bash
pnpm dev
```

The site will be available at `http://localhost:3000`

### Build for Production

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

---

## API Routes & Procedures

### Authentication
- `auth.me` - Get current user info
- `auth.logout` - Logout current user

### Service Requests (Contact Forms)
- `serviceRequests.submitForm` - Submit contact form
  - Saves to database
  - Sends emails to configured recipients
  - Triggers owner notification

### Blog Management
- `blog.list` - Get all published blog posts
- `blog.getBySlug` - Get single blog post by slug
- `blog.create` - Create new blog post (admin only)
- `blog.update` - Update existing blog post (admin only)
- `blog.delete` - Delete blog post (admin only)

### Analytics
- `analytics.trackPageView` - Track page visit
- `analytics.getDashboard` - Get analytics summary
- `analytics.getPageViews` - Get page view details
- `analytics.getLeads` - Get contact form submissions

### Admin Authentication
- `adminAuth.login` - Admin password login
- `adminAuth.hasAdmin` - Check if admin exists

### System
- `system.notifyOwner` - Send notification to owner

---

## Frontend Architecture

### Routing
The app uses **wouter** for lightweight client-side routing. Main routes defined in `client/src/App.tsx`:

```
/                    → Home page
/services            → Services dropdown menu
/services/hvac       → HVAC Tune-Up service page
/services/building   → Building Tune-Up page
/services/lighting   → Lighting efficiency page
/services/energy     → Energy efficiency programs
/services/benchmarking → Energy benchmarking
/services/solar      → Community solar
/services/supply     → Energy supply
/about               → About page
/contact             → Contact page
/blog                → Blog listing
/blog/:slug          → Individual blog post
/privacy-policy      → Privacy policy
/terms-of-service    → Terms of service
/admin               → Admin dashboard (password protected)
/admin/blog/new      → Create new blog post
/admin/blog/:id      → Edit blog post
```

### State Management
- **Authentication:** `useAuth()` hook from `client/src/_core/hooks/useAuth.ts`
- **Data fetching:** tRPC hooks (`useQuery`, `useMutation`)
- **Theme:** React Context via `ThemeProvider`
- **Form state:** React Hook Form with Zod validation

### Component Hierarchy

```
App.tsx
├── Layout.tsx (Header, Navigation, Banner, Footer)
│   ├── Promotional Banner (Gold, animated, 10s pulse)
│   ├── Header (Logo, Menu, Call Now button)
│   ├── Navigation (Home, Services, Blog, About, Contact)
│   └── Footer (Links, Legal, Contact)
├── Routes
│   ├── Home (Hero, Services overview, CTA)
│   ├── Service Pages (Hero, Description, CTA form)
│   ├── Blog (List view with filtering)
│   ├── Admin Dashboard (Tabs: Overview, Blog, Analytics, Leads)
│   └── Other pages
└── ServiceFormModal (Paperform embed)
```

---

## Key Features

### 1. Lead Capture System
- Contact form on every service page
- Paperform integration for form submission
- Automatic email notifications to 3 recipients
- Lead tracking in admin dashboard
- Affiliate and source tracking

### 2. Blog Management
- Create, edit, delete blog posts
- Markdown content support
- Category and featured post support
- Auto-generated URL slugs
- Published/draft status
- Author attribution

### 3. Admin Dashboard
- **Overview Tab:** Key metrics, recent leads
- **Blog Tab:** List of all posts with edit/delete actions
- **Analytics Tab:** Page views, traffic trends, top pages
- **Leads Tab:** Contact form submissions with details

### 4. Analytics Tracking
- Page view tracking (path, referrer, user agent)
- IP hashing for privacy
- Traffic trends and summaries
- Top pages by visits

### 5. Authentication
- Password-protected admin area
- Secure password hashing
- Session-based auth
- One-time admin setup

### 6. Responsive Design
- Mobile-first approach
- Tailwind CSS responsive utilities
- Optimized for all screen sizes
- Touch-friendly interfaces

---

## Deployment Guide

### Prerequisites for Deployment
1. MySQL database with proper credentials
2. All environment variables configured
3. S3 bucket for file storage (optional)
4. Email service for notifications

### Deployment Steps

1. **Build the application:**
```bash
pnpm build
```

2. **Set production environment variables:**
```bash
export DATABASE_URL="mysql://prod_user:prod_pass@prod_host/prod_db"
export JWT_SECRET="your-production-secret"
export ADMIN_PASSWORD="your-secure-password"
# ... other variables
```

3. **Start production server:**
```bash
pnpm start
```

The server will run on the port specified in environment (default 3000).

### Docker Deployment (Optional)
Create `Dockerfile`:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

Build and run:
```bash
docker build -t mdsmartenergy .
docker run -p 3000:3000 --env-file .env.production mdsmartenergy
```

---

## File-by-File Code Reference

### Critical Files for Import

#### Frontend Entry Points
- **client/src/main.tsx** - React app initialization
- **client/src/App.tsx** - Main router and layout
- **client/src/lib/trpc.ts** - tRPC client configuration

#### Backend Entry Points
- **server/_core/index.ts** - Express server initialization
- **server/routers.ts** - tRPC router aggregation
- **server/db.ts** - Database query helpers

#### Database
- **drizzle/schema.ts** - Table definitions
- **drizzle.config.ts** - ORM configuration

#### Configuration
- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript settings
- **vite.config.ts** - Frontend build configuration
- **tailwind.config.ts** - Tailwind CSS theme

### Important Component Files

#### Layout Components
- **client/src/components/Layout.tsx** - Main wrapper with header, footer, banner
- **client/src/components/ServiceFormModal.tsx** - Contact form modal

#### Page Components
- **client/src/pages/Home.tsx** - Homepage with hero and services
- **client/src/pages/AdminDashboard.tsx** - Admin control panel
- **client/src/pages/AdminBlogEditor.tsx** - Blog post editor
- **client/src/pages/Blog.tsx** - Blog listing page
- **client/src/pages/services/*.tsx** - Individual service pages

#### Backend Routers
- **server/routers/serviceRequests.ts** - Contact form handling
- **server/routers/blog.ts** - Blog CRUD operations
- **server/routers/analytics.ts** - Analytics queries
- **server/routers/adminAuth.ts** - Admin login

### Styling
- **client/src/index.css** - Global styles and Tailwind theme
- **tailwind.config.ts** - Tailwind configuration with brand colors

---

## Key Customization Points

### Brand Colors
Edit `client/src/index.css` and `tailwind.config.ts`:
- Primary Red: `#C41E3A`
- Gold/Yellow: `#FFB81C`
- Navy Blue: `#001F3F`

### Contact Form Recipients
Edit environment variable `CONTACT_FORM_EMAILS`:
```
admin@MdSmartEnergy.com,service@MdSmartEnergy.com,kevin@myutilityadvisor.com
```

### Phone Number
Edit `client/src/components/Layout.tsx` - search for `(301) 888-7090`

### Admin Password
Set via `ADMIN_PASSWORD` environment variable

### Services Offered
Edit service pages in `client/src/pages/services/` and update navigation in `client/src/App.tsx`

---

## Testing

### Run Tests
```bash
pnpm test
```

### Test Files
- `server/auth.logout.test.ts` - Example test file using Vitest

### Writing New Tests
Create files matching pattern `*.test.ts` in relevant directories.

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check MySQL server is running
- Ensure database exists and user has permissions

### Admin Login Issues
- Verify `ADMIN_PASSWORD` environment variable is set
- Check password is correct (case-sensitive)
- Clear browser cookies and try again

### Email Notifications Not Sending
- Verify `CONTACT_FORM_EMAILS` is set correctly
- Check email addresses are valid
- Verify Manus notification service is configured

### Blog Posts Not Appearing
- Check post is marked as `published: 1` in database
- Verify slug is unique
- Clear browser cache

### Analytics Not Tracking
- Verify page view tracking is integrated in Layout
- Check database connection
- Ensure `page_views` table exists

---

## Support & Documentation

### Additional Resources
- **tRPC Documentation:** https://trpc.io
- **Drizzle ORM:** https://orm.drizzle.team
- **Tailwind CSS:** https://tailwindcss.com
- **React:** https://react.dev
- **Express:** https://expressjs.com

### Common Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm check            # TypeScript check
pnpm format           # Format code with Prettier

# Database
pnpm drizzle-kit generate  # Generate migrations
pnpm drizzle-kit migrate   # Apply migrations

# Production
pnpm build            # Build for production
pnpm start            # Start production server
pnpm test             # Run tests
```

---

## Version History

- **v1.0.0** (March 2026) - Initial release
  - Full website with 7 service pages
  - Blog management system
  - Admin dashboard with analytics
  - Lead capture and email notifications
  - Password-protected admin area
  - Responsive design
  - Privacy policy and terms of service

---

## License

MIT License - See LICENSE file for details

---

**Generated:** March 19, 2026  
**Project Owner:** Kevin (Maryland Smart Energy)  
**Contact:** admin@MdSmartEnergy.com
