import React from 'react';
import { Card, Tabs, Typography } from 'antd';
import { HistoryOutlined, ExceptionOutlined, ToolOutlined } from '@ant-design/icons';
import { OperationRecoveryDashboard } from '../../components/operations/operation-recovery-dashboard';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

export const OperationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'campaign-clone';

  const handleTabChange = (key: string) => {
    navigate(`/operations?tab=${key}`);
  };

  return (
    <div className="operation-dashboard-page">
      <Card>
        <Title level={2}>
          <ToolOutlined /> Operations Dashboard
        </Title>
        <Paragraph>
          Monitor, manage, and recover operations in your Google Ads campaigns. 
          This dashboard provides visibility into operation history, success rates, 
          and allows you to retry failed operations.
        </Paragraph>

        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          type="card"
          style={{ marginTop: '20px' }}
        >
          <TabPane 
            tab={
              <span>
                <HistoryOutlined /> Campaign Clone Operations
              </span>
            } 
            key="campaign-clone"
          >
            <OperationRecoveryDashboard 
              operationType="campaign_clone"
              limit={20}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                <ExceptionOutlined /> Failed Operations
              </span>
            } 
            key="failed"
          >
            {/* This would be filtered to show only failed operations across all types */}
            <OperationRecoveryDashboard 
              limit={20}
              // We could add a custom filter to only show failed operations
              // This would be handled in the component
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default OperationDashboardPage;
