import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { devicesApi } from '../api/client';
import { mediaApi } from '../api/client';
import { schedulesApi } from '../api/client';
import type { DeviceResponse, MediaResponse, ScheduleResponse } from '../types';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const [devices, setDevices] = useState<DeviceResponse[]>([]);
  const [media, setMedia] = useState<MediaResponse[]>([]);
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([devicesApi.list(), mediaApi.list(), schedulesApi.list()])
      .then(([d, m, s]) => { setDevices(d); setMedia(m); setSchedules(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onlineCount = devices.filter((d) => d.isOnline).length;
  const pairedCount = devices.filter((d) => d.isPaired).length;
  const totalStorage = media.reduce((acc, m) => acc + m.sizeInBytes, 0);
  const activeSchedules = schedules.filter((s) => s.isActive).length;

  const stats = [
    { label: 'Total Devices', value: pairedCount, sub: `${onlineCount} online`, icon: '📺', color: 'var(--primary)', path: '/devices' },
    { label: 'Media Files', value: media.length, sub: formatBytes(totalStorage), icon: '🖼️', color: 'var(--purple)', path: '/media' },
    { label: 'Schedules', value: schedules.length, sub: `${activeSchedules} active`, icon: '📅', color: 'var(--success)', path: '/schedules' },
    { label: 'Online Now', value: onlineCount, sub: onlineCount > 0 ? 'screens live' : 'no screens live', icon: '🟢', color: 'var(--success)', path: '/devices' },
  ];

  return (
    <Layout title="Dashboard" subtitle="Overview of your signage network">
      {loading ? (
        <div className="full-center"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate(s.path)}>
                <div className="stat-card-top">
                  <span className="stat-card-label">{s.label}</span>
                  <span className="stat-card-icon">{s.icon}</span>
                </div>
                <div className="stat-card-num" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Recent Devices */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Devices</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/devices')}>View all →</button>
              </div>
              {devices.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <span className="empty-state-icon">📺</span>
                  <span className="empty-state-desc">No devices paired yet</span>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/devices')}>Add device</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {devices.slice(0, 5).map((d) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {d.lastHeartbeat ? `Last seen ${timeAgo(d.lastHeartbeat)}` : 'Never connected'}
                        </div>
                      </div>
                      <span className={`badge ${d.isOnline ? 'badge-online' : 'badge-offline'}`}>
                        <span className="badge-dot" />
                        {d.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Media */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Recent Media</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/media')}>View all →</button>
              </div>
              {media.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                  <span className="empty-state-icon">🖼️</span>
                  <span className="empty-state-desc">No media uploaded yet</span>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/media')}>Upload media</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {media.slice(0, 5).map((m) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 22 }}>{m.fileType === 'Video' ? '🎬' : '🖼️'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.fileName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatBytes(m.sizeInBytes)} · {timeAgo(m.uploadedAt)}</div>
                      </div>
                      <span className={`badge ${m.fileType === 'Video' ? 'badge-video' : 'badge-image'}`}>{m.fileType}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
