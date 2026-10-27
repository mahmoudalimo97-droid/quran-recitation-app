import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf9f5] dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-stone-800 dark:text-stone-200 font-sans" dir="rtl">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
              واجه التطبيق مشكلة أثناء التشغيل. يمكنك إعادة المحاولة أو إعادة ضبط البيانات المخزنة.
            </p>

            {this.state.error && (
              <div className="bg-stone-100 dark:bg-stone-800/60 rounded-xl p-3 text-right mb-6 overflow-x-auto text-xs font-mono text-red-600 dark:text-red-400">
                <p className="font-bold mb-1">تفاصيل الخطأ:</p>
                <p>{this.state.error.toString()}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تشغيل التطبيق</span>
              </button>

              <button
                onClick={this.handleResetAndReload}
                className="w-full py-2.5 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition"
              >
                <Trash2 className="w-4 h-4 text-stone-500" />
                <span>مسح البيانات المؤقتة والبدء من جديد</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
