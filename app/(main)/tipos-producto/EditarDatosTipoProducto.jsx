import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { TabView, TabPanel } from 'primereact/tabview';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { gePropiedades } from "@/app/api-endpoints/atributo";
import { getGrupoPropiedades } from "@/app/api-endpoints/grupo_atributo";
import { getMultimedias } from "@/app/api-endpoints/multimedia";
import { getTipoProductoPropiedadDetalles } from "@/app/api-endpoints/tipo_producto_atributo_detalle";
import { getTipoProductoMultimediaDetalles } from "@/app/api-endpoints/tipo_producto_multimedia_detalle";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';
import ListaCheckboxAgrupada from "@/app/components/shared/ListaCheckboxAgrupada";

const EditarDatosTipoProducto = ({ tipoProducto, setTipoProducto, estadoGuardando, editable, isEdit, idTipo }) => {
    const intl = useIntl();
    const usuarioSesion = getUsuarioSesion();
    
    const [propiedades, setPropiedades] = useState([]);
    const [gruposPropiedades, setGruposPropiedades] = useState([]);
    const [multimedias, setMultimedias] = useState([]);
    const [cargandoPropiedades, setCargandoPropiedades] = useState(false);
    const [cargandoMultimedias, setCargandoMultimedias] = useState(false);
    const [atributosSeleccionados, setPropiedadesSeleccionados] = useState(tipoProducto?.atributosIds || []);
    const [multimediasSeleccionados, setMultimediasSeleccionados] = useState(tipoProducto?.multimediasIds || []);
    const [datosInicializeados, setDatosInicializeados] = useState(false);
    const [gruposOrdenModificados, setGruposOrdenModificados] = useState({});
    const [atributosOrdenModificados, setPropiedadesOrdenModificados] = useState({});
    const [multimediasOrdenModificados, setMultimediasOrdenModificados] = useState({});

    // Cargar propiedades y sus grupos de la empresa
    useEffect(() => {
        const cargarPropiedadesYGrupos = async () => {
            if (!isEdit || !idTipo) return;
            
            setCargandoPropiedades(true);
            try {
                const filtroActivos = JSON.stringify({
                    where: {
                        and: {
                            empresaId: usuarioSesion?.empresaId,
                            activoSn: 'S' 
                        }
                    },
                    order: 'orden ASC'
                });
                
                const [dataPropiedades, dataGrupos] = await Promise.all([
                    gePropiedades(filtroActivos),
                    getGrupoPropiedades(filtroActivos)
                ]);
                
                setPropiedades(dataPropiedades);
                setGruposPropiedades(dataGrupos);
            } catch (error) {
                console.error('Error cargando propiedades y grupos:', error);
            } finally {
                setCargandoPropiedades(false);
            }
        };

        if (usuarioSesion?.empresaId && isEdit && idTipo) {
            cargarPropiedadesYGrupos();
        }
    }, [usuarioSesion?.empresaId, isEdit, idTipo]);

    // Cargar propiedades seleccionados por defecto desde la tabla de detalle
    useEffect(() => {
        const cargarPropiedadesSeleccionados = async () => {
            if (!isEdit || !idTipo || !tipoProducto?.id || datosInicializeados) return;
            
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                            tipoProductoId: tipoProducto.id
                        }
                    }
                });
                
                const detalles = await getTipoProductoPropiedadDetalles(filtro);
                if (detalles && detalles.length > 0) {
                    const atributosIds = detalles.map(detalle => detalle.id);
                    setPropiedadesSeleccionados(atributosIds);
                }
            } catch (error) {
                console.error('Error cargando propiedades seleccionados:', error);
            }
        };

        if (usuarioSesion?.empresaId && isEdit && idTipo && tipoProducto?.id) {
            cargarPropiedadesSeleccionados();
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
                    order: 'orden ASC'
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
                    const multimediasIds = detalles.map(detalle => detalle.id);
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

    // Sincronizar selecciones y órdenes con el tipo de producto
    useEffect(() => {
        setTipoProducto(prev => ({
            ...prev,
            atributosIds: atributosSeleccionados,
            multimediasIds: multimediasSeleccionados,
            _gruposOrdenModificados: gruposOrdenModificados,
            _atributosOrdenModificados: atributosOrdenModificados,
            _multimediasOrdenModificados: multimediasOrdenModificados
        }));
    }, [atributosSeleccionados, multimediasSeleccionados, gruposOrdenModificados, atributosOrdenModificados, multimediasOrdenModificados]);

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

    const manejarOrdenMultimedia = (multimediaId, nuevoOrden) => {
        setMultimedias(prev => prev.map(m =>
            m.id === multimediaId ? { ...m, orden: nuevoOrden } : m
        ));
        setMultimediasOrdenModificados(prev => ({ ...prev, [multimediaId]: nuevoOrden }));
    };

    const manejarOrdenGrupoPropiedad = (grupoId, nuevoOrden) => {
        setGruposPropiedades(prev => prev.map(g =>
            g.id === grupoId ? { ...g, orden: nuevoOrden } : g
        ));
        setGruposOrdenModificados(prev => ({ ...prev, [grupoId]: nuevoOrden }));
    };

    const manejarOrdenPropiedad = (atributoId, nuevoOrden) => {
        setPropiedades(prev => prev.map(a =>
            a.id === atributoId ? { ...a, orden: nuevoOrden } : a
        ));
        setPropiedadesOrdenModificados(prev => ({ ...prev, [atributoId]: nuevoOrden }));
    };

    const renderItemMultimedia = (multimedia) => (
        <div>
            <div className="font-bold">{multimedia.nombre || multimedia.nombreArchivo}</div>
            {multimedia.tipo && (
                <small className="p-text-secondary block mt-1">
                    <b>{intl.formatMessage({ id: 'Tipo' })}:</b> {multimedia.tipo}
                </small>
            )}
            {multimedia.descripcion && (
                <small className="p-text-secondary block mt-1">
                    <b>{intl.formatMessage({ id: 'Descripción' })}:</b> {multimedia.descripcion}
                </small>
            )}
        </div>
    );

    const renderItemPropiedad = (atributo) => (
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
        </div>
    );

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información del Tipo de Producto' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })} *</b></label>
                        <InputText
                            id="nombre"
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
                            id="descripcion"
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
                            <TabPanel header={`${intl.formatMessage({ id: 'Propiedades' })} (${atributosSeleccionados.length})`}>
                                {/* <Fieldset legend={intl.formatMessage({ id: 'Propiedades Asociados' })} collapsed={false} toggleable> */}
                                    <ListaCheckboxAgrupada
                                        items={propiedades}
                                        grupos={gruposPropiedades}
                                        seleccionados={atributosSeleccionados}
                                        onSeleccionChange={setPropiedadesSeleccionados}
                                        grupoIdField="grupoPropiedadId"
                                        cargando={cargandoPropiedades}
                                        editable={editable}
                                        disabled={estadoGuardando}
                                        renderItem={renderItemPropiedad}
                                        textoVacio={intl.formatMessage({ id: 'No hay propiedades disponibles en su empresa' })}
                                        titulo={intl.formatMessage({ id: 'Seleccione los propiedades que pertenecen a este tipo de producto' })}
                                        prefixId="atributo"
                                        mostrarOrden={editable}
                                        onOrdenGrupoChange={manejarOrdenGrupoPropiedad}
                                        onOrdenItemChange={manejarOrdenPropiedad}
                                    />
                                {/* </Fieldset> */}
                            </TabPanel>

                            <TabPanel header={`${intl.formatMessage({ id: 'Multimedia' })} (${multimediasSeleccionados.length})`}>
                                    <ListaCheckboxAgrupada
                                        items={multimedias}
                                        grupos={[]}
                                        seleccionados={multimediasSeleccionados}
                                        onSeleccionChange={setMultimediasSeleccionados}
                                        grupoIdField="_sinGrupo"
                                        cargando={cargandoMultimedias}
                                        editable={editable}
                                        disabled={estadoGuardando}
                                        renderItem={renderItemMultimedia}
                                        textoVacio={intl.formatMessage({ id: 'No hay archivos multimedia disponibles en su empresa' })}
                                        titulo={intl.formatMessage({ id: 'Seleccione los archivos multimedia que pertenecen a este tipo de producto' })}
                                        prefixId="multimedia"
                                        mostrarOrden={editable}
                                        onOrdenItemChange={manejarOrdenMultimedia}
                                    />
                            </TabPanel>
                        </TabView>
                    </div>
                </Fieldset>
            )}
        </>
    );
};

export default EditarDatosTipoProducto;