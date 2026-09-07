import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle, Play } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('The Drift encountered a runtime error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('THE_DRIFT_PLAYER_PROFILE_V2');
      localStorage.removeItem('the_drift_best_score');
      localStorage.removeItem('the_drift_best_time');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] text-slate-100 p-6 font-mono select-none">
          <div className="relative w-full max-w-lg bg-slate-950/90 border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <h2 className="text-xl font-bold text-slate-100 tracking-wider">
              SUBSYSTEM DESYNCHRONIZATION
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
              The ship’s quantum navigation matrix caught an unexpected anomaly during sector initialization.
            </p>

            {this.state.error && (
              <div className="w-full my-4 p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-left overflow-x-auto text-[11px] text-red-300 font-mono">
                {this.state.error.message || 'Unknown sector anomaly'}
              </div>
            )}

            <div className="flex gap-3 w-full mt-2">
              <button
                id="btn-error-reload"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RELOAD PROTOCOLS</span>
              </button>

              <button
                id="btn-error-reset"
                onClick={this.handleReset}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>CLEAR CACHE</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
