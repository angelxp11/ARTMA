import { useEffect, useState } from 'react';

const formatQuantity = (value) => value.replace(/\D/g, '').slice(0, 6);

const ModalCaja = ({ product, initialItem, onClose, onSave }) => {
	const [cantidad, setCantidad] = useState(String(initialItem?.cantidad || 1));
	const [detalles, setDetalles] = useState(initialItem?.detalles || '');

	useEffect(() => {
		setCantidad(String(initialItem?.cantidad || 1));
		setDetalles(initialItem?.detalles || '');
	}, [initialItem]);

	if (!product) return null;

	const handleSubmit = (event) => {
		event.preventDefault();
		onSave({ cantidad: Number(cantidad), detalles: detalles.trim() });
	};

	return (
		<div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
			<form className="modal-card" onSubmit={handleSubmit} onMouseDown={event => event.stopPropagation()}>
				<div className="modal-heading">
					<div>
						<p className="eyebrow">Producto</p>
						<h2>{product.nombre}</h2>
					</div>
					<button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">x</button>
				</div>
				<p className="modal-meta">${Number(product.precio).toLocaleString('es-ES')} | Disponible: {product.cantidad}</p>
				<label>Cantidad
					<input type="text" inputMode="numeric" value={cantidad} onChange={event => setCantidad(formatQuantity(event.target.value))} autoFocus />
				</label>
				<label>Observaciones
					<textarea placeholder="Medidas, color, entrega..." value={detalles} onChange={event => setDetalles(event.target.value)} />
				</label>
				<div className="modal-actions">
					<button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
					<button type="submit" className="primary-btn">Agregar al carrito</button>
				</div>
			</form>
		</div>
	);
};

export default ModalCaja;
