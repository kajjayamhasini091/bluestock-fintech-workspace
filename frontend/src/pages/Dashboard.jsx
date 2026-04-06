import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

const MOCK_DAILY = [
  { day: "Mon", requests: 142 }, { day: "Tue", requests: 238 },
  { day: "Wed", requests: 195 }, { day: "Thu", requests: 312 },
  { day: "Fri", requests: 287 }, { day: "Sat", requests: 89 },
  { day: "Sun", requests: 54 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [createdKey, setCreatedKey] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/summary").then(r => setSummary(r.data)).catch(() => {}),
      api.get("/auth/api-keys").then(r => setApiKeys(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function createKey() {
    if (!newKeyLabel.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/auth/api-keys", { label: newKeyLabel });
      setCreatedKey(res.data);
      setApiKeys(prev => [...prev, res.data]);
      setNewKeyLabel("");
    } catch {}
    setCreating(false);
  }

  async function revokeKey(id) {
    await api.delete(`/auth/api-keys/${id}`);
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: false } : k));
  }

  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading dashboard…</p></div>;

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <h2>Welcome back{user?.name ? `, ${user.name}` : ""}</h2>
          <p className="dash-sub">India Address API — Developer Dashboard</p>
        </div>
        <div className="header-badge">
          <span className="status-dot" /> Live
        </div>
      </header>

      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard label="Total Requests" value={summary?.totalRequests ?? "—"} icon="⚡" color="#f97316" />
        <StatCard label="Last 24 Hours" value={summary?.last24hRequests ?? "—"} icon="📈" color="#22c55e" />
        <StatCard label="API Keys" value={apiKeys.length} icon="🔑" color="#3b82f6" />
        <StatCard label="Data Coverage" value="600K+" icon="🗺️" color="#a855f7" sub="Villages indexed" />
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Requests This Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_DAILY}>
              <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#f1f5f9" }} />
              <Bar dataKey="requests" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Top Endpoints</h3>
          {summary?.topEndpoints?.length ? (
            <ul className="endpoint-list">
              {summary.topEndpoints.map((e, i) => (
                <li key={i}>
                  <span className="ep-path">{e.endpoint}</span>
                  <span className="ep-count">{e.count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p>No API calls yet. Start making requests to see analytics here.</p>
            </div>
          )}
        </div>
      </div>

      {/* API Keys */}
      <div className="section-card">
        <div className="section-header">
          <h3>API Keys</h3>
          <div className="create-key-row">
            <input
              placeholder="Key label (e.g. Production)"
              value={newKeyLabel}
              onChange={e => setNewKeyLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createKey()}
            />
            <button className="btn-primary small" onClick={createKey} disabled={creating || !newKeyLabel.trim()}>
              {creating ? "Creating…" : "+ New Key"}
            </button>
          </div>
        </div>

        {createdKey && (
          <div className="key-reveal">
            <p>⚠️ Copy your API key now — it won't be shown again.</p>
            <code>{createdKey.key}</code>
            <button onClick={() => { navigator.clipboard.writeText(createdKey.key); }}>Copy</button>
            <button className="dismiss" onClick={() => setCreatedKey(null)}>Dismiss</button>
          </div>
        )}

        <table className="keys-table">
          <thead>
            <tr><th>Label</th><th>Key</th><th>Status</th><th>Last Used</th><th></th></tr>
          </thead>
          <tbody>
            {apiKeys.length === 0 && (
              <tr><td colSpan={5} className="empty-row">No API keys yet. Create one above.</td></tr>
            )}
            {apiKeys.map(k => (
              <tr key={k.id} className={!k.isActive ? "revoked" : ""}>
                <td>{k.label || "—"}</td>
                <td><code className="key-preview">{k.key?.slice(0, 16)}…</code></td>
                <td><span className={`badge ${k.isActive ? "active" : "inactive"}`}>{k.isActive ? "Active" : "Revoked"}</span></td>
                <td>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}</td>
                <td>{k.isActive && <button className="btn-revoke" onClick={() => revokeKey(k.id)}>Revoke</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Reference */}
      <div className="section-card">
        <h3>Quick Reference</h3>
        <div className="endpoints-ref">
          {[
            ["GET", "/api/v1/countries", "List all countries"],
            ["GET", "/api/v1/states?countryId=1", "States by country"],
            ["GET", "/api/v1/districts?stateId=5", "Districts by state"],
            ["GET", "/api/v1/sub-districts?districtId=12", "Sub-districts"],
            ["GET", "/api/v1/villages?search=agra&page=1", "Search villages"],
            ["GET", "/api/v1/villages/:code", "Village by MDDS code"],
          ].map(([method, path, desc]) => (
            <div className="ref-row" key={path}>
              <span className="method">{method}</span>
              <code>{path}</code>
              <span className="ref-desc">{desc}</span>
            </div>
          ))}
        </div>
        <p className="ref-note">All address endpoints require <code>X-API-Key: your_key</code> header.</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + "22", color }}>{icon}</div>
      <div>
        <p className="stat-value">{typeof value === "number" ? value.toLocaleString() : value}</p>
        <p className="stat-label">{label}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}
