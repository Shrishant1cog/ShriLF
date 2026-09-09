const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('fc_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Cast response to 'any' to satisfy strict TypeScript checks
    const data = (await res.json().catch(() => ({}))) as any;

    if (!res.ok) {
      throw new Error(data?.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err: any) {
    console.error(`Fetch error on endpoint ${endpoint}:`, err.message);
    throw err;
  }
}