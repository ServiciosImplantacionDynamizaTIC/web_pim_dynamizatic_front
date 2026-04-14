import React, { useState, useEffect, useMemo } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { TabView, TabPanel } from 'primereact/tabview';
import { Checkbox } from 'primereact/checkbox';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { gePropiedades } from "@/app/api-endpoints/propiedad";
import { getGrupoPropiedades } from "@/app/api-endpoints/grupo_propiedad";
import { getMultimedias } from "@/app/api-endpoints/multimedia";
import { getProductosPropiedad } from "@/app/api-endpoints/producto_propiedad";
import { getProductos } from "@/app/api-endpoints/producto";
import { getTipoProductoPropiedadDetalles } from "@/app/api-endpoints/tipo_producto_propiedad_detalle";
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
    const [atributosSeleccionados, setAtributosSeleccionados] = useState([]);
    const [camposDinamicosSeleccionados, setCamposDinamicosSeleccionados] = useState([]);
    const [multimediasSeleccionados, setMultimediasSeleccionados] = useState(tipoProducto?.multimediasIds || []);
    const [datosInicializeados, setDatosInicializeados] = useState(false);
    const [propiedadesInicializados, setPropiedadesInicializados] = useState(false);
    const [gruposOrdenModificados, setGruposOrdenModificados] = useState({});
    const [atributosOrdenModificados, setPropiedadesOrdenModificados] = useState({});
    const [multimediasOrdenModificados, setMultimediasOrdenModificados] = useState({});
    const [dialogoConflictoPropiedad, setDialogoConflictoPropiedad] = useState({ visible: false, propiedades: [], tipo: '' });

    // Filtrar propiedades y grupos por tipo
    const atributos = useMemo(() => propiedades.filter(p => p.tipoDePropiedad === 'atributo'), [propiedades]);
    const camposDinamicos = useMemo(() => propiedades.filter(p => p.tipoDePropiedad === 'campo_dinamico'), [propiedades]);
    const gruposAtributos = useMemo(() => gruposPropiedades.filter(g => g.tipoDeGrupoPropiedad === 'grupo_atributos'), [gruposPropiedades]);
    const gruposCamposDinamicos = useMemo(() => gruposPropiedades.filter(g => g.tipoDeGrupoPropiedad === 'grupo_campos_dinamicos'), [gruposPropiedades]);

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
            if (!isEdit || !idTipo || !tipoProducto?.id || propiedadesInicializados || propiedades.length === 0) return;
            
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
                    const propiedadIds = detalles.map(detalle => detalle.id);
                    const atributosSet = new Set(propiedades.filter(p => p.tipoDePropiedad === 'atributo').map(p => p.id));
                    const camposSet = new Set(propiedades.filter(p => p.tipoDePropiedad === 'campo_dinamico').map(p => p.id));
                    
                    setAtributosSeleccionados(propiedadIds.filter(id => atributosSet.has(id)));
                    setCamposDinamicosSeleccionados(propiedadIds.filter(id => camposSet.has(id)));
                }
                setPropiedadesInicializados(true);
            } catch (error) {
                console.error('Error cargando propiedades seleccionados:', error);
            }
        };

        if (usuarioSesion?.empresaId && isEdit && idTipo && tipoProducto?.id && propiedades.length > 0) {
            cargarPropiedadesSeleccionados();
        }
    }, [usuarioSesion?.empresaId, isEdit, idTipo, tipoProducto?.id, propiedadesInicializados, propiedades]);

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
            propiedadesIds: [...atributosSeleccionados, ...camposDinamicosSeleccionados],
            multimediasIds: multimediasSeleccionados,
            _gruposOrdenModificados: gruposOrdenModificados,
            _atributosOrdenModificados: atributosOrdenModificados,
            _multimediasOrdenModificados: multimediasOrdenModificados
        }));
    }, [atributosSeleccionados, camposDinamicosSeleccionados, multimediasSeleccionados, gruposOrdenModificados, atributosOrdenModificados, multimediasOrdenModificados]);

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

    const manejarOrdenPropiedad = (propiedadId, nuevoOrden) => {
        setPropiedades(prev => prev.map(a =>
            a.id === propiedadId ? { ...a, orden: nuevoOrden } : a
        ));
        setPropiedadesOrdenModificados(prev => ({ ...prev, [propiedadId]: nuevoOrden }));
    };

    /**
     * Valida si las propiedades que se van a desmarcar tienen valores asignados a productos
     * QUE PERTENECEN A ESTE TIPO DE PRODUCTO (plantilla).
     * Si alguna tiene valores en productos de esta plantilla, muestra un Dialog y bloquea el cambio.
     * Si ninguna tiene valores (o los valores son de productos de otras plantillas), permite el cambio.
     */
    const validarDeseleccionPropiedades = async (nuevaSeleccion, seleccionActual, setSeleccion, tipoLabel) => {
        // Detectar qué IDs se están quitando
        const nuevaSet = new Set(nuevaSeleccion);
        const idsQuitados = seleccionActual.filter(id => !nuevaSet.has(id));

        // Si no se quita ninguno (solo se agregan), permitir directamente
        if (idsQuitados.length === 0) {
            setSeleccion(nuevaSeleccion);
            return;
        }

        // Verificar en BD si alguna propiedad quitada tiene valores asignados
        // SOLO en productos que pertenecen a este tipo de producto (plantilla)
        try {
            // 1. Obtener los productos que usan esta plantilla (tipo de producto)
            const tipoId = tipoProducto?.id;
            if (!tipoId) {
                // Si no hay ID de tipo (es creación nueva), permitir directamente
                setSeleccion(nuevaSeleccion);
                return;
            }

            const filtroProductos = JSON.stringify({
                where: { and: { tipoProductoId: tipoId } },
                fields: { id: true }
            });
            const productosDeEsteTipo = await getProductos(filtroProductos);
            const idsProductos = productosDeEsteTipo?.map(p => p.id) || [];

            // Si no hay productos con esta plantilla, no hay conflicto posible
            if (idsProductos.length === 0) {
                setSeleccion(nuevaSeleccion);
                return;
            }

            // 2. Para cada propiedad quitada, verificar si tiene valores en esos productos
            const propiedadesConValores = [];

            for (const propId of idsQuitados) {
                const filtro = JSON.stringify({
                    where: { and: { propiedadId: propId, productoId: { inq: idsProductos } } }
                });
                const registros = await getProductosPropiedad(filtro);
                const tieneValor = registros?.some(r =>
                    r.valor !== null && r.valor !== undefined && r.valor.toString().trim() !== ''
                );
                if (tieneValor) {
                    // Buscar el nombre de la propiedad
                    const prop = propiedades.find(p => p.id === propId);
                    propiedadesConValores.push(prop || { id: propId, nombre: `Propiedad #${propId}` });
                }
            }

            if (propiedadesConValores.length > 0) {
                // Bloquear: mostrar Dialog con las propiedades conflictivas
                setDialogoConflictoPropiedad({
                    visible: true,
                    propiedades: propiedadesConValores,
                    tipo: tipoLabel
                });
                // NO actualizar la selección (se mantiene la anterior)
                return;
            }

            // Sin conflictos: permitir el cambio
            setSeleccion(nuevaSeleccion);
        } catch (error) {
            console.error('Error validando deselección de propiedades:', error);
            // En caso de error, permitir el cambio para no bloquear al usuario
            setSeleccion(nuevaSeleccion);
        }
    };

    const manejarCambioAtributos = async (nuevaSeleccion) => {
        await validarDeseleccionPropiedades(
            nuevaSeleccion,
            atributosSeleccionados,
            setAtributosSeleccionados,
            intl.formatMessage({ id: 'Atributos' })
        );
    };

    const manejarCambioCamposDinamicos = async (nuevaSeleccion) => {
        await validarDeseleccionPropiedades(
            nuevaSeleccion,
            camposDinamicosSeleccionados,
            setCamposDinamicosSeleccionados,
            intl.formatMessage({ id: 'Campos Dinámicos' })
        );
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
            <Dialog
                visible={dialogoConflictoPropiedad.visible}
                onHide={() => setDialogoConflictoPropiedad({ visible: false, propiedades: [], tipo: '' })}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-exclamation-triangle text-yellow-500" style={{ fontSize: '1.5rem' }} />
                        <span>{intl.formatMessage({ id: 'No se puede desactivar' })}</span>
                    </div>
                }
                style={{ width: '40rem', maxWidth: '95vw' }}
                modal
                footer={
                    <div className="flex justify-content-end">
                        <Button
                            label={intl.formatMessage({ id: 'Entendido' })}
                            icon="pi pi-check"
                            onClick={() => setDialogoConflictoPropiedad({ visible: false, propiedades: [], tipo: '' })}
                            autoFocus
                        />
                    </div>
                }
            >
                <p style={{ margin: '0 0 12px 0' }}>
                    {intl.formatMessage({ id: 'No se pueden desactivar los siguientes registros de tipo' })}{' '}
                    <b>{dialogoConflictoPropiedad.tipo}</b>{' '}
                    {intl.formatMessage({ id: 'porque ya tienen valores asignados a al menos un producto. Debe borrar esos valores primero desde la edición del producto:' })}
                </p>
                <ul className="m-0 pl-3">
                    {dialogoConflictoPropiedad.propiedades.map(p => (
                        <li key={p.id} className="mb-1">
                            <b>{p.nombre}</b>
                            {p.grupoPropiedadNombre && (
                                <span className="text-500"> ({p.grupoPropiedadNombre})</span>
                            )}
                        </li>
                    ))}
                </ul>
            </Dialog>
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
                            <TabPanel header={`${intl.formatMessage({ id: 'Atributos' })} (${atributosSeleccionados.length})`}>
                                    <ListaCheckboxAgrupada
                                        items={atributos}
                                        grupos={gruposAtributos}
                                        seleccionados={atributosSeleccionados}
                                        onSeleccionChange={manejarCambioAtributos}
                                        grupoIdField="grupoPropiedadId"
                                        cargando={cargandoPropiedades}
                                        editable={editable}
                                        disabled={estadoGuardando}
                                        renderItem={renderItemPropiedad}
                                        textoVacio={intl.formatMessage({ id: 'No hay atributos disponibles en su empresa' })}
                                        titulo={intl.formatMessage({ id: 'Seleccione los atributos que pertenecen a este tipo de producto' })}
                                        prefixId="atributo"
                                        mostrarOrden={editable}
                                        onOrdenGrupoChange={manejarOrdenGrupoPropiedad}
                                        onOrdenItemChange={manejarOrdenPropiedad}
                                    />
                            </TabPanel>

                            <TabPanel header={`${intl.formatMessage({ id: 'Campos Dinámicos' })} (${camposDinamicosSeleccionados.length})`}>
                                    <ListaCheckboxAgrupada
                                        items={camposDinamicos}
                                        grupos={gruposCamposDinamicos}
                                        seleccionados={camposDinamicosSeleccionados}
                                        onSeleccionChange={manejarCambioCamposDinamicos}
                                        grupoIdField="grupoPropiedadId"
                                        cargando={cargandoPropiedades}
                                        editable={editable}
                                        disabled={estadoGuardando}
                                        renderItem={renderItemPropiedad}
                                        textoVacio={intl.formatMessage({ id: 'No hay campos dinámicos disponibles en su empresa' })}
                                        titulo={intl.formatMessage({ id: 'Seleccione los campos dinámicos que pertenecen a este tipo de producto' })}
                                        prefixId="campo-dinamico"
                                        mostrarOrden={editable}
                                        onOrdenGrupoChange={manejarOrdenGrupoPropiedad}
                                        onOrdenItemChange={manejarOrdenPropiedad}
                                    />
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