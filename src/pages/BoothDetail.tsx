import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bolt_Database } from '../lib/Bolt_Database';
import { useAuth } from '../lib/auth';
import { Booth, Product, Order, Message } from '../types/database';

export default function BoothDetail() {
  const { boothId } = useParams<{ boothId: string }>();
  const navigate = useNavigate();

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `booth_id=eq.${boothId}` }, loadProducts)
      .subscribe();

    const ordersSub = Bolt_Database()
      .channel('orders-booth-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `booth_id=eq.${boothId}` }, loadOrders)
      .subscribe();

    const messagesSub = Bolt_Database()
      .channel('messages-booth-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadMessages)
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
      const { data, error } = await Bolt_Database().from('booths').select('*').eq('id', boothId).maybeSingle();
      if (error) throw error;
      setBooth(data || null);
    } catch (err) {
      console.error('Error loading booth:', err);
    }
  };

  const loadProducts = async () => {
    if (!boothId) return;
    try {
      const { data, error } = await Bolt_Database().from('products').select('*').eq('booth_id', boothId).order('name');
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
        .from('orders')
        .select('*')
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
        .from('messages')
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

  return (
    <div className="app">
      {/* ...rest av render-koden utan TS-fel */}
    </div>
  );
}
