import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h2 className="footer-title">ALFAMETAL</h2>
            <p className="footer-desc">
              Confianza y calidad en materiales para<br />
              tu obra.
            </p>
          </div>

          <div className="footer-contact">
            <div className="contact-item">
              <Mail size={18} className="contact-icon" />
              <span>orlandojano@yahoo.com.ar</span>
            </div>
            <div className="contact-item">
              <MapPin size={18} className="contact-icon" />
              <span>Av. 59 4461, Necochea, Buenos Aires</span>
            </div>
            <div className="contact-item">
              <Phone size={18} className="contact-icon" />
              <span>2262 415321</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Alfametal. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
