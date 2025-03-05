# Monitoring Dashboard Components

This directory contains components for the Operations Monitoring Dashboard, which provides visibility into API usage, operation metrics, and performance insights for the Google Ads Automation system.

## Components

### Dashboard Container
- **operations-monitoring-dashboard.tsx**: Main container component that organizes the dashboard layout and manages data flow

### Metrics Cards
- **api-usage-card.tsx**: Displays API usage metrics, rate limit events, and request volume
- **operation-metrics-card.tsx**: Shows operation success rates, error distributions, and counts
- **performance-insights-card.tsx**: Provides performance trends, insights, and recommendations

### UI Components
- **metrics-timeframe-selector.tsx**: Toggle control for switching between different time ranges

## Features

- Real-time metrics visualization
- Interactive charts and graphs
- Timeframe selection (24 hours, 7 days, 30 days, etc.)
- Operation type filtering
- Error rate analysis
- Performance trends and insights

## Implementation Details

The dashboard is implemented with:
- React functional components with hooks
- TypeScript for type safety
- Material-UI for consistent UI components
- Recharts for data visualization
- Error boundaries for resilient UI
- Responsive design for all screen sizes

## Usage

The monitoring dashboard can be accessed through the main application navigation. It provides a comprehensive view of system operations, helping administrators identify potential issues, optimize performance, and understand usage patterns.

## Testing

Unit tests are available in the `__tests__` directory to ensure the components render correctly and respond to user interactions appropriately.
