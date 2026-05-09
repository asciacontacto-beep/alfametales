import React from 'react';
import './MedidasTable.css';

const MedidasTable: React.FC = () => {
  const medidas = [
    { pulgada: '1/8"', mm: '3.17' },
    { pulgada: '3/16"', mm: '4.76' },
    { pulgada: '1/4"', mm: '6.35' },
    { pulgada: '5/16"', mm: '7.93' },
    { pulgada: '3/8"', mm: '9.52' },
    { pulgada: '1/2"', mm: '12.70' },
    { pulgada: '5/8"', mm: '15.87' },
    { pulgada: '3/4"', mm: '19.05' },
    { pulgada: '7/8"', mm: '22.22' },
    { pulgada: '1"', mm: '25.40' },
    { pulgada: '1 1/4"', mm: '31.75' },
    { pulgada: '1 1/2"', mm: '38.10' },
    { pulgada: '2"', mm: '50.80' },
  ];

  return (
    <section className="medidas-section">
      <div className="container">
        <h2 className="medidas-title">Tabla de Equivalencias</h2>
        <p className="medidas-subtitle">Conversión básica de pulgadas a milímetros para materiales siderúrgicos.</p>
        
        <div className="table-container">
          <table className="medidas-table">
            <thead>
              <tr>
                <th>Pulgadas (in)</th>
                <th>Milímetros (mm)</th>
              </tr>
            </thead>
            <tbody>
              {medidas.map((item, index) => (
                <tr key={index}>
                  <td className="col-pulgada">{item.pulgada}</td>
                  <td className="col-mm">{item.mm} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default MedidasTable;
