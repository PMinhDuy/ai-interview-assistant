import { InterviewReportView } from '@/features/interviews';

export function generateStaticParams() {
  return [{ id: 'session' }];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InterviewReportPage({ params }: PageProps) {
  const { id } = await params;
  return <InterviewReportView sessionId={id} />;
}
