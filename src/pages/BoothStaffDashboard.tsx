import { useState, useEffect } from 'react';
import { Bolt_Database } from '../lib/Bolt_Database';
import { useAuth } from '../lib/auth';
import { Booth, Product, Message } from '../types/database';

export default function BoothStaffDashboard() {
  const [booth, setBooth] = useState<Booth | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateOrder, setShowCreateOrder] = useState<Product | null>(null);

  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    loadBoothData();

    const productsSub = Bolt_Database()
      .channel('staff-products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        if (booth?.id) loadProducts(booth.id);
      })
      .subscribe();

    const messagesSub = Bolt_Database()
      .channel('staff-messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      productsSub.unsubscribe();
      messagesSub.unsubscribe();
    };
  }, [user, booth]);

  const loadBoothData = async () => {
    setLoading(true);
    await loadBooth();
    setLoading(false);
  };

  const loadBooth = async () => {
    if (!user) return;

    try {
      const { data, error } = await Bolt_Database()
        .from<Booth>('booths')
        .select('*')
        .eq('staff_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBooth(data);
        await loadProducts(data.id);
        await loadMessages(data.id);
      } else {
        console.warn('Ingen bod hittades för denna användare.');
      }
    } catch (err) {
      console.error('Error loading booth:', err);
    }
  };

  const loadProducts = async (boothId: string) => {
    try {
      const { data, error } = await Bolt_Database()
        .from<Product>('products')
        .select('*')
        .eq('booth_id', boothId)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const loadMessages = async (boothId?: string) => {
    const id = boothId || booth?.id;
    if (!id) return;

    try {
      const { data, error } = await Bolt_Database()
        .from<Message>('messages')
        .select('*')
        .or(`to_booth_id.eq.${id},to_booth_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const toggleOutOfStock = async (product: Product) => {
    try {
      const { error } = await Bolt_Database()
        .from<Product>('products')
        .update({ is_out_of_stock: !product.is_out_of_stock })
        .eq('id', product.id);

      if (error) throw error;
      if (booth?.id) loadProducts(booth.id);
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await Bolt_Database()
        .from<Message>('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      if (booth?.id) loadMessages(booth.id);
    } catch (err) {
      console.error('Error marking message as read:', err);
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

  if (!booth) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1>🎄 Julmarknad</h1>
            <div className="header-actions">
              <span>Hej, {profile?.full_name}</span>
              <button onClick={handleSignOut}>Logga Ut</button>
            </div>
          </div>
        </header>
        <main className="main-content">
          <div className="empty-state">
            <h2>Du är inte tilldelad en bod ännu</h2>
            <p>Kontakta administratören för att få tillgång till din bod.</p>
          </div>
        </main>
      </div>
    );
  }

  const unreadMessages = messages.filter(m => !m.is_read);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🎄 {booth.booth_name}</h1>
          <div className="header-actions">
            <span>Hej, {profile?.full_name}</span>
            <button onClick={handleSignOut}>Logga Ut</button>
          </div>
        </div>
      </header>

      <main className="main-content booth-detail">
        <div className="booth-info">
          <h2>{booth.booth_name}</h2>
          <span className="booth-number">Bod #{booth.booth_number}</span>
          <p style={{ marginTop: '16px' }}>{booth.description}</p>
        </div>

        {unreadMessages.length > 0 && (
          <div className="notifications-section">
            <h3>🔔 Meddelanden ({unreadMessages.length})</h3>
            {unreadMessages.map(msg => (
              <div key={msg.id} className="notification-item unread">
                <strong>{msg.to_booth_id ? 'Meddelande till er bod' : 'Meddelande till alla bodar'}</strong>
                <p>{msg.message}</p>
                <div className="notification-time">{new Date(msg.created_at).toLocaleString('sv-SE')}</div>
                <button className="btn btn-small" onClick={() => markMessageAsRead(msg.id)} style={{ marginTop: '8px' }}>
                  Markera som Läst
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="products-section">
          <h3>Varor i Din Bod</h3>
          {products.length === 0 ? (
            <div className="empty-state">
              <p>Inga varor i boden ännu. Kontakta administratören.</p>
            </div>
          ) : (
            <div className="products-list">
              {products.map(product => (
                <div key={product.id} className={`product-item ${product.is_out_of_stock ? 'out-of-stock' : ''}`}>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <div className="product-price">{product.price} kr</div>
                    {product.is_out_of_stock && <span className="status-badge pending">Slut i lager</span>}
                  </div>
                  <div className="product-actions">
                    <button
                      className={`icon-btn ${product.is_out_of_stock ? 'success' : 'warning'}`}
                      onClick={() => toggleOutOfStock(product)}
                      title={product.is_out_of_stock ? 'Markera som i lager' : 'Markera som slut'}
                    >
                      {product.is_out_of_stock ? '✅' : '⚠️'}
                    </button>
                    <button className="icon-btn" onClick={() => setShowCreateOrder(product)} title="Beställ mer">
                      🛒
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreateOrder && <CreateOrderModal product={showCreateOrder} boothId={booth.id} onClose={() => setShowCreateOrder(null)} />}
    </div>
  );
}

/* --- MODAL --- */

function CreateOrderModal({ product, boothId, onClose }: { product: Product; boothId: string; onClose: () => void }) {
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('Ingen användare inloggad.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await Bolt_Database().from('orders').insert([{
        booth_id: boothId,
        product_id: product.id,
        quantity: parseInt(quantity),
        notes,
        created_by: user.id
      }]);

      if (error) throw error;
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Okänt fel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Beställ {product.name}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Antal</label>
            <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Kommentar (valfritt)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="T.ex. behövs snart..." />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Beställer...' : 'Skicka Beställning'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
