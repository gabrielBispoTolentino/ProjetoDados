import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './css/Feedback.css';

type ToastVariant = 'success' | 'error' | 'info';

type ToastOptions = {
  title?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastItem = Required<Pick<ToastOptions, 'variant'>> &
  Pick<ToastOptions, 'title'> & {
    id: string;
    message: string;
  };

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
};

type PromptOptions = ConfirmOptions & {
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
};

type ConfirmDialogState = {
  kind: 'confirm';
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

type PromptDialogState = {
  kind: 'prompt';
  options: PromptOptions;
  value: string;
  resolve: (value: string | null) => void;
};

type DialogState = ConfirmDialogState | PromptDialogState | null;

type FeedbackContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
  success: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  error: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  info: (message: string, options?: Omit<ToastOptions, 'variant'>) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const DEFAULT_TOAST_DURATION_MS = 4200;

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const idPrefix = useId();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current.clear();
  }, []);

  useEffect(() => {
    if (!dialog) {
      return undefined;
    }

    const activeDialog = dialog;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();

        if (activeDialog.kind === 'confirm') {
          activeDialog.resolve(false);
        } else {
          activeDialog.resolve(null);
        }

        setDialog(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dialog]);

  function removeToast(id: string) {
    const timerId = timersRef.current.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
      timersRef.current.delete(id);
    }

    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }

  function showToast(message: string, options: ToastOptions = {}) {
    const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const toast: ToastItem = {
      id,
      message,
      title: options.title,
      variant: options.variant ?? 'info',
    };

    setToasts((currentToasts) => [...currentToasts, toast]);

    const durationMs = options.durationMs ?? DEFAULT_TOAST_DURATION_MS;
    const timerId = window.setTimeout(() => {
      removeToast(id);
    }, durationMs);

    timersRef.current.set(id, timerId);
  }

  function success(message: string, options: Omit<ToastOptions, 'variant'> = {}) {
    showToast(message, { ...options, variant: 'success' });
  }

  function error(message: string, options: Omit<ToastOptions, 'variant'> = {}) {
    showToast(message, { ...options, variant: 'error', durationMs: options.durationMs ?? 5600 });
  }

  function info(message: string, options: Omit<ToastOptions, 'variant'> = {}) {
    showToast(message, { ...options, variant: 'info' });
  }

  function confirm(options: ConfirmOptions) {
    return new Promise<boolean>((resolve) => {
      setDialog({
        kind: 'confirm',
        options,
        resolve,
      });
    });
  }

  function prompt(options: PromptOptions) {
    return new Promise<string | null>((resolve) => {
      setDialog({
        kind: 'prompt',
        options,
        value: options.defaultValue ?? '',
        resolve,
      });
    });
  }

  function handleDialogCancel() {
    if (!dialog) {
      return;
    }

    if (dialog.kind === 'confirm') {
      dialog.resolve(false);
    } else {
      dialog.resolve(null);
    }

    setDialog(null);
  }

  function handleDialogConfirm() {
    if (!dialog) {
      return;
    }

    if (dialog.kind === 'confirm') {
      dialog.resolve(true);
      setDialog(null);
      return;
    }

    const nextValue = dialog.value.trim();
    if (dialog.options.required && !nextValue) {
      return;
    }

    dialog.resolve(nextValue || null);
    setDialog(null);
  }

  return (
    <FeedbackContext.Provider
      value={{
        showToast,
        success,
        error,
        info,
        confirm,
        prompt,
      }}
    >
      {children}

      {createPortal(
        <div className="feedback-toast-viewport" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`feedback-toast feedback-toast-${toast.variant}`}
              role="status"
            >
              <div className="feedback-toast-copy">
                {toast.title && <strong className="feedback-toast-title">{toast.title}</strong>}
                <span className="feedback-toast-message">{toast.message}</span>
              </div>
              <button
                type="button"
                className="feedback-toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Fechar notificacao"
              >
                x
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}

      {dialog && createPortal(
        <div className="feedback-dialog-backdrop" onClick={handleDialogCancel}>
          <div
            className="feedback-dialog"
            role="alertdialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="feedback-dialog-copy">
              <h3 className="feedback-dialog-title">
                {dialog.options.title || (dialog.kind === 'prompt' ? 'Confirmar acao' : 'Confirmacao')}
              </h3>
              <p className="feedback-dialog-message">{dialog.options.message}</p>
            </div>

            {dialog.kind === 'prompt' && (
              <div className="feedback-dialog-field">
                <input
                  type="text"
                  value={dialog.value}
                  placeholder={dialog.options.placeholder}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setDialog((currentDialog) => (
                      currentDialog?.kind === 'prompt'
                        ? {
                            ...currentDialog,
                            value: nextValue,
                          }
                        : currentDialog
                    ));
                  }}
                  autoFocus
                />
              </div>
            )}

            <div className="feedback-dialog-actions">
              <button
                type="button"
                className="feedback-dialog-cancel"
                onClick={handleDialogCancel}
              >
                {dialog.options.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                className={`feedback-dialog-confirm ${dialog.options.tone === 'danger' ? 'is-danger' : ''}`}
                onClick={handleDialogConfirm}
                disabled={dialog.kind === 'prompt' && dialog.options.required && !dialog.value.trim()}
              >
                {dialog.options.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error('useFeedback must be used within FeedbackProvider');
  }

  return context;
}
