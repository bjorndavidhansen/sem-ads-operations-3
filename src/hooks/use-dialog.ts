import { useState, useCallback } from 'react';

interface UseDialogOptions {
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}

export function useDialog(options: UseDialogOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    if (!loading) {
      setIsOpen(false);
      options.onClose?.();
    }
  }, [loading, options]);

  const confirm = useCallback(async () => {
    if (options.onConfirm) {
      try {
        setLoading(true);
        await options.onConfirm();
        setIsOpen(false);
      } catch (error) {
        console.error('Error in dialog confirmation:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [options]);

  const cancel = useCallback(() => {
    if (!loading) {
      setIsOpen(false);
      options.onCancel?.();
      options.onClose?.();
    }
  }, [loading, options]);

  return {
    isOpen,
    loading,
    open,
    close,
    confirm,
    cancel
  };
}