import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bolt_Database } from '../lib/Bolt_Database';
import { useAuth } from '../lib/auth';
import { Booth } from '../types/database';

export default function AdminDashboard() {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [notifications, setNotifications] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAddBooth, setShowAddBooth] = useState(false);
  const [showEditBooth, setShowEditBooth] = useState<Booth | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);

  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  useEffect(() => {
    loadBooths();
    loadNotifications();

    const boothsSubscription = Bolt_Database()
      .channel('booths-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booths' }, () => {
        loadBooths();
      })
      .subscribe();

    const ordersSubscription = Bolt_Database()
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadNotifications();
      })
      .subscribe();

    const productsSubscription = Bolt_Database()
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      boothsSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
      productsSubscription.unsubscribe();
    };
  }, []);

  const loadBooths = async () => {
    try {
      const { data, error } = await Bolt_Database()
        .from('booths')
        .select('*')
        .order('booth_number');

      if (error) throw error;
      setBooths(data || []);
    } catch (error) {
      console.error('Error loading booths:', error);
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
      orders?.forEach(order => {
        notifMap.set(order.booth_id, (notifMap.get(order.booth_id) || 0) + 1);
      });
      products?.forEach(product => {
        notifMap.set(product.booth_id, (notifMap.get(product.booth_id) || 0) + 1);
      });

      setNotifications(notifMap);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const deleteBooth = async (boothId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Är du säker på att du vill radera denna bod?')) return;

    try {
      const { error } = await Bolt_Database()
        .from('booths')
        .delete()
        .eq('id', boothId);

      if (error) throw error;
      loadBooths();
    } catch (error) {
      console.error('Error deleting booth:', error);
      alert('Ett fel uppstod vid radering av bod');
    }
  };

  const handleEditBooth = (booth: Booth, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditBooth(booth);
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
        <h2 style={{ color: 'var(--christmas-red)', marginBottom: '20px' }}>
          Alla Bodar ({booths.length})
        </h2>

        {booths.length === 0 ? (
          <div className="empty-state">
            <p>Inga bodar än. Lägg till din första bod!</p>
          </div>
        ) : (
          <div className="booths-grid">
            {booths.map((booth) => (
              <div key={booth.id} className="booth-card">
                {notifications.get(booth.id) && notifications.get(booth.id)! > 0 && (
                  <div className="notification-badge">{notifications.get(booth.id)}</div>
                )}
                <div
                  className="booth-card-clickable"
                  onClick={() => navigate(`/booth/${booth.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>{booth.booth_name}</h3>
                  <span className="booth-number">Bod #{booth.booth_number}</span>
                  <p>{booth.description}</p>
                </div>
                <div className="booth-card-actions">
                  <button className="btn btn-small" onClick={(e) => handleEditBooth(booth, e)}>
                    Redigera
                  </button>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={(e) => deleteBooth(booth.id, e)}
                    style={{ background: '#c33' }}
                  >
                    Radera
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAddBooth && <AddBoothModal onClose={() => setShowAddBooth(false)} onSuccess={loadBooths} />}
      {showEditBooth && <EditBoothModal booth={showEditBooth} onClose={() => setShowEditBooth(null)} onSuccess={loadBooths} />}
      {showBroadcast && <BroadcastModal onClose={() => setShowBroadcast(false)} />}
    </div>
  );
}

// --- Lägg till AddBoothModal, EditBoothModal, BroadcastModal ---
// Samma som du redan har, bara se till att varje async function har **en try/catch** och inga dubbletter.
