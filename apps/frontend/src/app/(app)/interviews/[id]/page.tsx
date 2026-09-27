import ActiveInterviewScreen from './InterviewView';

export function generateStaticParams() {
  return [{ id: 'session' }];
}

export default function Page() {
  return <ActiveInterviewScreen />;
}
