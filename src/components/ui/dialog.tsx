import { useState } from 'react';
import { Modal, ModalProps } from './modal';
import { Button } from './button';

export interface DialogProps extends Omit<ModalProps, 'isOpen' | 'onClose'> {
  trigger: React.ReactNode;
  confirmButton?: {
    label: string;
    onClick: () => void | Promise<void>;
    variant?: 'primary' | 'secondary' | 'danger';
  };
  cancelButton?: {
    label: string;
    variant?: 'outline' | 'ghost';
  };
}

export function Dialog({
  trigger,
  confirmButton,
  cancelButton = {
    label: 'Cancel',
    variant: 'outline'
  },
  footer,
  ...props
}: DialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmButton?.onClick) {
      try {
        setLoading(true);
        await confirmButton.onClick();
        setIsOpen(false);
      } catch (error) {
        console.error('Error in dialog confirmation:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>
      <Modal
        isOpen={isOpen}
        onClose={() => !loading && setIsOpen(false)}
        footer={
          footer || (
            <div className="flex justify-end gap-2">
              <Button
                variant={cancelButton.variant}
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                {cancelButton.label}
              </Button>
              {confirmButton && (
                <Button
                  variant={confirmButton.variant || 'primary'}
                  onClick={handleConfirm}
                  loading={loading}
                >
                  {confirmButton.label}
                </Button>
              )}
            </div>
          )
        }
        {...props}
      />
    </>
  );
}