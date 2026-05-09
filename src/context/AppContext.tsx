import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// --- TYPES ---

export interface Product {
  id: number;
  code: string;
  nombre: string;
  categoria: string;
  subcategoria: string;
  stock_actual: number;
  stock_minimo: number;
  unidad: string;
  precio_usd: number;
  precio_ars: number;
  manual_price_ars: number | null;
  descripcion: string;
  activo: boolean;
  priceDisplay: string;
  tag: string;
  badge: 'EN STOCK' | 'BAJO STOCK' | 'SIN STOCK';
  specs: { largo?: string; marca?: string; pesoAprox?: string; };
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  cuit: string;
  tipo: 'minorista' | 'mayorista';
  auth_user_id?: string; // Vincula con Supabase Auth
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string;
  email: string;
  telefono: string;
  cuit: string;
}

export interface Factura {
  id: number;
  numero: string;
  cliente_id: number;
  cliente_nombre?: string;
  fecha: string;
  tipo: 'A' | 'B' | 'C';
  estado: 'en_acopio' | 'emitida' | 'cobrada';
  monto_ars: number;
  items: any[];
  notas: string;
}

export interface Pedido {
  id: number;
  numero: string;
  cliente_id: number;
  cliente_nombre?: string;
  fecha: string;
  estado: 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado';
  tipo_entrega: string;
  items: any[];
  total_ars: number;
  direccion_envio?: string;
  notas?: string;
}

export interface Remito {
  id: number;
  numero: string;
  proveedor_id: number;
  proveedor_nombre?: string;
  fecha: string;
  items: any[];
  estado: string;
  notas: string;
}

export interface Recibo {
  id: number;
  numero: string;
  cliente_id: number;
  cliente_nombre?: string;
  fecha: string;
  monto: number;
  forma_pago: string;
  facturas_aplicadas: any[];
  notas: string;
}

export interface MovimientoCC {
  id: number;
  entidad_tipo: 'cliente' | 'proveedor';
  entidad_id: number;
  fecha: string;
  tipo_movimiento: string;
  monto: number;
  referencia_id: number;
  notas: string;
  saldo_acumulado?: number;
}

// Sesión del cliente autenticado
export interface ClienteSession {
  authUser: SupabaseUser;
  cliente: Cliente;
}

interface AppContextType {
  usdRate: number;
  loading: boolean;
  products: Product[];
  clientes: Cliente[];
  proveedores: Proveedor[];
  facturas: Factura[];
  pedidos: Pedido[];
  remitos: Remito[];
  recibos: Recibo[];

  // Auth
  currentUser: string | null;        // Admin (simple password)
  clienteSession: ClienteSession | null; // Cliente autenticado con Supabase Auth
  authLoading: boolean;

  refreshData: () => Promise<void>;
  setUsdRateGlobal: (rate: number) => Promise<void>;

  // Admin auth (simple)
  login: (name: string, email: string) => void;
  logout: () => void;

  // Cliente auth (Supabase)
  registerCliente: (nombre: string, email: string, password: string, telefono?: string) => Promise<{ error: string | null }>;
  loginCliente: (email: string, password: string) => Promise<{ error: string | null }>;
  logoutCliente: () => Promise<void>;

  // Productos
  addProduct: (p: Omit<Product, 'id' | 'priceDisplay' | 'badge'>) => Promise<void>;
  updateProduct: (p: Partial<Product>) => Promise<void>;
  updateProductStock: (id: number, newStock: number) => Promise<void>;

  // Facturacion
  addFactura: (f: Omit<Factura, 'id'>) => Promise<void>;
  updateFacturaEstado: (id: number, estado: Factura['estado']) => Promise<void>;

  // Pedidos
  addPedido: (order: Omit<Pedido, 'id'>) => Promise<number>;
  updatePedidoEstado: (id: number, estado: Pedido['estado']) => Promise<void>;
  getMisPedidos: () => Promise<Pedido[]>;

  // Remitos
  addRemito: (r: Omit<Remito, 'id'>) => Promise<void>;

  // Cuentas Corrientes & Recibos
  addRecibo: (r: Omit<Recibo, 'id'>) => Promise<void>;
  getHistorialCC: (tipo: 'cliente' | 'proveedor', id: number) => Promise<MovimientoCC[]>;
  getMiSaldoCC: () => Promise<number>;
  addCliente: (c: Omit<Cliente, 'id'>) => Promise<number | null>;
  addProveedor: (p: Omit<Proveedor, 'id'>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usdRate, setUsdRate] = useState(1100);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [remitos, setRemitos] = useState<Remito[]>([]);
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [clienteSession, setClienteSession] = useState<ClienteSession | null>(null);

  // ─── Supabase Auth listener ───────────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Buscar el registro de cliente vinculado a este usuario
        let { data: clienteData } = await supabase
          .from('clientes')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

        if (!clienteData && session.user.email) {
          // Recuperación: si el usuario existe en Auth pero no en clientes (falló a la mitad)
          const { data: newCliente } = await supabase.from('clientes').insert([{
            nombre: session.user.email.split('@')[0],
            email: session.user.email,
            direccion: '',
            cuit: '',
            tipo: 'minorista',
            auth_user_id: session.user.id,
          }]).select().single();
          clienteData = newCliente;
        }

        if (clienteData) {
          setClienteSession({ authUser: session.user, cliente: clienteData as Cliente });
        } else {
          supabase.auth.signOut(); // Forzar cierre si no se puede recuperar
        }
      } else {
        setClienteSession(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const { data: config } = await supabase.from('configuracion').select('*').eq('clave', 'tipo_cambio_usd').single();
      if (config) setUsdRate(Number(config.valor));

      const [pRes, cRes, provRes, fRes, pedRes, rRes, recRes] = await Promise.all([
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('proveedores').select('*').order('nombre'),
        supabase.from('facturas').select('*, clientes(nombre)').order('id', { ascending: false }),
        supabase.from('pedidos').select('*, clientes(nombre)').order('id', { ascending: false }),
        supabase.from('remitos').select('*, proveedores(nombre)').order('id', { ascending: false }),
        supabase.from('recibos').select('*, clientes(nombre)').order('id', { ascending: false }),
      ]);

      if (pRes.data) {
        const rate = config ? Number(config.valor) : 1100;
        setProducts(pRes.data.map((p: any) => ({
          ...p,
          priceDisplay: `$${(p.manual_price_ars || p.precio_usd * rate).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          tag: p.tag || (p.unidad === 'por barra' ? '6.4 Mts.' : 'Por metro lineal'),
          badge: p.stock_actual === 0 ? 'SIN STOCK' : (p.stock_actual <= p.stock_minimo ? 'BAJO STOCK' : 'EN STOCK'),
          specs: p.specs || {}
        })));
      }
      if (cRes.data) setClientes(cRes.data);
      if (provRes.data) setProveedores(provRes.data);
      if (fRes.data) setFacturas(fRes.data.map((f: any) => ({ ...f, cliente_nombre: f.clientes?.nombre })));
      if (pedRes.data) setPedidos(pedRes.data.map((p: any) => ({ ...p, cliente_nombre: p.clientes?.nombre })));
      if (rRes.data) setRemitos(rRes.data.map((r: any) => ({ ...r, proveedor_nombre: r.proveedores?.nombre })));
      if (recRes.data) setRecibos(recRes.data.map((r: any) => ({ ...r, cliente_nombre: r.clientes?.nombre })));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  const setUsdRateGlobal = async (rate: number) => {
    const { error } = await supabase.from('configuracion').update({ valor: rate.toString() }).eq('clave', 'tipo_cambio_usd');
    if (!error) { setUsdRate(rate); refreshData(); }
  };

  // ─── Admin auth (simple) ──────────────────────────────────────────────────
  const login = (name: string, _email: string) => setCurrentUser(name);
  const logout = () => setCurrentUser(null);

  // ─── Cliente auth (Supabase) ──────────────────────────────────────────────
  const registerCliente = async (nombre: string, email: string, password: string, telefono = '') => {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return { error: authError.message };
    if (!authData.user) return { error: 'No se pudo crear el usuario.' };

    // 2. Crear registro en tabla clientes
    const { data: clienteData, error: clienteError } = await supabase.from('clientes').insert([{
      nombre,
      email,
      telefono,
      direccion: '',
      cuit: '',
      tipo: 'minorista',
      auth_user_id: authData.user.id,
    }]).select().single();

    if (clienteError) {
      console.error('Error al insertar cliente:', clienteError);
      return { error: 'Cuenta creada, pero hubo un error al guardar tus datos. Contactanos.' };
    }

    setClienteSession({ authUser: authData.user, cliente: clienteData as Cliente });
    refreshData();
    return { error: null };
  };

  const loginCliente = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'Email o contraseña incorrectos.' };
    return { error: null };
    // El onAuthStateChange se encarga de setear clienteSession
  };

  const logoutCliente = async () => {
    await supabase.auth.signOut();
    setClienteSession(null);
  };

  // ─── Productos ────────────────────────────────────────────────────────────
  const addProduct = async (p: Omit<Product, 'id' | 'priceDisplay' | 'badge'>) => {
    const { error } = await supabase.from('productos').insert([p]);
    if (error) { alert('Error al guardar el producto: ' + error.message); }
    else { refreshData(); }
  };

  const updateProduct = async (p: Partial<Product>) => {
    const { error } = await supabase.from('productos').update(p).eq('id', p.id);
    if (!error) refreshData();
  };

  const updateProductStock = async (id: number, newStock: number) => {
    const { error: stockErr } = await supabase.from('productos').update({ stock_actual: newStock }).eq('id', id);
    if (!stockErr) {
      await supabase.from('movimientos_stock').insert([{
        producto_id: id, cantidad: newStock, tipo: 'ajuste',
        referencia_tipo: 'ajuste_manual', fecha: new Date().toISOString()
      }]);
      refreshData();
    }
  };

  // ─── Facturación ──────────────────────────────────────────────────────────
  const addFactura = async (f: Omit<Factura, 'id'>) => {
    const { data, error } = await supabase.from('facturas').insert([f]).select();
    if (!error && data) {
      await supabase.from('cuenta_corriente').insert([{
        entidad_tipo: 'cliente', entidad_id: f.cliente_id,
        tipo_movimiento: 'factura', monto: f.monto_ars,
        referencia_id: data[0].id, notas: `Factura ${f.numero}`
      }]);
      refreshData();
    }
  };

  const updateFacturaEstado = async (id: number, estado: Factura['estado']) => {
    const { error } = await supabase.from('facturas').update({ estado }).eq('id', id);
    if (!error) refreshData();
  };

  // ─── Pedidos ──────────────────────────────────────────────────────────────
  const addPedido = async (order: Omit<Pedido, 'id'>) => {
    const { data, error } = await supabase.from('pedidos').insert([order]).select();
    if (!error && data) { refreshData(); return data[0].id; }
    return 0;
  };

  const updatePedidoEstado = async (id: number, estado: Pedido['estado']) => {
    const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id);
    if (!error) refreshData();
  };

  // Pedidos del cliente autenticado
  const getMisPedidos = async (): Promise<Pedido[]> => {
    if (!clienteSession) return [];
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .eq('cliente_id', clienteSession.cliente.id)
      .order('id', { ascending: false });
    return (data || []) as Pedido[];
  };

  // ─── Remitos ──────────────────────────────────────────────────────────────
  const addRemito = async (r: Omit<Remito, 'id'>) => {
    const { data, error } = await supabase.from('remitos').insert([r]).select();
    if (!error && data) {
      for (const item of r.items) {
        const prod = products.find(p => p.id === item.producto_id);
        if (prod) {
          const nuevoStock = prod.stock_actual + item.cantidad;
          await supabase.from('productos').update({ stock_actual: nuevoStock }).eq('id', item.producto_id);
          await supabase.from('movimientos_stock').insert([{
            producto_id: item.producto_id, cantidad: item.cantidad,
            tipo: 'entrada', referencia_id: data[0].id, referencia_tipo: 'remito'
          }]);
        }
      }
      refreshData();
    }
  };

  // ─── Cuentas Corrientes & Recibos ─────────────────────────────────────────
  const addRecibo = async (r: Omit<Recibo, 'id'>) => {
    const { data, error } = await supabase.from('recibos').insert([r]).select();
    if (!error && data) {
      await supabase.from('cuenta_corriente').insert([{
        entidad_tipo: 'cliente', entidad_id: r.cliente_id,
        tipo_movimiento: 'pago', monto: -r.monto,
        referencia_id: data[0].id, notas: `Recibo ${r.numero}`
      }]);
      for (const fItem of r.facturas_aplicadas) {
        await supabase.from('facturas').update({ estado: 'cobrada' }).eq('id', fItem.id);
      }
      refreshData();
    }
  };

  const getHistorialCC = async (tipo: 'cliente' | 'proveedor', id: number) => {
    const { data } = await supabase.from('cuenta_corriente')
      .select('*').eq('entidad_tipo', tipo).eq('entidad_id', id).order('fecha', { ascending: true });
    if (!data) return [];
    let saldo = 0;
    return data.map(m => { saldo += Number(m.monto); return { ...m, saldo_acumulado: saldo }; });
  };

  // Saldo de cuenta corriente del cliente logueado
  const getMiSaldoCC = async (): Promise<number> => {
    if (!clienteSession) return 0;
    const { data } = await supabase.from('cuenta_corriente')
      .select('monto').eq('entidad_tipo', 'cliente').eq('entidad_id', clienteSession.cliente.id);
    if (!data) return 0;
    return data.reduce((s, m) => s + Number(m.monto), 0);
  };

  const addCliente = async (c: Omit<Cliente, 'id'>): Promise<number | null> => {
    const { data, error } = await supabase.from('clientes').insert([c]).select().single();
    if (!error && data) { refreshData(); return data.id; }
    return null;
  };

  const addProveedor = async (p: Omit<Proveedor, 'id'>) => {
    await supabase.from('proveedores').insert([p]);
    refreshData();
  };

  return (
    <AppContext.Provider value={{
      usdRate, loading, authLoading, products, clientes, proveedores,
      facturas, pedidos, remitos, recibos,
      currentUser, clienteSession,
      refreshData, setUsdRateGlobal,
      login, logout,
      registerCliente, loginCliente, logoutCliente,
      addProduct, updateProduct, updateProductStock,
      addFactura, updateFacturaEstado,
      addPedido, updatePedidoEstado, getMisPedidos,
      addRemito,
      addRecibo, getHistorialCC, getMiSaldoCC,
      addCliente, addProveedor
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
