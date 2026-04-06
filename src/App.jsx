import React, { useState, useEffect } from 'react';
import Login from './components/login/Login'; // Ajustá la ruta si tu carpeta se llama distinto
import Ventas from './components/ventas/Ventas';
import './App.css'; // <--- Aquí importamos los estilos que acabamos de crear

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Al cargar la app, verificamos si ya había una sesión guardada
        const token = localStorage.getItem('user_token');
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogout = () => {
        // Borramos el token y volvemos al Login
        localStorage.removeItem('user_token');
        setIsLoggedIn(false);
    };

    return (
        <div className="app-wrapper">
            {isLoggedIn ? (
                <>
                    {/* BARRA SUPERIOR DE NAVEGACIÓN */}
                    <nav className="navbar">
                        <div className="navbar-brand">
                            📊 <span>Sistema de Auditoría</span>
                        </div>
                        <button onClick={handleLogout} className="btn-logout">
                            Cerrar Sesión
                        </button>
                    </nav>
                    
                    {/* CONTENIDO PRINCIPAL */}
                    <Ventas />
                </>
            ) : (
                <Login onLoginSuccess={() => setIsLoggedIn(true)} />
            )}
        </div>
    );
}

export default App;