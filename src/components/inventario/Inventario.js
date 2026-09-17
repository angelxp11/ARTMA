import { useEffect, useMemo, useState } from 'react';
import './Inventario.css';
import { createProduct, deleteProduct, getProducts, updateProduct } from '../../server/functions';
import { showToast } from '../../resources/toastcontainer/ToastContainer';

const DEFAULT_CATEGORIES = [];

const normalizeCategory = (value = '') => value.trim().toUpperCase();

const formatQuantity = (value) => value.replace(/\D/g, '').slice(0, 6);

const formatPrice = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (!digits) return '';

  const formatted = Number(digits).toLocaleString('es-ES');
  return formatted;
};

const parsePrice = (value = '') => Number(value.replace(/\./g, '').replace(/,/g, '')) || 0;

const createEmptyPiece = () => ({ nombre: '', precio: '' });

const Inventario = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: '',
    categoria: '',
    cantidad: '',
    piezas: [createEmptyPiece()],
    ganancia: '',
  });
  const [editingId, setEditingId] = useState(null);

  const totalPiezas = form.piezas.reduce((total, pieza) => total + parsePrice(pieza.precio), 0);
  const totalProducto = totalPiezas + parsePrice(form.ganancia);

  const categoryOptions = useMemo(() => {
    const values = [...DEFAULT_CATEGORIES, ...products.map((product) => normalizeCategory(product.categoria))];
    return [...new Set(values)].filter(Boolean);
  }, [products]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        showToast('No se pudo cargar el inventario', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'categoria') {
      setForm(prev => ({ ...prev, categoria: normalizeCategory(value) }));
      return;
    }

    if (name === 'cantidad') {
      setForm(prev => ({ ...prev, cantidad: formatQuantity(value) }));
      return;
    }

    if (name === 'precio') {
      setForm(prev => ({ ...prev, ganancia: formatPrice(value) }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ nombre: '', categoria: '', cantidad: '', piezas: [createEmptyPiece()], ganancia: '' });
    setEditingId(null);
  };

  const handlePieceChange = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      piezas: prev.piezas.map((pieza, pieceIndex) => (
        pieceIndex === index
          ? { ...pieza, [field]: field === 'precio' ? formatPrice(value) : value }
          : pieza
      )),
    }));
  };

  const addPiece = () => {
    setForm(prev => ({ ...prev, piezas: [...prev.piezas, createEmptyPiece()] }));
  };

  const removePiece = (index) => {
    setForm(prev => ({
      ...prev,
      piezas: prev.piezas.filter((_, pieceIndex) => pieceIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanedCategoria = normalizeCategory(form.categoria);
    const cantidad = Number(form.cantidad.replace(/\D/g, ''));
    const piezas = form.piezas
      .filter(pieza => pieza.nombre.trim() && parsePrice(pieza.precio) > 0)
      .map(pieza => ({ nombre: pieza.nombre.trim(), precio: parsePrice(pieza.precio) }));
    const precio = piezas.reduce((total, pieza) => total + pieza.precio, 0) + parsePrice(form.ganancia);

    if (!form.nombre.trim() || !cleanedCategoria || !form.cantidad || piezas.length === 0) {
      showToast('Completa el producto y agrega al menos una pieza', 'error');
      return;
    }

    try {
      const payload = {
        nombre: form.nombre.trim(),
        categoria: cleanedCategoria,
        cantidad,
        precio,
        piezas,
        ganancia: parsePrice(form.ganancia),
      };

      if (editingId) {
        const updated = await updateProduct(editingId, payload);
        setProducts(prev => prev.map(product => (product.id === editingId ? { ...product, ...updated } : product)));
        showToast('Producto actualizado', 'success');
      } else {
        const created = await createProduct(payload);
        setProducts(prev => [created, ...prev]);
        showToast('Producto creado', 'success');
      }

      resetForm();
    } catch (error) {
      showToast('Error al guardar el producto', 'error');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      nombre: product.nombre,
      categoria: normalizeCategory(product.categoria),
      cantidad: String(product.cantidad),
      piezas: product.piezas?.length
        ? product.piezas.map(pieza => ({
          nombre: pieza.nombre,
          precio: Number(pieza.precio).toLocaleString('es-ES'),
        }))
        : [{ nombre: product.nombre, precio: Number(product.precio).toLocaleString('es-ES') }],
      ganancia: product.ganancia ? Number(product.ganancia).toLocaleString('es-ES') : '',
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(product => product.id !== id));
      if (editingId === id) resetForm();
      showToast('Producto eliminado', 'success');
    } catch (error) {
      showToast('No se pudo eliminar el producto', 'error');
    }
  };

  return (
    <section className="inventario-section">
      <div className="inventario-header">
        <p className="eyebrow">Inventario</p>
        <h2>Productos disponibles</h2>
      </div>

      <form className="product-form" onSubmit={handleSubmit}>
        <label className="field-group">
          Nombre del producto
          <input
            type="text"
            name="nombre"
            placeholder="Ej. Mesa de comedor"
            value={form.nombre}
            onChange={handleChange}
          />
        </label>

        <label className="field-group">
          Categoría
          <input
            type="text"
            name="categoria"
            list="category-options"
            placeholder="Ej. Comedor"
            value={form.categoria}
            onChange={handleChange}
          />
        </label>
        <datalist id="category-options">
          {categoryOptions.map(category => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <label className="field-group">
          Cantidad disponible
          <input
            type="text"
            name="cantidad"
            inputMode="numeric"
            placeholder="Ej. 10"
            value={form.cantidad}
            onChange={handleChange}
          />
        </label>

        <div className="pieces-field">
          <div className="pieces-header">
            <span>Piezas del producto</span>
            <button type="button" className="add-piece-btn" onClick={addPiece}>+ Agregar pieza</button>
          </div>
          {form.piezas.map((pieza, index) => (
            <div className="piece-row" key={`piece-${index}`}>
              <label className="field-group">
                Nombre de la pieza
                <input
                  type="text"
                  placeholder="Ej. Madera"
                  value={pieza.nombre}
                  onChange={(event) => handlePieceChange(index, 'nombre', event.target.value)}
                />
              </label>
              <label className="field-group">
                Precio de la pieza
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej. 15.000"
                  value={pieza.precio}
                  onChange={(event) => handlePieceChange(index, 'precio', event.target.value)}
                />
              </label>
              {form.piezas.length > 1 && (
                <button type="button" className="remove-piece-btn" onClick={() => removePiece(index)} aria-label="Eliminar pieza">
                  x
                </button>
              )}
            </div>
          ))}
        </div>

        <label className="field-group">
          Ganancia
          <input
            type="text"
            name="precio"
            inputMode="numeric"
            placeholder="Ej. 50.000"
            value={form.ganancia}
            onChange={handleChange}
          />
        </label>

        <div className="total-field">
          <span>Precio total</span>
          <strong>${totalProducto.toLocaleString('es-ES')}</strong>
        </div>

        <button type="submit" className="primary-btn">
          {editingId ? 'Guardar cambios' : 'Agregar producto'}
        </button>
        {editingId && (
          <button type="button" className="secondary-btn" onClick={resetForm}>
            Cancelar
          </button>
        )}
      </form>

      {loading ? (
        <p>Cargando inventario...</p>
      ) : (
        <div className="inventario-list">
          {products.length === 0 ? (
            <p>No hay productos en el inventario.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="inventario-item">
                <div className="item-badge">#{product.id.slice(0, 4)}</div>
                <div className="item-info">
                  <strong>{product.nombre}</strong>
                  <span>{normalizeCategory(product.categoria)}</span>
                  <span>Cantidad: {product.cantidad}</span>
                  <span>Precio total: ${Number(product.precio).toLocaleString('es-ES')}</span>
                </div>
                <div className="item-actions">
                  <button type="button" onClick={() => handleEdit(product)}>Editar</button>
                  <button type="button" className="danger-btn" onClick={() => handleDelete(product.id)}>Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
};

export default Inventario;
