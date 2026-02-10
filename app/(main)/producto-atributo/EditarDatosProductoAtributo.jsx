import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { getProductos } from "@/app/api-endpoints/producto";
import { getAtributos } from "@/app/api-endpoints/atributo";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarDatosProductoAtributo = ({ productoAtributo, setProductoAtributo, estadoGuardando, editable, idProducto, rowData }) => {
    const intl = useIntl();
    
    const [productos, setProductos] = useState([]);
    const [atributos, setAtributos] = useState([]);
    const [atributosCompletos, setAtributosCompletos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [cargandoAtributos, setCargandoAtributos] = useState(false);

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

    // Cargar atributos para el dropdown
    useEffect(() => {
        const cargarAtributos = async () => {
            setCargandoAtributos(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: getUsuarioSesion()?.empresaId,
                            activoSn: 'S' 
                        }
                    }
                });
                
                const data = await getAtributos(filtro);
                setAtributosCompletos(data);
                
                // Filtrar atributos ya usados para este producto (excepto el actual si estamos editando)
                let atributosDisponibles = data;
                if (rowData && idProducto) {
                    const atributosUsados = rowData
                        .filter(registro => registro.productoId === idProducto && registro.id !== productoAtributo?.id)
                        .map(registro => registro.atributoId);
                    
                    atributosDisponibles = data.filter(atributo => !atributosUsados.includes(atributo.id));
                }
                
                const atributosFormateados = atributosDisponibles.map(atributo => ({
                    label: atributo.nombre,
                    value: atributo.id
                }));
                setAtributos(atributosFormateados);
                
            } catch (error) {
                console.error('Error cargando atributos:', error);
            } finally {
                setCargandoAtributos(false);
            }
        };

        cargarAtributos();
    }, [rowData, idProducto, productoAtributo?.id]);

    //
    // Efecto separado para auto-seleccionar el producto cuando está disponible
    //
    useEffect(() => {
        if (idProducto && productos.length === 1 && productos[0].value === idProducto) {
            setProductoAtributo(prev => {
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
        setProductoAtributo(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioDropdown = (e, nombreCampo) => {
        const valor = e.value;
        setProductoAtributo(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioAtributo = (e) => {
        const atributoId = e.value;
        const atributoSeleccionado = atributosCompletos.find(atributo => atributo.id === atributoId);
        
        setProductoAtributo(prev => ({ 
            ...prev, 
            atributoId: atributoId,
            // Si el atributo tiene una unidad por defecto, usarla
            unidad: atributoSeleccionado?.unidadMedida || prev?.unidad || ''
        }));
    };

    const manejarCambioNumero = (e, nombreCampo) => {
        const valor = e.value;
        setProductoAtributo(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información del Producto' })} collapsed={false} toggleable style={{display: idProducto ? 'none' : 'block'}}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="productoId">{intl.formatMessage({ id: 'Producto' })} *</label>
                        <Dropdown
                            inputId="productoId"
                            value={productoAtributo?.productoId}
                            options={productos}
                            onChange={(e) => manejarCambioDropdown(e, 'productoId')}
                            placeholder={cargandoProductos ? intl.formatMessage({ id: 'Cargando productos...' }) : intl.formatMessage({ id: 'Seleccione un producto' })}
                            disabled={!editable || estadoGuardando || cargandoProductos || (idProducto && productos.length === 1)}
                            loading={cargandoProductos}
                            filter
                            showClear
                            className={(!productoAtributo?.productoId) ? 'p-invalid' : ''}
                        />
                    </div>
                </div>
            </Fieldset>

            <Fieldset legend={intl.formatMessage({ id: 'Información del Atributo' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="ordenEnGrupo">{intl.formatMessage({ id: 'Orden en Grupo' })}</label>
                        <InputNumber
                            inputId="ordenEnGrupo"
                            value={productoAtributo?.ordenEnGrupo}
                            onValueChange={(e) => manejarCambioNumero(e, 'ordenEnGrupo')}
                            disabled={!editable || estadoGuardando}
                            min={0}
                            showButtons
                            placeholder={intl.formatMessage({ id: 'Orden dentro del grupo de atributos' })}
                        />
                    </div>
                </div>
                <div className="formgrid grid">
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="atributoId"><b>{intl.formatMessage({ id: 'Atributo' })} *</b></label>
                        <Dropdown
                            inputId="atributoId"
                            value={productoAtributo?.atributoId}
                            options={atributos}
                            onChange={manejarCambioAtributo}
                            placeholder={cargandoAtributos ? intl.formatMessage({ id: 'Cargando atributos...' }) : intl.formatMessage({ id: 'Seleccione un atributo' })}
                            disabled={!editable || estadoGuardando || cargandoAtributos}
                            loading={cargandoAtributos}
                            filter
                            showClear
                            className={(!productoAtributo?.atributoId) ? 'p-invalid' : ''}
                        />
                    </div>
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="unidad">{intl.formatMessage({ id: 'Unidad' })}</label>
                        <InputText
                            inputId="unidad"
                            value={productoAtributo?.unidad || ''}
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
                            value={productoAtributo?.valor || ''}
                            onChange={(e) => manejarCambioInput(e, 'valor')}
                            disabled={!editable || estadoGuardando}
                            rows={3}
                            autoResize
                            placeholder={intl.formatMessage({ id: 'Valor del atributo para este producto' })}
                            className={(!productoAtributo?.valor || productoAtributo?.valor.trim() === '') ? 'p-invalid' : ''}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosProductoAtributo;