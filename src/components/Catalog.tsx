import React, { useState, useMemo } from 'react';
import { ShoppingCart, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import type { Product } from '../context/AppContext';
import './Catalog.css';

export type { Product } from '../context/AppContext';

const CATEGORIES: Record<string, string[]> = {
  'Todos': [],
  'Caños C/Costura': ['Todos', 'Galvanizado R y C', 'Conduit R y C', 'Caño SCH.40', 'Caño SCH.80'],
};

interface CatalogProps {
  onAddToCart: (product: Product) => void;
}

const Catalog: React.FC<CatalogProps> = ({ onAddToCart }) => {
  const { products } = useAppContext();
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [activeSubcategory, setActiveSubcategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState<'todos' | 'por barra' | 'por metro'>('todos');

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubcategory('Todos');
  };

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (activeCategory !== 'Todos' && p.categoria !== activeCategory) return false;
      if (activeSubcategory !== 'Todos' && p.subcategoria !== activeSubcategory) return false;
      if (unitFilter !== 'todos' && p.unidad !== unitFilter) return false;
      if (search && !p.nombre.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, activeCategory, activeSubcategory, unitFilter, search]);

  return (
    <section className="catalog">
      <div className="container">
        <h2 className="catalog-title">Catálogo de Productos</h2>

        {/* Search bar */}
        <div className="catalog-search-row">
          <div className="catalog-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar producto... (ej: 1/2, SCH.40, galvanizado)"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="unit-filter">
            {(['todos', 'por barra', 'por metro'] as const).map(u => (
              <button
                key={u}
                className={`unit-pill ${unitFilter === u ? 'active' : ''}`}
                onClick={() => setUnitFilter(u)}
              >
                {u === 'todos' ? 'Todos' : u === 'por barra' ? '📏 Por barra' : '📐 Por metro'}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="catalog-categories">
          {Object.keys(CATEGORIES).map(cat => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Subcategories */}
        {activeCategory !== 'Todos' && CATEGORIES[activeCategory]?.length > 0 && (
          <div className="catalog-subcategories animate-fade-in">
            {CATEGORIES[activeCategory].map(sub => (
              <button
                key={sub}
                className={`subcategory-pill ${activeSubcategory === sub ? 'active' : ''}`}
                onClick={() => setActiveSubcategory(sub)}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        <p className="results-count">{filtered.length} producto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>

        <div className="product-grid">
          {filtered.map(product => (
            <div key={product.id} className="product-card animate-fade-in no-image">
              <div className="product-info">
                <div className="product-card-top">
                  <span className={`product-badge ${product.badge === 'BAJO STOCK' || product.badge === 'SIN STOCK' ? 'badge-warning' : 'badge-success'}`}>
                    {product.badge}
                  </span>
                  <span className="product-code-label">{product.code}</span>
                </div>
                <h3 className="product-name">{product.nombre}</h3>
                <span className="product-tag">{product.tag}</span>
                <div className="product-specs">
                  {product.specs.largo && <div><span className="spec-label">Largo:</span> {product.specs.largo}</div>}
                  {product.specs.marca && <div><span className="spec-label">Marca:</span> {product.specs.marca}</div>}
                </div>
                <div className="product-price-container">
                  <span className="product-price">{product.priceDisplay}</span>
                  <span className="product-unit"> {product.unidad}</span>
                </div>
                <p className="product-disclaimer">Precio de referencia en ARS (Equivalente USD)</p>
                <button
                  className="btn btn-outline btn-add-cart"
                  onClick={() => onAddToCart(product)}
                  disabled={product.stock_actual === 0}
                >
                  <ShoppingCart size={18} /> {product.stock_actual === 0 ? 'Sin stock' : 'Agregar al pedido'}
                </button>
                <a 
                  href={`https://wa.me/542262415321?text=${encodeURIComponent('Hola! Quisiera consultar stock de: ' + product.nombre + ' (Código: ' + product.code + ')')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="stock-inquiry-link"
                >
                  💬 Consultar Stock
                </a>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="no-products">No se encontraron productos con esos filtros.</div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Catalog;
