# Deployment Guide - SEM Ads Operations Tool

## Overview

This guide outlines the deployment process for the SEM Ads Operations Tool, including environment requirements, configuration steps, and verification procedures. Follow these instructions to successfully deploy the latest version with campaign clone operations and recovery capabilities.

## Prerequisites

- Node.js v18.x or higher
- NPM v9.x or higher
- Access to Google Ads API (with proper credentials)
- Sufficient API quota allocation for bulk operations

## Environment Variables

Ensure the following environment variables are configured in your deployment environment:

```
REACT_APP_GOOGLE_ADS_API_KEY=your_api_key
REACT_APP_GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id
REACT_APP_API_BASE_URL=your_api_base_url
REACT_APP_MAX_CONCURRENT_REQUESTS=5
REACT_APP_RATE_LIMIT_PER_MINUTE=3000
```

## Deployment Steps

### 1. Build the Application

```bash
# Install dependencies
npm install

# Build production bundle
npm run build
```

### 2. Configure Rate Limiting

The application includes enhanced rate limiting to maintain API compliance. Default settings:

- Maximum 5 concurrent requests
- 3000 requests per minute maximum (as per Google Ads API limits)
- 100ms minimum delay between requests
- 3 retry attempts for failed requests

To modify these settings, update the environment variables or the configuration in `src/lib/rate-limiter.ts`.

### 3. Deploy the Build

#### Option A: Static Hosting (Recommended)

```bash
# Deploy to static hosting service (example with AWS S3)
aws s3 sync build/ s3://your-bucket-name --delete
```

#### Option B: Server Deployment

```bash
# Copy build files to server
scp -r build/* user@your-server:/path/to/web/root
```

### 4. Verify Deployment

After deployment, verify the following functionality:

1. User authentication
2. Campaign listing and selection
3. Campaign clone operations
4. Operations dashboard functionality
5. Retry capabilities for failed operations

## Rollback Procedure

If issues are encountered after deployment:

```bash
# Revert to previous version
aws s3 sync s3://your-backup-bucket/previous-version/ s3://your-bucket-name --delete
```

Or restore server files from backup.

## Monitoring

Monitor the following metrics after deployment:

1. API rate limit utilization
2. Operation success/failure rates
3. Average operation completion time
4. Error rates by operation type

## Troubleshooting

### Common Issues and Solutions

1. **Rate Limit Exceeded**
   - Check current quota allocation in Google Ads API console
   - Reduce `REACT_APP_MAX_CONCURRENT_REQUESTS` temporarily
   - Implement additional delays between operation batches

2. **Authentication Failures**
   - Verify OAuth credentials are current
   - Check token refresh mechanism is functioning
   - Ensure proper scopes are configured

3. **Operation Recovery Issues**
   - Check browser local storage availability and permissions
   - Verify operation logs are being stored correctly
   - Inspect failed operation metadata for completeness

## Performance Optimization

For large customer accounts:

1. Increase chunking size for operations gradually based on performance
2. Monitor and adjust rate limits based on actual usage patterns
3. Consider implementing server-side processing for very large operations

## Security Considerations

1. Ensure API credentials are properly secured
2. Implement proper user role restrictions
3. Use HTTPS for all API communications
4. Regularly audit access logs

---

Last Updated: March 4, 2025
