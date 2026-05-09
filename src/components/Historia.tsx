import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import './Historia.css';

const Historia: React.FC = () => {
  return (
    <section className="historia">
      <div className="container historia-container">
        <div className="historia-content animate-fade-in">
          <span className="badge">NUESTRA HISTORIA</span>
          <h2 className="historia-title">Compromiso con la Construcción en Necochea</h2>
          <p className="historia-text">
            En <strong>Alfametal</strong>, nos especializamos en la provisión de materiales siderúrgicos 
            para obras de toda escala. Con años de trayectoria en el mercado local, 
            entendemos las necesidades de contratistas y empresas constructoras.
          </p>
          
          <div className="historia-features">
            <div className="feature-item">
              <Truck className="feature-icon" size={20} />
              <span className="feature-text"><strong>Logística propia en zona</strong></span>
            </div>
            <div className="feature-item">
              <CheckCircle2 className="feature-icon" size={20} />
              <span className="feature-text"><strong>Calidad certificada IRAM</strong></span>
            </div>
          </div>
        </div>

        <div className="historia-stats animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-card">
            <h3 className="stat-number">+15</h3>
            <p className="stat-label">Años de experiencia</p>
          </div>
          <div className="stat-card">
            <h3 className="stat-number">+500</h3>
            <p className="stat-label">Obras abastecidas</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Historia;
