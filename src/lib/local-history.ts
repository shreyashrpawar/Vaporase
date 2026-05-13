export interface LocalSecret {
  id: string;
  link: string;
  createdAt: number;
  expiresAt: number;
  label?: string;
}

const STORAGE_KEY = 'ilusion_recent_secrets';

export const saveLocalSecret = (secret: LocalSecret) => {
  if (typeof window === 'undefined') return;
  
  const existing = getLocalSecrets();
  const updated = [secret, ...existing].slice(0, 10); // Keep last 10
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getLocalSecrets = (): LocalSecret[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const secrets: LocalSecret[] = JSON.parse(stored);
    // Filter out expired secrets
    return secrets.filter(s => s.expiresAt > Date.now());
  } catch {
    return [];
  }
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
