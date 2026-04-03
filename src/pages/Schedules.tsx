import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { schedulesApi, devicesApi, mediaApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { ScheduleResponse, DeviceResponse, MediaResponse, ScheduleItemRequest } from '../types';

// Convert "HH:mm:ss" from API → "HH:mm" for <input type="time">
function toTimeInput(t: string) { return t?.slice(0, 5) ?? ''; }
// Convert "HH:mm" from input → "HH:mm:ss" for API
function toTimeApi(t: string) { return t ? `${t}:00` : '00:00:00'; }

interface ItemDraft {
  mediaId: string;
  startTime: string; // HH:mm
  endTime: string;
  displayDuration: number;
}

interface ScheduleDraft {
  deviceId: string;
  name: string;
  isActive: boolean;
  timezone: string;
  items: ItemDraft[];
}

const BLANK_DRAFT: ScheduleDraft = {
  deviceId: '',
  name: '',
  isActive: true,
  timezone: 'UTC',
  items: [],
};

const BLANK_ITEM: ItemDraft = {
  mediaId: '',
  startTime: '09:00',
  endTime: '17:00',
  displayDuration: 10,
};

export default function Schedules() {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [mediaList, setMediaList] = useState<MediaResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScheduleResponse | null>(null);
  const [draft, setDraft] = useState<ScheduleDraft>(BLANK_DRAFT);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ScheduleResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [viewTarget, setViewTarget] = useState<ScheduleResponse | null>(null);

  const toast = useToast();

  async function load() {
    try {
      const [s, d, m] = await Promise.all([schedulesApi.list(), devicesApi.list(), mediaApi.list()]);
      setSchedules(s);
      setDevices(d.filter((dev) => dev.isPaired));
      setMediaList(m);
    } catch {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setDraft(BLANK_DRAFT);
    setShowForm(true);
  }

  function openEdit(s: ScheduleResponse) {
    setEditing(s);
    setDraft({
      deviceId: s.deviceId,
      name: s.name,
      isActive: s.isActive,
      timezone: s.timezone,
      items: s.items.map((it) => ({
        mediaId: it.mediaId,
        startTime: toTimeInput(it.startTime),
        endTime: toTimeInput(it.endTime),
        displayDuration: it.displayDuration,
      })),
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!draft.deviceId) { toast.error('Please select a device'); return; }
    if (!draft.name.trim()) { toast.error('Please enter a schedule name'); return; }
    if (draft.items.length === 0) { toast.error('Add at least one media item'); return; }
    for (const it of draft.items) {
      if (!it.mediaId) { toast.error('Select media for each item'); return; }
    }

    const payload = {
      deviceId: draft.deviceId,
      name: draft.name.trim(),
      isActive: draft.isActive,
      timezone: draft.timezone,
      items: draft.items.map((it, i): ScheduleItemRequest => ({
        mediaId: it.mediaId,
        displayOrder: i + 1,
        startTime: toTimeApi(it.startTime),
        endTime: toTimeApi(it.endTime),
        displayDuration: it.displayDuration,
      })),
    };

    setSaving(true);
    try {
      if (editing) {
        await schedulesApi.update(editing.id, payload);
        toast.success('Schedule updated');
      } else {
        await schedulesApi.create(payload);
        toast.success('Schedule created');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await schedulesApi.delete(deleteTarget.id);
      toast.success('Schedule deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  }

  function updateItem(i: number, patch: Partial<ItemDraft>) {
    setDraft((d) => ({ ...d, items: d.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) }));
  }

  function addItem() { setDraft((d) => ({ ...d, items: [...d.items, { ...BLANK_ITEM }] })); }

  function removeItem(i: number) { setDraft((d) => ({ ...d, items: d.items.filter((_, idx) => idx !== i) })); }

  return (
    <Layout
      title="Schedules"
      subtitle={`${schedules.length} schedule${schedules.length !== 1 ? 's' : ''}`}
      actions={<button className="btn btn-primary" onClick={openCreate}>＋ New schedule</button>}
    >
      {loading ? (
        <div className="full-center"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : schedules.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📅</span>
          <div className="empty-state-title">No schedules yet</div>
          <div className="empty-state-desc">Create a schedule to tell your devices what to show and when.</div>
        </div>
      ) : (
        <div className="schedule-list">
          {schedules.map((s) => (
            <div key={s.id} className="schedule-row">
              <div className="schedule-row-info">
                <div className="schedule-row-name">{s.name}</div>
                <div className="schedule-row-meta">
                  <span>📺 {s.deviceName || 'Unknown device'}</span>
                  <span>🕐 {s.timezone}</span>
                  <span>{s.items?.length ?? 0} item{(s.items?.length ?? 0) !== 1 ? 's' : ''}</span>
                  <span>Updated {new Date(s.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={`badge ${s.isActive ? 'badge-active' : 'badge-inactive'}`}>
                {s.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className="schedule-row-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setViewTarget(s)}>View</button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                <button className="btn btn-danger-ghost btn-sm" onClick={() => setDeleteTarget(s)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <Modal
          title={editing ? 'Edit schedule' : 'New schedule'}
          onClose={() => setShowForm(false)}
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" /> : editing ? 'Save changes' : 'Create schedule'}
              </button>
            </>
          }
        >
          {/* Schedule fields */}
          <div className="form-row">
            <div className="form-group">
              <label className="label">Schedule name</label>
              <input className="input" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Morning menu" />
            </div>
            <div className="form-group">
              <label className="label">Device</label>
              <select className="input" value={draft.deviceId} onChange={(e) => setDraft((d) => ({ ...d, deviceId: e.target.value }))}>
                <option value="">Select device…</option>
                {devices.map((dev) => <option key={dev.id} value={dev.id}>{dev.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">Timezone</label>
              <select className="input" value={draft.timezone} onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))}>
                {['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
                  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Dubai',
                  'Asia/Riyadh', 'Australia/Sydney'].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label className="label">Status</label>
              <div className="toggle-row">
                <span className="toggle-label">{draft.isActive ? 'Active' : 'Inactive'}</span>
                <label className="toggle">
                  <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))} />
                  <span className="toggle-track" />
                </label>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label className="label" style={{ marginBottom: 0 }}>Content items ({draft.items.length})</label>
              <button className="btn btn-secondary btn-sm" onClick={addItem}>＋ Add item</button>
            </div>

            {draft.items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
                No items yet — click "Add item" to add media
              </div>
            ) : (
              <div className="schedule-items">
                {draft.items.map((item, i) => (
                  <div key={i} className="schedule-item-row">
                    <div className="schedule-item-header">
                      <span>Item {i + 1}</span>
                      <button className="btn btn-danger-ghost btn-sm" onClick={() => removeItem(i)}>Remove</button>
                    </div>
                    <div className="form-group">
                      <label className="label">Media file</label>
                      <select className="input" value={item.mediaId} onChange={(e) => updateItem(i, { mediaId: e.target.value })}>
                        <option value="">Select media…</option>
                        {mediaList.map((m) => <option key={m.id} value={m.id}>{m.fileType === 'Video' ? '🎬' : '🖼️'} {m.fileName}</option>)}
                      </select>
                    </div>
                    <div className="form-row-3">
                      <div className="form-group">
                        <label className="label">Start time</label>
                        <input className="input" type="time" value={item.startTime} onChange={(e) => updateItem(i, { startTime: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="label">End time</label>
                        <input className="input" type="time" value={item.endTime} onChange={(e) => updateItem(i, { endTime: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="label">Duration (sec)</label>
                        <input className="input" type="number" min={1} value={item.displayDuration} onChange={(e) => updateItem(i, { displayDuration: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewTarget && (
        <Modal title={viewTarget.name} onClose={() => setViewTarget(null)} size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setViewTarget(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setViewTarget(null); openEdit(viewTarget); }}>Edit</button>
            </>
          }
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <span className={`badge ${viewTarget.isActive ? 'badge-active' : 'badge-inactive'}`}>{viewTarget.isActive ? 'Active' : 'Inactive'}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📺 {viewTarget.deviceName}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🕐 {viewTarget.timezone}</span>
          </div>
          {viewTarget.items?.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No items in this schedule.</div>
          ) : (
            <div className="schedule-items">
              {viewTarget.items?.map((it, i) => {
                const m = mediaList.find((x) => x.id === it.mediaId);
                return (
                  <div key={it.id} className="schedule-item-row">
                    <div className="schedule-item-header">
                      <span>Item {it.displayOrder ?? i + 1}</span>
                      <span className={`badge ${it.fileType === 'Video' ? 'badge-video' : 'badge-image'}`}>{it.fileType || m?.fileType}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{it.fileName || m?.fileName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16, marginTop: 4 }}>
                      <span>⏰ {toTimeInput(it.startTime)} → {toTimeInput(it.endTime)}</span>
                      <span>⏱ {it.displayDuration}s display</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Delete schedule" onClose={() => setDeleteTarget(null)}
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
            Delete schedule <strong style={{ color: 'var(--text)' }}>{deleteTarget.name}</strong>? All its content items will also be removed. This cannot be undone.
          </p>
        </Modal>
      )}
    </Layout>
  );
}
