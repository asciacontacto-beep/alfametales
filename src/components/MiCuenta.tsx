import React, { useEffect, useState } from 'react';
import { Package, FileText, CreditCard, Clock, CheckCircle, XCircle, Printer, AlertCircle, Truck, Building2 } from 'lucide-react';
import { useAppContext, type Pedido } from '../context/AppContext';
import { PrintSaleOrder } from './admin/PrintDoc';
import './MiCuenta.css';

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente:   { label: 'Pendiente de aprobación', color: 'warning',  icon: <Clock size={14} /> },
  preparando:  { label: 'Aprobado — En preparación', color: 'primary', icon: <Package size={14} /> },
  listo:       { label: '¡Listo para retirar!',    color: 'success',  icon: <CheckCircle size={14} /> },
  entregado:   { label: 'Entregado',               color: 'success',  icon: <CheckCircle size={14} /> },
  cancelado:   { label: 'Cancelado',               color: 'danger',   icon: <XCircle size={14} /> },
};

const MiCuenta: React.FC = () => {
  const { clienteSession, getMisPedidos, getMiSaldoCC, facturas } = useAppContext();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [saldo, setSaldo] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'facturas' | 'cuenta'>('pedidos');
  const [printOrder, setPrintOrder] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [p, s] = await Promise.all([getMisPedidos(), getMiSaldoCC()]);
      setPedidos(p);
      setSaldo(s);
      setLoading(false);
    };
    load();
  }, []);

  // Facturas del cliente logueado
  const misFaturas = facturas.filter(f => f.cliente_id === clienteSession?.cliente.id);

  if (!clienteSession) return null;

  return (
    <section className="mi-cuenta-section">
      <div className="container">

        {/* ENCABEZADO */}
        <div className="mc-header">
          <div className="mc-avatar">
            {clienteSession.cliente.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="mc-title">Hola, {clienteSession.cliente.nombre.split(' ')[0]}!</h1>
            <p className="mc-subtitle">{clienteSession.cliente.email}</p>
          </div>
        </div>

        {/* STATS */}
        <div className="mc-stats-grid">
          <div className="mc-stat">
            <Package size={22} className="mc-stat-icon" />
            <div>
              <p className="mc-stat-value">{pedidos.length}</p>
              <p className="mc-stat-label">Pedidos realizados</p>
            </div>
          </div>
          <div className="mc-stat">
            <Clock size={22} className="mc-stat-icon warning" />
            <div>
              <p className="mc-stat-value">{pedidos.filter(p => p.estado === 'pendiente').length}</p>
              <p className="mc-stat-label">Pendientes de aprobación</p>
            </div>
          </div>
          <div className="mc-stat">
            <CheckCircle size={22} className="mc-stat-icon success" />
            <div>
              <p className="mc-stat-value">{pedidos.filter(p => p.estado === 'listo').length}</p>
              <p className="mc-stat-label">Listos para retirar</p>
            </div>
          </div>
          <div className={`mc-stat ${saldo > 0 ? 'danger' : ''}`}>
            <CreditCard size={22} className={`mc-stat-icon ${saldo > 0 ? 'danger' : 'success'}`} />
            <div>
              <p className="mc-stat-value">${Math.abs(saldo).toLocaleString('es-AR')}</p>
              <p className="mc-stat-label">{saldo > 0 ? 'Saldo deudor' : saldo < 0 ? 'Saldo a favor' : 'Sin deuda'}</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="mc-tabs">
          <button className={`mc-tab ${activeTab === 'pedidos' ? 'active' : ''}`} onClick={() => setActiveTab('pedidos')}>
            <Package size={16} /> Mis Pedidos
          </button>
          <button className={`mc-tab ${activeTab === 'facturas' ? 'active' : ''}`} onClick={() => setActiveTab('facturas')}>
            <FileText size={16} /> Facturas y Comprobantes
          </button>
          <button className={`mc-tab ${activeTab === 'cuenta' ? 'active' : ''}`} onClick={() => setActiveTab('cuenta')}>
            <CreditCard size={16} /> Cuenta Corriente
          </button>
        </div>

        {/* ─── PEDIDOS ─── */}
        {activeTab === 'pedidos' && (
          <div className="mc-content animate-fade-in">
            {loading && <div className="mc-loading">Cargando pedidos...</div>}
            {!loading && pedidos.length === 0 && (
              <div className="mc-empty">
                <Package size={48} strokeWidth={1} />
                <h3>Todavía no hiciste pedidos</h3>
                <p>Cuando confirmes una pre-compra, aparecerá aquí con su estado.</p>
              </div>
            )}
            {!loading && pedidos.map(pedido => {
              const cfg = ESTADO_CONFIG[pedido.estado] ?? { label: pedido.estado, color: '', icon: null };
              return (
                <div key={pedido.id} className="mc-pedido-card">
                  <div className="mc-pedido-top">
                    <div>
                      <p className="mc-pedido-num">{pedido.numero}</p>
                      <p className="mc-pedido-fecha">{new Date(pedido.fecha).toLocaleDateString('es-AR', { year:'numeric', month:'long', day:'numeric' })}</p>
                    </div>
                    <span className={`mc-estado-badge ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  {/* Items del pedido */}
                  <div className="mc-pedido-items">
                    {pedido.items?.map((item: any, i: number) => (
                      <div key={i} className="mc-pedido-item-row">
                        <span>{item.title}</span>
                        <span>x{item.quantity}</span>
                        <span>${Number(item.price).toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mc-pedido-footer">
                    <div className="mc-pedido-info">
                      <span className="mc-info-chip">
                        {pedido.tipo_entrega === 'Retiro en local' ? <Building2 size={13} /> : <Truck size={13} />}
                        {pedido.tipo_entrega}
                      </span>
                      {pedido.notas && (
                        <span className="mc-info-chip">💳 {pedido.notas.split('|')[0].replace('Pago:', '').trim()}</span>
                      )}
                    </div>
                    <div className="mc-pedido-total-row">
                      <span className="mc-pedido-total-label">Total</span>
                      <span className="mc-pedido-total">${Number(pedido.total_ars).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {pedido.estado === 'pendiente' && (
                    <div className="mc-pedido-notice">
                      <AlertCircle size={14} />
                      <p>Tu pedido está siendo revisado. Te notificaremos cuando sea aprobado.</p>
                    </div>
                  )}
                  {pedido.estado === 'listo' && (
                    <div className="mc-pedido-notice success">
                      <CheckCircle size={14} />
                      <p>¡Tu pedido está listo! Podés venir a retirarlo a <strong>Av. 59 4461, Necochea</strong>.</p>
                    </div>
                  )}

                  <button className="mc-print-btn" onClick={() => setPrintOrder(pedido)}>
                    <Printer size={15} /> Imprimir comprobante
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── FACTURAS ─── */}
        {activeTab === 'facturas' && (
          <div className="mc-content animate-fade-in">
            {misFaturas.length === 0 && (
              <div className="mc-empty">
                <FileText size={48} strokeWidth={1} />
                <h3>Sin facturas todavía</h3>
                <p>Cuando Alfametal emita una factura a tu nombre, aparecerá aquí para que puedas descargarla.</p>
              </div>
            )}
            {misFaturas.map(f => (
              <div key={f.id} className="mc-factura-card">
                <div>
                  <p className="mc-factura-num">Factura {f.tipo} — {f.numero}</p>
                  <p className="mc-factura-fecha">{new Date(f.fecha).toLocaleDateString('es-AR', { year:'numeric', month:'long', day:'numeric' })}</p>
                </div>
                <div className="mc-factura-right">
                  <span className={`mc-estado-badge ${f.estado === 'cobrada' ? 'success' : f.estado === 'emitida' ? 'primary' : 'warning'}`}>
                    {f.estado === 'en_acopio' ? 'En proceso' : f.estado === 'emitida' ? 'Emitida' : 'Cobrada'}
                  </span>
                  <p className="mc-factura-monto">${Number(f.monto_ars).toLocaleString('es-AR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── CUENTA CORRIENTE ─── */}
        {activeTab === 'cuenta' && (
          <div className="mc-content animate-fade-in">
            <div className={`mc-saldo-box ${saldo > 0 ? 'danger' : 'success'}`}>
              <p className="mc-saldo-label">Saldo actual de tu cuenta</p>
              <p className="mc-saldo-valor">${Math.abs(saldo).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
              <p className="mc-saldo-desc">
                {saldo > 0 ? '⚠️ Tenés saldo pendiente de pago.' : saldo < 0 ? '✅ Tenés saldo a favor.' : '✅ Tu cuenta está al día.'}
              </p>
            </div>
            <div className="mc-empty" style={{marginTop:'1.5rem'}}>
              <CreditCard size={40} strokeWidth={1} />
              <h3>Movimientos de cuenta</h3>
              <p>El historial detallado de débitos y créditos de tu cuenta estará disponible aquí.</p>
            </div>
          </div>
        )}
      </div>

      {printOrder && <PrintSaleOrder order={printOrder} onClose={() => setPrintOrder(null)} />}
    </section>
  );
};

export default MiCuenta;
