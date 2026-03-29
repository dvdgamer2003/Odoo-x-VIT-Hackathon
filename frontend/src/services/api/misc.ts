import apiClient from '../api';

export const companiesApi = {
  me: () => apiClient.get('/companies/me').then((r) => r.data),
  update: (data: { name?: string; defaultCurrency?: string }) =>
    apiClient.patch('/companies/me', data).then((r) => r.data),
};

export const currencyApi = {
  rate: (from: string, to: string) =>
    apiClient.get('/currency/rate', { params: { from, to } }).then((r) => r.data),
  countries: () => apiClient.get('/currency/countries').then((r) => r.data),
};

export const uploadApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post('/upload/receipt', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};

export const ocrApi = {
  start: (expenseId: string) => apiClient.post('/ocr/start', { expenseId }).then((r) => r.data),
  status: (jobId: string) => apiClient.get(`/ocr/status/${jobId}`).then((r) => r.data),
};
