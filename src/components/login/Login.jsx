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

        // Llamamos a la API física de FastAPI
        fetch('https://disingenuous-unimprinted-kyleigh.ngrok-free.dev/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario: usuario, password: password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Si la API dice que está bien, guardamos el token y entramos
                localStorage.setItem('user_token', data.token);
                onLoginSuccess();
            } else {
                // Si la clave es incorrecta
                setError(data.message || 'Contraseña incorrecta');
            }
            setCargando(false);
        })
        .catch(err => {
            console.error("Error en login:", err);
            setError('No se pudo conectar con el servidor.');
            setCargando(false);
        });
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-logo">🔒</div>
                <h2>Iniciar Sesión</h2>
                <p className="login-subtitle">Panel de Auditoría de Ventas</p>
                
                {error && <div className="login-error">{error}</div>}
                
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