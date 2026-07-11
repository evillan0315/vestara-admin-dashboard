import { useState, useCallback } from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from '../components/ui/Modal';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export interface UseConfirmReturn {
  open: boolean;
  options: ConfirmOptions | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  close: () => void;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export function useConfirm(): UseConfirmReturn {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (confirmOptions: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setOptions(confirmOptions);
        setResolvePromise(() => resolve);
        setOpen(true);
      });
    },
    []
  );

  const close = useCallback(() => {
    setOpen(false);
    setOptions(null);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
    setOpen(false);
    setOptions(null);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
    setOpen(false);
    setOptions(null);
  }, [resolvePromise]);

  return {
    open,
    options,
    confirm,
    close,
    handleConfirm,
    handleCancel,
  };
}

export function ConfirmDialogWrapper(props: ConfirmDialogProps) {
  return <ConfirmDialog {...props} />;
}

export default useConfirm;