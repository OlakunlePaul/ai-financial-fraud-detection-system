# Contributing Guide

Thank you for your interest in contributing to the AI Financial Fraud Detection Platform!

## Development Setup

1. Follow the [Quick Start Guide](./QUICKSTART.md)
2. Ensure all services are running
3. Run tests before making changes

## Code Style

### TypeScript/JavaScript
- Use TypeScript for type safety
- Follow ESLint rules
- Use meaningful variable names
- Add JSDoc comments for complex functions

### Python
- Follow PEP 8 style guide
- Use type hints where possible
- Add docstrings to functions

## Project Structure

```
.
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── contexts/     # React contexts
├── backend/          # Node.js + Express backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── services/     # Business logic
│   │   └── db/           # Database utilities
└── ai-service/       # Python Flask AI service
    └── app.py        # Main Flask application
```

## Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push and create a pull request

## Testing

### Backend
```bash
cd backend
npm test  # When tests are added
```

### Frontend
```bash
cd frontend
npm test  # When tests are added
```

### AI Service
```bash
cd ai-service
python -m pytest  # When tests are added
```

## API Guidelines

- Use RESTful conventions
- Return consistent JSON responses
- Include proper error handling
- Document endpoints

## Database Changes

- Create migration files for schema changes
- Never modify existing migrations
- Test migrations on a copy of production data

## Security

- Never commit secrets or API keys
- Use environment variables
- Validate all user inputs
- Follow OWASP guidelines

## Pull Request Process

1. Update README if needed
2. Add tests for new features
3. Ensure all checks pass
4. Request review from maintainers
5. Address feedback

## Questions?

Open an issue for questions or discussions!

