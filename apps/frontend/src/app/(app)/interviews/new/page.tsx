'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card,
  Steps,
  Button,
  Radio,
  Select,
  Typography,
  Space,
  Row,
  Col,
  Alert,
  message,
  InputNumber,
  Tag,
} from 'antd';
import {
  CodeOutlined,
  SolutionOutlined,
  ClusterOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  RightOutlined,
  LeftOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import {
  interviewsService,
  type InterviewType,
  type Difficulty,
} from '../../../../services/interviews.service';
import { filesService } from '../../../../services/files.service';

const { Title, Text, Paragraph } = Typography;

export default function CreateInterviewPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Form State
  const [type, setType] = useState<InterviewType>('TECHNICAL');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [selectedJdId, setSelectedJdId] = useState<string | undefined>(undefined);

  // Fetch user's uploaded Resumes and JDs for Step 3
  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: filesService.getResumes,
  });

  const { data: jds = [] } = useQuery({
    queryKey: ['job-descriptions'],
    queryFn: filesService.getJobDescriptions,
  });

  // Mutation to create session
  const createSessionMutation = useMutation({
    mutationFn: interviewsService.createSession,
    onSuccess: (session) => {
      message.success('Interview session created!');
      router.push(`/interviews/${session.id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create interview session';
      message.error(msg);
    },
  });

  const interviewTypeOptions = [
    {
      key: 'TECHNICAL' as InterviewType,
      title: 'Technical Core',
      description: 'Language, framework, and core computer science concepts',
      icon: <CodeOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
    },
    {
      key: 'BEHAVIORAL' as InterviewType,
      title: 'Behavioral & HR',
      description: 'STAR method, leadership, communication, and situational scenarios',
      icon: <SolutionOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    },
    {
      key: 'SYSTEM_DESIGN' as InterviewType,
      title: 'System Design',
      description: 'Scalability, microservices, database choice, and architecture',
      icon: <ClusterOutlined style={{ fontSize: 24, color: '#faad14' }} />,
    },
    {
      key: 'CODING' as InterviewType,
      title: 'Coding & Algorithms',
      description: 'Data structures, complexity analysis, and problem solving',
      icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
    },
    {
      key: 'MIXED' as InterviewType,
      title: 'Comprehensive Mixed',
      description: 'Balanced mix of technical, coding, and behavioral questions',
      icon: <AppstoreOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
    },
  ];

  const steps = [
    { title: 'Interview Type' },
    { title: 'Difficulty & Count' },
    { title: 'Resume & JD Context' },
    { title: 'Review & Start' },
  ];

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Create New Interview Session
        </Title>
        <Text type="secondary">Customize your mock interview criteria for personalized AI feedback</Text>
      </div>

      <Card bordered={false} style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} />
      </Card>

      <Card bordered={false}>
        {/* STEP 1: Select Type */}
        {currentStep === 0 && (
          <div>
            <Title level={4}>Select Interview Domain & Type</Title>
            <Paragraph type="secondary">
              Choose the primary focus area for your mock interview. AI will generate tailored questions.
            </Paragraph>

            <Row gutter={[16, 16]}>
              {interviewTypeOptions.map((opt) => {
                const isSelected = type === opt.key;
                return (
                  <Col xs={24} sm={12} key={opt.key}>
                    <Card
                      hoverable
                      onClick={() => setType(opt.key)}
                      style={{
                        borderColor: isSelected ? '#1677ff' : '#e5e7eb',
                        borderWidth: isSelected ? 2 : 1,
                        background: isSelected ? '#e6f4ff' : '#ffffff',
                      }}
                    >
                      <Space align="start" size={16}>
                        {opt.icon}
                        <div>
                          <Text strong style={{ fontSize: 16, display: 'block' }}>
                            {opt.title}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            {opt.description}
                          </Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}

        {/* STEP 2: Select Difficulty & Question Count */}
        {currentStep === 1 && (
          <div>
            <Title level={4}>Set Difficulty & Question Count</Title>
            <Paragraph type="secondary">Adjust the challenge level and session length to match your goals.</Paragraph>

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Difficulty Level:
              </Text>
              <Radio.Group
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                size="large"
                buttonStyle="solid"
              >
                <Radio.Button value="EASY">Easy (Junior / Fundamentals)</Radio.Button>
                <Radio.Button value="MEDIUM">Medium (Mid-Level / Standard)</Radio.Button>
                <Radio.Button value="HARD">Hard (Senior / Advanced)</Radio.Button>
              </Radio.Group>
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Total Questions in Session:
              </Text>
              <InputNumber
                min={3}
                max={15}
                value={totalQuestions}
                onChange={(val) => setTotalQuestions(val || 5)}
                size="large"
                addonAfter="questions"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Link Resume & JD */}
        {currentStep === 2 && (
          <div>
            <Title level={4}>Attach Resume & Job Description (Optional)</Title>
            <Paragraph type="secondary">
              Linking your resume or target JD enables RAG retrieval to ask questions directly matching your profile.
            </Paragraph>

            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Candidate Resume:
              </Text>
              <Select
                placeholder="Select an uploaded resume (Optional)"
                style={{ width: '100%' }}
                size="large"
                allowClear
                value={selectedResumeId}
                onChange={(val) => setSelectedResumeId(val)}
                options={resumes.map((r) => ({ label: r.originalName, value: r.id }))}
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Target Job Description:
              </Text>
              <Select
                placeholder="Select a target Job Description (Optional)"
                style={{ width: '100%' }}
                size="large"
                allowClear
                value={selectedJdId}
                onChange={(val) => setSelectedJdId(val)}
                options={jds.map((j) => ({ label: j.originalName, value: j.id }))}
              />
            </div>

            {resumes.length === 0 && jds.length === 0 && (
              <Alert
                type="info"
                message="No uploaded files found"
                description="You can proceed without files, or upload documents first on the Resumes & JDs page."
                style={{ marginTop: 20 }}
              />
            )}
          </div>
        )}

        {/* STEP 4: Review & Start */}
        {currentStep === 3 && (
          <div>
            <Title level={4}>Review Session Settings</Title>
            <Paragraph type="secondary">Confirm your configuration before starting your AI interview.</Paragraph>

            <Card style={{ background: '#f5f7fa', marginBottom: 20 }}>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Text type="secondary">Interview Focus:</Text>
                </Col>
                <Col span={12}>
                  <Tag color="blue">{type}</Tag>
                </Col>

                <Col span={12}>
                  <Text type="secondary">Difficulty Level:</Text>
                </Col>
                <Col span={12}>
                  <Tag color={difficulty === 'HARD' ? 'red' : difficulty === 'MEDIUM' ? 'orange' : 'green'}>
                    {difficulty}
                  </Tag>
                </Col>

                <Col span={12}>
                  <Text type="secondary">Total Questions:</Text>
                </Col>
                <Col span={12}>
                  <Text strong>{totalQuestions} Questions</Text>
                </Col>

                <Col span={12}>
                  <Text type="secondary">Resume Linked:</Text>
                </Col>
                <Col span={12}>
                  <Text>{resumes.find((r) => r.id === selectedResumeId)?.originalName || 'None'}</Text>
                </Col>

                <Col span={12}>
                  <Text type="secondary">Job Description Linked:</Text>
                </Col>
                <Col span={12}>
                  <Text>{jds.find((j) => j.id === selectedJdId)?.originalName || 'None'}</Text>
                </Col>
              </Row>
            </Card>

            <Alert
              type="success"
              showIcon
              message="Ready to start!"
              description="Clicking 'Start Interview' will generate your first batch of AI questions."
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
          <Button disabled={currentStep === 0} onClick={() => setCurrentStep((prev) => prev - 1)} icon={<LeftOutlined />}>
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button type="primary" onClick={() => setCurrentStep((prev) => prev + 1)}>
              Next <RightOutlined />
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              icon={<CheckOutlined />}
              loading={createSessionMutation.isPending}
              onClick={() =>
                createSessionMutation.mutate({
                  type,
                  difficulty,
                  totalQuestions,
                  resumeId: selectedResumeId,
                  jobDescriptionId: selectedJdId,
                })
              }
            >
              Start Interview
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
