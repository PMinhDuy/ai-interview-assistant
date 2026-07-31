'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  Typography,
  Progress,
  Tag,
  Button,
  Collapse,
  Space,
  Timeline,
  Spin,
  Alert,
  Divider,
} from 'antd';
import {
  TrophyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { evaluationsService } from '../../../../../services/evaluations.service';
import { interviewsService } from '../../../../../services/interviews.service';

const { Title, Text, Paragraph } = Typography;

export default function SessionReportPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const router = useRouter();

  // Fetch Report
  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: ['session-report', sessionId],
    queryFn: () => evaluationsService.getSessionReport(sessionId),
  });

  // Fetch Session details
  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => interviewsService.getSession(sessionId),
  });

  // Fetch Question Evaluations
  const { data: evaluations = [] } = useQuery({
    queryKey: ['session-evaluations', sessionId],
    queryFn: () => evaluationsService.getEvaluationsBySession(sessionId),
  });

  if (isLoadingReport) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Generating Session Performance Report..." />
      </div>
    );
  }

  if (!report) {
    return (
      <Card bordered={false}>
        <Alert
          type="warning"
          message="Report Not Available"
          description="The evaluation report for this session has not been generated yet or session is incomplete."
          action={
            <Button type="primary" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          }
        />
      </Card>
    );
  }

  const scores = report.overallScore;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space size={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Session Performance Report
            </Title>
            <Text type="secondary">Comprehensive AI evaluation breakdown & learning roadmap</Text>
          </div>
        </Space>
      </div>

      {/* Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ textAlign: 'center', height: '100%' }}>
            <TrophyOutlined style={{ fontSize: 42, color: '#faad14', marginBottom: 12 }} />
            <Title level={1} style={{ margin: 0, color: '#1677ff' }}>
              {scores?.overall ?? 0}
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Overall Score (Out of 100)
            </Text>

            <div style={{ marginTop: 16 }}>
              <Space>
                <Tag color="blue">{session?.type || 'TECHNICAL'}</Tag>
                <Tag color="orange">{session?.difficulty || 'MEDIUM'}</Tag>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="5-Dimensional Performance Breakdown" bordered={false} style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <div>
                <Text>Technical Correctness ({scores?.technical ?? 0}/100)</Text>
                <Progress percent={scores?.technical ?? 0} strokeColor="#1677ff" />
              </div>
              <div>
                <Text>Communication & Structure ({scores?.communication ?? 0}/100)</Text>
                <Progress percent={scores?.communication ?? 0} strokeColor="#52c41a" />
              </div>
              <div>
                <Text>Problem Solving Approach ({scores?.problemSolving ?? 0}/100)</Text>
                <Progress percent={scores?.problemSolving ?? 0} strokeColor="#faad14" />
              </div>
              <div>
                <Text>Depth & Knowledge ({scores?.depth ?? 0}/100)</Text>
                <Progress percent={scores?.depth ?? 0} strokeColor="#722ed1" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Strengths & Improvements */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Key Strengths" bordered={false} style={{ height: '100%' }}>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {report.strengths?.map((str, idx) => (
                <li key={idx} style={{ marginBottom: 8, color: '#2b7135' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  {str}
                </li>
              ))}
            </ul>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Areas to Improve" bordered={false} style={{ height: '100%' }}>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {report.areasToImprove?.map((area, idx) => (
                <li key={idx} style={{ marginBottom: 8, color: '#b93815' }}>
                  <ExclamationCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                  {area}
                </li>
              ))}
            </ul>
          </Card>
        </Col>
      </Row>

      {/* Actionable Learning Roadmap */}
      {report.learningRoadmap && report.learningRoadmap.length > 0 && (
        <Card
          title={
            <Space>
              <BookOutlined style={{ color: '#1677ff' }} />
              <span>Actionable Learning Roadmap</span>
            </Space>
          }
          bordered={false}
          style={{ marginBottom: 24 }}
        >
          <Timeline
            items={report.learningRoadmap.map((item) => ({
              color: 'blue',
              children: (
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 16 }}>
                    Step {item.step}: {item.topic}
                  </Text>
                  <Paragraph style={{ margin: '4px 0 0 0' }}>{item.action}</Paragraph>
                  {item.resource && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Recommended Resource: {item.resource}
                    </Text>
                  )}
                </div>
              ),
            }))}
          />
        </Card>
      )}

      {/* Per-Question Accordion Breakdown */}
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>Per-Question Evaluation Breakdown</span>
          </Space>
        }
        bordered={false}
      >
        <Collapse
          items={evaluations.map((evalItem, index) => ({
            key: evalItem.id,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>
                  Q{index + 1}: {evalItem.question?.content || `Question #${index + 1}`}
                </Text>
                <Tag color="green">{evalItem.scores.overall}/100</Tag>
              </div>
            ),
            children: (
              <div>
                <Paragraph strong>Your Answer:</Paragraph>
                <Paragraph style={{ background: '#f5f7fa', padding: 12, borderRadius: 8 }}>
                  {evalItem.userAnswer}
                </Paragraph>

                <Divider style={{ margin: '12px 0' }} />

                <Paragraph strong>AI Feedback:</Paragraph>
                <Paragraph>{evalItem.feedback}</Paragraph>

                {evalItem.suggestedAnswer && (
                  <div>
                    <Paragraph strong style={{ color: '#1677ff' }}>
                      Suggested Model Answer:
                    </Paragraph>
                    <Paragraph style={{ background: '#e6f4ff', padding: 12, borderRadius: 8, fontFamily: 'monospace' }}>
                      {evalItem.suggestedAnswer}
                    </Paragraph>
                  </div>
                )}
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
}
