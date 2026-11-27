// Watch photos: the upload sheet (pick, shrink, preview, upload with progress)
// and the gallery strip on the watch page.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import type { WatchPhoto } from '../../shared/types';
import { errorMessage } from '../lib/api';
import { relativeTime } from '../lib/format';
import { compressImage, uploadPhoto, type CompressedPhoto } from '../lib/photo';
import { useAfterUpload, useDeletePhoto } from '../lib/queries';
import { ConfirmDialog } from './ConfirmDialog';
import { Sheet } from './Sheet';
import { useToast } from './Toast';
import { Button, FormError, SectionTitle } from './ui';

export interface PhotoPickerHandle {
  /** Opens the phone's camera / photo library chooser. */
  pick(): void;
}

type State =
  | { step: 'idle' }
  | { step: 'preparing' }
  | { step: 'ready'; photo: CompressedPhoto; preview: string }
  | { step: 'uploading'; photo: CompressedPhoto; preview: string; progress: number }
  | { step: 'error'; message: string; photo?: CompressedPhoto; preview?: string };

/** A hidden file input plus the sheet that previews and uploads the chosen photo. */
export const PhotoPicker = forwardRef<PhotoPickerHandle, { watchId: string; title: ReactNode }>(function PhotoPicker({ watchId, title }, ref) {
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const refresh = useAfterUpload();
  const [state, setState] = useState<State>({ step: 'idle' });

  useImperativeHandle(ref, () => ({ pick: () => input.current?.click() }), []);

  const preview = 'preview' in state ? state.preview : undefined;
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function onFile(file: File | undefined) {
    if (input.current) input.current.value = ''; // picking the same file again still fires
    if (!file) return;
    setState({ step: 'preparing' });
    try {
      const photo = await compressImage(file);
      setState({ step: 'ready', photo, preview: URL.createObjectURL(photo.blob) });
    } catch (err) {
      setState({ step: 'error', message: err instanceof Error ? err.message : 'Couldn’t open that photo.' });
    }
  }

  async function upload() {
    if (state.step !== 'ready' && state.step !== 'error') return;
    const { photo, preview: p } = state;
    if (!photo || !p) return;
    setState({ step: 'uploading', photo, preview: p, progress: 0 });
    try {
      await uploadPhoto(watchId, photo, (progress) => setState((s) => (s.step === 'uploading' ? { ...s, progress } : s)));
      await refresh();
      toast('Photo added');
      setState({ step: 'idle' });
    } catch (err) {
      setState({ step: 'error', message: errorMessage(err), photo, preview: p });
    }
  }

  const open = state.step !== 'idle';
  const close = () => {
    if (state.step !== 'uploading') setState({ step: 'idle' });
  };
  const kb = 'photo' in state && state.photo ? Math.round(state.photo.blob.size / 1024) : null;

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <Sheet open={open} onClose={close} eyebrow="Add photo" title={title}>
        <div className="space-y-4">
          <div className="hero grid aspect-[4/3] place-items-center overflow-hidden border border-line">
            {preview ? (
              <img src={preview} alt="The photo you chose" className="h-full w-full object-contain" />
            ) : (
              <p className="label" role="status">
                {state.step === 'preparing' ? 'Preparing photo…' : 'No photo'}
              </p>
            )}
          </div>
          {state.step === 'uploading' && (
            <div>
              <div
                className="h-2 w-full bg-surface-2"
                role="progressbar"
                aria-label="Upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(state.progress * 100)}
              >
                <div className="h-full bg-accent transition-[width] motion-reduce:transition-none" style={{ width: `${Math.round(state.progress * 100)}%` }} />
              </div>
              <p className="mono mt-1.5 text-xs text-muted">Uploading… {Math.round(state.progress * 100)}%</p>
            </div>
          )}
          {kb !== null && state.step !== 'uploading' && (
            <p className="mono text-xs text-muted">
              {'photo' in state && state.photo ? `${state.photo.width} × ${state.photo.height}` : ''} · {kb} KB · location data removed
            </p>
          )}
          <p className="text-xs text-muted">Only people signed in to Bezel can see photos. You can delete yours later.</p>
          <FormError message={state.step === 'error' ? state.message : null} />
          <div className="flex gap-2">
            <Button kind="secondary" onClick={() => input.current?.click()} disabled={state.step === 'uploading' || state.step === 'preparing'}>
              Choose another
            </Button>
            <Button
              className="flex-1"
              onClick={() => void upload()}
              busy={state.step === 'uploading'}
              disabled={!(state.step === 'ready' || (state.step === 'error' && !!state.photo))}
            >
              {state.step === 'error' && state.photo ? 'Try again' : 'Upload photo'}
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
});

/** Swipeable strip of all photos of a watch. Tapping one shows it in the hero. */
export function PhotoGallery({
  photos,
  meId,
  selectedId,
  onSelect,
}: {
  photos: WatchPhoto[];
  meId: string;
  selectedId: string | null;
  onSelect(p: WatchPhoto): void;
}) {
  const toast = useToast();
  const remove = useDeletePhoto();
  const [deleting, setDeleting] = useState<WatchPhoto | null>(null);
  if (photos.length === 0) return null;

  async function doDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast('Photo deleted');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
    setDeleting(null);
  }

  return (
    <section aria-labelledby="photos-title">
      <SectionTitle id="photos-title">Photos · {photos.length}</SectionTitle>
      <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {photos.map((p, i) => {
          const who = p.uploaded_by === meId ? 'You' : p.display_name;
          const selected = selectedId ? selectedId === p.id : i === 0;
          return (
            <li key={p.id} className="w-36 shrink-0 snap-start">
              <button
                type="button"
                onClick={() => onSelect(p)}
                aria-pressed={selected}
                aria-label={`Photo ${i + 1} by ${who}${i === 0 ? ' (main photo)' : ''}. Show it above`}
                className={`hero block size-36 overflow-hidden border ${selected ? 'border-accent' : 'border-line'}`}
              >
                <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              </button>
              <p className="mt-1.5 flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold">{who}</span>
                <span className="mono shrink-0 text-[0.6875rem] text-muted">{relativeTime(p.created_at)}</span>
              </p>
              {p.can_delete && (
                <button
                  type="button"
                  onClick={() => setDeleting(p)}
                  className="min-h-11 text-sm font-semibold text-danger"
                  aria-label={`Delete photo ${i + 1}`}
                >
                  Delete
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!deleting}
        title="Delete this photo?"
        message={
          deleting && photos[0]?.id === deleting.id && photos.length > 1
            ? 'It’s the main photo; the next oldest takes its place. This can’t be undone.'
            : 'This can’t be undone.'
        }
        confirmLabel="Delete"
        busy={remove.isPending}
        onConfirm={() => void doDelete()}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
