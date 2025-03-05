import React, { useState, useEffect } from 'react';
import { useOperationTracking } from '../../hooks/use-operation-tracking';
import { googleAdsApi } from '../../lib/google-ads-api';
import { Badge, Button, Card, Divider, Progress, Table, Tag, Typography, notification } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { RealTimeValidationPreview } from './real-time-validation-preview';

const { Title, Text, Paragraph } = Typography;

interface OperationRecoveryDashboardProps {
  operationType?: string;
  limit?: number;
  onRetry?: (operationId: string) => void;
}

export const OperationRecoveryDashboard: React.FC<OperationRecoveryDashboardProps> = ({
  operationType = 'campaign_clone',
  limit = 10,
  onRetry
}) => {
  const { 
    getOperations, 
    getOperation,
    getOperationLogs,
    retryOperation
  } = useOperationTracking();

  const [operations, setOperations] = useState<any[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [operationDetails, setOperationDetails] = useState<any | null>(null);
  const [operationLogs, setOperationLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Load operations on component mount
  useEffect(() => {
    loadOperations();
  }, [operationType, limit]);

  // Load operation details when selected
  useEffect(() => {
    if (selectedOperation) {
      loadOperationDetails(selectedOperation);
    } else {
      setOperationDetails(null);
      setOperationLogs([]);
    }
  }, [selectedOperation]);

  const loadOperations = () => {
    setIsLoading(true);
    try {
      const ops = getOperations({
        type: operationType,
        limit,
        includeCompleted: true,
        sortBy: 'createdAt',
        sortDirection: 'desc'
      });
      setOperations(ops);
    } catch (error) {
      console.error('Error loading operations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOperationDetails = (operationId: string) => {
    setIsLoading(true);
    try {
      const details = getOperation(operationId);
      setOperationDetails(details);
      
      const logs = getOperationLogs(operationId);
      setOperationLogs(logs);
    } catch (error) {
      console.error(`Error loading details for operation ${operationId}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryOperation = async (operationId: string, chunkSize?: number) => {
    setIsRetrying(true);
    try {
      if (onRetry) {
        // Use the parent component's retry handler if provided
        onRetry(operationId);
      } else {
        // Otherwise use the default retry behavior
        await retryFailedCampaigns(operationId, chunkSize);
      }
    } catch (error) {
      console.error(`Error retrying operation ${operationId}:`, error);
    } finally {
      setIsRetrying(false);
      // Refresh data
      loadOperations();
      if (selectedOperation === operationId) {
        loadOperationDetails(operationId);
      }
    }
  };

  const retryFailedCampaigns = async (operationId: string, chunkSize: number = 3) => {
    const operation = getOperation(operationId);
    if (!operation) return;

    // For bulk campaign operations, we need to extract the failed campaigns and retry them
    if (operation.type === 'campaign_clone' || operation.type === 'bulk_campaign_clone') {
      const customerId = operation.metadata?.customerId;
      const config = operation.metadata?.config;
      const failedCampaigns = operation.metadata?.failedCampaigns || [];
      
      if (!customerId || !config || failedCampaigns.length === 0) {
        console.error('Missing required data for retry');
        return;
      }

      // Create a new operation for the retry
      const retryOperationId = await retryOperation(
        operationId,
        'retry_campaign_clone',
        {
          customerId,
          campaignIds: failedCampaigns.map((fc: any) => fc.id),
          config,
          originalOperationId: operationId,
          retryCount: (operation.metadata?.retryCount || 0) + 1,
          chunkSize
        }
      );

      // Execute the bulk copy with the new operation ID
      await googleAdsApi.bulkCopyCampaigns(
        customerId,
        failedCampaigns.map((fc: any) => fc.id),
        {
          nameTemplate: config.name || config.nameTemplate || '{original}',
          matchType: config.matchType,
          createNegativeExactKeywords: config.createNegativeExactKeywords
        },
        retryOperationId,
        chunkSize // Use the specified chunk size
      );
    }
  };

  const handleFixProposed = async (fix: any) => {
    if (!fix || !fix.type) return;
    
    try {
      switch (fix.type) {
        case 'reduce_chunk_size':
          // Apply a reduced chunk size for retry
          notification.info({
            message: 'Applying fix',
            description: `Retrying with reduced chunk size (${fix.data.proposedChunkSize})`,
            duration: 5
          });
          
          await handleRetryOperation(fix.data.operationId, fix.data.proposedChunkSize);
          break;
          
        case 'retry_failed_campaigns':
          // Retry just the failed campaigns
          notification.info({
            message: 'Applying fix',
            description: `Retrying ${fix.data.failedCampaigns.length} failed campaigns`,
            duration: 5
          });
          
          await handleRetryOperation(fix.data.operationId, 3); // Use smaller chunk size
          break;
          
        default:
          console.warn('Unknown fix type', fix.type);
      }
    } catch (error) {
      console.error('Error applying fix:', error);
      notification.error({
        message: 'Fix failed',
        description: 'An error occurred while applying the fix.',
        duration: 5
      });
    }
  };

  // Render operation status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge status="success" text="Completed" />;
      case 'failed':
        return <Badge status="error" text="Failed" />;
      case 'in_progress':
        return <Badge status="processing" text="In Progress" />;
      case 'pending':
        return <Badge status="default" text="Pending" />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  // Calculate success rate for operations with success/failure data
  const getSuccessRate = (operation: any) => {
    if (!operation.metadata) return null;
    
    const completedCampaigns = operation.metadata.completedCampaigns?.length || 0;
    const failedCampaigns = operation.metadata.failedCampaigns?.length || 0;
    const totalCampaigns = completedCampaigns + failedCampaigns;
    
    if (totalCampaigns === 0) return null;
    
    const successRate = Math.round((completedCampaigns / totalCampaigns) * 100);
    return successRate;
  };

  // Generate columns for the operations table
  const columns = [
    {
      title: 'Time',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => {
        let displayText = text;
        switch (text) {
          case 'campaign_clone':
            displayText = 'Campaign Clone';
            break;
          case 'bulk_campaign_clone':
            displayText = 'Bulk Campaign Clone';
            break;
          case 'retry_campaign_clone':
            displayText = 'Retry Campaign Clone';
            break;
        }
        return <Tag color="blue">{displayText}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => renderStatusBadge(text)
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: any) => {
        const successRate = getSuccessRate(record);
        return (
          <div>
            <Progress 
              percent={progress} 
              size="small" 
              status={record.status === 'failed' ? 'exception' : undefined}
            />
            {successRate !== null && (
              <div style={{ fontSize: '12px' }}>
                Success rate: 
                <span style={{ 
                  color: successRate > 90 ? 'green' : successRate > 50 ? 'orange' : 'red',
                  marginLeft: '4px'
                }}>
                  {successRate}%
                </span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Campaigns',
      key: 'campaigns',
      render: (_, record: any) => {
        const totalCampaigns = record.metadata?.campaignIds?.length || 0;
        const completedCampaigns = record.metadata?.completedCampaigns?.length || 0;
        const failedCampaigns = record.metadata?.failedCampaigns?.length || 0;
        
        if (totalCampaigns === 0) return '-';
        
        return (
          <div>
            <div>Total: {totalCampaigns}</div>
            {completedCampaigns > 0 && (
              <div style={{ color: 'green' }}>
                <CheckCircleOutlined /> Success: {completedCampaigns}
              </div>
            )}
            {failedCampaigns > 0 && (
              <div style={{ color: 'red' }}>
                <CloseCircleOutlined /> Failed: {failedCampaigns}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => {
        const hasFailed = record.status === 'failed' || 
          (record.metadata?.failedCampaigns && record.metadata.failedCampaigns.length > 0);
          
        return (
          <div>
            <Button 
              type="link" 
              onClick={() => setSelectedOperation(record.id)}
            >
              Details
            </Button>
            {hasFailed && (
              <Button 
                type="link" 
                danger 
                onClick={() => handleRetryOperation(record.id)}
                loading={isRetrying && selectedOperation === record.id}
              >
                Retry Failed
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  const renderOperationDetails = () => {
    if (!operationDetails) return null;

    const { id, type, status, progress, createdAt, updatedAt, metadata } = operationDetails;
    const formattedType = type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    const errors = operationLogs
      .filter(log => log.level === 'error')
      .map(log => log.message);

    return (
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Operation Details</span>
            <Button 
              type="primary" 
              onClick={() => setSelectedOperation(null)}
              size="small"
            >
              Back to List
            </Button>
          </div>
        }
        loading={isLoading}
      >
        <div style={{ marginBottom: '20px' }}>
          <Title level={4}>
            {formattedType}{' '}
            {renderStatusBadge(status)}
          </Title>
          <Text type="secondary">ID: {id}</Text>
          <div style={{ margin: '10px 0' }}>
            <Text>Created: {new Date(createdAt).toLocaleString()}</Text>
            <br />
            <Text>Last Updated: {new Date(updatedAt).toLocaleString()}</Text>
          </div>
          
          <Divider />
          
          <div>
            <Title level={5}>Progress</Title>
            <Progress 
              percent={progress} 
              status={status === 'failed' ? 'exception' : undefined}
            />
          </div>
          
          <RealTimeValidationPreview 
            operationId={selectedOperation}
            onFixProposed={handleFixProposed}
          />
          
          {metadata && (
            <>
              <Divider />
              <Title level={5}>Operation Details</Title>
              <div style={{ marginBottom: '10px' }}>
                <Text strong>Account ID:</Text> {metadata.customerId}
              </div>
              
              {metadata.campaignIds && (
                <div style={{ marginBottom: '10px' }}>
                  <Text strong>Campaign Count:</Text> {metadata.campaignIds.length}
                </div>
              )}
              
              {metadata.config && (
                <div style={{ marginBottom: '10px' }}>
                  <Text strong>Configuration:</Text>
                  <ul>
                    <li>
                      <Text>Name Template:</Text> {metadata.config.name || metadata.config.nameTemplate || '{original}'}
                    </li>
                    <li>
                      <Text>Match Type:</Text> {metadata.config.matchType}
                    </li>
                    <li>
                      <Text>Create Negative Keywords:</Text> {metadata.config.createNegativeExactKeywords ? 'Yes' : 'No'}
                    </li>
                  </ul>
                </div>
              )}
              
              {metadata.failedCampaigns && metadata.failedCampaigns.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <Title level={5} style={{ color: 'red' }}>
                    <WarningOutlined /> Failed Campaigns ({metadata.failedCampaigns.length})
                  </Title>
                  <ul>
                    {metadata.failedCampaigns.map((campaign: any, index: number) => (
                      <li key={index}>
                        <Text>Campaign ID: {campaign.id}</Text>
                        <br />
                        <Text type="danger">Error: {campaign.error}</Text>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    type="primary" 
                    danger
                    icon={<SyncOutlined />}
                    onClick={() => handleRetryOperation(id)}
                    loading={isRetrying}
                    style={{ marginTop: '10px' }}
                  >
                    Retry Failed Campaigns
                  </Button>
                </div>
              )}
            </>
          )}
          
          {errors.length > 0 && (
            <>
              <Divider />
              <Title level={5} style={{ color: 'red' }}>Errors</Title>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>
                    <Text type="danger">{error}</Text>
                  </li>
                ))}
              </ul>
            </>
          )}
          
          <Divider />
          <Title level={5}>Operation Logs</Title>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {operationLogs.map((log, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '5px',
                  backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'transparent',
                  color: log.level === 'error' ? 'red' : log.level === 'warning' ? 'orange' : 'inherit'
                }}
              >
                <Text style={{ marginRight: '10px' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </Text>
                <Tag color={
                  log.level === 'error' ? 'red' : 
                  log.level === 'warning' ? 'orange' : 
                  log.level === 'info' ? 'blue' : 'default'
                }>
                  {log.level}
                </Tag>
                <Text>{log.message}</Text>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="operation-recovery-dashboard">
      <Title level={3}>Operations Dashboard</Title>
      <Paragraph>
        View and manage campaign clone operations. You can retry failed operations or view detailed logs.
      </Paragraph>
      
      {selectedOperation ? (
        renderOperationDetails()
      ) : (
        <Table 
          dataSource={operations} 
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => setSelectedOperation(record.id)
          })}
        />
      )}
      
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <Button 
          onClick={loadOperations} 
          icon={<SyncOutlined />}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};
