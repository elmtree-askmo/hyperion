# Hyperion Backend

A secure NestJS backend application with enterprise-grade security features.

## Features

- 🔐 **JWT Authentication & Authorization**
- 🛡️ **Security Middleware** (Helmet, CORS, Rate Limiting)
- ✅ **Input Validation** with class-validator
- 📝 **API Documentation** with Swagger
- 🏗️ **Modular Architecture**
- 📊 **Structured Logging** with Winston
- 🐳 **Docker Support**
- 🔒 **Role-based Access Control (RBAC)**
- 🗄️ **PostgreSQL + TypeORM** with Schema Support
- 🔄 **Database Migrations** for Schema Management
- 🎓 **AI-Powered Content Analysis** with LangChain & OpenAI GPT-4
- 📺 **YouTube Video Processing** with intelligent segmentation

## Security Features

### Authentication & Authorization

- JWT-based authentication
- Role-based access control (User, Admin)
- Password hashing with bcrypt
- Token expiration handling

### Security Middleware

- **Helmet**: Sets various HTTP headers to secure the app
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Validates and sanitizes all inputs

### Data Protection

- Environment variable configuration
- Secure password storage
- Input sanitization
- Request validation

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 12+ (or Docker for containerized setup)

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd hyperion
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**

   ```bash
   # Start PostgreSQL (using Docker)
   docker-compose up postgres -d

   # Run database migrations
   npm run migration:run
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

### Using Docker

1. **Build and run with Docker Compose**

   ```bash
   docker-compose up --build
   ```

2. **Or build manually**
   ```bash
   docker build -t hyperion-backend .
   docker run -p 3000:3000 hyperion-backend
   ```

## Environment Variables

| Variable               | Description                           | Default                               |
| ---------------------- | ------------------------------------- | ------------------------------------- |
| `NODE_ENV`             | Environment (development/production)  | `development`                         |
| `PORT`                 | Server port                           | `3000`                                |
| `JWT_SECRET`           | JWT signing secret                    | Required                              |
| `JWT_EXPIRES_IN`       | JWT expiration time                   | `1d`                                  |
| `CORS_ORIGIN`          | Allowed CORS origins                  | `http://localhost:3000`               |
| `RATE_LIMIT_TTL`       | Rate limit time window (seconds)      | `60`                                  |
| `RATE_LIMIT_LIMIT`     | Max requests per TTL                  | `10`                                  |
| `LOG_LEVEL`            | Logging level                         | `info`                                |
| `DB_HOST`              | Database host                         | `localhost`                           |
| `DB_PORT`              | Database port                         | `5432`                                |
| `DB_USERNAME`          | Database username                     | `postgres`                            |
| `DB_PASSWORD`          | Database password                     | `password`                            |
| `DB_DATABASE`          | Database name                         | `hyperion`                            |
| `DB_SCHEMA`            | Database schema                       | `public`                              |
| `LLM_PROVIDER`         | LLM provider to use                   | `openrouter` (openai/openrouter/groq) |
| `OPENAI_API_KEY`       | OpenAI API key for GPT models         | Required if using OpenAI              |
| `OPENROUTER_API_KEY`   | OpenRouter API key for diverse models | Required if using OpenRouter          |
| `GROQ_API_KEY`         | Groq API key for fast inference       | Required if using Groq                |
| `LANGCHAIN_API_KEY`    | LangSmith API key for LLM debugging   | Optional for debugging                |
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing              | `true` (optional)                     |
| `LANGCHAIN_PROJECT`    | LangSmith project name                | `hyperion-content-analysis`           |

## LLM Provider Configuration

The application supports multiple LLM providers for content analysis. You can switch between providers using the `LLM_PROVIDER` environment variable.

### Supported Providers

| Provider       | Value        | Description                           | Model Used                 |
| -------------- | ------------ | ------------------------------------- | -------------------------- |
| **OpenRouter** | `openrouter` | Access to multiple open-source models | `openai/gpt-oss-120b:free` |
| **OpenAI**     | `openai`     | Direct OpenAI API access              | `gpt-5`                    |
| **Groq**       | `groq`       | Fast inference with Groq hardware     | `openai/gpt-oss-120b`      |

### Configuration Examples

```bash
# Use OpenRouter (default)
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Use OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here

# Use Groq
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
```

### Provider Selection Guidelines

- **OpenRouter**: Best for cost-effectiveness and access to diverse models
- **OpenAI**: Best for highest quality results (requires paid API)
- **Groq**: Best for speed and low-latency inference

## API Documentation

The API documentation is available at `/api-docs` when running in development mode.

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user

### User Endpoints

- `GET /api/v1/users/profile` - Get current user profile
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `GET /api/v1/users` - Get all users (Admin only)
- `POST /api/v1/users` - Create user (Admin only)
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

### Health Check

- `GET /api/v1/` - Health check endpoint
- `GET /api/v1/version` - Get application version

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Data transfer objects
│   ├── strategies/      # Passport strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/               # Users module
│   ├── dto/            # Data transfer objects
│   ├── entities/       # User entities
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── common/              # Shared resources
│   ├── decorators/     # Custom decorators
│   ├── guards/         # Route guards
│   └── dto/           # Common DTOs
├── app.controller.ts    # Main app controller
├── app.service.ts       # Main app service
├── app.module.ts        # Root module
└── main.ts             # Application entry point
```

## Database Management

### PostgreSQL + TypeORM Setup

This application uses PostgreSQL with TypeORM for data persistence and schema management.

#### Initial Database Setup

1. **Start PostgreSQL**:

   ```bash
   # Using Docker (recommended)
   docker-compose up postgres -d

   # Or with local PostgreSQL
   brew services start postgresql  # macOS
   sudo systemctl start postgresql # Linux
   ```

2. **Create database and schema** (if needed):

   ```sql
   -- Connect to PostgreSQL
   psql -h localhost -U postgres

   -- Create database
   CREATE DATABASE hyperion;

   -- Create custom schema (optional)
   \c hyperion
   CREATE SCHEMA IF NOT EXISTS hyperion_dev;
   ```

3. **Run migrations**:
   ```bash
   npm run migration:run
   ```

#### Migration Workflow

1. **Generate migration from entity changes**:

   ```bash
   # Make changes to your entity files first
   npm run migration:generate src/migrations/UpdateUserTable
   ```

2. **Create empty migration**:

   ```bash
   npm run migration:create src/migrations/AddIndexes
   ```

3. **Run migrations**:

   ```bash
   npm run migration:run
   ```

4. **Revert migration** (if needed):

   ```bash
   npm run migration:revert
   ```

5. **Check migration status**:
   ```bash
   npx typeorm-ts-node-commonjs migration:show -d src/config/typeorm.config.ts
   ```

#### Environment-specific Database Configuration

- **Development**: Uses `synchronize: true` for automatic schema updates
- **Production**: Uses migrations only, `synchronize: false`
- **Schema Support**: Configure `DB_SCHEMA` environment variable

#### Troubleshooting

- **Connection issues**: Verify PostgreSQL is running and credentials are correct
- **Migration failures**: Check database permissions and schema existence
- **Schema not found**: Ensure the specified schema exists in the database

```bash
# Test database connection
psql -h localhost -U postgres -d hyperion -c "SELECT version();"

# Check if schema exists
psql -h localhost -U postgres -d hyperion -c "\dn"
```

## Development

### Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Database Scripts

- `npm run migration:generate src/migrations/MigrationName` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run migration:create src/migrations/MigrationName` - Create empty migration file

### Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Security Best Practices

This application implements several security best practices:

1. **Environment Configuration**: Sensitive data stored in environment variables
2. **Input Validation**: All inputs validated using class-validator
3. **Authentication**: JWT tokens with proper expiration
4. **Authorization**: Role-based access control
5. **Password Security**: Bcrypt hashing with salt rounds
6. **Rate Limiting**: Prevents brute force attacks
7. **CORS**: Configurable cross-origin policies
8. **Security Headers**: Helmet middleware for HTTP security
9. **Logging**: Structured logging for security monitoring
10. **Docker Security**: Non-root user in containers

## Production Deployment

### Environment Setup

1. Set strong `JWT_SECRET`
2. Configure proper `CORS_ORIGIN`
3. Set `NODE_ENV=production`
4. Configure logging levels
5. Set up proper database connections:
   - Configure `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
   - Set appropriate `DB_SCHEMA` (e.g., `production` or `hyperion_prod`)
   - Ensure database user has proper permissions
   - Enable SSL connections for remote databases
6. Configure reverse proxy (nginx/Apache)
7. Set up SSL/TLS certificates
8. Run database migrations: `npm run migration:run`

### Health Monitoring

The application includes health check endpoints:

- Basic health: `GET /api/v1/`
- Docker health check: Built-in container health monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
