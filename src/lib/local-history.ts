export interface LocalSecret {
  id: string;
  link: string;
  createdAt: number;
  expiresAt: number;
  label?: string;
  status: 'active' | 'burned' | 'expired';
  viewCount: number;
  lastCheckedAt?: number;
}

const STORAGE_KEY = 'ilusion_recent_secrets';

export const saveLocalSecret = (secret: Partial<LocalSecret>) => {
  if (typeof window === 'undefined') return;
  
  const existing = getLocalSecrets();
  const newSecret: LocalSecret = {
    id: secret.id!,
    link: secret.link!,
    createdAt: secret.createdAt || Date.now(),
    expiresAt: secret.expiresAt!,
    label: secret.label,
    status: secret.status || 'active',
    viewCount: secret.viewCount || 0,
    lastCheckedAt: Date.now(),
  };

  const updated = [newSecret, ...existing].filter(s => {
    // Auto-delete after 1 day (86400000 ms)
    return Date.now() - s.createdAt < 86400000;
  }).slice(0, 15); // Keep last 15
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getLocalSecrets = (): LocalSecret[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const secrets: LocalSecret[] = JSON.parse(stored);
    // Filter out secrets older than 1 day
    return secrets.filter(s => Date.now() - s.createdAt < 86400000);
  } catch {
    return [];
  }
};

export const updateLocalSecret = (id: string, updates: Partial<LocalSecret>) => {
  if (typeof window === 'undefined') return;
  
  const existing = getLocalSecrets();
  const updated = existing.map(s => s.id === id ? { ...s, ...updates, lastCheckedAt: Date.now() } : s);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const removeLocalSecret = (id: string) => {
  if (typeof window === 'undefined') return;
  
  const existing = getLocalSecrets();
  const updated = existing.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const clearLocalHistory = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};
