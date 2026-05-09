import React from 'react';
import './Hero.css';

interface HeroProps {
  onNavigate: (tab: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="hero">
      <div className="hero-overlay"></div>
      <div className="container hero-container">
        <div className="hero-content animate-fade-in">
          <span className="hero-badge">Hierros y Metales de Calidad</span>
          <h1 className="hero-title">
            Abastecimiento de Metales para <span className="text-primary">Grandes Proyectos</span>
          </h1>
          <p className="hero-description">
            Distribución especializada de caños galvanizados, conduit y sistemas SCH.40/80. 
            Calidad certificada para la industria y la construcción en Necochea.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('Productos')}>Explorar Catálogo</button>
            <button className="btn btn-outline-white btn-lg" onClick={() => onNavigate('Medidas')}>Ver Medidas</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
