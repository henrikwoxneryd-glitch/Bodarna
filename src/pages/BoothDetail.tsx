import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Bolt_Database } from '../lib/BoltDatabase';
import { Booth } from '../types/database';

export default function BoothDetail() {
  const { boothId } = useParams<{ boothId: string }>();
  const [booth, setBooth] = useState<Booth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!boothId) return;

    const loadBooth = async () => {
      try {
        const { data, error } = await Bolt_Database()
          .from('booths')
          .select('*')
          .eq('id', boothId)
          .maybeSingle();
        if (error) throw error;
        setBooth(data || null);
      } catch (err) {
        console.error('Error loading booth:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBooth();
  }, [boothId]);

  if (loading) return <div className="loading">Laddar...</div>;
  if (!booth) return <div className="loading">Bod hittades inte</div>;

  return (
    <div className="app">
      <header className="header">
        <h1>🎄 {booth.booth_name}</h1>
        <span>Bod #{booth.booth_number}</span>
        <p>{booth.description}</p>
      </header>
    </div>
  );
}
