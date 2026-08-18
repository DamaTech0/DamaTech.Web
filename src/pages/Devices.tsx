import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { devicesApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import type { DeviceResponse, PairingResponse } from '../types';

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Devices() {
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [pairingResult, setPairingResult] = useState<PairingResponse | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);

  const [renameTarget, setRenameTarget] = useState<DeviceResponse | null>(null);
  const [newName, setNewName] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeviceResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const toast = useToast();

  async function load() {
    try {
      setDevices(await devicesApi.list());
    } catch {
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handlePair() {
    setPairingLoading(true);
    try {
      const res = await devicesApi.pair();
      setPairingResult(res);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPairingLoading(false);
    }
  }

  async function handleRename() {
    if (!renameTarget || !newName.trim()) return;
    setRenameLoading(true);
    try {
      await devicesApi.update(renameTarget.id, newName.trim());
      toast.success('Device renamed');
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
      await devicesApi.delete(deleteTarget.id);
      toast.success('Device deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleteLoading(false);
    }
  }

  const paired = devices.filter((d) => d.isPaired);
  const unpaired = devices.filter((d) => !d.isPaired);

  return (
    <Layout
      title="Devices"
      subtitle={`${paired.length} paired device${paired.length !== 1 ? 's' : ''}`}
      actions={
        <button className="btn btn-primary" onClick={handlePair} disabled={pairingLoading}>
          {pairingLoading ? <span className="spinner" /> : '＋ Add device'}
        </button>
      }
    >
      {loading ? (
        <div className="full-center"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : devices.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📺</span>
          <div className="empty-state-title">No devices yet</div>
          <div className="empty-state-desc">Click "Add device" to generate a pairing code and connect your first screen.</div>
        </div>
      ) : (
        <>
          {paired.length > 0 && (
            <>
              <div className="section-label">Paired devices</div>
              <div className="device-grid" style={{ marginBottom: unpaired.length > 0 ? 28 : 0 }}>
                {paired.map((d) => (
                  <DeviceCard
                    key={d.id}
                    device={d}
                    onRename={() => { setRenameTarget(d); setNewName(d.name); }}
                    onDelete={() => setDeleteTarget(d)}
                  />
                ))}
              </div>
            </>
          )}

          {unpaired.length > 0 && (
            <>
              <div className="section-label">Awaiting pairing</div>
              <div className="device-grid">
                {unpaired.map((d) => (
                  <DeviceCard
                    key={d.id}
                    device={d}
                    onRename={() => { setRenameTarget(d); setNewName(d.name); }}
                    onDelete={() => setDeleteTarget(d)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Pairing Code Modal */}
      {pairingResult && (
        <Modal
          title="Pair a new device"
          onClose={() => setPairingResult(null)}
          footer={<button className="btn btn-secondary" onClick={() => setPairingResult(null)}>Done</button>}
        >
          <div className="pairing-code">
            {pairingResult.code.split('').map((digit, i) => (
              <div key={i} className="pairing-digit">{digit}</div>
            ))}
          </div>
          <div className="pairing-expiry">
            Expires at {new Date(pairingResult.expiresAt).toLocaleTimeString()} · valid for 15 minutes
          </div>
          <div className="pairing-instructions">
            On your player device, enter this 6-digit code when prompted. The device will automatically pair and appear in your device list.
          </div>
        </Modal>
      )}

      {/* Rename Modal */}
      {renameTarget && (
        <Modal
          title="Rename device"
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
            <label className="label">Device name</label>
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

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal
          title="Delete device"
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
            Are you sure you want to delete <strong style={{ color: 'var(--text)' }}>{deleteTarget.name}</strong>?
            All associated schedules will also be deleted. This cannot be undone.
          </p>
        </Modal>
      )}
    </Layout>
  );
}

function DeviceCard({
  device,
  onRename,
  onDelete,
}: {
  device: DeviceResponse;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="device-card">
      <div className="device-card-top">
        <div>
          <div className="device-card-name">{device.name}</div>
          <div className="device-card-meta">
            {device.deviceUuid && (
              <div className="device-card-uuid">{device.deviceUuid.slice(0, 18)}…</div>
            )}
            <div className="device-card-date">Added {new Date(device.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="device-card-actions">
          <button className="btn btn-ghost btn-icon-sm" onClick={onRename} title="Rename">✏️</button>
          <button className="btn btn-danger-ghost btn-icon-sm" onClick={onDelete} title="Delete">🗑️</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className={`badge ${device.isPaired ? (device.isOnline ? 'badge-online' : 'badge-offline') : 'badge-inactive'}`}>
          <span className="badge-dot" />
          {!device.isPaired ? 'Awaiting pair' : device.isOnline ? 'Online' : 'Offline'}
        </span>
        {device.lastHeartbeat && (
          <span className="device-card-heartbeat">Last seen {timeAgo(device.lastHeartbeat)}</span>
        )}
      </div>
    </div>
  );
}
