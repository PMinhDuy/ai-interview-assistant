'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Typography,
  Button,
  Input,
  Progress,
  Tag,
  Space,
  Drawer,
  Alert,
  Modal,
  Spin,
  message,
  Collapse,
  Divider,
} from 'antd';
import {
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
  TrophyOutlined,
  ArrowRightOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import {
  interviewsService,
  type SubmitAnswerResponse,
} from '../../../../services/interviews.service';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function ActiveInterviewScreen() {
  const params = useParams();
  const sessionId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [answerText, setAnswerText] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<SubmitAnswerResponse | null>(null);
  const [isEvaluationDrawerOpen, setIsEvaluationDrawerOpen] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);

  // Fetch Session data
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => interviewsService.getSession(sessionId),
  });

  // Fetch Current Question
  const { data: currentQuestionData, isLoading: isLoadingQuestion, refetch: refetchQuestion } = useQuery({
    queryKey: ['current-question', sessionId],
    queryFn: () => interviewsService.getCurrentQuestion(sessionId),
  });

  // Submit Answer Mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      const qId = currentQuestionData?.question?.id;
      if (!qId || !answerText.trim()) return;
      return interviewsService.submitAnswer(sessionId, qId, answerText.trim());
    },
    onSuccess: (res) => {
      if (!res) return;
      setEvaluationResult(res);
      setIsEvaluationDrawerOpen(true);
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });

      if (res.next?.completed) {
        setIsCompletedModalOpen(true);
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to submit answer';
      message.error(msg);
    },
  });

  const handleNextQuestion = () => {
    setIsEvaluationDrawerOpen(false);
    setEvaluationResult(null);
    setAnswerText('');
    refetchQuestion();
  };

  if (isLoadingSession || isLoadingQuestion) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading interview question..." />
      </div>
    );
  }

  const question = currentQuestionData?.question;
  const currentIdx = (currentQuestionData?.currentIndex ?? session?.currentQuestionIndex ?? 0) + 1;
  const total = session?.totalQuestions || 5;
  const progressPercent = Math.round((currentIdx / total) * 100);

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      {/* Header & Progress */}
      <Card bordered={false} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Space size={12}>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              {session?.type} INTERVIEW
            </Tag>
            <Tag
              color={session?.difficulty === 'HARD' ? 'red' : session?.difficulty === 'MEDIUM' ? 'orange' : 'green'}
              style={{ fontSize: 14, padding: '4px 12px' }}
            >
              {session?.difficulty}
            </Tag>
          </Space>

          <Text strong style={{ fontSize: 16 }}>
            Question {currentIdx} of {total}
          </Text>
        </div>

        <Progress percent={progressPercent} status="active" strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
      </Card>

      {/* Main Question Card */}
      {question ? (
        <Card bordered={false} style={{ marginBottom: 20 }}>
          <Space align="start" size={12} style={{ marginBottom: 16 }}>
            <QuestionCircleOutlined style={{ fontSize: 24, color: '#1677ff', marginTop: 4 }} />
            <div>
              <Tag color="purple">{question.category || 'General'}</Tag>
              <Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
                {question.content}
              </Title>
            </div>
          </Space>

          {question.hints && question.hints.length > 0 && (
            <Alert
              message="Interview Hint"
              description={
                <ul>
                  {question.hints.map((hint: string, i: number) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              }
              type="info"
              showIcon
              icon={<BulbOutlined />}
              style={{ marginBottom: 20 }}
            />
          )}

          <Divider style={{ margin: '16px 0' }} />

          {/* Answer Input */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
              Your Answer:
            </Text>
            <TextArea
              rows={8}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your response clearly. Be structured and detailed..."
              size="large"
            />
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {answerText.trim().split(/\s+/).filter(Boolean).length} words | {answerText.length} characters
              </Text>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              loading={submitAnswerMutation.isPending}
              disabled={!answerText.trim()}
              onClick={() => submitAnswerMutation.mutate()}
            >
              Submit Answer & Evaluate
            </Button>
          </div>
        </Card>
      ) : (
        <Card bordered={false}>
          <Alert
            type="success"
            message="Session Completed!"
            description="You have completed all questions in this session."
            action={
              <Button type="primary" onClick={() => router.push(`/interviews/${sessionId}/report`)}>
                View Session Report
              </Button>
            }
          />
        </Card>
      )}

      {/* Slide-in Evaluation Panel */}
      <Drawer
        title="AI Answer Evaluation"
        placement="right"
        width={640}
        onClose={() => setIsEvaluationDrawerOpen(false)}
        open={isEvaluationDrawerOpen}
        maskClosable={false}
      >
        {evaluationResult?.evaluation && (
          <div>
            {/* Overall Score Badge */}
            <Card style={{ background: '#f6ffed', borderColor: '#b7eb8f', textAlign: 'center', marginBottom: 20 }}>
              <TrophyOutlined style={{ fontSize: 36, color: '#52c41a', marginBottom: 8 }} />
              <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                {evaluationResult.evaluation.scores.overall} / 100
              </Title>
              <Text type="secondary">Overall Performance Score</Text>
            </Card>

            {/* Score Breakdown Bars */}
            <Title level={4}>Score Breakdown</Title>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
              <div>
                <Text>Technical Correctness: {evaluationResult.evaluation.scores.technical}/100</Text>
                <Progress percent={evaluationResult.evaluation.scores.technical} strokeColor="#1677ff" />
              </div>
              <div>
                <Text>Communication & Clarity: {evaluationResult.evaluation.scores.communication}/100</Text>
                <Progress percent={evaluationResult.evaluation.scores.communication} strokeColor="#52c41a" />
              </div>
              <div>
                <Text>Problem Solving Approach: {evaluationResult.evaluation.scores.problemSolving}/100</Text>
                <Progress percent={evaluationResult.evaluation.scores.problemSolving} strokeColor="#faad14" />
              </div>
              <div>
                <Text>Depth & Detail: {evaluationResult.evaluation.scores.depth}/100</Text>
                <Progress percent={evaluationResult.evaluation.scores.depth} strokeColor="#722ed1" />
              </div>
            </Space>

            {/* Strengths */}
            <Title level={4}>Key Strengths</Title>
            <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
              {evaluationResult.evaluation.strengths.map((str, idx) => (
                <li key={idx} style={{ marginBottom: 6, color: '#2b7135' }}>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  {str}
                </li>
              ))}
            </ul>

            {/* Areas to Improve */}
            <Title level={4}>Areas for Improvement</Title>
            <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
              {evaluationResult.evaluation.improvements.map((imp, idx) => (
                <li key={idx} style={{ marginBottom: 6, color: '#b93815' }}>
                  <ExclamationCircleOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
                  {imp}
                </li>
              ))}
            </ul>

            {/* Feedback */}
            <Title level={4}>Feedback & Analysis</Title>
            <Paragraph style={{ background: '#f5f7fa', padding: 12, borderRadius: 8 }}>
              {evaluationResult.evaluation.feedback}
            </Paragraph>

            {/* Model Answer */}
            {evaluationResult.evaluation.suggestedAnswer && (
              <Collapse
                style={{ marginBottom: 24 }}
                items={[
                  {
                    key: '1',
                    label: 'Suggested Model Answer',
                    children: (
                      <Paragraph style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                        {evaluationResult.evaluation.suggestedAnswer}
                      </Paragraph>
                    ),
                  },
                ]}
              />
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              {evaluationResult.next?.completed ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<TrophyOutlined />}
                  onClick={() => router.push(`/interviews/${sessionId}/report`)}
                >
                  View Session Report
                </Button>
              ) : (
                <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={handleNextQuestion}>
                  Proceed to Next Question
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Completion Modal */}
      <Modal
        title="🎉 Interview Session Completed!"
        open={isCompletedModalOpen}
        onOk={() => router.push(`/interviews/${sessionId}/report`)}
        okText="View Full Session Report"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <Paragraph>
          Congratulations! You have answered all questions in this session. Click below to view your aggregated performance scores, strengths, and personalized learning roadmap.
        </Paragraph>
      </Modal>
    </div>
  );
}
