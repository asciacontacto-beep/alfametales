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
            En <strong>Alfametal</strong> acompañamos hace mas de 20 años el crecimiento de nuestra ciudad y la región, ofreciendo materiales siderúrgicos y productos para la construcción con el compromiso y la confianza que nos caracterizan.
          </p>
          <p className="historia-text" style={{ marginTop: '1rem' }}>
            A lo largo de nuestra trayectoria, trabajamos junto a empresas, profesionales y particulares, entendiendo que detrás de cada obra existe un proyecto, un esfuerzo y una necesidad diferente. Por eso, buscamos brindar mucho más que materiales: ofrecemos atención personalizada, asesoramiento responsable y soluciones adaptadas a cada cliente.
          </p>
          
          <div className="historia-features" style={{ marginTop: '1.5rem' }}>
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
            <h3 className="stat-number">+20</h3>
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
