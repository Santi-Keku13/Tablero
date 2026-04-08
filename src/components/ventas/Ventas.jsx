import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import './Ventas.css'; 

function Ventas() {
    const [transacciones, setTransacciones] = useState([]);
    const [cargando, setCargando] = useState(false);

    // --- ESTADOS PARA EL MODAL ---
    const [modalAbierto, setModalAbierto] = useState(false);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
    const [detalleProductos, setDetalleProductos] = useState([]);

    // --- ESTADOS PARA FILTROS (TODOS) ---
    const [filtroSucursal, setFiltroSucursal] = useState('Todas');
    const [filtroCajero, setFiltroCajero] = useState('Todos'); 
    const [filtroTipo, setFiltroTipo] = useState('Todos'); 
    const [busquedaFiscal, setBusquedaFiscal] = useState(''); 
    const [busquedaZ, setBusquedaZ] = useState('');           
    const [busquedaCaja, setBusquedaCaja] = useState(''); 

    const [fechas, setFechas] = useState({ 
        inicio: new Date().toISOString().split('T')[0], 
        fin: new Date().toISOString().split('T')[0] 
    });

    // --- FUNCIÓN PARA LA TABLA PRINCIPAL ---
    const consultarDatos = () => {
        setCargando(true);
        // Actualizado a LocalTunnel URL y Header
        fetch(`https://sauda-auditoria.loca.lt/api/ventas?inicio=${fechas.inicio}&fin=${fechas.fin}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Bypass-Tunnel-Reminder': 'true' // <--- Header para LocalTunnel
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Error en la respuesta del servidor');
            return res.json();
        })
        .then(data => {
            setTransacciones(data);
            setCargando(false);
        })
        .catch(err => {
            console.error("Error:", err);
            setCargando(false);
        });
    };

    // --- FUNCIÓN PARA EL MODAL ---
    const verDetalleTicket = (ticket) => {
        setTicketSeleccionado(ticket);
        setModalAbierto(true);
        setCargandoDetalle(true);
        setDetalleProductos([]);

        // CORREGIDO: URL de LocalTunnel y Header correcto
        fetch(`https://sauda-auditoria.loca.lt/api/detalle-ticket?sucursal=${ticket.Sucursal}&numero_fiscal=${ticket.NumeroFiscal}`, {
            method: 'GET',
            headers: {
                'Bypass-Tunnel-Reminder': 'true' // <--- Header para LocalTunnel
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Error al traer detalle');
            return res.json();
        })
        .then(data => {
            setDetalleProductos(data);
            setCargandoDetalle(false);
        })
        .catch(err => {
            console.error("Error al traer detalle:", err);
            setCargandoDetalle(false);
        });
    };

    // Consultar al cargar por primera vez o cambiar fechas
    useEffect(() => {
        consultarDatos();
    }, [fechas]);

    // --- LÓGICA DE FILTRADO ---
    const datosFiltrados = useMemo(() => {
        return transacciones.filter(t => {
            const sucMatch = filtroSucursal === 'Todas' || (t.Sucursal || "").toLowerCase() === filtroSucursal.toLowerCase();
            const cajMatch = filtroCajero === 'Todos' || (t.NombreCajero || "").toLowerCase() === filtroCajero.toLowerCase();
            const tipoMatch = filtroTipo === 'Todos' || (t.TipoCbte || "").toString().toUpperCase() === filtroTipo.toUpperCase();
            const fiscalMatch = busquedaFiscal === '' || (t.NumeroFiscal || "").toString().includes(busquedaFiscal);
            const zMatch = busquedaZ === '' || (t.Z || "").toString() === busquedaZ;
            const cajaMatch = busquedaCaja === '' || (t.IdCaja || "").toString() === busquedaCaja;

            return sucMatch && cajMatch && tipoMatch && fiscalMatch && zMatch && cajaMatch;
        });
    }, [transacciones, filtroSucursal, filtroCajero, filtroTipo, busquedaFiscal, busquedaZ, busquedaCaja]);

    // --- INDICADORES ---
    const resumen = useMemo(() => {
        const totalVendido = datosFiltrados.reduce((acc, t) => {
            const valor = t.Total || 0;
            const tipo = (t.TipoCbte || "").toString().toUpperCase();

            if (tipo.includes("NC") || tipo.includes("ANUL") || tipo.includes("NCR")) {
                return acc - valor;
            }
            return acc + valor;
        }, 0);

        const cantTickets = datosFiltrados.length;
        const promedio = cantTickets > 0 ? totalVendido / cantTickets : 0;
        
        return { totalVendido, cantTickets, promedio };
    }, [datosFiltrados]);

    const listaCajeros = useMemo(() => ["Todos", ...new Set(transacciones.map(t => t.NombreCajero).filter(Boolean))], [transacciones]);
    const listaTipos = useMemo(() => ["Todos", ...new Set(transacciones.map(t => t.TipoCbte).filter(Boolean))], [transacciones]);

    // EXPORTAR A EXCEL
    const exportarExcel = () => {
        if (datosFiltrados.length === 0) {
            alert("No hay datos para exportar");
            return;
        }

        const datosParaExcel = datosFiltrados.map(t => ({
            "Fecha": t.Fecha,
            "Hora": t.Hora,
            "Sucursal": t.Sucursal,
            "Caja": t.IdCaja,
            "Z": t.Z,
            "Tipo": t.TipoCbte,
            "Nro Fiscal": t.NumeroFiscal,
            "Cajero": t.NombreCajero,
            "Total": t.Total
        }));

        const hoja = XLSX.utils.json_to_sheet(datosParaExcel);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Ventas");
        XLSX.writeFile(libro, `Auditoria_Ventas_${fechas.inicio}_al_${fechas.fin}.xlsx`);
    };

    return (
        <div className="ventas-container">
            <div className="ventas-header">
                <h2 className="ventas-title">Auditoría de Tickets</h2>
                {cargando && <span className="loading-text">⚡ Consultando datos...</span>}
            </div>

            {/* --- INDICADORES --- */}
            <div className="widgets-grid">
                <div className="card-widget">
                    <span className="card-label">TOTAL VENDIDO</span>
                    <span className="card-value value-green">
                        ${resumen.totalVendido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="card-widget">
                    <span className="card-label">CANT. TICKETS</span>
                    <span className="card-value">{resumen.cantTickets}</span>
                </div>
                <div className="card-widget">
                    <span className="card-label">TICKET PROMEDIO</span>
                    <span className="card-value value-blue">
                        ${resumen.promedio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {/* --- PANEL DE FILTROS --- */}
            <div className="filtros-wrapper">
                <div className="filter-group">
                    <label>Fechas</label>
                    <div className="date-inputs">
                        <input type="date" value={fechas.inicio} onChange={e => setFechas({...fechas, inicio: e.target.value})} className="input-control" />
                        <input type="date" value={fechas.fin} onChange={e => setFechas({...fechas, fin: e.target.value})} className="input-control" />
                    </div>
                </div>
                
                <div className="filter-group">
                    <label>Sucursal</label>
                    <select value={filtroSucursal} onChange={e => setFiltroSucursal(e.target.value)} className="input-control">
                        <option value="Todas">Todas</option>
                        <option value="Alameda">Alameda</option>
                        <option value="Acceso Sur">Acceso Sur</option>
                        <option value="La Bastilla">La Bastilla</option>
                        <option value="Alberdi">Alberdi</option>
                        <option value="Boedo">Boedo</option>
                        <option value="Italia">Italia</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Caja</label>
                    <input type="number" placeholder="N°" value={busquedaCaja} onChange={e => setBusquedaCaja(e.target.value)} className="input-control" style={{width: '60px'}} />
                </div>

                <div className="filter-group">
                    <label>Tipo</label>
                    <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="input-control">
                        {listaTipos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                    </select>
                </div>

                <div className="filter-group">
                    <label>N° Fiscal</label>
                    <input type="text" placeholder="Ticket..." value={busquedaFiscal} onChange={e => setBusquedaFiscal(e.target.value)} className="input-control" />
                </div>

                <div className="filter-group">
                    <label>Z</label>
                    <input type="number" placeholder="Z" value={busquedaZ} onChange={e => setBusquedaZ(e.target.value)} className="input-control" style={{width: '70px'}} />
                </div>

                <div className="filter-group">
                    <label>Cajero</label>
                    <select value={filtroCajero} onChange={e => setFiltroCajero(e.target.value)} className="input-control">
                        {listaCajeros.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <button onClick={consultarDatos} className="btn-update">Actualizar</button>
                <button onClick={exportarExcel} className="btn-excel" style={{ backgroundColor: '#1d6f42', color: 'white' }}>
                     Exportar Excel
                </button>
            </div>

            {/* --- TABLA --- */}
            <div className="table-responsive">
                <table className="main-table">
                    <thead>
                        <tr>
                            <th>Fecha / Hora</th>
                            <th>Sucursal</th>
                            <th>Caja</th>
                            <th>Z</th>
                            <th>Tipo</th>
                            <th>N° Fiscal</th>
                            <th>Cajero</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datosFiltrados.length > 0 ? (
                            datosFiltrados.map((t, i) => (
                                <tr key={i} onClick={() => verDetalleTicket(t)} className="clickable-row">
                                    <td>{t.Fecha} <small className="text-muted">{t.Hora}</small></td>
                                    <td><strong>{t.Sucursal}</strong></td>
                                    <td><span className="badge-caja">{t.IdCaja}</span></td>
                                    <td><span className="badge-z">{t.Z}</span></td>
                                    <td>{t.TipoCbte}</td>
                                    <td><strong>{t.NumeroFiscal}</strong></td>
                                    <td>{t.NombreCajero}</td>
                                    <td className="text-total">
                                        ${t.Total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="8" className="no-data">No se encontraron registros.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL --- */}
            {modalAbierto && (
                <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalle de Ticket - {ticketSeleccionado?.NumeroFiscal}</h3>
                            <button className="btn-close" onClick={() => setModalAbierto(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="ticket-header-info">
                                <p><strong>Sucursal:</strong> {ticketSeleccionado?.Sucursal}</p>
                                <p><strong>Caja:</strong> {ticketSeleccionado?.IdCaja} | <strong>Z:</strong> {ticketSeleccionado?.Z}</p>
                                <p><strong>Cajero:</strong> {ticketSeleccionado?.NombreCajero}</p>
                            </div>
                            
                            {cargandoDetalle ? (
                                <div className="loader-detalle">Cargando productos...</div>
                            ) : (
                                <table className="detalle-table">
                                    <thead>
                                        <tr>
                                            <th>Artículo</th>
                                            <th>Cant.</th>
                                            <th>P. Unit.</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detalleProductos.length > 0 ? (
                                            detalleProductos.map((prod, idx) => (
                                                <tr key={idx}>
                                                    <td>{prod.Articulo}</td>
                                                    <td>{prod.Cantidad}</td>
                                                    <td>${prod.PrecioSinIVA?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                                    <td>${prod.Subtotal?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="4" className="no-data">No se encontraron productos para este ticket.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                            <div className="ticket-total-final">
                                <span>TOTAL TICKET:</span>
                                <span>${ticketSeleccionado?.Total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Ventas;