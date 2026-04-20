import React, { useState, useEffect, useRef } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputSwitch } from 'primereact/inputswitch';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import VisualizadorDeImagen from "@/app/components/shared/VisualizadorDeImagen";
import { getUrlImagenMiniatura, getUrlImagenGrande } from "@/app/utility/ImageUtils";
import { getCategorias } from "@/app/api-endpoints/categoria";
import { getMarcas } from "@/app/api-endpoints/marca";
import { getEstados } from "@/app/api-endpoints/estado";
import { getTiposProducto, getTipoProducto } from "@/app/api-endpoints/tipo_producto";
import { getProductosPropiedad, deleteProductoPropiedad } from "@/app/api-endpoints/producto_propiedad";
import { patchProducto } from "@/app/api-endpoints/producto";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';
import { devuelveBasePath } from "../../utility/Utils";

const EditarDatosProducto = ({ producto, setProducto, estadoGuardando, estoyEditandoProducto, listaTipoArchivos, setRegistroResult }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [estados, setEstados] = useState([]);
    const [tiposProducto, setTiposProducto] = useState([]);
    const [cargandoCategorias, setCargandoCategorias] = useState(false);
    const [cargandoMarcas, setCargandoMarcas] = useState(false);
    const [cargandoEstados, setCargandoEstados] = useState(false);
    const [cargandoTiposProducto, setCargandoTiposProducto] = useState(false);
    const [imagenPrincipalPreview, setImagenPrincipalPreview] = useState(null);
    const [imagenPrincipalGrande, setImagenPrincipalGrande] = useState(null);
    const [visualizadorVisible, setVisualizadorVisible] = useState(false);
    const [dialogoCambioTipo, setDialogoCambioTipo] = useState({ visible: false, nuevoTipoId: null, registrosAEliminar: [] });
    const [eliminandoPropiedades, setEliminandoPropiedades] = useState(false);

    // Cargar categorías
    useEffect(() => {
        const cargarCategorias = async () => {
            setCargandoCategorias(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                             empresaId: getUsuarioSesion()?.empresaId,
                             activoSn: 'S' 
                            }
                    }
                });
                const data = await getCategorias(filtro);
                const categoriasFormateadas = data.map(cat => ({
                    label: cat.nombre,
                    value: cat.id
                }));
                setCategorias(categoriasFormateadas);
            } catch (error) {
                console.error('Error cargando categorías:', error);
            } finally {
                setCargandoCategorias(false);
            }
        };

        cargarCategorias();
    }, []);

    // Cargar marcas
    useEffect(() => {
        const cargarMarcas = async () => {
            setCargandoMarcas(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                             empresaId: getUsuarioSesion()?.empresaId,
                             activoSn: 'S' 
                            }
                    }
                });
                const data = await getMarcas(filtro);
                const marcasFormateadas = data.map(marca => ({
                    label: marca.nombre,
                    value: marca.id
                }));
                setMarcas(marcasFormateadas);
            } catch (error) {
                console.error('Error cargando marcas:', error);
            } finally {
                setCargandoMarcas(false);
            }
        };

        cargarMarcas();
    }, []);

    // Cargar estados
    useEffect(() => {
        const cargarEstados = async () => {
            setCargandoEstados(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        activoSn: 'S'
                    }
                });
                const data = await getEstados(filtro);
                const estadosFormateados = data.map(estado => ({
                    label: estado.nombre,
                    value: estado.id
                }));
                setEstados(estadosFormateados);
            } catch (error) {
                console.error('Error cargando estados:', error);
            } finally {
                setCargandoEstados(false);
            }
        };

        cargarEstados();
    }, []);

    // Cargar tipos de producto
    useEffect(() => {
        const cargarTiposProducto = async () => {
            setCargandoTiposProducto(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                             empresaId: getUsuarioSesion()?.empresaId,
                             activoSn: 'S' 
                            }
                    }
                });
                const data = await getTiposProducto(filtro);
                let tiposProductoFormateados = data.map(tipo => ({
                    label: tipo.nombre,
                    value: tipo.id
                }));

                // Si el producto tiene un tipoProductoId asignado, verificar si está en la lista
                if (producto?.tipoProductoId) {
                    const tipoExisteEnLista = tiposProductoFormateados.some(tipo => tipo.value === producto.tipoProductoId);
                    
                    // Si no existe (porque está inactivo), cargarlo individualmente
                    if (!tipoExisteEnLista) {
                        try {
                            const tipoInactivo = await getTipoProducto(producto.tipoProductoId);
                            if (tipoInactivo) {
                                tiposProductoFormateados.unshift({
                                    label: `${tipoInactivo.nombre}`,
                                    value: tipoInactivo.id
                                });
                            }
                        } catch (error) {
                            console.error('Error cargando tipo de producto inactivo:', error);
                        }
                    }
                }

                setTiposProducto(tiposProductoFormateados);
            } catch (error) {
                console.error('Error cargando tipos de producto:', error);
            } finally {
                setCargandoTiposProducto(false);
            }
        };

        cargarTiposProducto();
    }, [producto?.tipoProductoId]);
    
    //Crear inputs de archivos
    const inputsDinamicos = [];
    for (const tipoArchivo of listaTipoArchivos || []) {
        //Depende del tipo del input se genera multiple o no
        if (tipoArchivo.multiple === 'S') {
            inputsDinamicos.push(
                <div key={tipoArchivo.tipo} className="flex flex-column field gap-2 mt-2 col-12">
                    <label>{tipoArchivo.nombre}</label>
                    <ArchivoMultipleInput
                        registro={producto}
                        setRegistro={setProducto}
                        archivoTipo={tipoArchivo.tipo}
                        campoNombre={(tipoArchivo.nombre).toLowerCase()}
                    />
                </div>
            );
        }
        else {
            inputsDinamicos.push(
                <div key={tipoArchivo.tipo} className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <ArchivoInput
                        registro={producto}
                        setRegistro={setProducto}
                        archivoTipo={tipoArchivo.tipo}
                        archivoHeader={tipoArchivo.nombre}
                        campoNombre={(tipoArchivo.nombre).toLowerCase()}
                    />
                </div>
            );
        }
    }

    const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
        const valor = (e.target && e.target.value) || "";
        let _producto = { ...producto };
        const esTrue = valor === true ? 'S' : 'N';
        _producto[`${nombreInputSwitch}`] = esTrue;
        setProducto(_producto);
    };

    const manejarSeleccionImagenPrincipal = (e) => {
        const file = e.files[0];
        if (file) {
            // Crear URL temporal para mostrar la vista previa
            const imageUrl = URL.createObjectURL(file);
            setImagenPrincipalPreview(imageUrl);
            setImagenPrincipalGrande(null); // blob no tiene versión grande
            
            // Guardar el archivo en el producto para procesarlo al guardar
            setProducto({ ...producto, imagenPrincipalFile: file, imagenPrincipal: imageUrl });
        }
    };

    const eliminarImagenPrincipal = () => {
        if (imagenPrincipalPreview && imagenPrincipalPreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagenPrincipalPreview);
        }
        setImagenPrincipalPreview(null);
        setImagenPrincipalGrande(null);
        setProducto({ ...producto, imagenPrincipal: null, imagenPrincipalFile: null });
    };

    // Efecto para cargar la imagen existente si está editando
    useEffect(() => {
        if (producto?.imagenPrincipal && !imagenPrincipalPreview) {
            if (producto.imagenPrincipal.startsWith('blob:')) {
                setImagenPrincipalPreview(producto.imagenPrincipal);
                setImagenPrincipalGrande(null);
            } else {
                setImagenPrincipalPreview(devuelveBasePath() + getUrlImagenMiniatura(producto.imagenPrincipal));
                setImagenPrincipalGrande(getUrlImagenGrande(producto.imagenPrincipal));
            }
        }
    }, [producto?.imagenPrincipal]);

    /**
     * Maneja el cambio de tipo de producto.
     * Si el producto ya tiene valores en producto_propiedad, muestra un Dialog
     * advirtiendo que se borrarán todos los valores de atributos y campos dinámicos.
     */
    const manejarCambioTipoProducto = async (nuevoTipoId) => {
        // Si es producto nuevo (sin ID) o no tiene tipo asignado, cambiar directamente
        if (!producto?.id || !producto?.tipoProductoId) {
            setProducto({ ...producto, tipoProductoId: nuevoTipoId });
            return;
        }

        // Si selecciona el mismo tipo, no hacer nada
        if (nuevoTipoId === producto.tipoProductoId) return;

        try {
            // Consultar si existen registros en producto_propiedad para este producto
            const filtro = JSON.stringify({
                where: { and: { productoId: producto.id } }
            });
            const registros = await getProductosPropiedad(filtro);

            // Verificar si alguno tiene valor asignado
            const tieneValores = registros?.some(r =>
                r.valor !== null && r.valor !== undefined && r.valor.toString().trim() !== ''
            );

            if (tieneValores) {
                // Mostrar Dialog de confirmación
                setDialogoCambioTipo({
                    visible: true,
                    nuevoTipoId,
                    registrosAEliminar: registros
                });
                return;
            }

            // Si no hay valores pero sí hay registros vacíos, limpiarlos silenciosamente
            if (registros?.length > 0) {
                await Promise.all(registros.map(r => deleteProductoPropiedad(r.id)));
            }

            setProducto({ ...producto, tipoProductoId: nuevoTipoId });
        } catch (error) {
            console.error('Error verificando propiedades del producto:', error);
            // En caso de error, permitir el cambio para no bloquear
            setProducto({ ...producto, tipoProductoId: nuevoTipoId });
        }
    };

    const confirmarCambioTipoProducto = async () => {
        setEliminandoPropiedades(true);
        try {
            // 1. Borrar todos los registros de producto_propiedad para este producto
            await Promise.all(
                dialogoCambioTipo.registrosAEliminar.map(r => deleteProductoPropiedad(r.id))
            );

            // 2. Persistir el nuevo tipo de producto en BD
            await patchProducto(producto.id, { tipoProductoId: dialogoCambioTipo.nuevoTipoId });

            // 3. Actualizar el estado local
            setProducto({ ...producto, tipoProductoId: dialogoCambioTipo.nuevoTipoId });

            // 4. Notificar al Crud para que recargue la tabla
            setRegistroResult?.(`tipo_cambiado_${Date.now()}`);

            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Tipo de producto cambiado' }),
                detail: intl.formatMessage({ id: 'Se han eliminado los valores de atributos y campos dinámicos anteriores' }),
                life: 5000,
            });
        } catch (error) {
            console.error('Error eliminando propiedades del producto:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: intl.formatMessage({ id: 'Error al eliminar las propiedades del producto' }),
                life: 3000,
            });
        } finally {
            setEliminandoPropiedades(false);
            setDialogoCambioTipo({ visible: false, nuevoTipoId: null, registrosAEliminar: [] });
        }
    };

    const cancelarCambioTipoProducto = () => {
        setDialogoCambioTipo({ visible: false, nuevoTipoId: null, registrosAEliminar: [] });
    };

    return (
        <>
            <Toast ref={toast} />
            <Fieldset legend={intl.formatMessage({ id: 'Información básica' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="imagenPrincipal">{intl.formatMessage({ id: 'Imagen principal' })}</label>
                        <div className="flex gap-3 align-items-start">
                            <div className="flex-1">
                                {imagenPrincipalPreview && (
                                    <div className="flex flex-column align-items-start gap-2">
                                        <img
                                            src={imagenPrincipalPreview}
                                            alt="Vista previa imagen principal"
                                            width="160"
                                            height="160"
                                            className="border-round shadow-2"
                                            style={{ objectFit: 'cover', cursor: imagenPrincipalGrande ? 'zoom-in' : 'default' }}
                                            onClick={() => { if (imagenPrincipalGrande) setVisualizadorVisible(true); }}
                                            onError={(e) => { e.target.src = `${devuelveBasePath()}/multimedia/Sistema/200x200_imagen-no-disponible.jpeg`; }}
                                        />
                                        <VisualizadorDeImagen
                                            visible={visualizadorVisible}
                                            onHide={() => setVisualizadorVisible(false)}
                                            imageUrl={imagenPrincipalGrande}
                                            altText={intl.formatMessage({ id: 'Imagen principal' })}
                                        />
                                        {estoyEditandoProducto && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="p-button p-button-sm p-button-danger p-button-text"
                                                    onClick={eliminarImagenPrincipal}
                                                    disabled={estadoGuardando}
                                                    title={intl.formatMessage({ id: 'Eliminar imagen' })}
                                                >
                                                    <i className="pi pi-trash"></i>&nbsp;{intl.formatMessage({ id: 'Eliminar imagen' })}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                                {estoyEditandoProducto && (<>
                                    <FileUpload
                                        id="imagenPrincipal"
                                        mode="basic"
                                        accept="image/*"
                                        maxFileSize={2000000}
                                        onSelect={manejarSeleccionImagenPrincipal}
                                        onValidationFail={() => {
                                            toast.current?.show({
                                                severity: 'error',
                                                summary: intl.formatMessage({ id: 'Archivo demasiado grande' }),
                                                detail: intl.formatMessage({ id: 'La imagen supera el tamaño máximo permitido de 2MB. Por favor, selecciona una imagen más pequeña.' }),
                                                life: 5000
                                            });
                                        }}
                                        chooseLabel={intl.formatMessage({ id: 'Seleccionar imagen' })}
                                        disabled={estadoGuardando}
                                        className="w-full"
                                    />
                                    <small className="text-muted">{intl.formatMessage({ id: 'Formatos soportados: JPG, PNG, GIF. Máximo 2MB' })}</small>
                                    </>
                                )}
                            </div>                            
                        </div>
                    </div>
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-8">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={producto?.nombre || ''}
                            placeholder={intl.formatMessage({ id: 'Nombre del producto' })}
                            onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
                            className={`${(estadoGuardando && !producto?.nombre) ? "p-invalid" : ""}`}
                            maxLength={200}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="sku"><b>{intl.formatMessage({ id: 'SKU' })}*</b></label>
                        <InputText 
                            id="sku"
                            value={producto?.sku || ''}
                            placeholder={intl.formatMessage({ id: 'Código SKU del producto' })}
                            onChange={(e) => setProducto({ ...producto, sku: e.target.value })}
                            className={`${(estadoGuardando && !producto?.sku) ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="ean"><b>{intl.formatMessage({ id: 'EAN' })}*</b></label>
                        <InputText 
                            id="ean"
                            value={producto?.ean || ''}
                            placeholder={intl.formatMessage({ id: 'Código EAN del producto' })}
                            onChange={(e) => setProducto({ ...producto, ean: e.target.value })}
                            className={`${(estadoGuardando && !producto?.ean) ? "p-invalid" : ""}`}
                            maxLength={50}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="categoria"><b>{intl.formatMessage({ id: 'Categoría' })}*</b></label>
                        <Dropdown 
                            id="categoria"
                            value={producto?.categoriaId || null}
                            options={categorias}
                            onChange={(e) => setProducto({ ...producto, categoriaId: e.value })}
                            placeholder={intl.formatMessage({ id: 'Selecciona una categoría' })}
                            className={`${(estadoGuardando && !producto?.categoriaId) ? "p-invalid" : ""}`}
                            disabled={estadoGuardando || cargandoCategorias}
                            showClear
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="marca"><b>{intl.formatMessage({ id: 'Marca' })}*</b></label>
                        <Dropdown 
                            id="marca"
                            value={producto?.marcaId || null}
                            options={marcas}
                            onChange={(e) => setProducto({ ...producto, marcaId: e.value })}
                            placeholder={intl.formatMessage({ id: 'Selecciona una marca' })}
                            disabled={estadoGuardando || cargandoMarcas}
                            showClear
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="estado"><b>{intl.formatMessage({ id: 'Estado' })}*</b></label>
                        <Dropdown 
                            id="estado"
                            value={producto?.estadoId || null}
                            options={estados}
                            onChange={(e) => setProducto({ ...producto, estadoId: e.value })}
                            placeholder={intl.formatMessage({ id: 'Selecciona un estado' })}
                            className={`${(estadoGuardando && !producto?.estadoId) ? "p-invalid" : ""}`}
                            disabled={estadoGuardando || cargandoEstados}
                            showClear
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="tipoProducto"><b>{intl.formatMessage({ id: 'Tipo de producto' })}*</b></label>
                        <Dropdown 
                            id="tipoProducto"
                            value={producto?.tipoProductoId || null}
                            options={tiposProducto}
                            onChange={(e) => manejarCambioTipoProducto(e.value)}
                            placeholder={intl.formatMessage({ id: 'Selecciona un tipo de producto' })}
                            disabled={estadoGuardando || cargandoTiposProducto}
                            // showClear
                        />
                    </div>

                    
                </div>

                <div className="formgrid grid">

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={producto?.activoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="finalizado" className="font-bold block">{intl.formatMessage({ id: 'Finalizado' })}</label>
                        <InputSwitch
                            id="finalizado"
                            checked={producto?.finalizadoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "finalizadoSn")}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
            <br/>
            <Fieldset legend={intl.formatMessage({ id: 'Descripción y contenido' })} collapsed={true} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcionCorta">{intl.formatMessage({ id: 'Descripción corta' })}</label>
                        <InputTextarea 
                            id="descripcionCorta"
                            value={producto?.descripcionCorta || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción breve del producto' })}
                            onChange={(e) => setProducto({ ...producto, descripcionCorta: e.target.value })}
                            rows={3}
                            maxLength={500}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcionLarga">{intl.formatMessage({ id: 'Descripción larga' })}</label>
                        <InputTextarea 
                            id="descripcionLarga"
                            value={producto?.descripcionLarga || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción detallada del producto' })}
                            onChange={(e) => setProducto({ ...producto, descripcionLarga: e.target.value })}
                            rows={5}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="puntosClave">{intl.formatMessage({ id: 'Puntos clave' })}</label>
                        <InputTextarea 
                            id="puntosClave"
                            value={producto?.puntosClave || ''}
                            placeholder={intl.formatMessage({ id: 'Características destacadas del producto' })}
                            onChange={(e) => setProducto({ ...producto, puntosClave: e.target.value })}
                            rows={4}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>            

            {listaTipoArchivos && listaTipoArchivos.length > 0 && (
                <Fieldset legend={intl.formatMessage({ id: 'Archivos multimedia' })} collapsed={true} toggleable>
                    <div className="formgrid grid">
                        {
                            ...inputsDinamicos //Muestra las inputs generados
                        }
                    </div>
                </Fieldset>
            )}

            {/* Dialog de confirmación para cambio de tipo de producto */}
            <Dialog
                visible={dialogoCambioTipo.visible}
                onHide={cancelarCambioTipoProducto}
                header={intl.formatMessage({ id: 'Cambiar tipo de producto' })}
                style={{ width: '36rem', maxWidth: '95vw' }}
                modal
                closable={!eliminandoPropiedades}
                footer={
                    <div className="flex gap-2 justify-content-end">
                        <Button
                            label={intl.formatMessage({ id: 'Cancelar' })}
                            className="p-button-secondary"
                            onClick={cancelarCambioTipoProducto}
                            disabled={eliminandoPropiedades}
                        />
                        <Button
                            label={eliminandoPropiedades
                                ? intl.formatMessage({ id: 'Eliminando...' })
                                : intl.formatMessage({ id: 'Sí, cambiar tipo de producto' })
                            }
                            icon={eliminandoPropiedades ? 'pi pi-spin pi-spinner' : 'pi pi-exclamation-triangle'}
                            className="p-button-danger"
                            onClick={confirmarCambioTipoProducto}
                            disabled={eliminandoPropiedades}
                        />
                    </div>
                }
            >
                <div className="flex align-items-center gap-3 mb-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-orange-500" />
                    <span className="font-bold text-lg">
                        {intl.formatMessage({ id: 'Atención: esta acción es irreversible' })}
                    </span>
                </div>
                <p style={{ margin: 0, lineHeight: '1.6' }}>
                    {intl.formatMessage({ id: 'Este producto ya tiene valores asignados en los campos de Atributos y/o Campos Dinámicos.' })}
                    {' '}
                    {intl.formatMessage({ id: 'Si continúa cambiando el tipo de producto, se borrarán todos los valores asignados para atributos y campos dinámicos de este producto.' })}
                    <br /><br />
                    <strong>{intl.formatMessage({ id: '¿Desea continuar?' })}</strong>
                </p>
            </Dialog>
        </>
    );
};

export default EditarDatosProducto;