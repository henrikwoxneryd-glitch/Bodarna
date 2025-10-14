import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bolt_Database } from '../lib/Bolt_Database';
import { useAuth } from '../lib/auth';
import { Booth, Product, Order, Message } from '../types/database';

export default function BoothDetail() {
  const { boothId } = useParams<{ boothId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booth, setBooth] = useState<Booth | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!boothId) return;

    loadBoothData();

    const productsSub = Bolt_Database()
      .channel('products-booth-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `booth_id=eq.${boothId}` }, () => loadProducts())
      .subscribe();

    const ordersSub = Bolt_Database()
      .channel('orders-booth-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `booth_id=eq.${boothId}` }, () => loadOrders())
      .subscribe();

    const messagesSub = Bolt_Database()
      .channel('messages-booth-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadMessages())
      .subscribe();

    return () => {
      productsSub.unsubscribe();
      ordersSub.unsubscribe();
      messagesSub.unsubscribe();
    };
  }, [boothId]);

  const loadBoothData = async () => {
    setLoading(true);
    await Promise.all([loadBooth(), loadProducts(), loadOrders(), loadMessages()]);
    setLoading(false);
  };

  const loadBooth = async () => {
    if (!boothId) return;
    try {
      const { data, error } = await Bolt_Database().from<Booth>('booths').select('*').eq('id', boothId).maybeSingle();
      if (error) throw error;
      setBooth(data || null);
    } catch (err) {
      console.error('Error loading booth:', err);
    }
  };

  const loadProducts = async () => {
    if (!boothId) return;
    try {
      const { data, error } = await Bolt_Database().from<Product>('products').select('*').eq('booth_id', boothId).order('name');
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const loadOrders = async () => {
    if (!boothId) return;
    try {
      const { data, error } = await Bolt_Database()
        .from<Order>('orders')
        .select('*, products(name)')
        .eq('booth_id', boothId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const loadMessages = async () => {
    if (!boothId) return;
    try {
      const { data, error } = await Bolt_Database()
        .from<Message>('messages')
        .select('*')
        .or(`to_booth_id.eq.${boothId},to_booth_id.is.null`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna vara?')) return;
    try {
      const { error } = await Bolt_Database().from('products').delete().eq('id', productId);
      if (error) throw error;
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await Bolt_Database().from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      await loadOrders();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  if (loading) return <div className="loading">Laddar...</div>;
  if (!booth) return <div className="loading">Bod hittades inte</div>;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const outOfStockProducts = products.filter(p => p.is_out_of_stock);
  const unreadMessages = messages.filter(m => !m.is_read);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🎄 {booth.booth_name}</h1>
          <div className="header-actions">
            <button onClick={() => navigate('/')}>Tillbaka</button>
          </div>
        </div>
      </header>

      <main className="main-content booth-detail">
        {/* Bod info */}
        <div className="booth-info">
          <h2>{booth.booth_name}</h2>
          <span className="booth-number">Bod #{booth.booth_number}</span>
          <p style={{ marginTop: '16px' }}>{booth.description}</p>
        </div>

        {/* Notiser */}
        {(pendingOrders.length || outOfStockProducts.length || unreadMessages.length) > 0 && (
          <div className="notifications-section">
            <h3>🔔 Notiser</h3>
            {unreadMessages.map(msg => (
              <div key={msg.id} className="notification-item unread">
                <strong>{msg.to_booth_id ? 'Meddelande till er bod' : 'Meddelande till alla'}</strong>
                <p>{msg.message}</p>
                <div className="notification-time">{new Date(msg.created_at).toLocaleString('sv-SE')}</div>
              </div>
            ))}

            {pendingOrders.map(order => (
              <div key={order.id} className="notification-item">
                <strong>Beställning: {order.products?.name}</strong>
                <p>Antal: {order.quantity}</p>
                <p>{order.notes}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn btn-small" onClick={() => updateOrderStatus(order.id, 'completed')}>Markera Klar</button>
                  <button className="btn btn-small btn-secondary" onClick={() => updateOrderStatus(order.id, 'cancelled')}>Avbryt</button>
                </div>
              </div>
            ))}

            {outOfStockProducts.map(product => (
              <div key={product.id} className="notification-item">
                <strong>⚠️ {product.name} är slut</strong>
              </div>
            ))}
          </div>
        )}

        {/* Produkter */}
        <div className="products-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Varor i Boden</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-small" onClick={() => setShowAddProduct(true)}>+ Lägg till Vara</button>
              <button className="btn btn-small btn-secondary" onClick={() => setShowSendMessage(true)}>Skicka Meddelande</button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state"><p>Inga varor ännu</p></div>
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
                    <button className="icon-btn" onClick={() => setShowEditProduct(product)} title="Redigera">✏️</button>
                    <button className="icon-btn warning" onClick={() => deleteProduct(product.id)} title="Ta bort">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showAddProduct && <AddProductModal boothId={boothId} onClose={() => setShowAddProduct(false)} onSuccess={loadProducts} />}
      {showEditProduct && <EditProductModal product={showEditProduct} onClose={() => setShowEditProduct(null)} onSuccess={loadProducts} />}
      {showSendMessage && <SendMessageModal boothId={boothId} onClose={() => setShowSendMessage(false)} />}
    </div>
  );
}

/* --- MODALS --- */

function AddProductModal({ boothId, onClose, onSuccess }: { boothId: string; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await Bolt_Database().from<Product>('products').insert([{ booth_id: boothId, name, price: parseFloat(price) }]);
      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Okänt fel');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Lägg till Ny Vara</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Varunamn</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Pris (kr)</label>
            <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Avbryt</button>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Lägger till...' : 'Lägg till'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// EditProductModal & SendMessageModal kan skrivas om på samma typ-säkra sätt
