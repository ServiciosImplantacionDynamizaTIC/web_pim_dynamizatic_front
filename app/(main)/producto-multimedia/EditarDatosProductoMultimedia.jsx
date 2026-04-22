import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { getProductos } from "@/app/api-endpoints/producto";
import { getMultimedias } from "@/app/api-endpoints/multimedia";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarDatosProductoMultimedia = ({ productoMultimedia, setProductoMultimedia, estadoGuardando, editable, idProducto, rowData }) => {
    const intl = useIntl();
    
    const [productos, setProductos] = useState([]);
    const [multimedias, setMultimedias] = useState([]);
    const [multimediasCompletos, setMultimediasCompletos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [cargandoMultimedias, setCargandoMultimedias] = useState(false);

    // Opciones para tipo de uso
    const tiposUso = [
        { label: intl.formatMessage({ id: 'Galería' }), value: 'galeria' },
        { label: intl.formatMessage({ id: 'Principal' }), value: 'principal' },
        { label: intl.formatMessage({ id: 'Ficha Técnica' }), value: 'ficha_tecnica' },
        { label: intl.formatMessage({ id: 'Manual' }), value: 'manual' },
        { label: intl.formatMessage({ id: 'Otro' }), value: 'otro' }
    ];

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

    // Cargar multimedias para el dropdown
    useEffect(() => {
        const cargarMultimedias = async () => {
            setCargandoMultimedias(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: getUsuarioSesion()?.empresaId,
                            activoSn: 'S' 
                        }
                    }
                });
                
                const data = await getMultimedias(filtro);
                setMultimediasCompletos(data);
                
                // Filtrar multimedias ya usados para este producto (excepto el actual si estamos editando)
                let multimediasDisponibles = data;
                if (rowData && idProducto) {
                    const multimediasUsados = rowData
                        .filter(registro => registro.productoId === idProducto && registro.id !== productoMultimedia?.id)
                        .map(registro => registro.multimediaId);
                    
                    multimediasDisponibles = data.filter(multimedia => !multimediasUsados.includes(multimedia.id));
                }
                
                const multimediasFormateados = multimediasDisponibles.map(multimedia => ({
                    label: multimedia.nombre || multimedia.nombreArchivo,
                    value: multimedia.id
                }));
                setMultimedias(multimediasFormateados);
                
            } catch (error) {
                console.error('Error cargando multimedias:', error);
            } finally {
                setCargandoMultimedias(false);
            }
        };

        cargarMultimedias();
    }, [rowData, idProducto, productoMultimedia?.id]);

    //
    // Efecto separado para auto-seleccionar el producto cuando está disponible
    //
    useEffect(() => {
        if (idProducto && productos.length === 1 && productos[0].value === idProducto) {
            setProductoMultimedia(prev => {
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

    const manejarCambioDropdown = (e, nombreCampo) => {
        const valor = e.value;
        setProductoMultimedia(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioNumero = (e, nombreCampo) => {
        const valor = e.value;
        setProductoMultimedia(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioCheckbox = (e) => {
        const valor = e.checked ? 'S' : 'N';
        setProductoMultimedia(prev => ({ ...prev, esPrincipal: valor }));
    };

    const manejarCambioTipoUso = (e) => {
        const tipoUso = e.value;
        // Si se selecciona "principal", automáticamente marcarlo como principal
        const esPrincipal = tipoUso === 'principal' ? 'S' : productoMultimedia?.esPrincipal;
        
        setProductoMultimedia(prev => ({ 
            ...prev, 
            tipoUso: tipoUso,
            esPrincipal: esPrincipal
        }));
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información del Producto' })} collapsed={false} toggleable style={{display: idProducto ? 'none' : 'block'}}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="productoId">{intl.formatMessage({ id: 'Producto' })} *</label>
                        <Dropdown
                            inputId="productoId"
                            value={productoMultimedia?.productoId}
                            options={productos}
                            onChange={(e) => manejarCambioDropdown(e, 'productoId')}
                            placeholder={cargandoProductos ? intl.formatMessage({ id: 'Cargando productos...' }) : intl.formatMessage({ id: 'Seleccione un producto' })}
                            disabled={!editable || estadoGuardando || cargandoProductos || (idProducto && productos.length === 1)}
                            loading={cargandoProductos}
                            filter
                            showClear
                            className={(!productoMultimedia?.productoId) ? 'p-invalid' : ''}
                        />
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: 'Información del Multimedia' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="orden">{intl.formatMessage({ id: 'Orden' })}</label>
                        <InputNumber
                            inputId="orden"
                            value={productoMultimedia?.orden}
                            onValueChange={(e) => manejarCambioNumero(e, 'orden')}
                            disabled={!editable || estadoGuardando}
                            min={0}
                            showButtons
                            placeholder={intl.formatMessage({ id: 'Orden de visualización' })}
                        />
                    </div>
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="tipoUso">{intl.formatMessage({ id: 'Tipo de Uso' })}</label>
                        <Dropdown
                            inputId="tipoUso"
                            value={productoMultimedia?.tipoUso}
                            options={tiposUso}
                            onChange={manejarCambioTipoUso}
                            disabled={!editable || estadoGuardando}
                            placeholder={intl.formatMessage({ id: 'Seleccione el tipo de uso' })}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label>&nbsp;</label>
                        <div className="flex align-items-center">
                            <Checkbox 
                                inputId="esPrincipal" 
                                checked={productoMultimedia?.esPrincipal === 'S' || productoMultimedia?.esPrincipal === true}
                                onChange={manejarCambioCheckbox}
                                disabled={!editable || estadoGuardando || productoMultimedia?.tipoUso === 'principal'}
                            />
                            <label htmlFor="esPrincipal" className="ml-2">{intl.formatMessage({ id: 'Es Principal' })}</label>
                        </div>
                        {productoMultimedia?.tipoUso === 'principal' && (
                            <small className="p-text-secondary">
                                {intl.formatMessage({ id: 'Se marca automáticamente como principal al seleccionar tipo "Principal"' })}
                            </small>
                        )}
                    </div>
                </div>
                
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="multimediaId"><b>{intl.formatMessage({ id: 'Archivo Multimedia' })} *</b></label>
                        <Dropdown
                            inputId="multimediaId"
                            value={productoMultimedia?.multimediaId}
                            options={multimedias}
                            onChange={(e) => manejarCambioDropdown(e, 'multimediaId')}
                            placeholder={cargandoMultimedias ? intl.formatMessage({ id: 'Cargando archivos...' }) : intl.formatMessage({ id: 'Seleccione un archivo multimedia' })}
                            disabled={!editable || estadoGuardando || cargandoMultimedias}
                            loading={cargandoMultimedias}
                            filter
                            showClear
                            className={(!productoMultimedia?.multimediaId) ? 'p-invalid' : ''}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosProductoMultimedia;