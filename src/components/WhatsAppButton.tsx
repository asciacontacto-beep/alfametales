import React from 'react';
import './WhatsAppButton.css';

const WhatsAppButton: React.FC = () => {
  return (
    <a 
      href="https://wa.me/542262415321" 
      className="whatsapp-btn" 
      target="_blank" 
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
    >
      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" />
    </a>
  );
};

export default WhatsAppButton;
