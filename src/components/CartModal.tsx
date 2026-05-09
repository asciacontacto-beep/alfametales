import React, { useState } from 'react';
import { X, Trash2, CreditCard, Banknote, Building2, Truck, CheckCircle, Printer, AlertCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useAppContext, type Product, type Pedido } from '../context/AppContext';
import { PrintSaleOrder } from './admin/PrintDoc';
import './CartModal.css';

export interface CartItem extends Product {
  quantity: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Débito' | 'Crédito';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; note?: string; discount?: number; surcharge?: number }[] = [
  { id: 'Efectivo',      label: 'Efectivo',      note: '10% de descuento', discount: 0.10 },
  { id: 'Transferencia', label: 'Transferencia',  note: 'Sin recargo' },
  { id: 'Débito',        label: 'Débito',         note: 'Sin recargo' },
  { id: 'Crédito',       label: 'Crédito',        note: 'Consultar recargo', surcharge: undefined },
];

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, cart, setCart }) => {
  const { addPedido, pedidos, clienteSession } = useAppContext();
  const [shippingMethod, setShippingMethod] = useState<'local' | 'domicilio'>('local');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transferencia');
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState(clienteSession?.cliente.nombre ?? '');
  const [clientPhone, setClientPhone] = useState(clienteSession?.cliente.telefono ?? '');

  if (!isOpen) return null;

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.precio_ars * item.quantity), 0);
  
  const selectedPayment = PAYMENT_METHODS.find(p => p.id === paymentMethod)!;
  const finalTotal = selectedPayment.discount
    ? subtotal * (1 - selectedPayment.discount)
    : subtotal;

  const handleConfirmOrder = async () => {
    if (shippingMethod === 'domicilio' && !shippingAddress.trim()) return;
    setIsSubmitting(true);
    const orderData: Omit<Pedido, 'id'> = {
      numero: `PED-${Date.now().toString().slice(-6)}`,
      // Usar el cliente_id real si está logueado, sino 1 (consumidor final)
      cliente_id: clienteSession?.cliente.id ?? 1,
      fecha: new Date().toISOString(),
      items: cart.map(i => ({ title: i.nombre, quantity: i.quantity, price: i.precio_ars, tag: i.tag })),
      total_ars: finalTotal,
      estado: 'pendiente',
      tipo_entrega: shippingMethod === 'local' ? 'Retiro en local' : 'Envío a domicilio',
      direccion_envio: shippingMethod === 'domicilio' ? shippingAddress : undefined,
      notas: `Pago: ${paymentMethod}${clientName ? ` | Cliente: ${clientName}` : ''}${clientPhone ? ` | Tel: ${clientPhone}` : ''}`,
    };
    const newId = await addPedido(orderData);
    setConfirmedOrderId(newId);
    setCart([]);
    setIsSubmitting(false);
  };

  const confirmedOrder = pedidos.find(o => o.id === confirmedOrderId);
  const itemCount = cart.reduce((t, i) => t + i.quantity, 0);

  // ─── VISTA: CARRITO VACÍO ───
  if (!confirmedOrderId && cart.length === 0) {
    return (
      <div className="cm-overlay" onClick={onClose}>
        <div className="cm-drawer animate-slide-in" onClick={e => e.stopPropagation()}>
          <div className="cm-header">
            <div className="cm-header-left">
              <ShoppingBag size={22} />
              <span>Mi Pedido</span>
            </div>
            <button className="cm-close-btn" onClick={onClose}><X size={22} /></button>
          </div>
          <div className="cm-empty">
            <div className="cm-empty-icon">🛒</div>
            <h3>Tu pedido está vacío</h3>
            <p>Agregá productos desde el catálogo para comenzar.</p>
            <button className="cm-btn cm-btn-primary" onClick={onClose}>Ver Catálogo</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── VISTA: PEDIDO CONFIRMADO ───
  if (confirmedOrderId && confirmedOrder) {
    return (
      <div className="cm-overlay" onClick={onClose}>
        <div className="cm-drawer animate-slide-in" onClick={e => e.stopPropagation()}>
          <div className="cm-header">
            <div className="cm-header-left"><ShoppingBag size={22} /><span>Mi Pedido</span></div>
            <button className="cm-close-btn" onClick={onClose}><X size={22} /></button>
          </div>
          <div className="cm-success-view animate-fade-in">
            <div className="cm-success-icon-wrap">
              <CheckCircle size={56} strokeWidth={1.5} />
            </div>
            <h2>¡Pre-compra registrada!</h2>
            <p className="cm-success-sub">Te vamos a confirmar la disponibilidad a la brevedad.</p>

            <div className="cm-success-card">
              <div className="cm-success-row">
                <span>N° Pedido</span>
                <strong>{confirmedOrder.numero}</strong>
              </div>
              <div className="cm-success-row">
                <span>Entrega</span>
                <strong>{confirmedOrder.tipo_entrega}</strong>
              </div>
              <div className="cm-success-row">
                <span>Pago</span>
                <strong>{paymentMethod}</strong>
              </div>
              <div className="cm-success-row cm-success-total">
                <span>Total Estimado</span>
                <strong>${Number(confirmedOrder.total_ars).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <div className="cm-success-notice">
              <AlertCircle size={16} />
              <p>Tu pedido está <strong>pendiente de confirmación</strong>. Una vez aprobado, podrás pasar a abonar.</p>
            </div>

            <div className="cm-success-actions">
              <button className="cm-btn cm-btn-outline" onClick={() => setShowPrintModal(true)}>
                <Printer size={18} /> Imprimir Comprobante
              </button>
              <button className="cm-btn cm-btn-primary" onClick={onClose}>Listo</button>
            </div>
          </div>
        </div>
        {showPrintModal && confirmedOrder && (
          <PrintSaleOrder order={confirmedOrder} onClose={() => setShowPrintModal(false)} />
        )}
      </div>
    );
  }

  // ─── VISTA: CARRITO CON ITEMS ───
  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-drawer animate-slide-in" onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div className="cm-header">
          <div className="cm-header-left">
            <ShoppingBag size={22} />
            <span>Mi Pedido</span>
            <span className="cm-item-count">{itemCount}</span>
          </div>
          <button className="cm-close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        {/* BODY */}
        <div className="cm-body">

          {/* ITEMS */}
          <div className="cm-section">
            <h3 className="cm-section-title">Productos</h3>
            <div className="cm-items-list">
              {cart.map(item => (
                <div key={item.id} className="cm-item">
                  <div className="cm-item-info">
                    <p className="cm-item-name">{item.nombre}</p>
                    <p className="cm-item-meta">{item.tag}</p>
                    <p className="cm-item-price">{item.priceDisplay} <span>{item.unidad}</span></p>
                  </div>
                  <div className="cm-item-controls">
                    <div className="cm-qty">
                      <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                    </div>
                    <button className="cm-remove-btn" onClick={() => removeItem(item.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DATOS DEL CLIENTE */}
          <div className="cm-section">
            <h3 className="cm-section-title">Tus datos <span className="cm-optional">(opcional)</span></h3>
            <div className="cm-form-row">
              <input
                className="cm-input"
                type="text"
                placeholder="Nombre y apellido"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
              />
              <input
                className="cm-input"
                type="tel"
                placeholder="Teléfono"
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
              />
            </div>
          </div>

          {/* MÉTODO DE ENTREGA */}
          <div className="cm-section">
            <h3 className="cm-section-title">Método de Entrega</h3>
            <div className="cm-radio-group">
              <label className={`cm-radio-card ${shippingMethod === 'local' ? 'active' : ''}`}>
                <input type="radio" name="shipping" checked={shippingMethod === 'local'} onChange={() => setShippingMethod('local')} />
                <Building2 size={20} className="cm-radio-icon" />
                <div>
                  <p className="cm-radio-title">Retiro en local</p>
                  <p className="cm-radio-sub">Av. 59 4461, Necochea</p>
                </div>
                <div className="cm-radio-check" />
              </label>
              <label className={`cm-radio-card ${shippingMethod === 'domicilio' ? 'active' : ''}`}>
                <input type="radio" name="shipping" checked={shippingMethod === 'domicilio'} onChange={() => setShippingMethod('domicilio')} />
                <Truck size={20} className="cm-radio-icon" />
                <div>
                  <p className="cm-radio-title">Envío a domicilio</p>
                  <p className="cm-radio-sub">Consultar disponibilidad</p>
                </div>
                <div className="cm-radio-check" />
              </label>
            </div>
            {shippingMethod === 'domicilio' && (
              <input
                className="cm-input cm-input-address"
                type="text"
                placeholder="Ingresá tu dirección completa..."
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
              />
            )}
          </div>

          {/* FORMA DE PAGO */}
          <div className="cm-section">
            <h3 className="cm-section-title">Forma de Pago</h3>
            <div className="cm-payment-grid">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  className={`cm-payment-btn ${paymentMethod === pm.id ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(pm.id)}
                >
                  {pm.id === 'Efectivo' || pm.id === 'Transferencia'
                    ? <Banknote size={18} />
                    : <CreditCard size={18} />
                  }
                  <span className="cm-payment-label">{pm.label}</span>
                  {pm.note && <span className="cm-payment-note">{pm.note}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="cm-footer">
          <div className="cm-totals">
            <div className="cm-totals-row">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            {selectedPayment.discount && (
              <div className="cm-totals-row cm-discount-row">
                <span>Descuento ({paymentMethod})</span>
                <span>− ${(subtotal * selectedPayment.discount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="cm-totals-row cm-total-final">
              <span>Total Estimado</span>
              <span>${finalTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="cm-footer-notice">
            <AlertCircle size={14} />
            <p>Esto es una <strong>pre-compra</strong>. Te confirmamos disponibilidad antes de proceder al pago.</p>
          </div>

          <button
            className="cm-btn cm-btn-primary cm-btn-checkout"
            onClick={handleConfirmOrder}
            disabled={isSubmitting || (shippingMethod === 'domicilio' && !shippingAddress.trim())}
          >
            {isSubmitting ? 'Registrando...' : 'Enviar Pre-compra'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
