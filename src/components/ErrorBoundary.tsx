import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-brand-card p-6 rounded-lg retro-border retro-shadow text-center space-y-4">
            <h1 className="font-serif text-2xl font-bold text-brand-error uppercase tracking-tight">
              ⚠️ Ocurrió un error
            </h1>
            <div className="bg-brand-bg/50 p-4 rounded border border-brand-ink/20 text-left overflow-x-auto">
              <p className="font-mono text-sm text-brand-ink font-bold">
                {this.state.error?.message || "Error desconocido"}
              </p>
            </div>
            <p className="font-mono text-sm text-brand-ink-muted">
              La aplicación encontró un problema inesperado. Podés intentar recargar la página para volver a intentar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-brand-ink text-brand-bg font-mono font-bold uppercase py-3 rounded retro-border hover:bg-brand-ink/90 transition-colors"
            >
              🔄 Reintentar
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
