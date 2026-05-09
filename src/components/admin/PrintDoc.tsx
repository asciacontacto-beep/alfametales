import React from 'react';
import './PrintDoc.css';
import type { Factura, Recibo, Pedido } from '../../context/AppContext';

const EMPRESA = {
  nombre: 'ALFAMETAL',
  razonSocial: 'Alfametal S.R.L.',
  domicilio: 'Av. 59 4461, Necochea, Buenos Aires',
  telefono: '2262 415321',
  email: 'orlandojano@yahoo.com.ar',
};

/* ─── FACTURA ─── */
interface FacturaProps {
  invoice: Factura;
  onClose: () => void;
}

export const PrintFactura: React.FC<FacturaProps> = ({ invoice, onClose }) => {
  const subtotal = invoice.monto_ars / 1.21;
  const iva = invoice.monto_ars - subtotal;

  const handlePrint = () => {
    const el = document.getElementById('print-invoice');
    if (!el) return;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    const styles = Array.from(document.styleSheets)
      .map(s => { try { return Array.from(s.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Factura ${invoice.numero}</title>
      <style>${styles}</style>
    </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  return (
    <div className="print-modal-overlay" onClick={onClose}>
      <div className="print-modal-container" onClick={e => e.stopPropagation()}>
        <div className="print-modal-actions no-print">
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕ Cerrar</button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨️ Imprimir / Guardar PDF</button>
        </div>

        <div id="print-invoice" className="doc-sheet">
          <div className="doc-header">
            <div>
              <div className="doc-brand-name">{EMPRESA.nombre}</div>
              <div className="doc-brand-sub">{EMPRESA.domicilio}</div>
              <div className="doc-brand-sub">{EMPRESA.telefono} · {EMPRESA.email}</div>
            </div>
            <div className="doc-type-box">
              <div className="doc-tipo-letter">{invoice.tipo}</div>
              <div className="doc-type-label">FACTURA</div>
              <div className="doc-number">N° {invoice.numero}</div>
              <div className="doc-number">Fecha: {new Date(invoice.fecha).toLocaleDateString('es-AR')}</div>
              <span className={`doc-status-badge doc-status-${invoice.estado.replace('_', '-')}`}>
                {invoice.estado.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="doc-parties">
            <div className="doc-party">
              <h4>Emisor</h4>
              <strong>{EMPRESA.razonSocial}</strong>
              <p>{EMPRESA.domicilio}</p>
              <p>IVA Responsable Inscripto</p>
            </div>
            <div className="doc-party">
              <h4>Cliente</h4>
              <strong>{invoice.cliente_nombre}</strong>
              <p>Condición IVA: Consumidor Final</p>
            </div>
          </div>

          <table className="doc-items-table">
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Descripción</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.cantidad}</td>
                  <td>{item.descripcion}</td>
                  <td>${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  <td>${(item.precio * item.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="doc-totals">
            <div className="doc-totals-box">
              {invoice.tipo !== 'C' && (
                <>
                  <div className="doc-total-row"><span>Subtotal (sin IVA)</span><span>${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
                  <div className="doc-total-row"><span>IVA 21%</span><span>${iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
                </>
              )}
              <div className="doc-total-row"><span>TOTAL</span><span>${invoice.monto_ars.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            </div>
          </div>

          <div className="doc-footer">
            <div>
              <p>Este documento es un comprobante interno.</p>
              <p>Válido para uso administrativo de {EMPRESA.nombre}.</p>
            </div>
            <div className="doc-firma">Firma y sello</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── RECIBO ─── */
interface ReciboProps {
  receipt: Recibo;
  onClose: () => void;
}

export const PrintRecibo: React.FC<ReciboProps> = ({ receipt, onClose }) => {
  const handlePrint = () => {
    const el = document.getElementById('print-receipt');
    if (!el) return;
    const w = window.open('', '_blank', 'width=700,height=600');
    if (!w) return;
    const styles = Array.from(document.styleSheets)
      .map(s => { try { return Array.from(s.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Recibo ${receipt.numero}</title>
      <style>${styles}</style>
    </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  return (
    <div className="print-modal-overlay" onClick={onClose}>
      <div className="print-modal-container" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div className="print-modal-actions no-print">
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕ Cerrar</button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨️ Imprimir / Guardar PDF</button>
        </div>

        <div id="print-receipt" className="doc-sheet">
          <div className="doc-header">
            <div>
              <div className="doc-brand-name">{EMPRESA.nombre}</div>
              <div className="doc-brand-sub">{EMPRESA.domicilio}</div>
              <div className="doc-brand-sub">{EMPRESA.telefono}</div>
            </div>
            <div className="doc-type-box">
              <div className="doc-type-label">RECIBO</div>
              <div className="doc-number">N° {receipt.numero}</div>
              <div className="doc-number">Fecha: {new Date(receipt.fecha).toLocaleDateString('es-AR')}</div>
            </div>
          </div>

          <div className="doc-parties">
            <div className="doc-party">
              <h4>Recibido de</h4>
              <strong>{receipt.cliente_nombre}</strong>
            </div>
            <div className="doc-party">
              <h4>Forma de pago</h4>
              <strong>{receipt.forma_pago}</strong>
            </div>
          </div>

          <table className="doc-items-table">
            <thead><tr><th>Concepto</th><th>Importe</th></tr></thead>
            <tbody>
              <tr>
                <td>{receipt.notas || 'Pago a cuenta / Cancelación de facturas'}</td>
                <td>${receipt.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div className="doc-totals">
            <div className="doc-totals-box">
              <div className="doc-total-row"><span>TOTAL RECIBIDO</span><span>${receipt.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            </div>
          </div>

          <div className="doc-footer">
            <p>Son: {numberToWords(receipt.monto)} pesos argentinos.</p>
            <div className="doc-firma">Firma y sello</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple number to words for pesos
function numberToWords(n: number): string {
  const units = ['cero','un','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez',
    'once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve'];
  const tens = ['','','veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa'];
  if (n < 20) return units[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' y ' + units[n%10] : '');
  if (n < 1000) return (n===100 ? 'cien' : (Math.floor(n/100)===1?'ciento':['','','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos'][Math.floor(n/100)]) + (n%100 ? ' ' + numberToWords(n%100) : ''));
  if (n < 1000000) return (Math.floor(n/1000)===1?'mil':numberToWords(Math.floor(n/1000))+' mil') + (n%1000 ? ' ' + numberToWords(n%1000) : '');
  return n.toLocaleString('es-AR');
}

/* ─── REMITO DE PEDIDO (VENTA) ─── */
interface PedidoProps {
  order: Pedido;
  onClose: () => void;
}

export const PrintSaleOrder: React.FC<PedidoProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    const el = document.getElementById('print-order');
    if (!el) return;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;
    const styles = Array.from(document.styleSheets)
      .map(s => { try { return Array.from(s.cssRules).map(r => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Remito de Pedido ${order.numero}</title>
      <style>${styles}</style>
    </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 500);
  };

  return (
    <div className="print-modal-overlay" onClick={onClose}>
      <div className="print-modal-container" onClick={e => e.stopPropagation()}>
        <div className="print-modal-actions no-print">
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕ Cerrar</button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>🖨️ Imprimir / Guardar PDF</button>
        </div>

        <div id="print-order" className="doc-sheet">
          <div className="doc-header">
            <div>
              <div className="doc-brand-name">{EMPRESA.nombre}</div>
              <div className="doc-brand-sub">{EMPRESA.domicilio}</div>
              <div className="doc-brand-sub">{EMPRESA.telefono}</div>
            </div>
            <div className="doc-type-box">
              <div className="doc-tipo-letter">R</div>
              <div className="doc-type-label">REMITO</div>
              <div className="doc-number">PEDIDO N° {order.numero}</div>
              <div className="doc-number">Fecha: {new Date(order.fecha).toLocaleDateString('es-AR')}</div>
              <span className={`doc-status-badge doc-status-${order.estado}`}>{order.estado.toUpperCase()}</span>
            </div>
          </div>

          <div className="doc-parties">
            <div className="doc-party">
              <h4>Cliente</h4>
              <strong>{order.cliente_nombre}</strong>
              {order.direccion_envio && <p>Dirección: {order.direccion_envio}</p>}
            </div>
            <div className="doc-party">
              <h4>Detalles</h4>
              <p>Entrega: {order.tipo_entrega}</p>
            </div>
          </div>

          <table className="doc-items-table">
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Descripción</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.quantity}</td>
                  <td>{item.title}</td>
                  <td>${(item.price * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="doc-totals">
            <div className="doc-totals-box">
              <div className="doc-total-row"><span>TOTAL ESTIMADO</span><span>${order.total_ars.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
            </div>
          </div>

          <div className="doc-footer">
            <div>
              <p>Este remito no es válido como factura fiscal.</p>
              <p>Su pedido ha sido enviado vía WhatsApp para coordinación.</p>
            </div>
            <div className="doc-firma">Recibí Conforme</div>
          </div>
        </div>
      </div>
    </div>
  );
};
