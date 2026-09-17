import { useState } from 'react';

const DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50];

const formatMoneyInput = (value) => {
	const digits = value.replace(/\D/g, '');
	return digits ? Number(digits).toLocaleString('es-ES') : '';
};

const parseMoneyInput = (value) => Number(value.replace(/\./g, '').replace(/,/g, '')) || 0;

const ModalRegistro = ({ total, onClose, onConfirm, saving }) => {
	const [metodoPago, setMetodoPago] = useState('efectivo');
	const [recibido, setRecibido] = useState('');
	const [detalles, setDetalles] = useState('');
	const change = parseMoneyInput(recibido) - total;

	const handleSubmit = (event) => {
		event.preventDefault();
		if (metodoPago === 'efectivo' && change < 0) return;
		onConfirm({ metodoPago, recibido: metodoPago === 'efectivo' ? parseMoneyInput(recibido) : total, vuelto: metodoPago === 'efectivo' ? change : 0, detalles: detalles.trim() });
	};

	return (
		<div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
			<form className="modal-card payment-modal" onSubmit={handleSubmit} onMouseDown={event => event.stopPropagation()}>
				<div className="modal-heading">
					<div><p className="eyebrow">Confirmar venta</p><h2>Total ${total.toLocaleString('es-ES')}</h2></div>
					<button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">x</button>
				</div>
				<div className="payment-tabs">
					<button type="button" className={metodoPago === 'efectivo' ? 'active' : ''} onClick={() => setMetodoPago('efectivo')}>Efectivo</button>
					<button type="button" className={metodoPago === 'transferencia' ? 'active' : ''} onClick={() => setMetodoPago('transferencia')}>Transferencia</button>
				</div>
				{metodoPago === 'efectivo' && (
					<>
						<label>Dinero recibido
							<input type="text" inputMode="numeric" value={recibido} onChange={event => setRecibido(formatMoneyInput(event.target.value))} autoFocus />
						</label>
						<div className="denominations">
							{DENOMINATIONS.map(value => <button type="button" key={value} onClick={() => setRecibido(formatMoneyInput(String(parseMoneyInput(recibido) + value)))}>+${value.toLocaleString('es-ES')}</button>)}
						</div>
						<p className={change >= 0 ? 'change-positive' : 'change-negative'}>Vuelto: ${Math.max(change, 0).toLocaleString('es-ES')}</p>
					</>
				)}
				<label>Observaciones de la venta
					<textarea placeholder="Nota general, comprobante..." value={detalles} onChange={event => setDetalles(event.target.value)} />
				</label>
				<div className="modal-actions">
					<button type="button" className="secondary-btn" onClick={onClose}>Cancelar</button>
					<button type="submit" className="primary-btn" disabled={saving || (metodoPago === 'efectivo' && change < 0)}>{saving ? 'Guardando...' : 'Confirmar y pagar'}</button>
				</div>
			</form>
		</div>
	);
};

export default ModalRegistro;
