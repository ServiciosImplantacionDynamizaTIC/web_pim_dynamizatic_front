import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { getProductos } from "@/app/api-endpoints/producto";
import { getIconos } from "@/app/api-endpoints/icono";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarDatosProductoIcono = ({ productoIcono, setProductoIcono, estadoGuardando, editable, idProducto, rowData }) => {
    const intl = useIntl();
    
    const [productos, setProductos] = useState([]);
    const [iconos, setIconos] = useState([]);
    const [iconosCompletos, setIconosCompletos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [cargandoIconos, setCargandoIconos] = useState(false);

    // Cargar productos para el dropdown
    useEffect(() => {
        const cargarProductos = async () => {
            setCargandoProductos(true);
            try {
                let filtro;
                if (idProducto) {
                    // Si tenemos un idProducto específico, filtrar solo ese producto
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
                    // Si no hay idProducto específico, cargar todos los productos activos
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

    // Cargar iconos para el dropdown
    useEffect(() => {
        const cargarIconos = async () => {
            setCargandoIconos(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: getUsuarioSesion()?.empresaId,
                            activoSn: 'S' 
                        }
                    }
                });
                
                const data = await getIconos(filtro);
                setIconosCompletos(data);
                
                // Filtrar iconos ya usados para este producto (excepto el actual si estamos editando)
                let iconosDisponibles = data;
                if (rowData && idProducto) {
                    const iconosUsados = rowData
                        .filter(registro => registro.productoId === idProducto && registro.id !== productoIcono?.id)
                        .map(registro => registro.iconoId);
                    
                    iconosDisponibles = data.filter(icono => !iconosUsados.includes(icono.id));
                }
                
                const iconosFormateados = iconosDisponibles.map(icono => ({
                    label: icono.nombre,
                    value: icono.id
                }));
                setIconos(iconosFormateados);
                
            } catch (error) {
                console.error('Error cargando iconos:', error);
            } finally {
                setCargandoIconos(false);
            }
        };

        cargarIconos();
    }, [rowData, idProducto, productoIcono?.id]);

    //
    // Efecto separado para auto-seleccionar el producto cuando está disponible
    //
    useEffect(() => {
        if (idProducto && productos.length === 1 && productos[0].value === idProducto) {
            setProductoIcono(prev => {
                //
                // Solo actualizar si no tiene productoId o es diferente
                //
                if (!prev?.productoId || prev.productoId !== idProducto) {
                    return { ...prev, productoId: idProducto };
                }
                return prev;
            });
        }
    }, [idProducto, productos]);

    const manejarCambioInput = (e, nombreCampo) => {
        const valor = e.target.value;
        setProductoIcono(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioDropdown = (e, nombreCampo) => {
        const valor = e.value;
        setProductoIcono(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioIcono = (e) => {
        const iconoId = e.value;
        const iconoSeleccionado = iconosCompletos.find(icono => icono.id === iconoId);
        
        setProductoIcono(prev => ({ 
            ...prev, 
            iconoId: iconoId,
            textoAsociado: iconoSeleccionado ? iconoSeleccionado.nombre : prev?.textoAsociado || ''
        }));
    };

    const manejarCambioNumero = (e, nombreCampo) => {
        const valor = e.value;
        setProductoIcono(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información del Producto' })} collapsed={false} toggleable style={{display: idProducto ? 'none' : 'block'}}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="productoId">{intl.formatMessage({ id: 'Producto' })} *</label>
                        <Dropdown
                            inputId="productoId"
                            value={productoIcono?.productoId}
                            options={productos}
                            onChange={(e) => manejarCambioDropdown(e, 'productoId')}
                            placeholder={cargandoProductos ? intl.formatMessage({ id: 'Cargando productos...' }) : intl.formatMessage({ id: 'Seleccione un producto' })}
                            disabled={!editable || estadoGuardando || cargandoProductos || (idProducto && productos.length === 1)}
                            loading={cargandoProductos}
                            filter
                            showClear
                            className={(!productoIcono?.productoId) ? 'p-invalid' : ''}
                        />
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: 'Información del Icono' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="orden">{intl.formatMessage({ id: 'Orden' })}</label>
                        <InputNumber
                            inputId="orden"
                            value={productoIcono?.orden}
                            onValueChange={(e) => manejarCambioNumero(e, 'orden')}
                            disabled={!editable || estadoGuardando}
                            min={0}
                            showButtons
                            placeholder={intl.formatMessage({ id: 'Orden de visualización' })}
                        />
                    </div>
                </div>
                <div className="formgrid grid">
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="iconoId"><b>{intl.formatMessage({ id: 'Icono' })} *</b></label>
                        <Dropdown
                            inputId="iconoId"
                            value={productoIcono?.iconoId}
                            options={iconos}
                            onChange={manejarCambioIcono}
                            placeholder={cargandoIconos ? intl.formatMessage({ id: 'Cargando iconos...' }) : intl.formatMessage({ id: 'Seleccione un icono' })}
                            disabled={!editable || estadoGuardando || cargandoIconos}
                            loading={cargandoIconos}
                            filter
                            showClear
                            className={(!productoIcono?.iconoId) ? 'p-invalid' : ''}
                        />
                    </div>
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="textoAsociado">{intl.formatMessage({ id: 'Texto Asociado' })}</label>
                        <InputText
                            inputId="textoAsociado"
                            value={productoIcono?.textoAsociado || ''}
                            onChange={(e) => manejarCambioInput(e, 'textoAsociado')}
                            disabled={!editable || estadoGuardando}
                            maxLength={100}
                            placeholder={intl.formatMessage({ id: 'Texto descriptivo del icono' })}
                        />
                    </div>                    

                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosProductoIcono;