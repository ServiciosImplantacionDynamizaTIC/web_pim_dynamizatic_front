import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Calendar } from 'primereact/calendar';
import { getProductos } from "@/app/api-endpoints/producto";
import { getMarketplaces } from "@/app/api-endpoints/marketplace";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarDatosProductoMarketplace = ({ productoMarketplace, setProductoMarketplace, estadoGuardando, editable, idProducto }) => {
    const intl = useIntl();
    
    const [productos, setProductos] = useState([]);
    const [marketplaces, setMarketplaces] = useState([]);
    const [marketplacesCompletos, setMarketplacesCompletos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [cargandoMarketplaces, setCargandoMarketplaces] = useState(false);

    const opcionesEstadoSincronizacion = [
        { label: intl.formatMessage({ id: 'Pendiente' }), value: 'pendiente' },
        { label: intl.formatMessage({ id: 'Sincronizado' }), value: 'sincronizado' },
        { label: intl.formatMessage({ id: 'Error' }), value: 'error' }
    ];

    useEffect(() => {
        const cargarProductos = async () => {
            setCargandoProductos(true);
            try {
                let filtro;
                if (idProducto) {
                    filtro = JSON.stringify({
                        where: {
                            and: {
                                id: idProducto,
                                empresaId: getUsuarioSesion()?.empresaId,
                                activoSn: 'S' 
                            }
                        }
                    });
                } else {
                    filtro = JSON.stringify({
                        where: {
                            and: {
                                empresaId: getUsuarioSesion()?.empresaId,
                                activoSn: 'S' 
                            }
                        }
                    });
                }
                
                const data = await getProductos(filtro);
                const productosFormateados = data.map(prod => ({
                    label: `${prod.sku} - ${prod.nombre}`,
                    value: prod.id
                }));
                setProductos(productosFormateados);
                
            } catch (error) {
                console.error('Error cargando productos:', error);
            } finally {
                setCargandoProductos(false);
            }
        };

        cargarProductos();
    }, [idProducto]);

    useEffect(() => {
        const cargarMarketplaces = async () => {
            setCargandoMarketplaces(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: getUsuarioSesion()?.empresaId,
                            activoSn: 'S' 
                        }
                    }
                });
                
                const data = await getMarketplaces(filtro);
                setMarketplacesCompletos(data);
                const marketplacesFormateados = data.map(marketplace => ({
                    label: marketplace.nombre,
                    value: marketplace.id
                }));
                setMarketplaces(marketplacesFormateados);
                
            } catch (error) {
                console.error('Error cargando marketplaces:', error);
            } finally {
                setCargandoMarketplaces(false);
            }
        };

        cargarMarketplaces();
    }, []);

    useEffect(() => {
        if (idProducto && productos.length === 1 && productos[0].value === idProducto) {
            setProductoMarketplace(prev => {
                if (!prev.productoId || prev.productoId !== idProducto) {
                    return { ...prev, productoId: idProducto };
                }
                return prev;
            });
        }
    }, [idProducto, productos]);

    const manejarCambioInput = (e, nombreCampo) => {
        const valor = e.target.value;
        setProductoMarketplace({ ...productoMarketplace, [nombreCampo]: valor });
    };

    const manejarCambioDropdown = (e, nombreCampo) => {
        const valor = e.value;
        setProductoMarketplace({ ...productoMarketplace, [nombreCampo]: valor });
    };

    const manejarCambioMarketplace = (e) => {
        const marketplaceId = e.value;
        const marketplaceSeleccionado = marketplacesCompletos.find(marketplace => marketplace.id === marketplaceId);
        
        setProductoMarketplace({ 
            ...productoMarketplace, 
            marketplaceId: marketplaceId,
            tituloPersonalizado: marketplaceSeleccionado ? marketplaceSeleccionado.nombre : productoMarketplace.tituloPersonalizado
        });
    };

    const manejarCambioInputSwitch = (e, nombreCampo) => {
        const valor = (e.target && e.target.value) || "";
        const esTrue = valor === true ? 'S' : 'N';
        setProductoMarketplace({ ...productoMarketplace, [nombreCampo]: esTrue });
    };

    const manejarCambioFecha = (e, nombreCampo) => {
        const valor = e.value;
        setProductoMarketplace({ ...productoMarketplace, [nombreCampo]: valor });
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información del Producto' })} collapsed={false} toggleable style={{display: idProducto ? 'none' : 'block'}}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="productoId">{intl.formatMessage({ id: 'Producto' })} *</label>
                        <Dropdown
                            inputId="productoId"
                            value={productoMarketplace.productoId}
                            options={productos}
                            onChange={(e) => manejarCambioDropdown(e, 'productoId')}
                            placeholder={cargandoProductos ? intl.formatMessage({ id: 'Cargando productos...' }) : intl.formatMessage({ id: 'Seleccione un producto' })}
                            disabled={!editable || estadoGuardando || cargandoProductos || (idProducto && productos.length === 1)}
                            loading={cargandoProductos}
                            filter
                            showClear
                            className={(!productoMarketplace.productoId) ? 'p-invalid' : ''}
                        />
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: 'Información del Marketplace' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="marketplaceId">{intl.formatMessage({ id: 'Marketplace' })} *</label>
                        <Dropdown
                            inputId="marketplaceId"
                            value={productoMarketplace.marketplaceId}
                            options={marketplaces}
                            onChange={manejarCambioMarketplace}
                            placeholder={cargandoMarketplaces ? intl.formatMessage({ id: 'Cargando marketplaces...' }) : intl.formatMessage({ id: 'Seleccione un marketplace' })}
                            disabled={!editable || estadoGuardando || cargandoMarketplaces}
                            loading={cargandoMarketplaces}
                            filter
                            showClear
                            className={(!productoMarketplace.marketplaceId) ? 'p-invalid' : ''}
                        />
                    </div>
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="activoEnMarketplace" className="font-bold block">{intl.formatMessage({ id: 'Activo en Marketplace' })}</label>
                        <InputSwitch
                            id="activoEnMarketplace"
                            checked={productoMarketplace.activoEnMarketplace === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, 'activoEnMarketplace')}
                            disabled={!editable || estadoGuardando}
                        />
                    </div>
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="tituloPersonalizado">{intl.formatMessage({ id: 'Título Personalizado' })}</label>
                        <InputText
                            inputId="tituloPersonalizado"
                            value={productoMarketplace.tituloPersonalizado || ''}
                            onChange={(e) => manejarCambioInput(e, 'tituloPersonalizado')}
                            disabled={!editable || estadoGuardando}
                            maxLength={200}
                            placeholder={intl.formatMessage({ id: 'Título específico para este marketplace' })}
                        />
                    </div>
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcionPersonalizada">{intl.formatMessage({ id: 'Descripción Personalizada' })}</label>
                        <InputTextarea
                            inputId="descripcionPersonalizada"
                            value={productoMarketplace.descripcionPersonalizada || ''}
                            onChange={(e) => manejarCambioInput(e, 'descripcionPersonalizada')}
                            disabled={!editable || estadoGuardando}
                            rows={4}
                            placeholder={intl.formatMessage({ id: 'Descripción específica para este marketplace' })}
                        />
                    </div>
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="palabrasClavePersonalizadas">{intl.formatMessage({ id: 'Palabras Clave Personalizadas' })}</label>
                        <InputText
                            inputId="palabrasClavePersonalizadas"
                            value={productoMarketplace.palabrasClavePersonalizadas || ''}
                            onChange={(e) => manejarCambioInput(e, 'palabrasClavePersonalizadas')}
                            disabled={!editable || estadoGuardando}
                            maxLength={500}
                            placeholder={intl.formatMessage({ id: 'Palabras clave separadas por comas' })}
                        />
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: 'Estado de Sincronización' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="estadoSincronizacion">{intl.formatMessage({ id: 'Estado' })}</label>
                        <Dropdown
                            inputId="estadoSincronizacion"
                            value={productoMarketplace.estadoSincronizacion}
                            options={opcionesEstadoSincronizacion}
                            onChange={(e) => manejarCambioDropdown(e, 'estadoSincronizacion')}
                            disabled={!editable || estadoGuardando}
                        />
                    </div>
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="fechaUltimaSincronizacion">{intl.formatMessage({ id: 'Fecha Última Sincronización' })}</label>
                        <Calendar
                            inputId="fechaUltimaSincronizacion"
                            value={productoMarketplace.fechaUltimaSincronizacion ? new Date(productoMarketplace.fechaUltimaSincronizacion) : null}
                            onChange={(e) => manejarCambioFecha(e, 'fechaUltimaSincronizacion')}
                            disabled={!editable || estadoGuardando}
                            showTime
                            showSeconds
                            dateFormat="dd/mm/yy"
                            placeholder={intl.formatMessage({ id: 'Seleccione fecha y hora' })}
                        />
                    </div>
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="mensajeError">{intl.formatMessage({ id: 'Mensaje de Error' })}</label>
                        <InputTextarea
                            inputId="mensajeError"
                            value={productoMarketplace.mensajeError || ''}
                            onChange={(e) => manejarCambioInput(e, 'mensajeError')}
                            disabled={!editable || estadoGuardando}
                            rows={3}
                            placeholder={intl.formatMessage({ id: 'Detalles del error de sincronización (si aplica)' })}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosProductoMarketplace;