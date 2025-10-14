import { useState, useEffect } from 'react';
import { Bolt Database } from '../lib/Bolt Database';
import { useAuth } from '../lib/auth';
import { Booth, Product, Message } from '../types/database';

export default function BoothStaffDashboard() {
  const [booth, setBooth] = useState<Booth | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    loadBoothData();

    const productsSub = Bolt Database
      .channel('staff-products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        if (booth?.id) loadProducts(booth.id);
      })
      .subscribe();

    const messagesSub = Bolt Database
      .channel('staff-messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        if (booth?.id) loadMessages(booth.id);
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
      const { data, error } = await Bolt Database
        .from('booths')
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
      const { data, error } = await Bolt Database
        .from('products')
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
      const { data, error } = await Bolt Database
        .from('messages')
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
      const { error } = await Bolt Database
        .from('products')
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
      const { error } = await Bolt Database
        .from('messages')
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
                <button
                  className="btn btn-small"
                  onClick={() => markMessageAsRead(msg.id)}
                  style={{ marginTop: '8px' }}
                >
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
