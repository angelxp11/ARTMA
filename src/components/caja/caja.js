import { useEffect, useMemo, useState } from 'react';
import './caja.css';
import ModalCaja from './modalcaja';
import ModalRegistro from './modalregistro';
import { createSale, getProducts, updateProductStock } from '../../server/functions';
import { showToast } from '../../resources/toastcontainer/ToastContainer';

const Caja = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [productModal, setProductModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => showToast('No se pudieron cargar los productos', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['Todas', ...new Set(products.map(product => product.categoria).filter(Boolean))], [products]);
  const filteredProducts = products.filter(product => product.nombre.toLowerCase().includes(search.toLowerCase()) && (category === 'Todas' || product.categoria === category));
  const cartTotal = cart.reduce((total, item) => total + item.precio * item.cantidad, 0);
  const cartQuantity = cart.reduce((total, item) => total + item.cantidad, 0);

  const openProductModal = (product) => setProductModal({ product, item: cart.find(item => item.id === product.id) });

  const saveCartItem = ({ cantidad, detalles }) => {
    const product = productModal.product;
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > Number(product.cantidad)) {
      showToast('La cantidad no está disponible', 'error');
      return;
    }
    const nextItem = { ...product, cantidad, detalles };
    setCart(prev => prev.some(item => item.id === product.id) ? prev.map(item => item.id === product.id ? nextItem : item) : [...prev, nextItem]);
    setProductModal(null);
  };

  const changeQuantity = (item, amount) => {
    const nextQuantity = item.cantidad + amount;
    if (nextQuantity < 1) {
      setCart(prev => prev.filter(cartItem => cartItem.id !== item.id));
      return;
    }
    if (nextQuantity > Number(products.find(product => product.id === item.id)?.cantidad || 0)) {
      showToast('No hay más unidades disponibles', 'error');
      return;
    }
    setCart(prev => prev.map(cartItem => cartItem.id === item.id ? { ...cartItem, cantidad: nextQuantity } : cartItem));
  };

  const confirmPayment = async ({ metodoPago, recibido, vuelto, detalles }) => {
    try {
      setSaving(true);
      for (const item of cart) {
        await createSale({
          productId: item.id,
          producto: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          total: item.precio * item.cantidad,
          fecha: new Date().toISOString().slice(0, 10),
          detalles: [item.detalles, detalles].filter(Boolean).join(' | '),
          metodoPago,
          recibido,
          vuelto,
        });
        const currentProduct = products.find(product => product.id === item.id);
        await updateProductStock(item.id, Number(currentProduct.cantidad) - item.cantidad);
      }
      setProducts(prev => prev.map(product => {
        const item = cart.find(cartItem => cartItem.id === product.id);
        return item ? { ...product, cantidad: Number(product.cantidad) - item.cantidad } : product;
      }));
      setCart([]);
      setPaymentModal(false);
      showToast('Venta registrada correctamente', 'success');
    } catch (error) {
      showToast('No se pudo registrar la venta', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="caja-section">
      <div className="caja-header">
        <div><p className="eyebrow">Caja</p><h2>Punto de venta</h2></div>
        <span className="caja-total">{cartQuantity} producto(s)</span>
      </div>
      <div className="caja-layout">
        <aside className="cart-panel">
          <div className="panel-title"><h3>Carrito</h3><span>{cartQuantity}</span></div>
          <div className="cart-items">
            {!cart.length && <p className="empty-state">Selecciona productos para comenzar.</p>}
            {cart.map(item => (
              <article className="cart-item" key={item.id}>
                <button type="button" className="cart-item-main" onClick={() => openProductModal(item)}>
                  <strong>{item.nombre}</strong><span>{item.detalles || 'Sin observaciones'}</span><b>${(item.precio * item.cantidad).toLocaleString('es-ES')}</b>
                </button>
                <div className="cart-item-controls">
                  <button type="button" onClick={() => changeQuantity(item, -1)} aria-label="Reducir cantidad">-</button><span>{item.cantidad}</span><button type="button" onClick={() => changeQuantity(item, 1)} aria-label="Aumentar cantidad">+</button>
                  <button type="button" className="remove-cart" onClick={() => setCart(prev => prev.filter(cartItem => cartItem.id !== item.id))}>Eliminar</button>
                </div>
              </article>
            ))}
          </div>
          <div className="cart-footer"><div><span>Total</span><strong>${cartTotal.toLocaleString('es-ES')}</strong></div><button type="button" className="pay-btn" disabled={!cart.length} onClick={() => setPaymentModal(true)}>Pagar ${cartTotal.toLocaleString('es-ES')}</button></div>
        </aside>
        <div className="product-picker">
          <div className="picker-tools"><input type="search" placeholder="Buscar por nombre" value={search} onChange={event => setSearch(event.target.value)} /><select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></div>
          {loading ? <p>Cargando productos...</p> : <div className="product-results">{filteredProducts.map(product => <button type="button" key={product.id} className="product-option" disabled={!product.cantidad} onClick={() => openProductModal(product)}><strong>{product.nombre}</strong><span>{product.categoria} | Stock: {product.cantidad}</span><b>${Number(product.precio).toLocaleString('es-ES')}</b></button>)}{!filteredProducts.length && <p>No hay productos que coincidan.</p>}</div>}
        </div>
      </div>
      {productModal && <ModalCaja product={productModal.product} initialItem={productModal.item} onClose={() => setProductModal(null)} onSave={saveCartItem} />}
      {paymentModal && <ModalRegistro total={cartTotal} saving={saving} onClose={() => setPaymentModal(false)} onConfirm={confirmPayment} />}
    </section>
  );
};

export default Caja;
