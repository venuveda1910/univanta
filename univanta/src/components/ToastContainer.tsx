import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.tone === 'error'
            ? AlertCircle
            : toast.tone === 'info'
              ? Info
              : CheckCircle2;
        const borderTone =
          toast.tone === 'error'
            ? 'border-red-200 bg-white text-slate-900'
            : toast.tone === 'info'
              ? 'border-slate-200 bg-white text-slate-900'
              : 'border-blue-200 bg-white text-slate-900';
        const iconTone =
          toast.tone === 'error'
            ? 'text-red-600'
            : toast.tone === 'info'
              ? 'text-blue-700'
              : 'text-emerald-600';

        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-sm transition-all ${borderTone}`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconTone}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-700"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
