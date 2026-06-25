import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { logger } from './utils/logger';
import { MotionConfig } from 'framer-motion';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker in production only to avoid stale caches during dev.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        const showUpdateToast = (worker: ServiceWorker) => {
          if (document.getElementById('pwa-update-toast')) return;

          const toast = document.createElement('div');
          toast.id = 'pwa-update-toast';
          toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-modal flex items-center justify-between gap-4 px-5 py-3.5 bg-zinc-950/90 border border-zinc-800 text-white rounded-2xl shadow-glow backdrop-blur-md w-[calc(100%-2rem)] max-w-sm animate-in fade-in slide-in-from-bottom-5';
          toast.style.marginBottom = 'env(safe-area-inset-bottom)';
          
          toast.innerHTML = `
            <div class="flex flex-col gap-0.5">
              <div class="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em]">Update Available</div>
              <div class="text-xs text-zinc-300">Nova versão pronta para uso.</div>
            </div>
            <button class="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 shrink-0 tap">
              Reload
            </button>
          `;

          const button = toast.querySelector('button');
          if (button) {
            button.addEventListener('click', () => {
              worker.postMessage('SKIP_WAITING');
              toast.remove();
            });
          }

          document.body.appendChild(toast);
        };

        // 1. Check if there is already a waiting worker from a previous load
        if (registration.waiting) {
          showUpdateToast(registration.waiting);
        }

        // 2. Listen for future updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateToast(newWorker);
              }
            });
          }
        });
      })
      .catch((err) => logger.warn('SW', 'Registration failed', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}