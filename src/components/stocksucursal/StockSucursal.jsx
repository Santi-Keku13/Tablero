import React, { useState, useEffect, useMemo } from 'react';
import './StockSucursal.css';

function StockSucursal() {
    const [datos, setDatos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [deptosSeleccionados, setDeptosSeleccionados] = useState([]); 
    const [fechas, setFechas] = useState({ 
        inicio: new Date().toISOString().split('T')[0], 
        fin: new Date().toISOString().split('T')[0] 
    });

    const sucursales = [
        { id: "Alameda", label: "Alameda" },
        { id: "Acceso_Sur", label: "Acceso Sur" },
        { id: "La_Bastilla", label: "La Bastilla" },
        { id: "Alberdi", label: "Alberdi" }
    ];

    const consultar = () => {
        setCargando(true);
        fetch(`https://disingenuous-unimprinted-kyleigh.ngrok-free.dev -> http://localhost:8000/api/ventas-stock?inicio=${fechas.inicio}&fin=${fechas.fin}`)
            .then(res => res.json())
            .then(data => {
                setDatos(data);
                setCargando(false);
            })
            .catch(() => setCargando(false));
    };

    useEffect(() => { consultar(); }, [fechas]);

    // Lista única de departamentos extraída del backend corregido
    const listaDepartamentos = useMemo(() => {
        const d = datos.map(item => item.Departamento).filter(Boolean);
        return [...new Set(d)].sort();
    }, [datos]);

    // Funciones de selección
    const toggleDepto = (depto) => {
        setDeptosSeleccionados(prev => 
            prev.includes(depto) ? prev.filter(d => d !== depto) : [...prev, depto]
        );
    };

    const seleccionarTodos = () => {
        if (deptosSeleccionados.length === listaDepartamentos.length) {
            setDeptosSeleccionados([]); // Desmarcar todos
        } else {
            setDeptosSeleccionados(listaDepartamentos); // Marcar todos
        }
    };

    // Filtrado dinámico
    const datosFiltrados = useMemo(() => {
        if (deptosSeleccionados.length === 0) return datos;
        return datos.filter(item => deptosSeleccionados.includes(item.Departamento));
    }, [datos, deptosSeleccionados]);

    // Cálculo de la fila de totales (Footer)
    const totalesGral = useMemo(() => {
        const res = {};
        sucursales.forEach(s => {
            res[`Cant_${s.id}`] = datosFiltrados.reduce((acc, curr) => acc + (curr[`Cant_${s.id}`] || 0), 0);
            res[`Venta_${s.id}`] = datosFiltrados.reduce((acc, curr) => acc + (curr[`Venta_${s.id}`] || 0), 0);
        });
        return res;
    }, [datosFiltrados, sucursales]);

    return (
        <div className="stock-page">
            <div className="stock-header">
                <h2>Ventas y Stock por Sucursal (Neto)</h2>
                {cargando && <span className="loader">⚡ Procesando datos...</span>}
            </div>

            <div className="stock-controls">
                <div className="control-group">
                    <label>Período</label>
                    <div className="date-inputs">
                        <input type="date" value={fechas.inicio} onChange={e => setFechas({...fechas, inicio: e.target.value})} />
                        <input type="date" value={fechas.fin} onChange={e => setFechas({...fechas, fin: e.target.value})} />
                    </div>
                </div>

                <div className="control-group full-width">
                    <div className="depto-header">
                        <label>Filtrar por Departamento</label>
                        <button className="btn-link" onClick={seleccionarTodos}>
                            {deptosSeleccionados.length === listaDepartamentos.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                        </button>
                    </div>
                    <div className="depto-selector-multi">
                        {listaDepartamentos.map(d => (
                            <button 
                                key={d} 
                                className={`depto-chip ${deptosSeleccionados.includes(d) ? 'active' : ''}`}
                                onClick={() => toggleDepto(d)}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <button className="btn-refresh" onClick={consultar}>Actualizar Datos</button>
            </div>

            <div className="table-container">
                <table className="grid-table">
                    <thead>
                        <tr>
                            <th rowSpan="2" className="sticky-col">Artículo</th>
                            <th rowSpan="2">Departamento</th>
                            {sucursales.map(s => (
                                <th key={s.id} colSpan="2" className="suc-header">{s.label}</th>
                            ))}
                        </tr>
                        <tr>
                            {sucursales.map(s => (
                                <React.Fragment key={s.id}>
                                    <th className="sub-h">Cant.</th>
                                    <th className="sub-h">Venta</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {datosFiltrados.length > 0 ? (
                            datosFiltrados.map((item, i) => (
                                <tr key={i}>
                                    <td className="sticky-col art-name">{item.Articulo}</td>
                                    <td className="dept-name">{item.Departamento || 'S/D'}</td>
                                    {sucursales.map(s => (
                                        <React.Fragment key={s.id}>
                                            <td className={item[`Cant_${s.id}`] > 0 ? "cell-val" : "cell-empty"}>
                                                {item[`Cant_${s.id}`] || '-'}
                                            </td>
                                            <td className={item[`Venta_${s.id}`] > 0 ? "cell-price" : "cell-empty"}>
                                                {item[`Venta_${s.id}`] ? `$${item[`Venta_${s.id}`].toLocaleString('es-AR', {maximumFractionDigits:0})}` : '-'}
                                            </td>
                                        </React.Fragment>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={2 + sucursales.length * 2} className="no-data">No hay datos para mostrar</td></tr>
                        )}
                    </tbody>
                    <tfoot className="table-footer">
                        <tr>
                            <td colSpan="2" className="sticky-col">TOTALES SELECCIONADOS</td>
                            {sucursales.map(s => (
                                <React.Fragment key={s.id}>
                                    <td>{totalesGral[`Cant_${s.id}`]}</td>
                                    <td className="footer-money">
                                        ${totalesGral[`Venta_${s.id}`].toLocaleString('es-AR', {maximumFractionDigits:0})}
                                    </td>
                                </React.Fragment>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export default StockSucursal;