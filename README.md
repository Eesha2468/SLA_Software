# SLA Management System

**TAP Trade and Projects**

## Login Credentials
- **Username:** Admin
- **Password:** admin22

## Tech Stack
- React 18 + TypeScript
- Vite
- Ant Design 5
- Recharts
- React Router v6

## Features
- Login Page (styled like TAP branding)
- Dashboard with 4 stat cards: Pending, Approved, Rejected, Critical
- Charts: Monthly Ticket Trend, Status Overview, Weekly Volume, Fault Level Breakdown
- Master Forms (all with form + grid/table + export to Excel/CSV/PDF):
  - Organization
  - Lines
  - Equipments
  - Service Providers
  - Users
  - KPI Categories
  - KPI Sub-Categories
  - Fault-Level Category
- New Ticket page (accessible from header button)
- Settings page (System, Notifications, SLA Configuration)
- Logout support

## How to Run

### Prerequisites
- Node.js v18 or higher → https://nodejs.org

### Steps
```bash
# 1. Navigate to the project folder
cd SLA_Software

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```
