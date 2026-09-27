import SessionReportPage from './ReportView';

export function generateStaticParams() {
  return [{ id: 'session' }];
}

export default function Page() {
  return <SessionReportPage />;
}
