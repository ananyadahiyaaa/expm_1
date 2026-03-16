const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://expense-manager-qxue.onrender.com';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`);
  return data as T;
}

export const authApi = {
  register: (body: { email: string; password: string; name?: string }) =>
    api<{ user: { id: string; email: string; name: string }; token: string; expiresIn: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    api<{ user: { id: string; email: string; name: string }; token: string; expiresIn: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api<{ user: { id: string; email: string; name: string } }>('/api/auth/me'),
};

export const expensesApi = {
  list: (params?: { from?: string; to?: string; category?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    if (params?.category) q.set('category', params.category);
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    const query = q.toString();
    return api<{ expenses: Expense[] }>(`/api/expenses${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api<Expense>(`/api/expenses/${id}`),
  create: (body: { amount: number; category?: string; description?: string; date?: string }) =>
    api<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ amount: number; category: string; description: string; date: string }>) =>
    api<Expense>(`/api/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => api<void>(`/api/expenses/${id}`, { method: 'DELETE' }),
  categories: () => api<{ categories: string[] }>('/api/expenses/categories'),
};

export const budgetsApi = {
  get: (params?: { month?: number; year?: number }) => {
    const q = new URLSearchParams();
    if (params?.month != null) q.set('month', String(params.month));
    if (params?.year != null) q.set('year', String(params.year));
    const query = q.toString();
    return api<BudgetSummary>(`/api/budgets${query ? `?${query}` : ''}`);
  },
  set: (body: { amount: number; month?: number; year?: number }) =>
    api<{ id: string; amount: string; month: number; year: number }>('/api/budgets', { method: 'PUT', body: JSON.stringify(body) }),
};

export const analyticsApi = {
  dashboard: (params?: { from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const query = q.toString();
    return api<AnalyticsDashboard>(`/api/analytics${query ? `?${query}` : ''}`);
  },
};

export interface Expense {
  id: string;
  amount: string;
  category: string;
  description: string | null;
  date: string;
  created_at?: string;
}

export interface BudgetSummary {
  month: number;
  year: number;
  budget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  budgetId?: string;
}

export interface AnalyticsDashboard {
  totalSpent: number;
  averageDailySpend: number;
  highestCategory: string;
  highestCategoryAmount: number;
  byCategory: { category: string; total: number }[];
  spendingOverTime: { date: string; total: number }[];
  monthlyComparison: { month: number; year: number; total: number; label: string }[];
  from: string;
  to: string;
}
