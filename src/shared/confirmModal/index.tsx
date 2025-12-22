import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import styles from './styles.module.less';
import Button from '../button';
import T, { useTranslation } from '../translate';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export default function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmWrapperRef = useRef<HTMLDivElement>(null);
  const cancelWrapperRef = useRef<HTMLDivElement>(null);

  const translatedMessage = useTranslation(message);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const cancelButton = cancelWrapperRef.current?.querySelector('button');
      const confirmButton = confirmWrapperRef.current?.querySelector('button');

      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (document.activeElement === cancelButton) {
          onCancel();
        } else {
          onConfirm();
        }
      } else if (event.key === 'Tab') {
        event.preventDefault();
        if (document.activeElement === confirmButton) {
          cancelButton?.focus();
        } else {
          confirmButton?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const cancelButton = cancelWrapperRef.current?.querySelector('button');
    cancelButton?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onConfirm, onCancel]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} ref={modalRef}>
        <div className={styles.modalMessage}>
          {translatedMessage}
        </div>
        <div className={styles.modalButtons}>
          <div ref={cancelWrapperRef}>
            <Button
              onClick={onCancel}
              color="gray"
            >
              <T>{cancelText}</T>
            </Button>
          </div>
          <div ref={confirmWrapperRef}>
            <Button
              onClick={onConfirm}
              color={isDangerous ? 'red' : 'green'}
            >
              <T>{confirmText}</T>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

