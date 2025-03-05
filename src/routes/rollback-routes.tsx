import React from 'react';
import { Route, Routes } from 'react-router-dom';
import RollbackMonitoringPage from '../pages/rollback-monitoring-page';

/**
 * Rollback-related routes for the application
 */
export const RollbackRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/monitoring" element={<RollbackMonitoringPage />} />
      {/* Additional rollback-related routes can be added here */}
    </Routes>
  );
};

export default RollbackRoutes;
