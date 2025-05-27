# Mastra Expense Tracker

A modern expense tracking application built for Mastra.ai that streamlines expense management through automated receipt processing and workflow integration.

## Features

- 📸 Image-based receipt processing
- 🔄 Integration with Mastra workflows
- 💳 Payment method management
- 📊 Expense categorization
- 🔍 Review and approval workflow
- 🗄️ Secure file storage with Supabase

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Next.js API Routes
- **Storage**: Supabase Storage
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.development` file with the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application

## Project Structure

- `/src/app/api/*` - API routes for expense management
- `/src/components/*` - Reusable React components
- `/src/app/(routes)/*` - Application pages and routes
- `/public/uploads/*` - Temporary storage for uploaded receipts

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

Copyright © 2025 Mastra.ai. All rights reserved.
