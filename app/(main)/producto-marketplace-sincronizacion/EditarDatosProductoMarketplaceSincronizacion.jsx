import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { useIntl } from 'react-intl';

const EditarDatosProductoMarketplaceSincronizacion = ({ 
    sincronizacion, 
    setSincronizacion, 
    productosMarketplace, 
    cargandoProductosMarketplace, 
    estadoGuardando, 
    isEdit 
}) => {
    const intl = useIntl();
    
    const estadosDisponibles = [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'En progreso', value: 'en_progreso' },
        { label: 'Exitoso', value: 'exitoso' },
        { label: 'Error', value: 'error' },
        { label: 'Cancelado', value: 'cancelado' }
    ];

    const manejarCambioFecha = (e) => {
        const fechaSeleccionada = e.value;
        setSincronizacion({ ...sincronizacion, fecha: fechaSeleccionada });
    };

    const manejarCambioProductoMarketplace = (e) => {
        setSincronizacion({ ...sincronizacion, productoMarketplaceId: e.value });
    };

    const manejarCambioEstado = (e) => {
        setSincronizacion({ ...sincronizacion, estado: e.value });
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos de la sincronización' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="productoMarketplace"><b>{intl.formatMessage({ id: 'Producto Marketplace' })}*</b></label>
                        <Dropdown 
                            id="productoMarketplace"
                            value={sincronizacion.productoMarketplaceId}
                            options={productosMarketplace}
                            onChange={manejarCambioProductoMarketplace}
                            placeholder={cargandoProductosMarketplace ? intl.formatMessage({ id: 'Cargando...' }) : intl.formatMessage({ id: 'Seleccionar producto marketplace' })}
                            disabled={estadoGuardando || cargandoProductosMarketplace}
                            loading={cargandoProductosMarketplace}
                            className={`${(estadoGuardando && !sincronizacion.productoMarketplaceId) ? "p-invalid" : ""}`}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="estado"><b>{intl.formatMessage({ id: 'Estado' })}*</b></label>
                        <Dropdown 
                            id="estado"
                            value={sincronizacion.estado}
                            options={estadosDisponibles}
                            onChange={manejarCambioEstado}
                            placeholder={intl.formatMessage({ id: 'Seleccionar estado' })}
                            disabled={estadoGuardando}
                            className={`${(estadoGuardando && !sincronizacion.estado) ? "p-invalid" : ""}`}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="fecha">{intl.formatMessage({ id: 'Fecha y Hora' })}</label>
                        <Calendar 
                            id="fecha"
                            value={sincronizacion.fecha ? new Date(sincronizacion.fecha) : null}
                            onChange={manejarCambioFecha}
                            showTime={true}
                            hourFormat="24"
                            placeholder={intl.formatMessage({ id: 'Seleccionar fecha y hora' })}
                            disabled={estadoGuardando}
                            dateFormat="dd/mm/yy"
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="mensaje">{intl.formatMessage({ id: 'Mensaje' })}</label>
                        <InputTextarea 
                            id="mensaje"
                            value={sincronizacion.mensaje || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción o detalles del estado de sincronización' })}
                            onChange={(e) => setSincronizacion({ ...sincronizacion, mensaje: e.target.value })}
                            rows={4}
                            maxLength={500}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosProductoMarketplaceSincronizacion;