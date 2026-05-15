'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from './ThemeProvider';

export function ClerkThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: theme === 'dark' ? '#141416' : '#ffffff',
          colorInputBackground: theme === 'dark' ? '#0c0c0e' : '#f4f5f7',
          colorInputText: theme === 'dark' ? '#fafafa' : '#0a0a0b',
          colorText: theme === 'dark' ? '#fafafa' : '#0a0a0b',
          colorTextSecondary: theme === 'dark' ? '#a1a1aa' : '#52525b',
          colorSuccess: '#22c55e',
          colorDanger: '#ef4444',
          borderRadius: '0.75rem',
        },
        elements: {
          userButtonPopoverCard: {
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.12)' : '#e4e4e7'}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 99999,
            backgroundColor: theme === 'dark' ? '#1c1c1e' : '#ffffff',
          },
          userButtonPopoverActionButton: {
            color: theme === 'dark' ? '#ffffff' : '#0a0a0b',
            '&:hover': {
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            }
          },
          userButtonPopoverActionButtonText: {
            color: theme === 'dark' ? '#ffffff !important' : '#0a0a0b !important',
            fontWeight: 600,
          },
          userButtonPopoverActionButtonIcon: {
            color: theme === 'dark' ? '#ffffff !important' : '#0a0a0b !important',
            opacity: 0.8,
          },
          userButtonPopoverFooter: {
            display: 'none',
          },
          userButtonPopoverMain: {
            backgroundColor: theme === 'dark' ? '#1c1c1e' : '#ffffff',
          },
          userPreviewMainIdentifier: {
            color: theme === 'dark' ? '#ffffff !important' : '#0a0a0b !important',
            fontWeight: 700,
          },
          userPreviewSecondaryIdentifier: {
            color: theme === 'dark' ? '#a1a1aa' : '#52525b',
          },
          userButtonTrigger: {
            '&:focus': {
              boxShadow: 'none',
            }
          }
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
