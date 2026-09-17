import { useEffect, useState } from 'react';
import './facturas.css';
import { cancelSale, createClient, getClients, getSales, updateSale } from '../../server/functions';
import { showToast } from '../../resources/toastcontainer/ToastContainer';

const today = () => new Date().toISOString().slice(0, 10);
const money = value => `$${Number(value || 0).toLocaleString('es-ES')}`;

const Facturas = () => {
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [clientModalInvoice, setClientModalInvoice] = useState(null);
  const [clientMode, setClientMode] = useState('search');
  const [clientSearch, setClientSearch] = useState('');
  const [clientForm, setClientForm] = useState({ cedula: '', nombre: '', telefono: '', correo: '', direccion: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [salesData, clientsData] = await Promise.all([getSales(), getClients()]);
      setSales(salesData.sort((a, b) => `${b.fecha || ''}${b.createdAt || ''}`.localeCompare(`${a.fecha || ''}${a.createdAt || ''}`)));
      setClients(clientsData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    } catch (error) {
      showToast('No se pudieron cargar las facturas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const assignClient = async (invoice, client) => {
    if (!client) return;
    try {
      const updated = await updateSale(invoice.id, { ...invoice, clientId: client.id, cliente: client.nombre });
      setSales(prev => prev.map(item => item.id === invoice.id ? { ...item, ...updated } : item));
      showToast('Cliente asignado a la factura', 'success');
    } catch (error) {
      showToast('No se pudo asignar el cliente', 'error');
    }
  };

  const registerClient = async (event) => {
    event.preventDefault();
    if (!clientForm.cedula.trim() || !clientForm.nombre.trim()) {
      showToast('Escribe la cédula y el nombre del cliente', 'error');
      return;
    }
    try {
      const client = await createClient({ ...clientForm, nombre: clientForm.nombre.trim() });
      setClients(prev => [...prev, client].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      if (clientModalInvoice) await assignClient(clientModalInvoice, client);
      setClientForm({ cedula: '', nombre: '', telefono: '', correo: '', direccion: '' });
      setClientModalInvoice(null);
    } catch (error) {
      showToast('No se pudo registrar el cliente', 'error');
    }
  };

  const openClientModal = (invoice) => {
    setClientModalInvoice(invoice);
    setClientMode('search');
    setClientSearch('');
  };

  const selectClient = async (client) => {
    await assignClient(clientModalInvoice, client);
    setClientModalInvoice(null);
  };

  const matchingClients = clients.filter(client => (client.cedula || '').toLowerCase().includes(clientSearch.trim().toLowerCase()));

  const saveInvoice = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      setSaving(true);
      const updated = await updateSale(selectedInvoice.id, {
        ...selectedInvoice,
        fecha: form.get('fecha'),
        detalles: form.get('detalles'),
        metodoPago: form.get('metodoPago'),
        clientId: selectedInvoice.clientId || '',
        cliente: selectedInvoice.cliente || '',
      });
      setSales(prev => prev.map(item => item.id === selectedInvoice.id ? { ...item, ...updated } : item));
      setSelectedInvoice(null);
      showToast('Factura actualizada', 'success');
    } catch (error) {
      showToast('No se pudo editar la factura', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeInvoice = async (invoice) => {
    if (!window.confirm('La factura se marcará como anulada. El registro se conservará.')) return;
    try {
      const result = await cancelSale(invoice.id);
      setSales(prev => prev.map(item => item.id === invoice.id ? { ...item, ...result } : item));
      showToast('Factura anulada', 'success');
    } catch (error) {
      showToast('No se pudo anular la factura', 'error');
    }
  };

  return (
    <section className="facturas-section">
      <div className="facturas-header">
        <div><p className="eyebrow">Facturas</p><h2>Historial de ventas</h2></div>
        <span>{sales.length} registro(s)</span>
      </div>
      {loading ? <p>Cargando facturas...</p> : !sales.length ? <p>No hay ventas registradas.</p> : (
        <div className="invoice-list">
          {sales.map(invoice => {
            const isCancelled = invoice.estado === 'anulada';
            return (
              <article className={`invoice-card ${isCancelled ? 'cancelled' : ''}`} key={invoice.id}>
                <div className="invoice-main">
                  <div className="invoice-title"><strong>Factura #{invoice.id.slice(0, 6)}</strong><span className={`invoice-status ${isCancelled ? 'status-cancelled' : ''}`}>{isCancelled ? 'Anulada' : 'Activa'}</span></div>
                  <span>{invoice.fecha || 'Sin fecha'} | {invoice.producto} | {invoice.cantidad} unidad(es)</span>
                  <small>{invoice.detalles || 'Sin observaciones'}{invoice.cliente ? ` | Cliente: ${invoice.cliente}` : ''}</small>
                </div>
                <div className="invoice-side"><strong>{money(invoice.total)}</strong><span>{invoice.metodoPago || 'efectivo'}</span></div>
                <div className="invoice-actions">
                  {!isCancelled && <button type="button" onClick={() => openClientModal(invoice)}>{invoice.cliente ? 'Cambiar cliente' : 'Asignar cliente'}</button>}
                  {!isCancelled && <button type="button" onClick={() => setSelectedInvoice(invoice)}>Editar</button>}
                  {!isCancelled && <button type="button" className="danger-btn" onClick={() => removeInvoice(invoice)}>Anular</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedInvoice && (
        <div className="invoice-modal-backdrop" role="presentation" onMouseDown={() => setSelectedInvoice(null)}>
          <form className="invoice-modal" onSubmit={saveInvoice} onMouseDown={event => event.stopPropagation()}>
            <div className="invoice-modal-heading"><h2>Editar factura</h2><button type="button" onClick={() => setSelectedInvoice(null)}>x</button></div>
            <p className="invoice-client-note">Cliente: {selectedInvoice.cliente || 'Sin cliente asignado'}</p>
            <label>Fecha<input type="date" name="fecha" defaultValue={selectedInvoice.fecha || today()} /></label>
            <label>Método de pago<select name="metodoPago" defaultValue={selectedInvoice.metodoPago || 'efectivo'}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select></label>
            <label>Detalles<textarea name="detalles" defaultValue={selectedInvoice.detalles || ''} /></label>
            <div className="invoice-modal-actions"><button type="button" className="secondary-btn" onClick={() => setSelectedInvoice(null)}>Cancelar</button><button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button></div>
          </form>
        </div>
      )}

      {clientModalInvoice && (
        <div className="invoice-modal-backdrop" role="presentation" onMouseDown={() => setClientModalInvoice(null)}>
          <div className="invoice-modal client-modal" onMouseDown={event => event.stopPropagation()}>
            <div className="invoice-modal-heading"><h2>Asignar cliente</h2><button type="button" onClick={() => setClientModalInvoice(null)}>x</button></div>
            <div className="client-tabs">
              <button type="button" className={clientMode === 'search' ? 'active' : ''} onClick={() => setClientMode('search')}>Buscar cliente</button>
              <button type="button" className={clientMode === 'register' ? 'active' : ''} onClick={() => setClientMode('register')}>Registrar cliente</button>
            </div>
            {clientMode === 'search' ? (
              <>
                <label>Buscar por cédula<input type="text" inputMode="numeric" placeholder="Número de cédula" value={clientSearch} onChange={event => setClientSearch(event.target.value.replace(/\D/g, ''))} autoFocus /></label>
                <div className="client-results">
                  {!clientSearch && <p>Escribe una cédula para buscar.</p>}
                  {clientSearch && !matchingClients.length && <p>No se encontró un cliente con esa cédula.</p>}
                  {matchingClients.map(client => <button type="button" key={client.id} onClick={() => selectClient(client)}><strong>{client.nombre}</strong><span>Cédula: {client.cedula}</span></button>)}
                </div>
                <button type="button" className="new-client-button" onClick={() => setClientMode('register')}>¿No está registrado? Registrar cliente</button>
              </>
            ) : (
              <form className="new-client-form" onSubmit={registerClient}>
                <label>Cédula<input type="text" inputMode="numeric" value={clientForm.cedula} onChange={event => setClientForm(prev => ({ ...prev, cedula: event.target.value.replace(/\D/g, '') }))} autoFocus /></label>
                <label>Nombre<input value={clientForm.nombre} onChange={event => setClientForm(prev => ({ ...prev, nombre: event.target.value }))} /></label>
                <label>Teléfono<input value={clientForm.telefono} onChange={event => setClientForm(prev => ({ ...prev, telefono: event.target.value }))} /></label>
                <label>Correo<input type="email" value={clientForm.correo} onChange={event => setClientForm(prev => ({ ...prev, correo: event.target.value }))} /></label>
                <label>Dirección<input value={clientForm.direccion} onChange={event => setClientForm(prev => ({ ...prev, direccion: event.target.value }))} /></label>
                <div className="invoice-modal-actions"><button type="button" className="secondary-btn" onClick={() => setClientMode('search')}>Ya está registrado</button><button type="submit" className="primary-btn">Guardar y asignar</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Facturas;
