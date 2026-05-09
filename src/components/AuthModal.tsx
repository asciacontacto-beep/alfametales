import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, LogOut, Package, FileText, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

type AuthView = 'login' | 'register' | 'dashboard';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const { clienteSession, loginCliente, registerCliente, logoutCliente } = useAppContext();
  const [view, setView] = useState<AuthView>('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setNombre(''); setEmail(''); setTelefono('');
    setPassword(''); setError(''); setSuccess('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error: err } = await loginCliente(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    if (onLoginSuccess) onLoginSuccess();
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('Ingresá tu nombre completo.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setError(''); setLoading(true);
    const { error: err } = await registerCliente(nombre, email, password, telefono);
    setLoading(false);
    if (err) { setError(err); return; }
    setSuccess('¡Cuenta creada! Revisá tu email para confirmarla.');
  };

  const handleLogout = async () => {
    await logoutCliente();
    onClose();
  };

  // ─── DASHBOARD DEL CLIENTE ───────────────────────────────────────────────
  if (clienteSession) {
    const initials = clienteSession.cliente.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-modal animate-fade-in" onClick={e => e.stopPropagation()}>
          <button className="btn-close-auth" onClick={onClose}><X size={24} /></button>

          <div className="auth-profile-header">
            <div className="auth-avatar">{initials}</div>
            <div>
              <h3 className="auth-profile-name">{clienteSession.cliente.nombre}</h3>
              <p className="auth-profile-email">{clienteSession.cliente.email}</p>
              {clienteSession.cliente.telefono && (
                <p className="auth-profile-tel">📱 {clienteSession.cliente.telefono}</p>
              )}
            </div>
          </div>

          <div className="auth-menu-list">
            <a href="#mis-pedidos" className="auth-menu-item" onClick={onClose}>
              <Package size={20} className="auth-menu-icon" />
              <div>
                <p className="auth-menu-title">Mis Pedidos</p>
                <p className="auth-menu-sub">Ver historial de compras y estados</p>
              </div>
              <ChevronRight size={18} className="auth-menu-arrow" />
            </a>
            <a href="#mi-cuenta" className="auth-menu-item" onClick={onClose}>
              <FileText size={20} className="auth-menu-icon" />
              <div>
                <p className="auth-menu-title">Mis Facturas y Comprobantes</p>
                <p className="auth-menu-sub">Descargá tus documentos</p>
              </div>
              <ChevronRight size={18} className="auth-menu-arrow" />
            </a>
            <a href="#cuenta-corriente" className="auth-menu-item" onClick={onClose}>
              <CreditCard size={20} className="auth-menu-icon" />
              <div>
                <p className="auth-menu-title">Cuenta Corriente</p>
                <p className="auth-menu-sub">Saldo y movimientos</p>
              </div>
              <ChevronRight size={18} className="auth-menu-arrow" />
            </a>
          </div>

          <button className="auth-logout-btn" onClick={handleLogout}>
            <LogOut size={17} /> Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // ─── FORMULARIO LOGIN / REGISTER ─────────────────────────────────────────
  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal animate-fade-in" onClick={e => e.stopPropagation()}>
        <button className="btn-close-auth" onClick={onClose}><X size={24} /></button>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${view === 'login' ? 'active' : ''}`} onClick={() => { setView('login'); resetForm(); }}>
            Iniciar Sesión
          </button>
          <button className={`auth-tab ${view === 'register' ? 'active' : ''}`} onClick={() => { setView('register'); resetForm(); }}>
            Crear Cuenta
          </button>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className="auth-success">
            ✅ {success}
          </div>
        )}

        {/* LOGIN */}
        {view === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <p className="auth-form-desc">Accedé para ver tus pedidos y comprobantes.</p>
            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input type="password" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        )}

        {/* REGISTER */}
        {view === 'register' && !success && (
          <form className="auth-form" onSubmit={handleRegister}>
            <p className="auth-form-desc">Creá tu cuenta para gestionar pedidos y tener historial de compras.</p>
            <div className="form-group">
              <label>Nombre completo</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input type="text" placeholder="Juan García" value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input type="email" placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Teléfono <span style={{color:'#94a3b8', fontWeight:400}}>(opcional, para notificaciones)</span></label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input type="tel" placeholder="2262 XXXXXX" value={telefono} onChange={e => setTelefono(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
            <p className="auth-legal">Al registrarte aceptás que tus datos sean utilizados para gestionar tus pedidos en Alfametal.</p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
