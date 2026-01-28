# Curio

A personal knowledge capture and reflection tool. Think of it as a private stream of consciousness - quick thoughts, ideas, links, and observations that you want to capture without the friction of organizing them.

## Features

- **Quick Capture** - Post thoughts instantly with a chat-like interface
- **Tags** - Organize entries with `#tags` for easy filtering
- **Search** - Instant search with keyboard navigation and jump-to-entry
- **Date Navigation** - Browse by date with a calendar picker
- **Dark/Light Mode** - System-aware theme with manual toggle
- **File Attachments** - Upload images and documents
- **Mobile-First** - Designed for quick capture on any device

## Tech Stack

- **Backend**: Laravel 12, PHP 8.3, SQLite
- **Frontend**: React 19, TypeScript, Inertia.js, Tailwind CSS
- **Build**: Vite

## Quick Start

### Prerequisites

- PHP 8.3+
- Composer
- Node.js 20+
- npm

### Installation

```bash
# Clone the repo
git clone https://github.com/alexknowshtml/curio.git
cd curio

# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Copy environment file and generate app key
cp .env.example .env
php artisan key:generate

# Create SQLite database
touch database/database.sqlite

# Run migrations
php artisan migrate

# Build frontend assets
npm run build
```

### Development

```bash
# Start the development server
php artisan serve

# In another terminal, start Vite for hot reload
npm run dev
```

Visit `http://localhost:8000` to use the app.

### Production

```bash
# Build optimized assets
npm run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Docker (Optional)

```bash
# Start with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec app php artisan migrate
```

## Usage

1. **Register** an account at `/register`
2. **Post** thoughts using the input at the bottom of the screen
3. **Tag** entries by including `#tagname` in your text
4. **Search** using the search box in the header
5. **Filter** by clicking tags or using the date picker
6. **Navigate** search results with arrow keys, Enter to jump

## License

MIT
