import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bolt Database } from '../lib/Bolt Database';
import { useAuth } from '../lib/auth';
import { Booth, Product, Order, Message } from '../types/database';

export default function BoothDetail() {
  const { boothId } = useParams<{ boothId: string }>();
  const navigate = useNavigate();
  const { user: _user } = useAuth();

  const [booth, setBooth] = useState<Booth | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (boothId) {
      loadBoothData();

      const productsSubscription = Bolt Database
        .channel('products-booth-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `booth_id=eq.${boothId}`
        }, () => {
          loadProducts();
        })
        .subscribe();

      const ordersSubscription = Bolt Database
        .channel('orders-booth-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `booth_id=eq.${boothId}`
        }, () => {
          loadOrders();
        })
        .subscribe();

      const messagesSubscription = Bolt Database
        .channel('messages-booth-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages'
        }, () => {
          loadMessages();
        })
        .subscribe();

      return () => {
        productsSubscription.unsubscribe();
        ordersSubscription.unsubscribe();
        messagesSubscription.unsubscribe();
      };
    }
  }, [boothId]);

  const loadBoothData = async () => {
    setLoading(true);
    await Promise.all([loadBooth(), loadProducts(), loadOrders(), loadMessages()]);
    setLoading(false);
  };

  const loadBooth = async () => {
    try {
      const { data, error } = await Bolt Database
        .from('booths')
        .select('*')
        .eq('id', boothId)
        .maybeSingle();

      if (error) throw error;
      setBooth(data);
    } catch (error) {
      console.error('Error loading booth:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await Bolt Database
        .from('products')
        .select('*')
        .eq('booth_id', boothId)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await Bolt Database
        .from('orders')
        .select('*, products(name)')
        .eq('booth_id', boothId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await Bolt Database
        .from('messages')
        .select('*')
        .or(`to_booth_id.eq.${boothId},to_booth_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna vara?')) return;

    try {
      const { error } = await Bolt Database
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await Bolt Database
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  if (loading) {
    return <div className="loading">Laddar...</div>;
  }

  if (!booth) {
    return <div className="loading">Bod hittades inte</div>;
  }

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
        <div className="booth-info">
          <h2>{booth.booth_name}</h2>
          <span className="booth-number">Bod #{booth.booth_number}</span>
          <p style={{ marginTop: '16px' }}>{booth.description}</p>
        </div>

        {(pendingOrders.length > 0 || outOfStockProducts.length > 0 || unreadMessages.length > 0) && (
          <div className="notifications-section">
            <h3>🔔 Notiser</h3>

            {unreadMessages.map(msg => (
              <div key={msg.id} className="notification-item unread">
                <strong>{msg.to_booth_id ? 'Meddelande till er bod' : 'Meddelande till alla'}</strong>
                <p>{msg.message}</p>
                <div className="notification-time">
                  {new Date(msg.created_at).toLocaleString('sv-SE')}
                </div>
              </div>
            ))}

            {pendingOrders.map(order => (
              <div key={order.id} className="notification-item">
                <strong>Beställning: {(order as any).products?.name}</strong>
                <p>Antal: {order.quantity}</p>
                <p>{order.notes}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    className="btn btn-small"
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                  >
                    Markera Klar
                  </button>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                  >
                    Avbryt
                  </button>
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

        <div className="products-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Varor i Boden</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-small" onClick={() => setShowAddProduct(true)}>
                + Lägg till Vara
              </button>
              <button className="btn btn-small btn-secondary" onClick={() => setShowSendMessage(true)}>
                Skicka Meddelande
              </button>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <p>Inga varor ännu</p>
            </div>
          ) : (
            <div className="products-list">
              {products.map(product => (
                <div
                  key={product.id}
                  className={`product-item ${product.is_out_of_stock ? 'out-of-stock' : ''}`}
                >
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <div className="product-price">{product.price} kr</div>
                    {product.is_out_of_stock && (
                      <span className="status-badge pending">Slut i lager</span>
                    )}
                  </div>
                  <div className="product-actions">
                    <button
                      className="icon-btn"
                      onClick={() => setShowEditProduct(product)}
                      title="Redigera"
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn warning"
                      onClick={() => deleteProduct(product.id)}
                      title="Ta bort"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showAddProduct && (
        <AddProductModal
          boothId={boothId!}
          onClose={() => setShowAddProduct(false)}
          onSuccess={loadProducts}
        />
      )}

      {showEditProduct && (
        <EditProductModal
          product={showEditProduct}
          onClose={() => setShowEditProduct(null)}
          onSuccess={loadProducts}
        />
      )}

      {showSendMessage && (
        <SendMessageModal
          boothId={boothId!}
          onClose={() => setShowSendMessage(false)}
        />
      )}
    </div>
  );
}

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
      const { error } = await Bolt Database
        .from('products')
        .insert([{ booth_id: boothId, name, price: parseFloat(price) }]);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Lägg till Ny Vara</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Varunamn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Pris (kr)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Lägger till...' : 'Lägg till'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditProductModal({ product, onClose, onSuccess }: { product: Product; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await Bolt Database
        .from('products')
        .update({ name, price: parseFloat(price) })
        .eq('id', product.id);

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Redigera Vara</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Varunamn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Pris (kr)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SendMessageModal({ boothId, onClose }: { boothId: string; onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await Bolt Database
        .from('messages')
        .insert([{ from_user_id: user!.id, to_booth_id: boothId, message }]);

      if (error) throw error;
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Skicka Meddelande till Boden</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Meddelande</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Skickar...' : 'Skicka'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
