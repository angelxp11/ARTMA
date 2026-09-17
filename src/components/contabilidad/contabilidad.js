import { useEffect, useState } from 'react';
import '../caja/caja.css';
import './contabilidad.css';
import { createExpense, getExpenses, getSales } from '../../server/functions';
import { showToast } from '../../resources/toastcontainer/ToastContainer';

const today = () => new Date().toISOString().slice(0, 10);
const formatMoney = value => `$${Number(value || 0).toLocaleString('es-ES')}`;
const formatMoneyInput = (value) => {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('es-ES') : '';
};
const parseMoneyInput = value => Number(value.replace(/\./g, '').replace(/,/g, '')) || 0;

const Contabilidad = () => {
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({ descripcion: '', monto: '', fecha: today(), detalles: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [expenseData, salesData] = await Promise.all([getExpenses(), getSales()]);
      setExpenses(expenseData.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setSales(salesData.sort((a, b) => b.fecha.localeCompare(a.fecha)));
    } catch (error) {
      showToast('No se pudo cargar la contabilidad', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const totalVentas = sales.reduce((total, sale) => total + Number(sale.total || 0), 0);
  const totalEgresos = expenses.reduce((total, expense) => total + Number(expense.monto || 0), 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.descripcion.trim() || parseMoneyInput(form.monto) <= 0 || !form.fecha) {
      showToast('Completa la descripción, el monto y la fecha', 'error');
      return;
    }

    try {
      setSaving(true);
      const expense = await createExpense({ ...form, descripcion: form.descripcion.trim(), monto: parseMoneyInput(form.monto) });
      setExpenses(prev => [expense, ...prev].sort((a, b) => b.fecha.localeCompare(a.fecha)));
      setForm({ descripcion: '', monto: '', fecha: today(), detalles: '' });
      showToast('Egreso guardado correctamente', 'success');
    } catch (error) {
      showToast('No se pudo guardar el egreso', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="contabilidad-section">
      <div className="accounting-header">
        <div>
          <p className="eyebrow">Contabilidad</p>
          <h2>Movimientos del negocio</h2>
        </div>
        <div className="accounting-totals">
          <span>Ventas <strong>{formatMoney(totalVentas)}</strong></span>
          <span>Egresos <strong>{formatMoney(totalEgresos)}</strong></span>
          <span>Balance <strong>{formatMoney(totalVentas - totalEgresos)}</strong></span>
        </div>
      </div>

      <form className="expense-form" onSubmit={handleSubmit}>
        <h3>Nuevo egreso</h3>
        <div className="expense-fields">
          <label>Descripción<input type="text" placeholder="Ej. Compra de materiales" value={form.descripcion} onChange={event => setForm(prev => ({ ...prev, descripcion: event.target.value }))} /></label>
          <label>Monto<input type="text" inputMode="numeric" placeholder="0" value={form.monto} onChange={event => setForm(prev => ({ ...prev, monto: formatMoneyInput(event.target.value) }))} /></label>
          <label>Fecha<input type="date" value={form.fecha} onChange={event => setForm(prev => ({ ...prev, fecha: event.target.value }))} /></label>
        </div>
        <label>Detalles<textarea placeholder="Proveedor, comprobante u observaciones..." value={form.detalles} onChange={event => setForm(prev => ({ ...prev, detalles: event.target.value }))} /></label>
        <button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar egreso'}</button>
      </form>

      {loading ? <p>Cargando movimientos...</p> : (
        <div className="accounting-lists">
          <div className="movement-list">
            <h3>Ventas</h3>
            {!sales.length && <p>No hay ventas registradas.</p>}
            {sales.map(sale => (
              <article className="movement-item" key={sale.id}>
                <div><strong>{sale.producto}</strong><span>{sale.fecha} | {sale.cantidad} unidad(es)</span>{sale.detalles && <small>{sale.detalles}</small>}</div>
                <b>{formatMoney(sale.total)}</b>
              </article>
            ))}
          </div>
          <div className="movement-list">
            <h3>Egresos</h3>
            {!expenses.length && <p>No hay egresos registrados.</p>}
            {expenses.map(expense => (
              <article className="movement-item" key={expense.id}>
                <div><strong>{expense.descripcion}</strong><span>{expense.fecha}</span>{expense.detalles && <small>{expense.detalles}</small>}</div>
                <b className="expense-amount">-{formatMoney(expense.monto)}</b>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Contabilidad;