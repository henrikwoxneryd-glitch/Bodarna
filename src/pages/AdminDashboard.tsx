import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bolt_Database } from '../lib/Bolt_Database';
import { useAuth } from '../lib/auth';
import { Booth } from '../types/database';

// ---------- Huvudkomponent ----------
export function AdminDashboard() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [notifications, setNotifications] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAddBooth, setShowAddBooth] = useState(false);
  const [showEditBooth, setShowEditBooth] = useState<Booth | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();

  useEffect(() => {
    loadBooths();
    loadNotifications();

    const boothsSubscription = Bolt_Database()
      .channel('booths-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booths' }, loadBooths)
      .subscribe();

    const ordersSubscription = Bolt_Database()
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadNotifications)
      .subscribe();

    const productsSubscription = Bolt_Database()
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadNotifications)
      .subscribe();

    return () => {
      boothsSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
      productsSubscription.unsubscribe();
    };
  }, []);

  const loadBooths = async () => {
    try {
      const { data, error } = await Bolt_Database().from('booths').select('*').order('booth_number');
      if (error) throw error;
      setBooths(data || []);
    } catch (err) {
      console.error('Error loading booths:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data: orders, error: ordersError } = await Bolt_Database<{ booth_id: string }>()
        .from('orders')
        .select('booth_id')
        .eq('status', 'pending');
      if (ordersError) throw ordersError;

      const { data: products, error: productsError } = await Bolt_Database<{ booth_id: string }>()
        .from('products')
        .select('booth_id')
        .eq('is_out_of_stock', true);
      if (productsError) throw productsError;

      const notifMap = new Map<string, number>();
      orders?.forEach((o) => notifMap.set(o.booth_id, (notifMap.get(o.booth_id) || 0) + 1));
      products?.forEach((p) => notifMap.set(p.booth_id, (notifMap.get(p.booth_id) || 0) + 1));

      setNotifications(notifMap);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading) return <div className="loading">Laddar...</div>;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🎄 Julmarknad</h1>
          <div className="header-actions">
            <span>Hej, {profile?.full_name}</span>
            <button onClick={() => setShowAddBooth(true)}>+ Lägg till Bod</button>
            <button onClick={() => setShowBroadcast(true)}>📢 Skicka till Alla</button>
            <button onClick={handleSignOut}>Logga Ut</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <h2 style={{ color: 'var(--christmas-red)', marginBottom: '20px' }}>Alla Bodar ({booths.length})</h2>

        {booths.length === 0 ? (
          <div className="empty-state">
            <p>Inga bodar än. Lägg till din första bod!</p>
          </div>
        ) : (
          <div className="booths-grid">
            {booths.map((booth) => (
              <div key={booth.id} className="booth-card">
                {notifications.get(booth.id) && <div className="notification-badge">{notifications.get(booth.id)}</div>}
                <div className="booth-card-clickable" onClick={() => navigate(`/booth/${booth.id}`)} style={{ cursor: 'pointer' }}>
                  <h3>{booth.booth_name}</h3>
                  <span className="booth-number">Bod #{booth.booth_number}</span>
                  <p>{booth.description}</p>
                </div>
                <div className="booth-card-actions">
                  <button className="btn btn-small" onClick={() => setShowEditBooth(booth)}>Redigera</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAddBooth && <AddBoothModal onClose={() => setShowAddBooth(false)} onSuccess={loadBooths} />}
      {showEditBooth && <EditBoothModal booth={showEditBooth} onClose={() => setShowEditBooth(null)} onSuccess={loadBooths} />}
      {showBroadcast && user && <BroadcastModal onClose={() => setShowBroadcast(false)} user={user} />}
    </div>
  );
}

// ---------- Modaler ----------
function AddBoothModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [boothNumber, setBoothNumber] = useState('');
  const [boothName, setBoothName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await Bolt_Database()
        .from('booths')
        .insert([{ booth_number: boothNumber, booth_name: boothName, description }]);
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Lägg till Ny Bod</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Bodnummer</label>
            <input type="text" value={boothNumber} onChange={(e) => setBoothNumber(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Bodnamn</label>
            <input type="text" value={boothName} onChange={(e) => setBoothName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Beskrivning</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Skapar...' : 'Skapa Bod'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditBoothModal({ booth, onClose, onSuccess }: { booth: Booth; onClose: () => void; onSuccess: () => void }) {
  const [boothNumber, setBoothNumber] = useState(booth.booth_number);
  const [boothName, setBoothName] = useState(booth.booth_name);
  const [description, setDescription] = useState(booth.description);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await Bolt_Database()
        .from('booths')
        .update({ booth_number: boothNumber, booth_name: boothName, description })
        .eq('id', booth.id);
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Redigera Bod</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Bodnummer</label>
            <input type="text" value={boothNumber} onChange={(e) => setBoothNumber(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Bodnamn</label>
            <input type="text" value={boothName} onChange={(e) => setBoothName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Beskrivning</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Sparar...' : 'Spara'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BroadcastModal({ onClose, user }: { onClose: () => void; user: any }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await Bolt_Database()
        .from('messages')
        .insert([{ from_user_id: user.id, to_booth_id: null, message }]);
      if (error) throw error;
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Ett okänt fel uppstod.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Skicka Meddelande till Alla Bodar</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Meddelande</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Skickar...' : 'Skicka'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
