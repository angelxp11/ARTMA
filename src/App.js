import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import './App.css';
import Login from './components/login/Login';
import Homepage from './components/homepage/Homepage';
import Inventario from './components/inventario/Inventario';
import Caja from './components/caja/caja';
import Contabilidad from './components/contabilidad/contabilidad';
import Facturas from './components/facturas/facturas';
import Navbar from './resources/navbar/Navbar';
import ToastContainer, { showToast } from './resources/toastcontainer/ToastContainer';
import PantallaCarga from './resources/pantalla de carga/PantallaCarga';
import { auth } from './server/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [currentView, setCurrentView] = useState('homepage');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(Boolean(user));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      setLoggingIn(true);
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
      setCurrentView('homepage');
      showToast('Inicio de sesión correcto', 'success');
    } catch (error) {
      setIsAuthenticated(false);
      showToast(error.message || 'Credenciales incorrectas', 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading || loggingIn) {
    return (
      <div className="app-shell loading-shell">
        <ToastContainer />
        <PantallaCarga />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <ToastContainer />

      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <>
          <Navbar currentView={currentView} setCurrentView={setCurrentView} />
          {currentView === 'homepage' && <Homepage />}
          {currentView === 'inventario' && <Inventario />}
          {currentView === 'caja' && <Caja />}
          {currentView === 'contabilidad' && <Contabilidad />}
          {currentView === 'facturas' && <Facturas />}
        </>
      )}
    </div>
  );
}

export default App;
