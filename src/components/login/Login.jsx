import React, { useState } from 'react';
import './Login.css';

function Login({ onLoginSuccess }) {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        // Usamos la URL de Localtunnel
        fetch('https://soma-collection-sort-providing.trycloudflare.com/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // CAMBIO CLAVE: Header para saltar la advertencia de Localtunnel
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({ usuario: usuario, password: password })
        })
        .then(res => {
            // Verificamos que la respuesta sea JSON
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return res.json();
            } else {
                throw new Error("El túnel devolvió una página de advertencia. Abre la URL en el navegador una vez.");
            }
        })
        .then(data => {
            if (data.success) {
                localStorage.setItem('user_token', data.token);
                onLoginSuccess();
            } else {
                setError(data.message || 'Contraseña incorrecta');
            }
            setCargando(false);
        })
        .catch(err => {
            console.error("Error en login:", err);
            setError('No se pudo conectar con el servidor LocalTunnel.');
            setCargando(false);
        });
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-logo">🔒</div>
                <h2>Iniciar Sesión</h2>
                
                {error && <div className="login-error" style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
                
                <div className="form-group">
                    <label>Usuario</label>
                    <input 
                        type="text" 
                        value={usuario} 
                        onChange={(e) => setUsuario(e.target.value)} 
                        placeholder="Ingresa tu usuario"
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label>Contraseña</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Ingresa tu contraseña"
                        required 
                    />
                </div>
                
                <button type="submit" className="btn-login" disabled={cargando}>
                    {cargando ? 'Verificando...' : 'Entrar al Sistema'}
                </button>
            </form>
        </div>
    );
}

export default Login;