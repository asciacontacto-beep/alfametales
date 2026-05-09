import { useState, useEffect } from 'react';
import Topbar from './components/Topbar';
import Hero from './components/Hero';
import Historia from './components/Historia';
import Catalog from './components/Catalog';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import MedidasTable from './components/MedidasTable';
import CartModal from './components/CartModal';
import type { CartItem } from './components/CartModal';
import AuthModal from './components/AuthModal';
import MiCuenta from './components/MiCuenta';
import type { Product } from './components/Catalog';
import AdminDashboard from './components/admin/AdminDashboard';
import { useAppContext } from './context/AppContext';

function App() {
  const { clienteSession } = useAppContext();
  const [view, setView] = useState<'store' | 'admin'>('store');
  const [activeTab, setActiveTab] = useState('Inicio');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  useEffect(() => {
    // Detect /admin in URL
    if (window.location.pathname === '/admin' || window.location.hash === '#/admin') {
      setView('admin');
    }
  }, []);

  const handleAddToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  if (view === 'admin') {
    return <AdminDashboard onExit={() => setView('store')} />;
  }

  return (
    <div className="app">
      <Topbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cartItemCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
      />
      
      <main>
        {activeTab === 'Inicio' && (
          <>
            <Hero onNavigate={setActiveTab} />
            <Historia />
            <Catalog onAddToCart={handleAddToCart} />
          </>
        )}
        
        {activeTab === 'Productos' && (
          <Catalog onAddToCart={handleAddToCart} />
        )}

        {activeTab === 'Medidas' && (
          <MedidasTable />
        )}

        {activeTab === 'Nosotros' && (
          <Historia />
        )}

        {activeTab === 'Contacto' && (
          <div style={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <h2>Página de Contacto en construcción</h2>
          </div>
        )}

        {activeTab === 'Mi Cuenta' && clienteSession && (
          <MiCuenta />
        )}
      </main>

      <Footer />
      
      <WhatsAppButton />
      
      {isCartOpen && (
        <CartModal 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cart={cart}
          setCart={setCart}
        />
      )}

      {isAuthOpen && (
        <AuthModal 
          isOpen={isAuthOpen} 
          onClose={() => setIsAuthOpen(false)} 
          onLoginSuccess={() => setActiveTab('Mi Cuenta')}
        />
      )}
    </div>
  );
}

export default App;
