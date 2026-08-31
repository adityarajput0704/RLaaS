import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          {isDanger && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-mono rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
              isDanger
                ? 'bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-100 hover:bg-zinc-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
