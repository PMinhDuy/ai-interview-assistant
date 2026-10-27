import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { SessionReportItem } from './types';

export const getSessionReport = async (sessionId: string): Promise<SessionReportItem> => {
  const { data } = await apiClient.get<SessionReportItem>(`/evaluations/sessions/${sessionId}/report`);
  return data;
};

export const getSessionReportQueryOptions = (sessionId: string) =>
  queryOptions({
    queryKey: ['session-report', sessionId],
    queryFn: () => getSessionReport(sessionId),
    enabled: Boolean(sessionId),
  });
