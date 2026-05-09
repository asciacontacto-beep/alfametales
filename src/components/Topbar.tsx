import React from 'react';
import { ShoppingCart, UserCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Topbar.css';

interface TopbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartItemCount: number;
  onCartClick: () => void;
  onAuthClick: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ activeTab, setActiveTab, cartItemCount, onCartClick, onAuthClick }) => {
  const { clienteSession } = useAppContext();
  const baseLinks = ['Inicio', 'Productos', 'Medidas', 'Nosotros', 'Contacto'];
  const links = clienteSession ? [...baseLinks, 'Mi Cuenta'] : baseLinks;

  const handleAuthClick = () => {
    if (clienteSession) {
      setActiveTab('Mi Cuenta');
    } else {
      onAuthClick();
    }
  };

  return (
    <header className="topbar">
      <div className="container topbar-container">
        <div className="logo" onClick={() => setActiveTab('Inicio')} style={{cursor: 'pointer'}}>
          <span className="logo-symbol">α</span>
          <span className="logo-text">ALFAMETAL</span>
        </div>
        
        <nav className="desktop-nav">
          {links.map((link) => (
            <button 
              key={link} 
              className={`nav-link ${activeTab === link ? 'active' : ''}`}
              onClick={() => setActiveTab(link)}
            >
              {link}
            </button>
          ))}
        </nav>

        <div className="topbar-actions">
          <button className="auth-btn" onClick={handleAuthClick} aria-label="Mi Cuenta" title={clienteSession ? `Mi cuenta — ${clienteSession.cliente.nombre}` : 'Iniciar Sesión'} style={{position:'relative'}}>
            <UserCircle size={24} />
            {clienteSession && <span className="auth-active-dot" />}
          </button>
          
          <div className="cart-container" onClick={onCartClick} title="Carrito">
            <ShoppingCart size={24} />
            <span className="cart-badge">{cartItemCount}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
