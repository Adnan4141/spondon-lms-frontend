import { apiRequest } from '../api';

export const generateMonthlyDues = (month?: string) => apiRequest<any>(`/accounting/generate-monthly-dues${month ? `?month=${month}` : ''}`, {
  method: 'POST'
});
