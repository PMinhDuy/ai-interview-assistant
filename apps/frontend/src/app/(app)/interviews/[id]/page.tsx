import { InterviewSessionView } from '@/features/interviews';

export function generateStaticParams() {
  return [{ id: 'session' }];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewPage({ params }: PageProps) {
  const { id } = await params;
  return <InterviewSessionView sessionId={id} />;
}
