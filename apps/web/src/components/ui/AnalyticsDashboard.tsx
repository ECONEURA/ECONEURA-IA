import React from 'react';

interface AnalyticsDashboardProps {
  data?: any;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
  return (
    <div className="analytics-dashboard">
      <h2>Analytics Dashboard</h2>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Users</h3>
          <p>{data?.users || 0}</p>
        </div>
        <div className="metric-card">
          <h3>Revenue</h3>
          <p>${data?.revenue || 0}</p>
        </div>
        <div className="metric-card">
          <h3>Orders</h3>
          <p>{data?.orders || 0}</p>
        </div>
      </div>
    </div>
  );
};
