import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

interface AppShellProps {
  children: React.ReactNode;
}

export const applyThemeSystemBars = async (theme: 'light' | 'dark' | 'system') => {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);

  if (!Capacitor.isNativePlatform()) return;
  try {
    if (isDark) {
      await StatusBar.setBackgroundColor({ color: '#172554' });
      await StatusBar.setStyle({ style: Style.Dark });
    } else {
      await StatusBar.setBackgroundColor({ color: '#2563EB' });
      await StatusBar.setStyle({ style: Style.Dark });
    }
  } catch (err) {
    console.warn('StatusBar theme update error:', err);
  }
};

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  useEffect(() => {
    // 1. Initialize native status bar and keyboard behavior if running on Capacitor
    const initNativeFeatures = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        const savedTheme = (localStorage.getItem('bizledger_theme') as any) || 'light';
        await applyThemeSystemBars(savedTheme);
      } catch (err) {
        console.warn('StatusBar init warning:', err);
      }

      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      } catch (err) {
        console.warn('Keyboard init warning:', err);
      }
    };

    initNativeFeatures();

    // 2. Setup Keyboard event listeners for active layout adjustments
    let showListener: any = null;
    let hideListener: any = null;

    if (Capacitor.isNativePlatform()) {
      showListener = Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.classList.add('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);

        // Automatically scroll active input or button into visible viewport
        setTimeout(() => {
          const activeEl = document.activeElement as HTMLElement | null;
          if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      });

      hideListener = Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-open');
        document.documentElement.style.setProperty('--keyboard-height', '0px');
      });
    }

    // 3. Listen to focus events globally so any input stays visible above keyboard
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    window.addEventListener('focusin', handleFocusIn);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      if (showListener) showListener.remove();
      if (hideListener) hideListener.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col relative w-full overflow-x-clip">
      {children}
    </div>
  );
};
