import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Alert, Button, Space, Popconfirm } from 'antd';
import { SyncOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useOperationTracking } from '../../hooks/use-operation-tracking';
import { googleAdsApi } from '../../lib/google-ads-api';

const { Title, Text } = Typography;

interface RealTimeValidationPreviewProps {
  operationId: string | null;
  onFixProposed?: (fix: { 
    type: string; 
    data: any; 
    description: string; 
  }) => void;
}

export const RealTimeValidationPreview: React.FC<RealTimeValidationPreviewProps> = ({
  operationId,
  onFixProposed
}) => {
  const { getOperation, getOperationLogs } = useOperationTracking();
  
  const [operation, setOperation] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [validationIssues, setValidationIssues] = useState<any[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  
  // Load operation data when operationId changes
  useEffect(() => {
    if (!operationId) {
      setOperation(null);
      setLogs([]);
      setValidationIssues([]);
      setValidationComplete(false);
      return;
    }
    
    const op = getOperation(operationId);
    setOperation(op || null);
    
    const opLogs = getOperationLogs(operationId);
    setLogs(opLogs || []);
    
    // Reset validation state
    setValidationIssues([]);
    setValidationComplete(false);
  }, [operationId, getOperation, getOperationLogs]);
  
  // Perform validation when operation data changes
  const validateOperation = async () => {
    if (!operation) return;
    
    setIsValidating(true);
    setValidationIssues([]);
    
    try {
      // Check for specific validation issues based on operation type
      if (operation.type === 'campaign_clone' || operation.type === 'bulk_campaign_clone') {
        const issues = [];
        
        // 1. Check for rate limiting issues
        const rateLimitLogs = logs.filter(log => 
          log.level === 'error' && 
          (log.message.includes('rate limit') || log.message.includes('quota'))
        );
        
        if (rateLimitLogs.length > 0) {
          issues.push({
            key: 'rate_limit',
            type: 'API Limit',
            description: 'Operation encountered rate limiting issues',
            severity: 'high',
            resolution: 'Suggest reducing chunk size and implementing progressive retry',
            autoFixable: true,
            fix: {
              type: 'reduce_chunk_size',
              data: {
                operationId: operation.id,
                originalChunkSize: operation.metadata?.chunkSize || 5,
                proposedChunkSize: Math.max(1, Math.floor((operation.metadata?.chunkSize || 5) / 2))
              },
              description: 'Reduce chunk size and retry with progressive delay'
            }
          });
        }
        
        // 2. Check for incomplete operations
        if (operation.status === 'failed' && 
            operation.metadata?.failedCampaigns && 
            operation.metadata.failedCampaigns.length > 0) {
          issues.push({
            key: 'incomplete',
            type: 'Incomplete',
            description: `${operation.metadata.failedCampaigns.length} campaigns failed to process`,
            severity: 'medium',
            resolution: 'Retry failed campaigns with smaller chunk size',
            autoFixable: true,
            fix: {
              type: 'retry_failed_campaigns',
              data: {
                operationId: operation.id,
                failedCampaigns: operation.metadata.failedCampaigns.map((c: any) => c.id)
              },
              description: 'Retry failed campaigns with reduced chunk size'
            }
          });
        }
        
        // 3. Check for potential negative keyword issues
        if (operation.metadata?.config?.createNegativeExactKeywords && 
            (operation.status === 'completed' || operation.progress >= 50)) {
          const negKeywordLogs = logs.filter(log => 
            log.message.includes('negative') && log.message.includes('keyword')
          );
          
          if (negKeywordLogs.length === 0) {
            issues.push({
              key: 'neg_keywords',
              type: 'Configuration',
              description: 'Negative keywords may not have been created properly',
              severity: 'low',
              resolution: 'Verify negative keyword creation status',
              autoFixable: false
            });
          }
        }
        
        // 4. Check for naming issues
        if (operation.status === 'completed' && operation.metadata?.completedCampaigns) {
          const nameTemplate = operation.metadata.config?.nameTemplate || operation.metadata.config?.name;
          if (nameTemplate && nameTemplate === '{original}') {
            issues.push({
              key: 'naming',
              type: 'Configuration',
              description: 'Default naming template used which might lead to confusion',
              severity: 'low',
              resolution: 'Consider using a more descriptive naming convention',
              autoFixable: false
            });
          }
        }
        
        setValidationIssues(issues);
      }
    } catch (error) {
      console.error('Error validating operation:', error);
    } finally {
      setIsValidating(false);
      setValidationComplete(true);
    }
  };
  
  // Auto-validate when operation data is loaded
  useEffect(() => {
    if (operation && !validationComplete && !isValidating) {
      validateOperation();
    }
  }, [operation, validationComplete, isValidating]);
  
  const handleFixIssue = (issue: any) => {
    if (onFixProposed && issue.autoFixable && issue.fix) {
      onFixProposed(issue.fix);
    }
  };
  
  const renderSeverityTag = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Tag color="red">High</Tag>;
      case 'medium':
        return <Tag color="orange">Medium</Tag>;
      case 'low':
        return <Tag color="blue">Low</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };
  
  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => renderSeverityTag(severity)
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Resolution',
      dataIndex: 'resolution',
      key: 'resolution',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.autoFixable ? (
            <Popconfirm
              title="Apply this fix?"
              description={record.fix.description}
              onConfirm={() => handleFixIssue(record)}
              okText="Apply"
              cancelText="Cancel"
            >
              <Button type="primary" size="small">
                Auto-Fix
              </Button>
            </Popconfirm>
          ) : (
            <Button type="default" size="small" disabled>
              Manual Fix Required
            </Button>
          )}
        </Space>
      )
    }
  ];
  
  if (!operation) {
    return null;
  }
  
  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5}>
            <InfoCircleOutlined /> Operation Validation
          </Title>
          <Button 
            icon={<SyncOutlined />} 
            size="small" 
            onClick={validateOperation}
            loading={isValidating}
          >
            Refresh
          </Button>
        </div>
      }
      size="small"
      style={{ marginTop: '20px' }}
    >
      {isValidating ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <SyncOutlined spin style={{ fontSize: '24px' }} />
          <div style={{ marginTop: '10px' }}>Validating operation...</div>
        </div>
      ) : validationIssues.length > 0 ? (
        <>
          <Alert
            message={`${validationIssues.length} issue${validationIssues.length > 1 ? 's' : ''} detected`}
            type="warning"
            showIcon
            style={{ marginBottom: '15px' }}
          />
          <Table 
            dataSource={validationIssues} 
            columns={columns} 
            pagination={false}
            size="small"
            rowKey="key"
          />
        </>
      ) : (
        <Alert
          message="No issues detected"
          description="The operation appears to be configured correctly. No validation issues were found."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      )}
    </Card>
  );
};
