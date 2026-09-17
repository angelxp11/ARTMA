import './Navbar.css';

const Navbar = ({ currentView, setCurrentView }) => {
  return (
    <nav className="navbar">
      <div className="brand">ARTMA</div>

      <ul className="nav-links">
        <li className={currentView === 'homepage' ? 'active' : ''} onClick={() => setCurrentView('homepage')}>
          Inicio
        </li>
        <li className={currentView === 'inventario' ? 'active' : ''} onClick={() => setCurrentView('inventario')}>
          Inventario
        </li>
        <li className={currentView === 'caja' ? 'active' : ''} onClick={() => setCurrentView('caja')}>
          Caja
        </li>
        <li className={currentView === 'contabilidad' ? 'active' : ''} onClick={() => setCurrentView('contabilidad')}>
          Contabilidad
        </li>
        <li className={currentView === 'facturas' ? 'active' : ''} onClick={() => setCurrentView('facturas')}>
          Facturas
        </li>
      </ul>

      <button className="nav-btn">Perfil</button>
    </nav>
  );
};

export default Navbar;
