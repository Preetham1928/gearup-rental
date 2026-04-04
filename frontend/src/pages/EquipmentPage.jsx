import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EMOJIS = {
  laptop:'💻', camera:'📷', gaming:'🎮', books:'📚',
  sports:'🏏', music:'🎵', events:'🎭', other:'📦',
  crane:'🏗️', excavator:'⛏️', generator:'⚡',
  compressor:'🔩', mixer:'🚧', bulldozer:'🚜'
};

export default function EquipmentPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name:'', category:'laptop', dailyRate:'', description:'', emoji:'💻', status:'available' });
  const [rentForm, setRentForm] = useState({ startDate:'', endDate:'', purpose:'' });
  const [summary, setSummary] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/equipment?${params}`);
      setItems(res.data?.data || []);
    } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Rental summary calculation
  useEffect(() => {
    if (selectedItem && rentForm.startDate && rentForm.endDate) {
      const days = Math.ceil((new Date(rentForm.endDate) - new Date(rentForm.startDate)) / 86400000);
      if (days > 0) setSummary({ days, total: days * selectedItem.dailyRate });
      else setSummary(null);
    } else setSummary(null);
  }, [rentForm, selectedItem]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name:'', category:'laptop', dailyRate:'', description:'', emoji:'💻', status:'available' });
    setShowAddModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name:item.name, category:item.category, dailyRate:item.dailyRate, description:item.description||'', emoji:item.emoji||'📦', status:item.status });
    setShowAddModal(true);
  };

  const openRent = (item) => {
    setSelectedItem(item);
    setRentForm({ startDate:'', endDate:'', purpose:'' });
    setSummary(null);
    setShowRentModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.dailyRate) { alert('Please fill name and daily rate'); return; }
    setSaving(true);
    try {
      if (editItem) await api.put(`/equipment/${editItem.id}`, form);
      else await api.post('/equipment', form);
      setShowAddModal(false);
      fetchItems();
    } catch (e) { alert(e.response?.data?.error || 'Error saving item'); }
    finally { setSaving(false); }
  };

  const handleRent = async () => {
    if (!rentForm.startDate || !rentForm.endDate) { alert('Please select dates'); return; }
    setSaving(true);
    try {
      const count = await api.get('/rentals').then(r => r.data?.total || 0).catch(() => 0);
      await api.post('/rentals', {
        equipmentId: selectedItem.id,
        startDate: rentForm.startDate,
        endDate: rentForm.endDate,
        purpose: rentForm.purpose
      });
      setShowRentModal(false);
      alert('✅ Rental request submitted successfully!');
      fetchItems();
    } catch (e) { alert(e.response?.data?.error || 'Failed to create rental'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Retire this item?')) return;
    try { await api.delete(`/equipment/${id}`); fetchItems(); }
    catch (e) { alert(e.response?.data?.error || 'Error'); }
  };

  // All roles can add items now
  const canManage = true;
  const canDelete = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎒 Browse Gear</h1>
          <p className="page-sub">Find and rent what you need — or list your own item!</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ List Item</button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-wrap" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input className="form-control search-input"
            placeholder="Search laptops, cameras, books..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 160 }}
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="available">✅ Available</option>
          <option value="rented">📦 Rented</option>
          <option value="maintenance">🔧 Maintenance</option>
        </select>
      </div>

      {/* Category chips */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
        {['All','💻 Laptops','📷 Cameras','🎮 Gaming','📚 Books','🏏 Sports','🎵 Music','🎭 Events'].map(c => (
          <button key={c} className="chip" onClick={() => setSearch(c === 'All' ? '' : c.split(' ')[1])}>
            {c}
          </button>
        ))}
      </div>

      {loading
        ? <div className="loading-wrapper"><div className="spinner" /></div>
        : items.length === 0
          ? (
            <div className="empty-state panel">
              <div className="icon">🔍</div>
              <p>No items found</p>
              <button className="btn btn-primary" onClick={openAdd}>+ List First Item</button>
            </div>
          )
          : (
            <div className="grid-3">
              {items.map(item => (
                <div key={item.id} className="panel"
                  style={{ overflow:'hidden', transition:'all .2s', cursor:'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(124,58,237,0.18)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=''; }}>

                  {/* Card top */}
                  <div style={{ background:'linear-gradient(135deg,#f7f3ff,#fce7f3)', height:110, display:'flex', alignItems:'center', justifyContent:'center', fontSize:54, position:'relative' }}>
                    {item.emoji}
                    <div style={{ position:'absolute', top:10, right:10 }}>
                      <span className={`badge badge-${item.status}`}>{item.status}</span>
                    </div>
                  </div>

                  <div style={{ padding:'14px 18px' }}>
                    <div style={{ fontWeight:800, fontSize:15, marginBottom:4, color:'#1e1b4b' }}>{item.name}</div>
                    <div style={{ fontSize:12, color:'#9ca3af', fontWeight:600, marginBottom:10, textTransform:'capitalize' }}>
                      {item.category} · {item.equipmentId}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                      <div>
                        <span style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'#7c3aed' }}>
                          ₹{Number(item.dailyRate).toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>/day</span>
                      </div>
                      {canDelete && (
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => openEdit(item)}>✏️</button>
                          <button className="btn btn-danger btn-xs" onClick={() => handleDelete(item.id)}>🗑️</button>
                        </div>
                      )}
                    </div>

                    {item.status === 'available'
                      ? (
                        <button className="btn btn-primary btn-sm"
                          style={{ width:'100%', justifyContent:'center' }}
                          onClick={() => openRent(item)}>
                          🛒 Rent Now
                        </button>
                      )
                      : (
                        <button className="btn btn-ghost btn-sm"
                          style={{ width:'100%', justifyContent:'center', cursor:'not-allowed', opacity:0.5 }}
                          disabled>
                          {item.status === 'rented' ? '📦 Currently Rented' : '🔧 In Maintenance'}
                        </button>
                      )
                    }
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {/* ── Add / Edit Item Modal ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowAddModal(false)}>
          <div className="modal">
            <div className="modal-title">{editItem ? '✏️ Edit Item' : '➕ List New Item'}</div>
            <div className="form-group">
              <label>Item Name *</label>
              <input className="form-control" value={form.name}
                onChange={e => setForm(f => ({...f, name:e.target.value}))}
                placeholder="e.g. MacBook Pro M3, Canon EOS R50..." />
            </div>
            <div className="grid-2" style={{ gap:12 }}>
              <div className="form-group">
                <label>Category *</label>
                <select className="form-control" value={form.category}
                  onChange={e => setForm(f => ({...f, category:e.target.value, emoji:EMOJIS[e.target.value]||'📦'}))}>
                  <option value="laptop">💻 Laptop</option>
                  <option value="camera">📷 Camera</option>
                  <option value="gaming">🎮 Gaming</option>
                  <option value="books">📚 Books</option>
                  <option value="sports">🏏 Sports</option>
                  <option value="music">🎵 Music</option>
                  <option value="events">🎭 Events</option>
                  <option value="other">📦 Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Daily Rate (₹) *</label>
                <input type="number" className="form-control" value={form.dailyRate}
                  onChange={e => setForm(f => ({...f, dailyRate:e.target.value}))}
                  placeholder="e.g. 500" />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" value={form.description}
                onChange={e => setForm(f => ({...f, description:e.target.value}))}
                placeholder="Condition, specs, any notes..." />
            </div>
            {editItem && (
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status}
                  onChange={e => setForm(f => ({...f, status:e.target.value}))}>
                  <option value="available">✅ Available</option>
                  <option value="maintenance">🔧 Maintenance</option>
                  <option value="retired">❌ Retired</option>
                </select>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editItem ? '✅ Save Changes' : '🚀 List Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rent Now Modal ── */}
      {showRentModal && selectedItem && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowRentModal(false)}>
          <div className="modal">
            <div className="modal-title">🛒 Rent — {selectedItem.emoji} {selectedItem.name}</div>

            {/* Item info */}
            <div style={{ background:'linear-gradient(135deg,#f7f3ff,#fce7f3)', borderRadius:16, padding:16, marginBottom:20, display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:48 }}>{selectedItem.emoji}</div>
              <div>
                <div style={{ fontWeight:800, fontSize:16 }}>{selectedItem.name}</div>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'#7c3aed' }}>
                  ₹{Number(selectedItem.dailyRate).toLocaleString('en-IN')}<span style={{ fontFamily:'Nunito,sans-serif', fontSize:13, color:'#9ca3af', fontWeight:600 }}>/day</span>
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ gap:12 }}>
              <div className="form-group">
                <label>📅 Start Date *</label>
                <input type="date" className="form-control" value={rentForm.startDate}
                  onChange={e => setRentForm(f => ({...f, startDate:e.target.value}))}
                  min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label>📅 End Date *</label>
                <input type="date" className="form-control" value={rentForm.endDate}
                  onChange={e => setRentForm(f => ({...f, endDate:e.target.value}))}
                  min={rentForm.startDate || new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="form-group">
              <label>📝 Purpose</label>
              <input className="form-control" value={rentForm.purpose}
                onChange={e => setRentForm(f => ({...f, purpose:e.target.value}))}
                placeholder="e.g. College project, Sports tournament..." />
            </div>

            {/* Live summary */}
            {summary && (
              <div style={{ background:'#f7f3ff', borderRadius:16, padding:16, marginBottom:8, border:'2px solid #ede9fe' }}>
                <div style={{ fontWeight:800, fontSize:13, color:'#7c3aed', marginBottom:8 }}>📋 Rental Summary</div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:700, color:'#6b7280', marginBottom:6 }}>
                  <span>Duration</span><span>{summary.days} day{summary.days > 1 ? 's' : ''}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:700, color:'#6b7280', marginBottom:8 }}>
                  <span>Rate</span><span>₹{Number(selectedItem.dailyRate).toLocaleString('en-IN')}/day</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'#7c3aed', borderTop:'2px solid #ede9fe', paddingTop:8 }}>
                  <span>TOTAL</span><span>₹{Number(summary.total).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowRentModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRent} disabled={saving}>
                {saving ? 'Submitting...' : '🚀 Confirm Rental'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
