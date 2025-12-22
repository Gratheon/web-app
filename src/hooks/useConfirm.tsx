import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import ConfirmModal from '../shared/confirmModal';

interface ConfirmConfig {
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export function useConfirm() {
  const [message, setMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfirmConfig>({});
  const [resolveCallback, setResolveCallback] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((msg: string, cfg?: ConfirmConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setMessage(msg);
      setConfig(cfg || {});
      setResolveCallback(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveCallback) {
      resolveCallback(true);
      setMessage(null);
      setConfig({});
      setResolveCallback(null);
    }
  }, [resolveCallback]);

  const handleCancel = useCallback(() => {
    if (resolveCallback) {
      resolveCallback(false);
      setMessage(null);
      setConfig({});
      setResolveCallback(null);
    }
  }, [resolveCallback]);

  const ConfirmDialog = message ? (
    <ConfirmModal
      message={message}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      isDangerous={config.isDangerous}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { confirm, ConfirmDialog };
}

