import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { mediaApi, toBrowserUrl } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { MediaResponse } from '../types';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'video/mp4'];
const MAX_BYTES = 100 * 1024 * 1024;

export default function Media() {
  const [items, setItems] = useState<MediaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [viewTarget, setViewTarget] = useState<MediaResponse | null>(null);

  const [renameTarget, setRenameTarget] = useState<MediaResponse | null>(null);
  const [newName, setNewName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MediaResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  async function load() {
    try {
      setItems(await mediaApi.list());
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function uploadFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Unsupported type. Allowed: JPG, PNG, MP4');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('File too large. Max 100 MB');
      return;
    }
    setUploading(true);
    setUploadProgress(file.name);
    try {
      await mediaApi.upload(file);
      toast.success(`${file.name} uploaded`);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    Array.from(files).forEach(uploadFile);
  }

  function openView(item: MediaResponse) {
    // blobUrl from the list is already a 24-hour SAS URL — no extra fetch needed
    setViewTarget(item);
  }

  function openRename(item: MediaResponse) {
    setRenameTarget(item);
    setNewName(item.fileName);
  }

  async function handleRename() {
    if (!renameTarget || !newName.trim()) return;
    setRenameLoading(true);
    try {
      await mediaApi.rename(renameTarget.id, newName.trim());
      toast.success('Media renamed');
      setRenameTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRenameLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await mediaApi.delete(deleteTarget.id);
      toast.success('Media deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalBytes = items.reduce((a, m) => a + m.sizeInBytes, 0);
  const images = items.filter((m) => m.fileType === 'Image');
  const videos = items.filter((m) => m.fileType === 'Video');

  return (
    <Layout
      title="Media"
      subtitle={`${items.length} file${items.length !== 1 ? 's' : ''} · ${formatBytes(totalBytes)}`}
      actions={
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.mp4"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <><span className="spinner" /> Uploading…</> : '↑ Upload'}
          </button>
        </>
      }
    >
      {loading ? (
        <div className="full-center"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : (
        <>
          {/* Upload zone */}
          <div
            className={`upload-zone${dragOver ? ' drag-over' : ''}`}
            style={{ marginBottom: 24 }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-zone-icon">{uploading ? '⏳' : '⬆️'}</div>
            {uploading ? (
              <div className="upload-zone-text">Uploading <strong>{uploadProgress}</strong>…</div>
            ) : (
              <>
                <div className="upload-zone-text">Drop files here or click to browse</div>
                <div className="upload-zone-sub">JPG, PNG, MP4 · max 100 MB per file</div>
              </>
            )}
          </div>

          {items.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🖼️</span>
              <div className="empty-state-title">No media yet</div>
              <div className="empty-state-desc">Upload images and videos to use in your schedules.</div>
            </div>
          ) : (
            <>
              {images.length > 0 && (
                <>
                  <div className="section-label">Images ({images.length})</div>
                  <div className="media-grid" style={{ marginBottom: 28 }}>
                    {images.map((m) => (
                      <MediaCard key={m.id} item={m} onView={() => openView(m)} onRename={() => openRename(m)} onDelete={() => setDeleteTarget(m)} />
                    ))}
                  </div>
                </>
              )}
              {videos.length > 0 && (
                <>
                  <div className="section-label">Videos ({videos.length})</div>
                  <div className="media-grid">
                    {videos.map((m) => (
                      <MediaCard key={m.id} item={m} onView={() => openView(m)} onRename={() => openRename(m)} onDelete={() => setDeleteTarget(m)} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── View Modal ─────────────────────────────────────────────────── */}
      {viewTarget && (
        <Modal
          title={viewTarget.fileName}
          onClose={() => setViewTarget(null)}
          size="lg"
          footer={<button className="btn btn-secondary" onClick={() => setViewTarget(null)}>Close</button>}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className={`badge ${viewTarget.fileType === 'Video' ? 'badge-video' : 'badge-image'}`}>{viewTarget.fileType}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatBytes(viewTarget.sizeInBytes)}</span>
            {viewTarget.durationSeconds != null && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {Math.floor(viewTarget.durationSeconds / 60)}:{String(viewTarget.durationSeconds % 60).padStart(2, '0')} duration
              </span>
            )}
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
            {viewTarget.fileType === 'Video' ? (
              <video
                src={toBrowserUrl(viewTarget.blobUrl)}
                controls
                style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block' }}
              />
            ) : (
              <img
                src={toBrowserUrl(viewTarget.blobUrl)}
                alt={viewTarget.fileName}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block' }}
              />
            )}
          </div>
        </Modal>
      )}

      {/* ── Rename Modal ────────────────────────────────────────────────── */}
      {renameTarget && (
        <Modal
          title="Rename media"
          onClose={() => setRenameTarget(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setRenameTarget(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRename} disabled={renameLoading || !newName.trim()}>
                {renameLoading ? <span className="spinner" /> : 'Save'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="label">File name</label>
            <input
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); }}
            />
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <Modal
          title="Delete media"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? <span className="spinner" /> : 'Delete'}
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Delete <strong style={{ color: 'var(--text)' }}>{deleteTarget.fileName}</strong>?
            This will fail if the file is used in an active schedule.
          </p>
        </Modal>
      )}
    </Layout>
  );
}

// ── Media Card ────────────────────────────────────────────────────────────────

function MediaCard({ item, onView, onRename, onDelete }: {
  item: MediaResponse;
  onView: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const isVideo = item.fileType === 'Video';
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="media-card">
      <div
        className="media-card-preview"
        onClick={onView}
        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
      >
        {isVideo ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 40 }}>🎬</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click to play</span>
          </div>
        ) : imgFailed ? (
          <span style={{ fontSize: 36 }}>🖼️</span>
        ) : (
          <img
            src={toBrowserUrl(item.blobUrl)}
            alt={item.fileName}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        <div className="media-card-overlay">
          <span style={{ fontSize: 13, fontWeight: 600 }}>{isVideo ? 'Play' : 'View'}</span>
        </div>
      </div>

      <div className="media-card-body">
        <div className="media-card-name" title={item.fileName}>{item.fileName}</div>
        <div className="media-card-meta">
          <span className={`badge ${isVideo ? 'badge-video' : 'badge-image'}`}>{item.fileType}</span>
          <span className="media-card-size">{formatBytes(item.sizeInBytes)}</span>
        </div>
        {item.durationSeconds != null && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            {Math.floor(item.durationSeconds / 60)}:{String(item.durationSeconds % 60).padStart(2, '0')} duration
          </div>
        )}
        <div className="media-card-actions">
          <button className="btn btn-ghost btn-icon-sm" onClick={onRename} title="Rename">✏️</button>
          <button className="btn btn-danger-ghost btn-icon-sm" onClick={onDelete} title="Delete">🗑️</button>
        </div>
      </div>
    </div>
  );
}
