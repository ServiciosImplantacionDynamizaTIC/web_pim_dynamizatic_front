import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { getProductos } from "@/app/api-endpoints/producto";
import { gePropiedades } from "@/app/api-endpoints/propiedad";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarDatosProductoPropiedad = ({ productoPropiedad, setProductoPropiedad, estadoGuardando, editable, idProducto, rowData }) => {
    const intl = useIntl();
    
    const [productos, setProductos] = useState([]);
    const [propiedades, setPropiedades] = useState([]);
    const [propiedadesCompletos, setPropiedadesCompletos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [cargandoPropiedades, setCargandoPropiedades] = useState(false);

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

    // Cargar propiedades para el dropdown
    useEffect(() => {
        const cargarPropiedades = async () => {
            setCargandoPropiedades(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: getUsuarioSesion()?.empresaId,
                            activoSn: 'S' 
                        }
                    }
                });
                
                const data = await gePropiedades(filtro);
                setPropiedadesCompletos(data);
                
                // Filtrar propiedades ya usados para este producto (excepto el actual si estamos editando)
                let propiedadesDisponibles = data;
                if (rowData && idProducto) {
                    const propiedadesUsadas = rowData
                        .filter(registro => registro.productoId === idProducto && registro.id !== productoPropiedad?.id)
                        .map(registro => registro.propiedadId);
                    
                    propiedadesDisponibles = data.filter(propiedad => !propiedadesUsadas.includes(propiedad.id));
                }
                
                const propiedadesFormateadas = propiedadesDisponibles.map(propiedad => ({
                    label: propiedad.nombre,
                    value: propiedad.id
                }));
                setPropiedades(propiedadesFormateadas);
                
            } catch (error) {
                console.error('Error cargando propiedades:', error);
            } finally {
                setCargandoPropiedades(false);
            }
        };

        cargarPropiedades();
    }, [rowData, idProducto, productoPropiedad?.id]);

    //
    // Efecto separado para auto-seleccionar el producto cuando está disponible
    //
    useEffect(() => {
        if (idProducto && productos.length === 1 && productos[0].value === idProducto) {
            setProductoPropiedad(prev => {
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
        setProductoPropiedad(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioDropdown = (e, nombreCampo) => {
        const valor = e.value;
        setProductoPropiedad(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioPropiedad = (e) => {
        const propiedadId = e.value;
        const propiedadSeleccionada = propiedadesCompletos.find(propiedad => propiedad.id === propiedadId);
        
        setProductoPropiedad(prev => ({ 
            ...prev, 
            propiedadId: propiedadId,
            // Si la propiedad tiene una unidad por defecto, usarla
            unidad: propiedadSeleccionada?.unidadMedida || prev?.unidad || ''
        }));
    };

    const manejarCambioNumero = (e, nombreCampo) => {
        const valor = e.value;
        setProductoPropiedad(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información del Producto' })} collapsed={false} toggleable style={{display: idProducto ? 'none' : 'block'}}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="productoId">{intl.formatMessage({ id: 'Producto' })} *</label>
                        <Dropdown
                            inputId="productoId"
                            value={productoPropiedad?.productoId}
                            options={productos}
                            onChange={(e) => manejarCambioDropdown(e, 'productoId')}
                            placeholder={cargandoProductos ? intl.formatMessage({ id: 'Cargando productos...' }) : intl.formatMessage({ id: 'Seleccione un producto' })}
                            disabled={!editable || estadoGuardando || cargandoProductos || (idProducto && productos.length === 1)}
                            loading={cargandoProductos}
                            filter
                            showClear
                            className={(!productoPropiedad?.productoId) ? 'p-invalid' : ''}
                        />
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: 'Información del Propiedad' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="ordenEnGrupo">{intl.formatMessage({ id: 'Orden en Grupo' })}</label>
                        <InputNumber
                            inputId="ordenEnGrupo"
                            value={productoPropiedad?.ordenEnGrupo}
                            onValueChange={(e) => manejarCambioNumero(e, 'ordenEnGrupo')}
                            disabled={!editable || estadoGuardando}
                            min={0}
                            showButtons
                            placeholder={intl.formatMessage({ id: 'Orden dentro del grupo de propiedades' })}
                        />
                    </div>
                </div>
                <div className="formgrid grid">
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="propiedadId"><b>{intl.formatMessage({ id: 'Propiedad' })} *</b></label>
                        <Dropdown
                            inputId="propiedadId"
                            value={productoPropiedad?.propiedadId}
                            options={propiedades}
                            onChange={manejarCambioPropiedad}
                            placeholder={cargandoPropiedades ? intl.formatMessage({ id: 'Cargando propiedades...' }) : intl.formatMessage({ id: 'Seleccione una propiedad' })}
                            disabled={!editable || estadoGuardando || cargandoPropiedades}
                            loading={cargandoPropiedades}
                            filter
                            showClear
                            className={(!productoPropiedad?.propiedadId) ? 'p-invalid' : ''}
                        />
                    </div>
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="unidad">{intl.formatMessage({ id: 'Unidad' })}</label>
                        <InputText
                            inputId="unidad"
                            value={productoPropiedad?.unidad || ''}
                            onChange={(e) => manejarCambioInput(e, 'unidad')}
                            disabled={!editable || estadoGuardando}
                            maxLength={50}
                            placeholder={intl.formatMessage({ id: 'Unidad de medida (kg, cm, etc.)' })}
                        />
                    </div>                    

                </div>
                
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="valor"><b>{intl.formatMessage({ id: 'Valor' })} *</b></label>
                        <InputTextarea
                            inputId="valor"
                            value={productoPropiedad?.valor || ''}
                            onChange={(e) => manejarCambioInput(e, 'valor')}
                            disabled={!editable || estadoGuardando}
                            rows={3}
                            autoResize
                            placeholder={intl.formatMessage({ id: 'Valor del atributo para este producto' })}
                            className={(!productoPropiedad?.valor || productoPropiedad?.valor.trim() === '') ? 'p-invalid' : ''}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosProductoPropiedad;