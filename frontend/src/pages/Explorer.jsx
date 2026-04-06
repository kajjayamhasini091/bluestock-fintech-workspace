import { useEffect, useState } from "react";
import api from "../utils/api";

export default function Explorer() {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);
  const [villages, setVillages] = useState({ data: [], pagination: {} });

  const [selected, setSelected] = useState({ state: null, district: null, subDistrict: null });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    api.get("/states?countryId=1").then(r => setStates(r.data)).catch(() => {});
  }, []);

  async function selectState(state) {
    setSelected({ state, district: null, subDistrict: null });
    setDistricts([]); setSubDistricts([]); setVillages({ data: [], pagination: {} });
    setLoading(l => ({ ...l, districts: true }));
    const r = await api.get(`/districts?stateId=${state.id}`);
    setDistricts(r.data);
    setLoading(l => ({ ...l, districts: false }));
  }

  async function selectDistrict(district) {
    setSelected(s => ({ ...s, district, subDistrict: null }));
    setSubDistricts([]); setVillages({ data: [], pagination: {} });
    setLoading(l => ({ ...l, subDistricts: true }));
    const r = await api.get(`/sub-districts?districtId=${district.id}`);
    setSubDistricts(r.data);
    setLoading(l => ({ ...l, subDistricts: false }));
  }

  async function selectSubDistrict(sub) {
    setSelected(s => ({ ...s, subDistrict: sub }));
    setPage(1);
    fetchVillages(sub.id, 1, search);
  }

  async function fetchVillages(subDistrictId, pg, q) {
    setLoading(l => ({ ...l, villages: true }));
    const params = new URLSearchParams({ subDistrictId, page: pg, limit: 20 });
    if (q) params.append("search", q);
    const r = await api.get(`/villages?${params}`);
    setVillages(r.data);
    setLoading(l => ({ ...l, villages: false }));
  }

  function handleSearch(e) {
    setSearch(e.target.value);
    if (selected.subDistrict) {
      fetchVillages(selected.subDistrict.id, 1, e.target.value);
      setPage(1);
    }
  }

  function changePage(p) {
    setPage(p);
    fetchVillages(selected.subDistrict.id, p, search);
  }

  return (
    <div className="explorer">
      <div className="explorer-header">
        <h2>Address Explorer</h2>
        <p>Browse the full India administrative hierarchy</p>
      </div>

      <div className="explorer-columns">
        {/* States */}
        <Column title="States" loading={loading.states} empty={states.length === 0 && "No states loaded"}>
          {states.map(s => (
            <ColItem key={s.id} label={s.name} sub={s.code}
              active={selected.state?.id === s.id}
              onClick={() => selectState(s)} />
          ))}
        </Column>

        {/* Districts */}
        <Column title="Districts" loading={loading.districts} empty={!selected.state ? "← Select a state" : districts.length === 0 ? "No districts" : null}>
          {districts.map(d => (
            <ColItem key={d.id} label={d.name} sub={d.code}
              active={selected.district?.id === d.id}
              onClick={() => selectDistrict(d)} />
          ))}
        </Column>

        {/* Sub-Districts */}
        <Column title="Sub-Districts" loading={loading.subDistricts} empty={!selected.district ? "← Select a district" : subDistricts.length === 0 ? "No sub-districts" : null}>
          {subDistricts.map(s => (
            <ColItem key={s.id} label={s.name} sub={s.code}
              active={selected.subDistrict?.id === s.id}
              onClick={() => selectSubDistrict(s)} />
          ))}
        </Column>

        {/* Villages */}
        <div className="col villages-col">
          <div className="col-header">
            <span>Villages</span>
            {villages.pagination.total > 0 && (
              <span className="col-count">{villages.pagination.total.toLocaleString()} total</span>
            )}
          </div>
          {selected.subDistrict && (
            <input className="village-search" placeholder="Search villages…" value={search} onChange={handleSearch} />
          )}
          {!selected.subDistrict && <p className="col-empty">← Select a sub-district</p>}
          {loading.villages && <div className="col-spinner"><div className="spinner small" /></div>}
          {villages.data.map(v => (
            <div className="col-item village-item" key={v.id}>
              <span>{v.name}</span>
              <code className="mdds-code">{v.code}</code>
            </div>
          ))}
          {villages.pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => changePage(page - 1)}>←</button>
              <span>{page} / {villages.pagination.pages}</span>
              <button disabled={page === villages.pagination.pages} onClick={() => changePage(page + 1)}>→</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({ title, children, loading, empty }) {
  return (
    <div className="col">
      <div className="col-header">{title}</div>
      {loading && <div className="col-spinner"><div className="spinner small" /></div>}
      {empty && !loading && <p className="col-empty">{empty}</p>}
      {children}
    </div>
  );
}

function ColItem({ label, sub, active, onClick }) {
  return (
    <div className={`col-item ${active ? "active" : ""}`} onClick={onClick}>
      <span>{label}</span>
      <code className="item-code">{sub}</code>
    </div>
  );
}
