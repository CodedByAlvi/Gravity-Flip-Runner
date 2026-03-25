import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl">
            <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/30">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-4 uppercase tracking-tighter">System Malfunction</h2>
            <p className="text-zinc-400 font-mono text-xs tracking-widest uppercase mb-8 leading-relaxed">
              The void-runner encountered a critical error. System stability has been compromised.
            </p>
            <div className="bg-black/50 rounded-xl p-4 mb-8 text-left border border-zinc-800">
              <p className="text-red-400 font-mono text-[10px] uppercase tracking-tighter break-words">
                {this.state.error?.message || 'Unknown Error'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              <RotateCcw size={20} />
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
