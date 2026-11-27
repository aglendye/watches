import { Sheet } from './Sheet';
import { Button } from './ui';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm(): void;
  onCancel(): void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, busy, onConfirm, onCancel }: Props) {
  return (
    <Sheet open={open} onClose={onCancel} title={title} variant="center">
      <p className="text-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button kind="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button kind="danger" busy={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
