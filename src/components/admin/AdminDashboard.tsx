import React, { useState, useMemo } from 'react';
import { Receipt, Package, Users, Banknote, ArrowLeft, Settings, Plus, X, ShoppingCart, BarChart3, Eye, AlertTriangle } from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
import type { Factura, Pedido, Recibo, MovimientoCC } from '../../context/AppContext';
import { PrintFactura, PrintRecibo, PrintSaleOrder } from './PrintDoc';
import { productsData } from '../../data/products';
import './Admin.css';
import './PrintDoc.css';
import './PrintModal.css';

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [activeMenu, setActiveMenu] = useState('facturacion');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'alfametal2026') {
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <form className="admin-login-card animate-fade-in" onSubmit={handleLogin}>
          <div className="login-brand">
            <span className="logo-symbol">α</span>
            <h2>ALFAMETAL ADMIN</h2>
          </div>
          <p>Ingresá la contraseña para acceder al panel de gestión.</p>
          <div className="form-group">
            <input 
              type="password" 
              placeholder="Contraseña" 
              className={`admin-input ${loginError ? 'input-error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {loginError && <small className="text-danger">Contraseña incorrecta</small>}
          </div>
          <button type="submit" className="btn btn-primary btn-full">Entrar al Sistema</button>
          <button type="button" className="btn-exit-login" onClick={onExit}>
            <ArrowLeft size={16} /> Volver a la web pública
          </button>
        </form>
      </div>
    );
  }

  const menus = [
    { key: 'facturacion', label: 'Facturación (A-B-C)', icon: <Receipt size={20} /> },
    { key: 'pedidos', label: 'Pedidos Web (Remitos)', icon: <ShoppingCart size={20} /> },
    { key: 'informes', label: 'Informes y Estadísticas', icon: <BarChart3 size={20} /> },
    { key: 'stock', label: 'Remitos y Stock', icon: <Package size={20} /> },
    { key: 'productos', label: 'Productos y Precios', icon: <Settings size={20} /> },
    { key: 'cuentas', label: 'Cuentas Corrientes', icon: <Users size={20} /> },
    { key: 'pagos', label: 'Recibo de Pagos', icon: <Banknote size={20} /> },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'facturacion': return <AdminFacturacion />;
      case 'pedidos': return <AdminPedidos />;
      case 'informes': return <AdminInformes />;
      case 'stock': return <AdminStock />;
      case 'productos': return <AdminProductos />;
      case 'cuentas': return <AdminCuentas />;
      case 'pagos': return <AdminPagos />;
      default: return null;
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="logo-symbol">α</span>
          <span>Admin Panel</span>
        </div>
        <nav className="admin-nav">
          {menus.map(m => (
            <button
              key={m.key}
              className={`admin-nav-item ${activeMenu === m.key ? 'active' : ''}`}
              onClick={() => setActiveMenu(m.key)}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </nav>
        <div className="admin-footer">
          <button className="btn-exit-admin" onClick={onExit}>
            <ArrowLeft size={18} /> Volver a la Tienda
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h2>{menus.find(m => m.key === activeMenu)?.label}</h2>
          <div className="admin-header-actions">
            <span className="admin-badge">Administrador Conectado</span>
          </div>
        </header>
        <div className="admin-content-wrapper animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

/* ─── FACTURACIÓN ─── */
const AdminFacturacion = () => {
  const { facturas, addFactura, updateFacturaEstado, clientes, products } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    clienteId: '', 
    tipo: 'B' as 'A'|'B'|'C', 
    estado: 'en_acopio' as any,
    items: [{ producto_id: 0, descripcion: '', cantidad: 1, precio: 0 }]
  });
  const [printInvoice, setPrintInvoice] = useState<Factura | null>(null);

  const acopio = facturas.filter(i => i.estado === 'en_acopio');
  const emitidas = facturas.filter(i => i.estado === 'emitida');
  const totalArs = facturas.reduce((s, i) => s + Number(i.monto_ars), 0);

  const addItem = () => setForm({ ...form, items: [...form.items, { producto_id: 0, descripcion: '', cantidad: 1, precio: 0 }] });
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItem = (idx: number, field: string, val: any) => {
    const newItems = [...form.items];
    const item = { ...newItems[idx], [field]: val };
    if (field === 'producto_id') {
      const p = products.find(prod => prod.id === Number(val));
      if (p) {
        item.descripcion = p.nombre;
        item.precio = p.precio_ars;
      }
    }
    newItems[idx] = item;
    setForm({ ...form, items: newItems });
  };

  const currentTotal = form.items.reduce((s, it) => s + (it.precio * it.cantidad), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clientes.find(c => c.id === Number(form.clienteId));
    if (!cliente || form.items.length === 0) return;
    
    const num = `FAC-${String(facturas.length + 1001).padStart(6, '0')}`;
    await addFactura({
      numero: num,
      cliente_id: cliente.id,
      fecha: new Date().toISOString().split('T')[0],
      tipo: form.tipo,
      estado: form.estado,
      monto_ars: currentTotal,
      items: form.items.map(it => ({ descripcion: it.descripcion, cantidad: it.cantidad, precio: it.precio })),
      notas: ''
    });
    setShowForm(false);
    setForm({ clienteId: '', tipo: 'B', estado: 'en_acopio', items: [{ producto_id: 0, descripcion: '', cantidad: 1, precio: 0 }] });
  };

  return (
    <div>
      <div className="admin-stats-row">
        <div className="stat-box"><h4>En Acopio</h4><span className="stat-value text-warning">{acopio.length}</span></div>
        <div className="stat-box"><h4>Emitidas</h4><span className="stat-value text-primary">{emitidas.length}</span></div>
        <div className="stat-box"><h4>Total Facturado</h4><span className="stat-value text-success">${totalArs.toLocaleString('es-AR')}</span></div>
      </div>

      <div className="admin-card" style={{marginTop:'1.5rem'}}>
        <div className="admin-card-header">
          <h3>Listado de Facturas</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X size={16}/> Cancelar</> : <><Plus size={16}/> Nueva Factura</>}
          </button>
        </div>
        {showForm && (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Cliente</label>
                <select value={form.clienteId} onChange={e => setForm({...form, clienteId: e.target.value})} required>
                  <option value="">Seleccionar...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value as any})}>
                  <option value="A">Factura A</option>
                  <option value="B">Factura B</option>
                  <option value="C">Factura C</option>
                </select>
              </div>
              <div className="form-group">
                <label>Estado Inicial</label>
                <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value as any})}>
                  <option value="en_acopio">En Acopio</option>
                  <option value="emitida">Emitida</option>
                </select>
              </div>
            </div>

            <div className="admin-items-section" style={{marginTop:'1.5rem'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                <h4>Ítems de Factura</h4>
                <button type="button" className="btn btn-outline btn-sm" onClick={addItem}><Plus size={14}/> Agregar Ítem</button>
              </div>
              <table className="admin-table-compact">
                <thead>
                  <tr>
                    <th>Producto / Descripción</th>
                    <th style={{width:'100px'}}>Cant.</th>
                    <th style={{width:'150px'}}>Precio Unit.</th>
                    <th style={{width:'150px'}}>Subtotal</th>
                    <th style={{width:'50px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <select 
                          value={item.producto_id} 
                          onChange={e => updateItem(idx, 'producto_id', e.target.value)}
                          style={{width:'100%', marginBottom:'5px'}}
                        >
                          <option value={0}>Seleccionar producto...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                        <input 
                          type="text" 
                          placeholder="Descripción personalizada..." 
                          value={item.descripcion} 
                          onChange={e => updateItem(idx, 'descripcion', e.target.value)} 
                        />
                      </td>
                      <td>
                        <input type="number" min={1} value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', Number(e.target.value))} />
                      </td>
                      <td>
                        <input type="number" value={item.precio} onChange={e => updateItem(idx, 'precio', Number(e.target.value))} />
                      </td>
                      <td style={{textAlign:'right'}}>${(item.precio * item.cantidad).toLocaleString('es-AR')}</td>
                      <td>
                        <button type="button" className="btn-remove-item" onClick={() => removeItem(idx)}><X size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="form-total-row" style={{textAlign:'right', marginTop:'1rem', fontSize:'1.2rem', fontWeight:'bold'}}>
                Total ARS: ${currentTotal.toLocaleString('es-AR')}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{marginTop:'2rem'}}>Guardar Factura</button>
          </form>
        )}
        <div className="admin-card-body">
          <table className="admin-table">
            <thead><tr><th>N°</th><th>Cliente</th><th>Fecha</th><th>Tipo</th><th>Estado</th><th>Monto</th><th>Acciones</th></tr></thead>
            <tbody>
              {facturas.map(inv => (
                <tr key={inv.id}>
                  <td><strong>{inv.numero}</strong></td>
                  <td>{inv.cliente_nombre}</td>
                  <td>{new Date(inv.fecha).toLocaleDateString('es-AR')}</td>
                  <td><span className="tipo-badge">Tipo {inv.tipo}</span></td>
                  <td>
                    <span className={`status-badge ${inv.estado === 'en_acopio' ? 'warning' : inv.estado === 'cobrada' ? 'success' : 'primary'}`}>
                      {inv.estado.replace('_', ' ')}
                    </span>
                  </td>
                  <td>${Number(inv.monto_ars).toLocaleString('es-AR')}</td>
                  <td style={{display:'flex', gap:'0.5rem'}}>
                    <button className="btn btn-sm btn-outline" onClick={() => setPrintInvoice(inv)} title="Imprimir"><Eye size={14}/></button>
                    {inv.estado === 'en_acopio' && (
                      <button className="btn btn-sm btn-outline" onClick={() => updateFacturaEstado(inv.id, 'emitida')}>Emitir</button>
                    )}
                    {inv.estado === 'emitida' && (
                      <button className="btn btn-sm btn-outline" onClick={() => updateFacturaEstado(inv.id, 'cobrada')}>Marcar Cobrada</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {printInvoice && <PrintFactura invoice={printInvoice} onClose={() => setPrintInvoice(null)} />}
    </div>
  );
};

/* ─── PEDIDOS WEB ─── */
const AdminPedidos = () => {
  const { pedidos, updatePedidoEstado } = useAppContext();
  const [printOrder, setPrintOrder] = useState<Pedido | null>(null);

  const pendientes = pedidos.filter(p => p.estado === 'pendiente');
  const enCurso = pedidos.filter(p => p.estado === 'preparando' || p.estado === 'listo');
  const completados = pedidos.filter(p => p.estado === 'entregado' || p.estado === 'cancelado');

  // Extraer teléfono de las notas del pedido
  const getPhone = (order: Pedido): string | null => {
    const match = order.notas?.match(/Tel: ?(\d+)/);
    return match ? match[1] : null;
  };

  const notifyWhatsApp = (order: Pedido, mensaje: string) => {
    const phone = getPhone(order);
    if (!phone) {
      alert('Este pedido no tiene número de teléfono guardado. Podés contactar al cliente manualmente.');
      return;
    }
    const text = encodeURIComponent(mensaje);
    window.open(`https://wa.me/54${phone.replace(/\D/g,'')}?text=${text}`, '_blank');
  };

  // ─── Config de pagos (completar con datos reales) ───
  const CBU_ALIAS = 'alfametal.necochea'; // ← Cambiar por el alias real
  const CBU_NUMERO = '0000000000000000000000'; // ← Cambiar por el CBU real
  const MP_LINK_BASE = 'https://mpago.la/'; // ← Pegar link de pago fijo de MP (configurar en MP)

  const handleAprobar = async (order: Pedido) => {
    const metodoPago = window.confirm(
      `Pedido ${order.numero} — $${Number(order.total_ars).toLocaleString('es-AR')}\n\n` +
      `¿Cómo querés que pague el cliente?\n\n` +
      `OK → Transferencia bancaria (enviás CBU/alias)\n` +
      `Cancelar → Link de Mercado Pago`
    );

    await updatePedidoEstado(order.id, 'preparando');

    const base =
      `¡Hola! 👋 Tu pedido *${order.numero}* de Alfametal fue *aprobado* ✅\n\n` +
      `📦 Entrega: ${order.tipo_entrega}\n` +
      `💰 Total a abonar: *$${Number(order.total_ars).toLocaleString('es-AR')}*\n\n`;

    const instruccionPago = metodoPago
      ? `💳 *Datos para transferencia:*\n` +
        `🏦 CBU: \`${CBU_NUMERO}\`\n` +
        `🔑 Alias: \`${CBU_ALIAS}\`\n` +
        `💬 Una vez realizada, envianos el comprobante por acá.`
      : `💳 *Podés pagar con Mercado Pago haciendo clic acá:*\n` +
        `🔗 ${MP_LINK_BASE}\n` +
        `(Aceptamos débito, crédito y dinero en cuenta)\n` +
        `💬 Una vez pagado, envianos el comprobante.`;

    notifyWhatsApp(order, base + instruccionPago +
      `\n\n¡Gracias por elegirnos! Ante cualquier duda, estamos acá 😊`
    );
  };


  const handleRechazar = async (order: Pedido) => {
    const motivo = prompt('Motivo del rechazo (opcional):') ?? '';
    await updatePedidoEstado(order.id, 'cancelado');
    notifyWhatsApp(order,
      `Hola, lamentamos informarte que tu pedido *${order.numero}* no pudo ser confirmado en este momento.` +
      (motivo ? `\n\nMotivo: ${motivo}` : '') +
      `\n\nNo dudes en contactarnos para más información. ¡Gracias por elegirnos!`
    );
  };

  const handleListo = async (order: Pedido) => {
    await updatePedidoEstado(order.id, 'listo');
    notifyWhatsApp(order,
      `¡Buenas noticias! 🎉 Tu pedido *${order.numero}* está *listo para retirar* en nuestro local.\n\n` +
      `📍 Av. 59 4461, Necochea\n🕐 Horario de atención: Lunes a Viernes 8 a 18hs\n\n` +
      `Recordá traer tu comprobante de pedido. ¡Te esperamos!`
    );
  };

  const StatusBadge = ({ estado }: { estado: string }) => {
    const map: Record<string, string> = {
      pendiente: 'warning', preparando: 'primary', listo: 'success',
      entregado: 'success', cancelado: 'danger'
    };
    return (
      <span className={`status-badge ${map[estado] || ''}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const OrderTable = ({ orders, showActions }: { orders: Pedido[], showActions: boolean }) => (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Pedido</th><th>Notas / Cliente</th><th>Fecha</th>
          <th>Entrega</th><th>Total</th><th>Estado</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {orders.length === 0 && (
          <tr><td colSpan={7} style={{textAlign:'center', color:'#94a3b8', padding:'2rem'}}>Sin pedidos en esta categoría</td></tr>
        )}
        {orders.map(order => (
          <tr key={order.id}>
            <td><strong>{order.numero}</strong></td>
            <td style={{fontSize:'0.8rem', maxWidth:'180px'}}>
              {order.notas?.split('|').map((n, i) => <div key={i}>{n.trim()}</div>)}
            </td>
            <td>{new Date(order.fecha).toLocaleDateString('es-AR')}</td>
            <td style={{fontSize:'0.8rem'}}>{order.tipo_entrega}</td>
            <td><strong>${Number(order.total_ars).toLocaleString('es-AR')}</strong></td>
            <td><StatusBadge estado={order.estado} /></td>
            <td>
              <div style={{display:'flex', gap:'0.4rem', flexWrap:'wrap'}}>
                <button className="btn btn-sm btn-outline" onClick={() => setPrintOrder(order)} title="Ver detalle">
                  <Eye size={13} />
                </button>
                {showActions && order.estado === 'pendiente' && (
                  <>
                    <button className="btn btn-sm btn-primary" onClick={() => handleAprobar(order)} title="Aprobar y notificar">
                      ✅ Aprobar
                    </button>
                    <button className="btn btn-sm" style={{background:'#fee2e2',color:'#dc2626',border:'1px solid #fca5a5'}} onClick={() => handleRechazar(order)} title="Rechazar">
                      ✗ Rechazar
                    </button>
                  </>
                )}
                {showActions && order.estado === 'preparando' && (
                  <button className="btn btn-sm btn-primary" onClick={() => handleListo(order)}>
                    📦 Marcar Listo
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div>
      <div className="admin-stats-row">
        <div className="stat-box"><h4>⏳ Pendientes</h4><span className="stat-value text-warning">{pendientes.length}</span></div>
        <div className="stat-box"><h4>🔄 En Proceso</h4><span className="stat-value text-primary">{enCurso.length}</span></div>
        <div className="stat-box"><h4>✅ Completados</h4><span className="stat-value text-success">{completados.length}</span></div>
      </div>

      {pendientes.length > 0 && (
        <div className="admin-card" style={{marginTop:'1.5rem', border:'2px solid #fde68a'}}>
          <div className="admin-card-header" style={{background:'#fffbeb'}}>
            <h3>⚠️ Pre-compras pendientes de aprobación</h3>
            <span className="status-badge warning">{pendientes.length} sin confirmar</span>
          </div>
          <div className="admin-card-body">
            <OrderTable orders={pendientes} showActions={true} />
          </div>
        </div>
      )}

      <div className="admin-card" style={{marginTop:'1.5rem'}}>
        <div className="admin-card-header"><h3>🔄 En preparación / Listos</h3></div>
        <div className="admin-card-body">
          <OrderTable orders={enCurso} showActions={true} />
        </div>
      </div>

      <div className="admin-card" style={{marginTop:'1.5rem'}}>
        <div className="admin-card-header"><h3>📋 Historial</h3></div>
        <div className="admin-card-body">
          <OrderTable orders={completados} showActions={false} />
        </div>
      </div>

      {printOrder && <PrintSaleOrder order={printOrder} onClose={() => setPrintOrder(null)} />}
    </div>
  );
};

/* ─── REMITOS Y STOCK ─── */
const AdminStock = () => {
  const { products, updateProductStock, addRemito, proveedores } = useAppContext();
  const [showRemito, setShowRemito] = useState(false);
  const [remitoForm, setRemitoForm] = useState({ proveedorId: '', numero: '', items: [{ producto_id: 0, cantidad: 1 }] });

  const addItem = () => setRemitoForm({ ...remitoForm, items: [...remitoForm.items, { producto_id: 0, cantidad: 1 }] });
  const removeItem = (idx: number) => setRemitoForm({ ...remitoForm, items: remitoForm.items.filter((_, i) => i !== idx) });
  const updateItem = (idx: number, field: string, val: any) => {
    const newItems = [...remitoForm.items];
    newItems[idx] = { ...newItems[idx], [field]: val };
    setRemitoForm({ ...remitoForm, items: newItems });
  };

  const handleRemitoSave = async () => {
    if (!remitoForm.proveedorId || remitoForm.items.some(it => it.producto_id === 0)) return;
    await addRemito({
      numero: remitoForm.numero || `REM-${Date.now()}`,
      proveedor_id: Number(remitoForm.proveedorId),
      fecha: new Date().toISOString().split('T')[0],
      items: remitoForm.items,
      estado: 'recibido',
      notas: ''
    });
    setShowRemito(false);
    setRemitoForm({ proveedorId: '', numero: '', items: [{ producto_id: 0, cantidad: 1 }] });
  };

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Entrada de Mercadería (Remitos)</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowRemito(!showRemito)}>
            {showRemito ? 'Cancelar' : 'Cargar Remito'}
          </button>
        </div>
        {showRemito && (
          <div className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Proveedor</label>
                <select value={remitoForm.proveedorId} onChange={e => setRemitoForm({...remitoForm, proveedorId: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>N° de Remito</label>
                <input type="text" value={remitoForm.numero} onChange={e => setRemitoForm({...remitoForm, numero: e.target.value})} />
              </div>
            </div>
            {remitoForm.items.map((item, idx) => (
              <div className="form-row" key={idx} style={{alignItems:'flex-end'}}>
                <div className="form-group" style={{flex:3}}>
                  <label>Producto</label>
                  <select value={item.producto_id} onChange={e => updateItem(idx, 'producto_id', Number(e.target.value))}>
                    <option value={0}>Seleccionar...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{flex:1}}>
                  <label>Cantidad</label>
                  <input type="number" value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', Number(e.target.value))} />
                </div>
                <button type="button" className="btn btn-outline btn-sm" style={{marginBottom:'1rem'}} onClick={() => removeItem(idx)}><X size={14}/></button>
              </div>
            ))}
            <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
              <button type="button" className="btn btn-outline btn-sm" onClick={addItem}><Plus size={14}/> Agregar Ítem</button>
              <button className="btn btn-primary" onClick={handleRemitoSave}>Confirmar Entrada de Stock</button>
            </div>
          </div>
        )}
      </div>

      <div className="admin-card" style={{marginTop:'1.5rem'}}>
        <div className="admin-card-header"><h3>Control de Stock Actual</h3></div>
        <div className="admin-card-body">
          <table className="admin-table">
            <thead><tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Ajuste Manual</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td>
                    <span className={`status-badge ${p.stock_actual <= p.stock_minimo ? 'warning' : 'success'}`}>
                      {p.stock_actual} {p.unidad}
                    </span>
                    {p.stock_actual <= p.stock_minimo && <AlertTriangle size={14} className="text-warning" style={{marginLeft:'5px'}}/>}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => {
                      const n = prompt(`Ajustar stock para ${p.nombre}:`, String(p.stock_actual));
                      if (n !== null) updateProductStock(p.id, Number(n));
                    }}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ─── PRODUCTOS Y PRECIOS ─── */
const AdminProductos = () => {
  const { products, usdRate, setUsdRateGlobal, updateProduct, addProduct } = useAppContext();
  const [localRate, setLocalRate] = useState(usdRate);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProd, setNewProd] = useState({ 
    nombre: '', code: '', categoria: '', subcategoria: '', 
    precio_usd: 0, stock_actual: 0, stock_minimo: 10, unidad: 'unidad' 
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProduct({
      ...newProd,
      activo: true,
      descripcion: '',
      precio_ars: newProd.precio_usd * usdRate,
      manual_price_ars: null,
      tag: newProd.unidad === 'por barra' ? '6.4 Mts.' : 'Por metro lineal',
      specs: {}
    });
    setShowNewForm(false);
    setNewProd({ nombre: '', code: '', categoria: '', subcategoria: '', precio_usd: 0, stock_actual: 0, stock_minimo: 10, unidad: 'unidad' });
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('¿Cargar los 90+ productos iniciales en la base de datos?')) return;
    for (const p of productsData) {
      await addProduct({
        nombre: p.name,
        code: p.code,
        categoria: p.cat,
        subcategoria: p.subcat,
        unidad: p.unit,
        precio_usd: p.basePriceUsd,
        stock_actual: 50, // Default stock for testing
        stock_minimo: 10,
        activo: true,
        descripcion: '',
        precio_ars: p.basePriceUsd * usdRate,
        manual_price_ars: null,
        tag: p.unit === 'por barra' ? '6.4 Mts.' : 'Por metro lineal',
        specs: {}
      });
    }
    alert('Base de datos cargada con éxito.');
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>Cotización del Dólar y Precios</h3>
        <div style={{display:'flex', gap:'1rem'}}>
          {products.length === 0 && (
            <button className="btn btn-outline btn-sm" onClick={handleSeedDatabase}>
              🚀 Cargar Base de Datos
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewForm(!showNewForm)}>
            {showNewForm ? 'Cancelar' : 'Nuevo Producto'}
          </button>
          <div className="usd-global-config">
            <label>Dólar Hoy: $</label>
            <input type="number" value={localRate} onChange={e => setLocalRate(Number(e.target.value))} />
            <button className="btn btn-primary btn-sm" onClick={() => setUsdRateGlobal(localRate)}>Actualizar Catálogo</button>
          </div>
        </div>
      </div>

      {showNewForm && (
        <form className="admin-form" onSubmit={handleCreate} style={{padding:'1rem', borderBottom:'1px solid #e2e8f0'}}>
          <div className="form-row">
            <div className="form-group"><label>Nombre</label><input type="text" placeholder="Ej: Caño Galvanizado 1/2" value={newProd.nombre} onChange={e=>setNewProd({...newProd, nombre: e.target.value})} required/></div>
            <div className="form-group"><label>Código</label><input type="text" placeholder="Ej: GALV-050" value={newProd.code} onChange={e=>setNewProd({...newProd, code: e.target.value})} required/></div>
            <div className="form-group">
              <label>Unidad</label>
              <select value={newProd.unidad} onChange={e=>setNewProd({...newProd, unidad: e.target.value})}>
                <option value="unidad">Unidad</option><option value="por barra">Por barra</option><option value="por metro">Por metro</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Categoría</label><input type="text" placeholder="Ej: Caños C/Costura" value={newProd.categoria} onChange={e=>setNewProd({...newProd, categoria: e.target.value})} /></div>
            <div className="form-group"><label>Subcategoría</label><input type="text" placeholder="Ej: Galvanizado R y C" value={newProd.subcategoria} onChange={e=>setNewProd({...newProd, subcategoria: e.target.value})} /></div>
            <div className="form-group"><label>Precio USD</label><input type="number" placeholder="Ej: 15.50" value={newProd.precio_usd} onChange={e=>setNewProd({...newProd, precio_usd: Number(e.target.value)})} /></div>
          </div>
          <button type="submit" className="btn btn-primary">Crear Producto</button>
        </form>
      )}

      <div className="admin-card-body">
        <table className="admin-table">
          <thead><tr><th>Producto</th><th>Precio USD</th><th>ARS Auto</th><th>ARS Manual</th><th>Acción</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>${Number(p.precio_usd).toFixed(2)}</td>
                <td>${(Number(p.precio_usd) * usdRate).toLocaleString('es-AR')}</td>
                <td>
                  <input 
                    type="number" 
                    className="admin-input-small"
                    placeholder="Manual..." 
                    defaultValue={p.manual_price_ars || ''}
                    onBlur={e => updateProduct({ id: p.id, manual_price_ars: e.target.value ? Number(e.target.value) : null })}
                  />
                </td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => {
                    const desc = prompt('Nueva descripción:', p.descripcion);
                    if (desc !== null) updateProduct({ id: p.id, descripcion: desc });
                  }}>Edit Info</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─── CUENTAS CORRIENTES ─── */
const AdminCuentas = () => {
  const { clientes, getHistorialCC } = useAppContext();
  const [selectedEntidad, setSelectedEntidad] = useState<{tipo:'cliente'|'proveedor', id:number, nombre:string} | null>(null);
  const [historial, setHistorial] = useState<MovimientoCC[]>([]);

  const handleVerCC = async (tipo:'cliente'|'proveedor', id:number, nombre:string) => {
    const data = await getHistorialCC(tipo, id);
    setHistorial(data);
    setSelectedEntidad({tipo, id, nombre});
  };

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header"><h3>Saldos de Clientes</h3></div>
        <div className="admin-card-body">
          <table className="admin-table">
            <thead><tr><th>Nombre</th><th>Email/Tel</th><th>Acción</th></tr></thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.nombre}</strong></td>
                  <td>{c.email} / {c.telefono}</td>
                  <td><button className="btn btn-sm btn-outline" onClick={() => handleVerCC('cliente', c.id, c.nombre)}>Ver Cuenta</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEntidad && (
        <div className="admin-card animate-fade-in" style={{marginTop:'2rem'}}>
          <div className="admin-card-header">
            <h3>Estado de Cuenta: {selectedEntidad.nombre}</h3>
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedEntidad(null)}>Cerrar</button>
          </div>
          <div className="admin-card-body">
            <table className="admin-table">
              <thead><tr><th>Fecha</th><th>Movimiento</th><th>Monto</th><th>Saldo Acum.</th></tr></thead>
              <tbody>
                {historial.map(m => (
                  <tr key={m.id}>
                    <td>{new Date(m.fecha).toLocaleDateString()}</td>
                    <td>{m.tipo_movimiento.toUpperCase()} - {m.notas}</td>
                    <td className={Number(m.monto) > 0 ? 'text-danger' : 'text-success'}>
                      ${Number(m.monto).toLocaleString('es-AR')}
                    </td>
                    <td><strong>${Number(m.saldo_acumulado).toLocaleString('es-AR')}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── RECIBO DE PAGOS ─── */
const AdminPagos = () => {
  const { recibos, addRecibo, clientes } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clienteId: '', monto: '', metodo: 'Transferencia', notas: '', applyTo: [] as number[] });
  const [printRecibo, setPrintRecibo] = useState<Recibo | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clienteId || !form.monto) return;
    const num = `REC-${Date.now().toString().slice(-6)}`;
    await addRecibo({
      numero: num,
      cliente_id: Number(form.clienteId),
      fecha: new Date().toISOString().split('T')[0],
      monto: Number(form.monto),
      forma_pago: form.metodo,
      facturas_aplicadas: form.applyTo.map(id => ({ id })),
      notas: form.notas
    });
    setShowForm(false);
    setForm({ clienteId: '', monto: '', metodo: 'Transferencia', notas: '', applyTo: [] });
  };

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Recibos de Pago</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Nuevo Recibo'}
          </button>
        </div>
        {showForm && (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Cliente</label>
                <select value={form.clienteId} onChange={e => setForm({...form, clienteId: e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Monto Recibido (ARS)</label>
                <input type="number" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Método</label>
                <select value={form.metodo} onChange={e => setForm({...form, metodo: e.target.value})}>
                  <option>Transferencia</option><option>Efectivo</option><option>Cheque</option><option>MercadoPago</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notas</label>
                <input type="text" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Generar Recibo y Actualizar CC</button>
          </form>
        )}
        <div className="admin-card-body">
          <table className="admin-table">
            <thead><tr><th>Recibo</th><th>Cliente</th><th>Fecha</th><th>Monto</th><th>Acción</th></tr></thead>
            <tbody>
              {recibos.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.numero}</strong></td>
                  <td>{r.cliente_nombre}</td>
                  <td>{new Date(r.fecha).toLocaleDateString()}</td>
                  <td>${Number(r.monto).toLocaleString('es-AR')}</td>
                  <td><button className="btn btn-sm btn-outline" onClick={() => setPrintRecibo(r)}><Eye size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {printRecibo && <PrintRecibo receipt={printRecibo} onClose={() => setPrintRecibo(null)} />}
    </div>
  );
};

/* ─── INFORMES Y ESTADÍSTICAS ─── */
const AdminInformes = () => {
  const { facturas, pedidos } = useAppContext();

  const salesByDate = useMemo(() => {
    const data: Record<string, number> = {};
    [...facturas].forEach(item => {
      const date = new Date(item.fecha).toLocaleDateString('es-AR');
      data[date] = (data[date] || 0) + Number(item.monto_ars);
    });
    return Object.entries(data).map(([name, total]) => ({ name, total }));
  }, [facturas]);

  return (
    <div className="admin-informes-container">
      <div className="grid-3" style={{marginBottom: '2rem'}}>
        <div className="stat-box">
          <h4>Ventas Facturadas (ARS)</h4>
          <span className="stat-value">${facturas.reduce((s, i) => s + Number(i.monto_ars), 0).toLocaleString('es-AR')}</span>
        </div>
        <div className="stat-box">
          <h4>Pedidos Web</h4>
          <span className="stat-value">{pedidos.length}</span>
        </div>
        <div className="stat-box">
          <h4>Ticket Promedio</h4>
          <span className="stat-value">
            ${(facturas.reduce((s, i) => s + Number(i.monto_ars), 0) / (facturas.length || 1)).toLocaleString('es-AR', {maximumFractionDigits: 0})}
          </span>
        </div>
      </div>

      <div className="admin-charts-grid">
        <div className="admin-card chart-card">
          <div className="admin-card-header"><h3>Ventas Históricas (Facturación)</h3></div>
          <div className="admin-card-body" style={{height: '300px'}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#0ca354" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
