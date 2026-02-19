import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { TabView, TabPanel } from 'primereact/tabview';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { getAtributos } from "@/app/api-endpoints/atributo";
import { getMultimedias } from "@/app/api-endpoints/multimedia";
import { getTipoProductoAtributoDetalles } from "@/app/api-endpoints/tipo_producto_atributo_detalle";
import { getTipoProductoMultimediaDetalles } from "@/app/api-endpoints/tipo_producto_multimedia_detalle";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarDatosTipoProducto = ({ tipoProducto, setTipoProducto, estadoGuardando, editable, isEdit, idTipo }) => {
    const intl = useIntl();
    const usuarioSesion = getUsuarioSesion();
    
    const [atributos, setAtributos] = useState([]);
    const [multimedias, setMultimedias] = useState([]);
    const [cargandoAtributos, setCargandoAtributos] = useState(false);
    const [cargandoMultimedias, setCargandoMultimedias] = useState(false);
    const [atributosSeleccionados, setAtributosSeleccionados] = useState(tipoProducto?.atributosIds || []);
    const [multimediasSeleccionados, setMultimediasSeleccionados] = useState(tipoProducto?.multimediasIds || []);
    const [datosInicializeados, setDatosInicializeados] = useState(false);

    // Cargar atributos de la empresa
    useEffect(() => {
        const cargarAtributos = async () => {
            if (!isEdit || !idTipo) return;
            
            setCargandoAtributos(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: usuarioSesion?.empresaId,
                            activoSn: 'S' 
                        }
                    },
                    order: 'orden ASC'
                });
                
                const data = await getAtributos(filtro);
                setAtributos(data);
            } catch (error) {
                console.error('Error cargando atributos:', error);
            } finally {
                setCargandoAtributos(false);
            }
        };

        if (usuarioSesion?.empresaId && isEdit && idTipo) {
            cargarAtributos();
        }
    }, [usuarioSesion?.empresaId, isEdit, idTipo]);

    // Cargar atributos seleccionados por defecto desde la tabla de detalle
    useEffect(() => {
        const cargarAtributosSeleccionados = async () => {
            if (!isEdit || !idTipo || !tipoProducto?.id || datosInicializeados) return;
            
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            tipoProductoId: tipoProducto.id
                        }
                    }
                });
                
                const detalles = await getTipoProductoAtributoDetalles(filtro);
                if (detalles && detalles.length > 0) {
                    const atributosIds = detalles.map(detalle => detalle.id);
                    setAtributosSeleccionados(atributosIds);
                }
            } catch (error) {
                console.error('Error cargando atributos seleccionados:', error);
            }
        };

        if (usuarioSesion?.empresaId && isEdit && idTipo && tipoProducto?.id) {
            cargarAtributosSeleccionados();
        }
    }, [usuarioSesion?.empresaId, isEdit, idTipo, tipoProducto?.id, datosInicializeados]);

    // Cargar multimedia de la empresa
    useEffect(() => {
        const cargarMultimedias = async () => {
            if (!isEdit || !idTipo) return;
            
            setCargandoMultimedias(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            empresaId: usuarioSesion?.empresaId,
                            activoSn: 'S' 
                        }
                    },
                    order: 'nombre ASC'
                });
                
                const data = await getMultimedias(filtro);
                setMultimedias(data);
            } catch (error) {
                console.error('Error cargando multimedias:', error);
            } finally {
                setCargandoMultimedias(false);
            }
        };

        if (usuarioSesion?.empresaId && isEdit && idTipo) {
            cargarMultimedias();
        }
    }, [usuarioSesion?.empresaId, isEdit, idTipo]);

    // Cargar multimedia seleccionados por defecto desde la tabla de detalle
    useEffect(() => {
        const cargarMultimediasSeleccionados = async () => {
            if (!isEdit || !idTipo || !tipoProducto?.id || datosInicializeados) return;
            
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            tipoProductoId: tipoProducto.id
                        }
                    }
                });
                
                const detalles = await getTipoProductoMultimediaDetalles(filtro);
                if (detalles && detalles.length > 0) {
                    const multimediasIds = detalles.map(detalle => detalle.multimediaId);
                    setMultimediasSeleccionados(multimediasIds);
                    setDatosInicializeados(true);
                }
            } catch (error) {
                console.error('Error cargando multimedias seleccionados:', error);
            }
        };

        if (usuarioSesion?.empresaId && isEdit && idTipo && tipoProducto?.id) {
            cargarMultimediasSeleccionados();
        }
    }, [usuarioSesion?.empresaId, isEdit, idTipo, tipoProducto?.id, datosInicializeados]);

    // Sincronizar selecciones con el tipo de producto
    useEffect(() => {
        setTipoProducto(prev => ({
            ...prev,
            atributosIds: atributosSeleccionados,
            multimediasIds: multimediasSeleccionados
        }));
    }, [atributosSeleccionados, multimediasSeleccionados]);

    const manejarCambioInput = (e, nombreCampo) => {
        const valor = e.target.value;
        setTipoProducto(prev => ({ ...prev, [nombreCampo]: valor }));
    };

    const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
        const valor = (e.target && e.target.value) || "";
        let _tipoProducto = { ...tipoProducto };
        const esTrue = valor === true ? 'S' : 'N';
        _tipoProducto[`${nombreInputSwitch}`] = esTrue;
        setTipoProducto(_tipoProducto);
    };

    const manejarCambioAtributo = (atributoId, isChecked) => {
        if (isChecked) {
            setAtributosSeleccionados(prev => [...prev, atributoId]);
        } else {
            setAtributosSeleccionados(prev => prev.filter(id => id !== atributoId));
        }
    };

    const manejarCambioMultimedia = (multimediaId, isChecked) => {
        if (isChecked) {
            setMultimediasSeleccionados(prev => [...prev, multimediaId]);
        } else {
            setMultimediasSeleccionados(prev => prev.filter(id => id !== multimediaId));
        }
    };

    const seleccionarTodosAtributos = () => {
        const todosIds = atributos.map(attr => attr.id);
        setAtributosSeleccionados(todosIds);
    };

    const deseleccionarTodosAtributos = () => {
        setAtributosSeleccionados([]);
    };

    const seleccionarTodosMultimedias = () => {
        const todosIds = multimedias.map(media => media.id);
        setMultimediasSeleccionados(todosIds);
    };

    const deseleccionarTodosMultimedias = () => {
        setMultimediasSeleccionados([]);
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información del Tipo de Producto' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })} *</b></label>
                        <InputText
                            inputId="nombre"
                            value={tipoProducto?.nombre || ''}
                            onChange={(e) => manejarCambioInput(e, 'nombre')}
                            disabled={!editable || estadoGuardando}
                            maxLength={50}
                            placeholder={intl.formatMessage({ id: 'Nombre del tipo de producto' })}
                            className={(!tipoProducto?.nombre || tipoProducto?.nombre.trim() === '') ? 'p-invalid' : ''}
                        />
                        <small className="p-text-secondary">
                            {intl.formatMessage({ id: 'Máximo 50 caracteres' })}
                        </small>
                    </div>
                </div>
                
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcion">{intl.formatMessage({ id: 'Descripción' })}</label>
                        <InputTextarea
                            inputId="descripcion"
                            value={tipoProducto?.descripcion || ''}
                            onChange={(e) => manejarCambioInput(e, 'descripcion')}
                            disabled={!editable || estadoGuardando}
                            rows={4}
                            cols={30}
                            maxLength={500}
                            autoResize
                            placeholder={intl.formatMessage({ id: 'Descripción detallada del tipo de producto' })}
                        />
                        <small className="p-text-secondary">
                            {intl.formatMessage({ id: 'Máximo 500 caracteres' })}
                            {tipoProducto?.descripcion && ` - ${tipoProducto.descripcion.length}/500`}
                        </small>
                    </div>
                </div>
                
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={tipoProducto?.activoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={!editable || estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
            <br/>
            {(isEdit && idTipo && idTipo !== 0) && (
                <Fieldset legend={intl.formatMessage({ id: 'Información de los registros asociados' })} collapsed={false} toggleable>
                    <div className="mt-4">
                        <TabView scrollable>
                            <TabPanel header={`${intl.formatMessage({ id: 'Atributos' })} (${atributosSeleccionados.length})`}>
                                <Fieldset legend={intl.formatMessage({ id: 'Atributos Asociados' })} collapsed={false} toggleable>
                                    <div className="flex justify-content-between align-items-center mb-3">
                                        <h5>{intl.formatMessage({ id: 'Seleccione los atributos que pertenecen a este tipo de producto' })}</h5>
                                        <div>
                                            <button 
                                                type="button" 
                                                className="p-button p-button-text p-button-sm mr-2"
                                                onClick={seleccionarTodosAtributos}
                                                disabled={!editable || cargandoAtributos}
                                            >
                                                {intl.formatMessage({ id: 'Seleccionar Todos' })}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="p-button p-button-text p-button-sm"
                                                onClick={deseleccionarTodosAtributos}
                                                disabled={!editable || cargandoAtributos}
                                            >
                                                {intl.formatMessage({ id: 'Deseleccionar Todos' })}
                                            </button>
                                        </div>
                                    </div>

                                    {cargandoAtributos ? (
                                        <div className="flex justify-content-center p-4">
                                            <ProgressSpinner style={{width: '50px', height: '50px'}} />
                                        </div>
                                    ) : (
                                        <div className="grid">
                                            {atributos.map((atributo) => (
                                                <div key={atributo.id} className="col-12 md:col-6 lg:col-4">
                                                    <div className="field-checkbox p-3 border-1 border-round border-300 hover:border-primary transition-colors">
                                                        <Checkbox 
                                                            inputId={`atributo-${atributo.id}`}
                                                            checked={atributosSeleccionados.includes(atributo.id)}
                                                            onChange={(e) => manejarCambioAtributo(atributo.id, e.checked)}
                                                            disabled={!editable || estadoGuardando}
                                                        />
                                                        <label htmlFor={`atributo-${atributo.id}`} className="ml-2 cursor-pointer">
                                                            <div>
                                                                <div className="font-bold">{atributo.nombre}</div>
                                                                {atributo.descripcion && (
                                                                    <small className="p-text-secondary block mt-1">
                                                                        <b>{intl.formatMessage({ id: 'Descripción' })}:</b> {atributo.descripcion}
                                                                    </small>
                                                                )}
                                                                {atributo.unidadMedida && (
                                                                    <small className="p-text-secondary block mt-1">
                                                                        <b>{intl.formatMessage({ id: 'Unidad Medida' })}:</b> {atributo.unidadMedida}
                                                                    </small>
                                                                )}
                                                                {atributo.valoresPermitidos && (
                                                                    <small className="p-text-secondary block mt-1">
                                                                        <b>{intl.formatMessage({ id: 'Valores Permitidos' })}:</b> {atributo.valoresPermitidos}
                                                                    </small>
                                                                )}
                                                                {atributo.orden && (
                                                                    <small className="p-text-secondary block mt-1">
                                                                        <b>{intl.formatMessage({ id: 'Orden' })}:</b> {atributo.orden}
                                                                    </small>
                                                                )}                                                                
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                            {atributos.length === 0 && !cargandoAtributos && (
                                                <div className="col-12">
                                                    <div className="text-center p-4 text-500">
                                                        {intl.formatMessage({ id: 'No hay atributos disponibles en su empresa' })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Fieldset>
                            </TabPanel>

                            <TabPanel header={`${intl.formatMessage({ id: 'Multimedia' })} (${multimediasSeleccionados.length})`}>
                                <Fieldset legend={intl.formatMessage({ id: 'Multimedia Asociado' })} collapsed={false} toggleable>
                                    <div className="flex justify-content-between align-items-center mb-3">
                                        <h5>{intl.formatMessage({ id: 'Seleccione los archivos multimedia que pertenecen a este tipo de producto' })}</h5>
                                        <div>
                                            <button 
                                                type="button" 
                                                className="p-button p-button-text p-button-sm mr-2"
                                                onClick={seleccionarTodosMultimedias}
                                                disabled={!editable || cargandoMultimedias}
                                            >
                                                {intl.formatMessage({ id: 'Seleccionar Todos' })}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="p-button p-button-text p-button-sm"
                                                onClick={deseleccionarTodosMultimedias}
                                                disabled={!editable || cargandoMultimedias}
                                            >
                                                {intl.formatMessage({ id: 'Deseleccionar Todos' })}
                                            </button>
                                        </div>
                                    </div>

                                    {cargandoMultimedias ? (
                                        <div className="flex justify-content-center p-4">
                                            <ProgressSpinner style={{width: '50px', height: '50px'}} />
                                        </div>
                                    ) : (
                                        <div className="grid">
                                            {multimedias.map((multimedia) => (
                                                <div key={multimedia.id} className="col-12 md:col-6 lg:col-4">
                                                    <div className="field-checkbox p-3 border-1 border-round border-300 hover:border-primary transition-colors">
                                                        <Checkbox 
                                                            inputId={`multimedia-${multimedia.id}`}
                                                            checked={multimediasSeleccionados.includes(multimedia.id)}
                                                            onChange={(e) => manejarCambioMultimedia(multimedia.id, e.checked)}
                                                            disabled={!editable || estadoGuardando}
                                                        />
                                                        <label htmlFor={`multimedia-${multimedia.id}`} className="ml-2 cursor-pointer">
                                                            <div>
                                                                <div className="font-bold">
                                                                    {multimedia.nombre || multimedia.nombreArchivo}
                                                                </div>
                                                                {multimedia.descripcion && (
                                                                    <small className="p-text-secondary block mt-1">
                                                                        <b>{intl.formatMessage({ id: 'Descripción' })}:</b> {multimedia.descripcion}
                                                                    </small>
                                                                )}
                                                                {multimedia.tipo && (
                                                                    <small className="p-text-secondary block">
                                                                        <b>{intl.formatMessage({ id: 'Tipo' })}:</b> {multimedia.tipo}
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                            {multimedias.length === 0 && !cargandoMultimedias && (
                                                <div className="col-12">
                                                    <div className="text-center p-4 text-500">
                                                        {intl.formatMessage({ id: 'No hay archivos multimedia disponibles en su empresa' })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Fieldset>
                            </TabPanel>
                        </TabView>
                    </div>
                </Fieldset>
            )}
        </>
    );
};

export default EditarDatosTipoProducto;