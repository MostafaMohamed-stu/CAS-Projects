# Configuration Guide

## Simple Configuration Setup

This project uses a simple configuration approach instead of environment variables.

### How to Configure

1. **Open** `client/src/config/apiConfig.js`
2. **Change** `CURRENT_ENV` from `'development'` to `'production'` when deploying
3. **Update** the `API_BASE_URL` in the production section to your actual production URL

### Example

```javascript
// For development
const CURRENT_ENV = 'development';

// For production
const CURRENT_ENV = 'production';
```

### Configuration Options

- **API_BASE_URL**: Your backend API URL
- **API_TIMEOUT**: Request timeout in milliseconds
- **DEBUG**: Enable/disable console logging

### Security

- Console logs are automatically disabled in production mode
- No sensitive data is logged
- Easy to switch between environments

This approach is simpler and more reliable than environment variables!