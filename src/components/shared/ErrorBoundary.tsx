import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Catches any runtime error thrown while rendering the app so the user sees a
 * recoverable retro-styled screen instead of a fully blank page. Offers a hard
 * reload that also clears the service worker caches, which lets visitors recover
 * from a stale/broken cached app shell on their own.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // React types are not installed in this project, so the Component generics that
  // normally provide `state`/`props` do not resolve. Declare them explicitly.
  state: ErrorBoundaryState;
  props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown) {
    console.error('PRODE ErrorBoundary capturó un error de renderizado:', error);
  }

  handleReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
    } catch (err) {
      console.warn('No se pudo limpiar la caché antes de recargar:', err);
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-brand-bg text-brand-ink flex flex-col items-center justify-center px-4 text-center grain-overlay">
        <div className="bg-brand-card retro-border retro-shadow p-6 max-w-md w-full">
          <h1 className="font-display text-3xl uppercase tracking-tight mb-2">⚽ Uy, algo falló</h1>
          <p className="font-sans text-sm text-brand-ink-muted mb-4">
            La aplicación tuvo un problema al cargar. Tocá el botón para limpiar la caché y volver a intentarlo.
          </p>
          <button
            onClick={this.handleReload}
            className="bg-brand-accent text-brand-bg retro-border retro-shadow font-display uppercase tracking-wider text-base px-6 py-3 cursor-pointer hover:translate-y-[-2px] transition-all"
          >
            Recargar y limpiar caché 🔄
          </button>
          {this.state.message && (
            <p className="font-mono text-[10px] text-brand-ink-muted/70 mt-4 break-words">
              {this.state.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
