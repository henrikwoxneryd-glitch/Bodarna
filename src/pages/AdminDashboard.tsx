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

    if (!user) {
      setError('Ingen användare inloggad.');
      setLoading(false);
      return;
    }

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
