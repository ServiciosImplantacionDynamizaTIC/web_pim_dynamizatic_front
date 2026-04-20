"use client";
import React, { useState, useEffect, useRef } from "react";
import { useIntl } from 'react-intl';
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { FileUpload } from "primereact/fileupload";
import { MultiSelect } from "primereact/multiselect";
import VisualizadorDeImagen from "@/app/components/shared/VisualizadorDeImagen";
import { getUrlImagenMiniatura, getUrlImagenGrande } from "@/app/utility/ImageUtils";
import { getTipoProductoMultimediaDetalles } from "@/app/api-endpoints/tipo_producto_multimedia_detalle";
import { getProductosMultimedia, postProductoMultimedia, patchProductoMultimedia, deleteProductoMultimedia } from "@/app/api-endpoints/producto_multimedia";
import { postSubirImagen, postSubirFichero, borrarFichero } from "@/app/api-endpoints/ficheros";
import { getTiposUsoMultimedia } from "@/app/api-endpoints/tipo_uso_multimedia";
import { getProductoMultimediaTiposUso, postProductoMultimediaTipoUso, deleteProductoMultimediaTipoUso } from "@/app/api-endpoints/producto_multimedia_tipo_uso";
import { getUsuarioSesion, devuelveBasePath } from "@/app/utility/Utils";

/**
 * Muestra una imagen en miniatura (thumbnail). Al hacer clic, abre VisualizadorDeImagen
 * con la versión grande (1250x850). No pre-carga la imagen grande.
 */
const ImagenConVisualizador = ({ urlThumbnail, urlGrande, alt }) => {
    const [visible, setVisible] = React.useState(false);
    const fallbackSrc = `/multimedia/Sistema/200x200_imagen-no-disponible.jpeg`;

    return (
        <>
            <img
                src={urlThumbnail}
                alt={alt}
                width="120"
                height="120"
                style={{ objectFit: 'cover', cursor: 'zoom-in', borderRadius: '6px', boxShadow: '0 1px 4px rgba(0,0,0,.25)' }}
                onClick={() => setVisible(true)}
                onError={(e) => { e.target.src = `${devuelveBasePath()}${fallbackSrc}`; }}
            />
            <VisualizadorDeImagen
                visible={visible}
                onHide={() => setVisible(false)}
                imageUrl={urlGrande}
                altText={alt}
            />
        </>
    );
};

const ProductoMultimedia = ({ idProducto, tipoProductoId, estoyEditandoProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [multimediaDefinidos, setMultimediaDefinidos] = useState([]);
    const [valoresMultimedia, setValoresMultimedia] = useState({});
    const [tiposUso, setTiposUso] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [subiendo, setSubiendo] = useState({});
    const [dialogoTipoUso, setDialogoTipoUso] = useState(false);
    const [dialogoEliminar, setDialogoEliminar] = useState({ visible: false, multimediaDetalleId: null, nombreArchivo: '' });
    const [erroresValidacion, setErroresValidacion] = useState(new Set());

    /**
     * Devuelve el icono PrimeIcons correspondiente al tipo de multimedia.
     */
    const obtenerIconoMultimedia = (tipo) => {
        switch (tipo?.toLowerCase()) {
            case 'imagen': return 'pi pi-image';
            case 'video': return 'pi pi-video';
            case 'audio': return 'pi pi-volume-up';
            case 'documento': return 'pi pi-file';
            default: return 'pi pi-image';
        }
    };

    /**
     * Resuelve la URL de un archivo multimedia para mostrar en el navegador.
     * Las URLs blob (previsualización local) y absolutas se devuelven tal cual.
     * Las rutas relativas del servidor se prefijan con el basePath del backend.
     */
    const resolverUrlMultimedia = (url) => {
        if (!url) return null;
        if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) return url;
        return devuelveBasePath() + url;
    };

    /**
     * Función reutilizable para cargar los valores de producto_multimedia desde BD
     * y sus tipos de uso asociados. Devuelve un mapa indexado por multimediaId.
     */
    const cargarValoresDesdeDB = async () => {
        const filtroProductoMultimedia = JSON.stringify({
            where: { and: { productoId: idProducto } },
            order: 'ordenEnGrupo ASC'
        });
        const registros = await getProductosMultimedia(filtroProductoMultimedia);

        // Cargar tipos de uso asignados para cada producto_multimedia
        const ids = registros.map(r => r.id).filter(Boolean);
        let tiposUsoPorRegistro = {};
        if (ids.length > 0) {
            const filtroTiposUso = JSON.stringify({
                where: { and: { productoMultimediaId: { inq: ids } } }
            });
            const tiposUsoAsignados = await getProductoMultimediaTiposUso(filtroTiposUso);
            tiposUsoAsignados.forEach(tu => {
                if (!tiposUsoPorRegistro[tu.productoMultimediaId]) {
                    tiposUsoPorRegistro[tu.productoMultimediaId] = [];
                }
                tiposUsoPorRegistro[tu.productoMultimediaId].push(tu.tipoUsoMultimediaId);
            });
        }

        const mapa = {};
        registros.forEach(registro => {
            mapa[registro.multimediaId] = {
                id: registro.id,
                archivo: registro.multimediaNombre,
                url: registro.multimediaUrl,
                tipoUsoMultimediaIds: tiposUsoPorRegistro[registro.id] || []
            };
        });
        return mapa;
    };

    // Carga inicial de datos
    useEffect(() => {
        const cargarDatos = async () => {
            if (!idProducto || !tipoProductoId) {
                setCargando(false);
                return;
            }

            try {
                // Cargar tipos de uso multimedia (catálogo)
                const tiposUsoData = await getTiposUsoMultimedia();
                setTiposUso(tiposUsoData.map(tipo => ({ label: tipo.nombre, value: tipo.id })));
                
                // Cargar multimedia definidos para este tipo de producto (plantilla)
                const filtroTipoProducto = JSON.stringify({
                    where: { and: { tipoProductoId: tipoProductoId } },
                    order: 'orden ASC'
                });
                const multimediaPlantilla = await getTipoProductoMultimediaDetalles(filtroTipoProducto);
                setMultimediaDefinidos(multimediaPlantilla);
                
                // Cargar valores existentes del producto
                const mapa = await cargarValoresDesdeDB();
                setValoresMultimedia(mapa);
                
            } catch (error) {
                console.error('Error cargando datos:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: intl.formatMessage({ id: 'Error al cargar los datos' }),
                    life: 3000,
                });
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [idProducto, tipoProductoId]);

    // Limpiar URLs blob al desmontar el componente
    useEffect(() => {
        return () => {
            Object.values(valoresMultimedia).forEach(valor => {
                if (valor.url && valor.url.startsWith('blob:')) {
                    URL.revokeObjectURL(valor.url);
                }
            });
        };
    }, []);

    const actualizarValorMultimedia = (multimediaId, campo, valor) => {
        setValoresMultimedia(prev => ({
            ...prev,
            [multimediaId]: {
                ...prev[multimediaId],
                [campo]: valor
            }
        }));
    };

    /**
     * Extensiones permitidas por cada tipo de multimedia.
     */
    const extensionesPorTipo = {
        imagen: /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i,
        video: /\.(mp4|webm|ogg|avi|mov|mkv|flv|wmv)$/i,
        audio: /\.(mp3|wav|ogg|flac|m4a|aac|wma)$/i,
        documento: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar)$/i
    };

    /**
     * Devuelve el atributo accept del FileUpload según el tipo de multimedia.
     */
    const obtenerLosTiposAceptadosPorTipo = (tipo) => {
        switch (tipo?.toLowerCase()) {
            case 'imagen': return 'image/*';
            case 'video': return 'video/*';
            case 'audio': return 'audio/*';
            case 'documento': return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar';
            default: return 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar';
        }
    };

    /**
     * Cuando el usuario selecciona un archivo:
     * 1. Valido que el archivo coincida con el tipo de multimedia definido
     * 2. Verifico que la multimedia tenga al menos un TIPO DE USO asignado
     * 3. Subo el archivo al servidor (postSubirImagen para imágenes, postSubirFichero para el resto)
     * 4. Creo o actualizo el registro en la tabla producto_multimedia inmediatamente
     */
    const seleccionarArchivo = async (multimediaDetalle, archivo) => {
        const valorActual = valoresMultimedia[multimediaDetalle.id] || {};
        const tipoMultimedia = multimediaDetalle.tipo?.toLowerCase();

        // Validar que el archivo coincida con el tipo de multimedia
        if (tipoMultimedia && extensionesPorTipo[tipoMultimedia]) {
            if (!archivo.name.match(extensionesPorTipo[tipoMultimedia])) {
                const tiposLegibles = { imagen: 'imagen', video: 'vídeo', audio: 'audio', documento: 'documento' };
                toast.current?.show({
                    severity: 'error',
                    summary: intl.formatMessage({ id: 'Tipo de archivo incorrecto' }),
                    detail: intl.formatMessage(
                        { id: 'El archivo seleccionado no es compatible con el tipo de multimedia' }) +
                        ` "${tiposLegibles[tipoMultimedia] || tipoMultimedia}". ` +
                        intl.formatMessage({ id: 'Por favor seleccione un archivo del tipo correcto.' }),
                    life: 5000,
                });
                return;
            }
        }

        const tienetiposUso = valorActual.tipoUsoMultimediaIds && valorActual.tipoUsoMultimediaIds.length > 0;

        if (!tienetiposUso) {
            setDialogoTipoUso(true);
            return;
        }

        setSubiendo(prev => ({ ...prev, [multimediaDetalle.id]: true }));

        // Previsualización local inmediata
        const urlLocal = URL.createObjectURL(archivo);
        actualizarValorMultimedia(multimediaDetalle.id, 'archivo', archivo.name);
        actualizarValorMultimedia(multimediaDetalle.id, 'url', urlLocal);
        actualizarValorMultimedia(multimediaDetalle.id, 'pendienteSubir', true);

        try {
            // 1. Subir archivo al servidor: imágenes con postSubirImagen, el resto con postSubirFichero
            const carpeta = `producto/${idProducto}/multimedia`;
            const esImagen = tipoMultimedia === 'imagen' || (!tipoMultimedia && archivo.type?.startsWith('image/'));
            const respuestaSubida = esImagen
                ? await postSubirImagen(carpeta, archivo.name, archivo)
                : await postSubirFichero(carpeta, archivo.name, archivo);

            // Limpiar URL blob
            URL.revokeObjectURL(urlLocal);

            const urlServidor = respuestaSubida.originalUrl;
            const nombreArchivo = archivo.name;

            // 2. Crear o actualizar el registro en producto_multimedia
            const usuario = getUsuarioSesion();
            const datosGuardar = {
                productoId: idProducto,
                multimediaId: parseInt(multimediaDetalle.id),
                multimediaUrl: urlServidor,
                multimediaNombre: nombreArchivo,
                usuarioModificacion: usuario.id
            };

            let productoMultimediaId;
            if (valorActual.id) {
                // Actualizar registro existente
                await patchProductoMultimedia(valorActual.id, datosGuardar);
                productoMultimediaId = valorActual.id;
            } else {
                // Crear nuevo registro
                datosGuardar.usuarioCreacion = usuario.id;
                const nuevoRegistro = await postProductoMultimedia(datosGuardar);
                productoMultimediaId = nuevoRegistro.id;
            }

            // 3. Actualizar estado local con los datos guardados
            setValoresMultimedia(prev => ({
                ...prev,
                [multimediaDetalle.id]: {
                    ...prev[multimediaDetalle.id],
                    id: productoMultimediaId,
                    archivo: nombreArchivo,
                    url: urlServidor,
                    pendienteSubir: false
                }
            }));

            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Éxito' }),
                detail: intl.formatMessage({ id: 'Archivo subido y guardado correctamente' }),
                life: 3000,
            });

        } catch (error) {
            console.error('Error subiendo/guardando archivo:', error);
            // Limpiar previsualización en caso de error
            URL.revokeObjectURL(urlLocal);
            actualizarValorMultimedia(multimediaDetalle.id, 'url', valorActual.url || null);
            actualizarValorMultimedia(multimediaDetalle.id, 'archivo', valorActual.archivo || null);
            actualizarValorMultimedia(multimediaDetalle.id, 'pendienteSubir', false);
            
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: intl.formatMessage({ id: 'Error al subir el archivo' }),
                life: 3000,
            });
        } finally {
            setSubiendo(prev => ({ ...prev, [multimediaDetalle.id]: false }));
        }
    };

    /**
     * Elimina los ficheros del servidor.
     * El backend ya se encarga de eliminar todas las versiones (original + redimensionadas)
     * automáticamente al recibir cualquier URL del archivo, buscando por nombre base.
     */
    const eliminarFicherosDelServidor = async (url) => {
        if (!url || url.startsWith('blob:')) return;

        try {
            await borrarFichero(url);
        } catch (error) {
            console.warn('Error eliminando ficheros del servidor:', error);
        }
    };

    /**
     * Elimina un registro de producto_multimedia y sus tipos de uso asociados.
     * Primero elimina los ficheros del servidor, luego los registros hijos (FK) y finalmente el padre.
     */
    const eliminarMultimedia = async (multimediaDetalleId) => {
        const valorActual = valoresMultimedia[multimediaDetalleId];

        if (valorActual?.url && valorActual.url.startsWith('blob:')) {
            URL.revokeObjectURL(valorActual.url);
        }
        
        if (valorActual?.id) {
            try {
                // 1. Eliminar ficheros del servidor (original + web + thumbnail si es imagen)
                if (valorActual.url && !valorActual.url.startsWith('blob:')) {
                    await eliminarFicherosDelServidor(valorActual.url);
                }

                // 2. Eliminar tipos de uso asociados (FK constraint)
                const filtroTiposUso = JSON.stringify({
                    where: { and: { productoMultimediaId: valorActual.id } }
                });
                const tiposUsoExistentes = await getProductoMultimediaTiposUso(filtroTiposUso);
                if (tiposUsoExistentes.length > 0) {
                    await Promise.all(tiposUsoExistentes.map(tu => deleteProductoMultimediaTipoUso(tu.id)));
                }

                // 3. Eliminar el registro de producto_multimedia
                await deleteProductoMultimedia(valorActual.id);
                
                setValoresMultimedia(prev => {
                    const nuevos = { ...prev };
                    delete nuevos[multimediaDetalleId];
                    return nuevos;
                });
                
                toast.current?.show({
                    severity: 'success',
                    summary: intl.formatMessage({ id: 'Éxito' }),
                    detail: intl.formatMessage({ id: 'Multimedia eliminado correctamente' }),
                    life: 3000,
                });
            } catch (error) {
                console.error('Error eliminando multimedia:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: intl.formatMessage({ id: 'Error al eliminar el multimedia' }),
                    life: 3000,
                });
            }
        } else {
            // Si no tiene id en BD, solo limpiar del estado local
            setValoresMultimedia(prev => {
                const nuevos = { ...prev };
                delete nuevos[multimediaDetalleId];
                return nuevos;
            });
        }
    };

    /**
     * Maneja el cambio de tipos de uso en el MultiSelect.
     * Guarda los cambios inmediatamente en la tabla producto_multimedia_tipo_uso.
     * Si la multimedia aún no tiene registro en producto_multimedia, lo crea primero.
     */
    const manejarCambioTiposUso = async (multimediaDetalleId, nuevosIdsSeleccionados) => {
        const valorActual = valoresMultimedia[multimediaDetalleId] || {};

        // Actualizar estado local inmediatamente para que el UI refleje el cambio
        actualizarValorMultimedia(multimediaDetalleId, 'tipoUsoMultimediaIds', nuevosIdsSeleccionados);

        // Limpiar error de validación si ahora tiene al menos un tipo de uso
        if (nuevosIdsSeleccionados.length > 0 && erroresValidacion.has(parseInt(multimediaDetalleId))) {
            setErroresValidacion(prev => {
                const nuevos = new Set(prev);
                nuevos.delete(parseInt(multimediaDetalleId));
                return nuevos;
            });
        }

        try {
            const usuario = getUsuarioSesion();
            let productoMultimediaId = valorActual.id;

            // Si no existe registro en producto_multimedia, crearlo primero (sin archivo aún)
            if (!productoMultimediaId) {
                const nuevoRegistro = await postProductoMultimedia({
                    productoId: idProducto,
                    multimediaId: parseInt(multimediaDetalleId),
                    usuarioCreacion: usuario.id,
                    usuarioModificacion: usuario.id
                });
                productoMultimediaId = nuevoRegistro.id;

                // Actualizar el id en el estado local
                actualizarValorMultimedia(multimediaDetalleId, 'id', productoMultimediaId);
            }

            // Obtener tipos de uso actuales en BD
            const filtroExistentes = JSON.stringify({
                where: { and: { productoMultimediaId: productoMultimediaId } }
            });
            const tiposUsoEnBD = await getProductoMultimediaTiposUso(filtroExistentes);
            const idsEnBD = new Set(tiposUsoEnBD.map(tu => tu.tipoUsoMultimediaId));
            const idsNuevos = new Set(nuevosIdsSeleccionados);

            // Eliminar los que se desmarcaron
            const aEliminar = tiposUsoEnBD.filter(tu => !idsNuevos.has(tu.tipoUsoMultimediaId));
            if (aEliminar.length > 0) {
                await Promise.all(aEliminar.map(tu => deleteProductoMultimediaTipoUso(tu.id)));
            }

            // Crear los nuevos que se seleccionaron
            const aCrear = [...idsNuevos].filter(id => !idsEnBD.has(id));
            if (aCrear.length > 0) {
                await Promise.all(aCrear.map(tipoUsoId =>
                    postProductoMultimediaTipoUso({
                        productoMultimediaId: productoMultimediaId,
                        tipoUsoMultimediaId: tipoUsoId
                    })
                ));
            }

        } catch (error) {
            console.error('Error guardando tipos de uso:', error);
            // Revertir el cambio local en caso de error
            actualizarValorMultimedia(multimediaDetalleId, 'tipoUsoMultimediaIds', valorActual.tipoUsoMultimediaIds || []);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: intl.formatMessage({ id: 'Error al guardar los tipos de uso' }),
                life: 3000,
            });
        }
    };

    /**
     * Abro el diálogo de confirmación antes de eliminar un multimedia.
     */
    const confirmarEliminarMultimedia = (multimediaDetalleId) => {
        const valorActual = valoresMultimedia[multimediaDetalleId] || {};
        setDialogoEliminar({
            visible: true,
            multimediaDetalleId,
            nombreArchivo: valorActual.archivo || intl.formatMessage({ id: 'este archivo' })
        });
    };

    const ejecutarEliminarMultimedia = async () => {
        const { multimediaDetalleId } = dialogoEliminar;
        setDialogoEliminar({ visible: false, multimediaDetalleId: null, nombreArchivo: '' });
        if (multimediaDetalleId) {
            await eliminarMultimedia(multimediaDetalleId);
        }
    };

    /**
     * Valido que todas las multimedia que tienen archivo subido tengan al menos un tipo de uso.
     * Marco con borde rojo las que no lo cumplen y muestro un toast con la lista.
     * Retorna true si la validación pasa, false si hay errores.
     */
    const validarTiposUsoObligatorios = () => {
        const errores = new Set();
        const multimediasSinTipoUso = [];

        multimediaDefinidos.forEach(detalle => {
            const valor = valoresMultimedia[detalle.id];
            // Solo validar multimedia que ya tiene archivo subido
            if (valor && valor.archivo && valor.url) {
                const tieneTipoUso = valor.tipoUsoMultimediaIds && valor.tipoUsoMultimediaIds.length > 0;
                if (!tieneTipoUso) {
                    errores.add(detalle.id);
                    multimediasSinTipoUso.push(detalle.nombre);
                }
            }
        });

        setErroresValidacion(errores);

        if (multimediasSinTipoUso.length > 0) {
            const detalle = (
                <div>
                    <p className="m-0 mb-2">{intl.formatMessage({ id: 'Las siguientes multimedia necesitan al menos un tipo de uso:' })}</p>
                    <ul className="m-0 pl-3">
                        {multimediasSinTipoUso.map(nombre => <li key={nombre}>{nombre}</li>)}
                    </ul>
                </div>
            );
            toast.current?.show({
                severity: 'error',
                summary: intl.formatMessage({ id: 'Tipo de uso obligatorio' }),
                detail: detalle,
                life: 6000,
                sticky: false
            });
            return false;
        }
        return true;
    };

    /**
     * Renderizo la previsualización del archivo según su extensión.
     */
    const renderizarPrevisualizacion = (archivo, url) => {
        const urlResuelta = resolverUrlMultimedia(url);

        if (archivo.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
            const urlThumbnail = url.startsWith('blob:') ? url : resolverUrlMultimedia(getUrlImagenMiniatura(url));
            const urlGrande = url.startsWith('blob:') ? url : getUrlImagenGrande(url);
            return (
                <ImagenConVisualizador
                    urlThumbnail={urlThumbnail}
                    urlGrande={urlGrande}
                    alt={archivo}
                />
            );
        }
        if (archivo.match(/\.(mp4|webm|ogg|avi|mov)$/i)) {
            return (
                <div className="border-round overflow-hidden shadow-2">
                    <video width="120" height="90" controls style={{ objectFit: 'cover' }}>
                        <source src={urlResuelta} />
                    </video>
                </div>
            );
        }
        if (archivo.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) {
            return (
                <div className="flex align-items-center gap-2 p-2 border-1 border-round surface-border">
                    <i className="pi pi-volume-up text-xl text-blue-500"></i>
                    <audio controls style={{ width: '100%', height: '30px' }}>
                        <source src={urlResuelta} />
                    </audio>
                </div>
            );
        }
        if (archivo.match(/\.pdf$/i)) {
            return (
                <div className="flex align-items-center gap-2 p-2 border-1 border-round surface-border">
                    <i className="pi pi-file-pdf text-2xl text-red-500"></i>
                    <span className="text-sm font-medium">{intl.formatMessage({ id: 'Documento PDF' })}</span>
                </div>
            );
        }
        return (
            <div className="flex align-items-center gap-2 p-2 border-1 border-round surface-border">
                <i className="pi pi-file text-2xl text-gray-500"></i>
                <span className="text-sm font-medium">{archivo}</span>
            </div>
        );
    };

    /**
     * Renderizo el campo completo de una multimedia: título, tipo de uso + subida en la misma fila,
     * previsualización con acciones.
     */
    const renderizarCampoMultimedia = (multimediaDetalle) => {
        const valorActual = valoresMultimedia[multimediaDetalle.id] || {};
        const deshabilitado = !estoyEditandoProducto || guardando;
        const estaSubiendo = subiendo[multimediaDetalle.id];
        const tieneError = erroresValidacion.has(multimediaDetalle.id);

        return (
            <div className={`p-3 border-1 border-round h-full flex flex-column ${tieneError ? 'border-red-500 bg-red-50' : 'border-300'}`}>
                {/* Título de la multimedia */}
                <div className="mb-3 pb-2 border-bottom-1 border-200">
                    <span className="text-lg font-bold">
                        <i className={`${obtenerIconoMultimedia(multimediaDetalle.tipo)} mr-2 text-primary`}></i>
                        {multimediaDetalle.nombre}
                    </span>
                    {multimediaDetalle.obligatorioSn === 'S' && <span className="text-red-500 ml-1 text-lg">*</span>}
                    {multimediaDetalle.tamanoMaximoMb && (
                        <span className="text-xs text-500 ml-2">
                            ({intl.formatMessage({ id: 'Máx.' })} {multimediaDetalle.tamanoMaximoMb} MB)
                        </span>
                    )}
                    {multimediaDetalle.descripcion && (
                        <small className="text-gray-500 block mt-1">{multimediaDetalle.descripcion}</small>
                    )}
                </div>

                {/* Fila 1: Tipo de uso */}
                <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                        {intl.formatMessage({ id: 'Tipo de Uso' })}<span className="text-red-500">*</span>
                    </label>
                    <MultiSelect
                        value={valorActual.tipoUsoMultimediaIds || []}
                        options={tiposUso}
                        onChange={(e) => manejarCambioTiposUso(multimediaDetalle.id, e.value)}
                        placeholder={intl.formatMessage({ id: 'Seleccione' })}
                        disabled={deshabilitado}
                        className="w-full"
                        display="chip"
                    />
                </div>

                {/* Fila 2: Previsualización centrada */}
                {valorActual.url && valorActual.archivo && (
                    <div className="flex flex-column align-items-center gap-2 p-2 surface-50 border-round mb-3">
                        <div>
                            {renderizarPrevisualizacion(valorActual.archivo, valorActual.url)}
                        </div>
                        <span className="text-sm font-medium text-center text-overflow-ellipsis overflow-hidden white-space-nowrap w-full" title={valorActual.archivo}>
                            {valorActual.archivo}
                        </span>
                        {valorActual.pendienteSubir ? (
                            <span className="text-xs text-orange-500">
                                <i className="pi pi-spin pi-spinner mr-1"></i>
                                {intl.formatMessage({ id: 'Subiendo...' })}
                            </span>
                        ) : (
                            <div className="flex gap-2">
                                <a
                                    href={resolverUrlMultimedia(valorActual.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary text-xs no-underline hover:underline"
                                >
                                    <i className="pi pi-external-link mr-1"></i>
                                    {intl.formatMessage({ id: 'Ver archivo' })}
                                </a>
                                {estoyEditandoProducto && (
                                    <span className="text-xs text-400">|</span>
                                )}
                                {estoyEditandoProducto && (
                                    <button
                                        className="p-0 border-none bg-transparent text-red-500 text-xs cursor-pointer hover:underline"
                                        onClick={() => confirmarEliminarMultimedia(multimediaDetalle.id)}
                                        disabled={guardando}
                                    >
                                        <i className="pi pi-trash mr-1"></i>
                                        {intl.formatMessage({ id: 'Eliminar' })}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Fila 3: Botón de carga */}
                <div className="mt-auto">
                    <FileUpload
                        mode="basic"
                        accept={obtenerLosTiposAceptadosPorTipo(multimediaDetalle.tipo)}
                        maxFileSize={multimediaDetalle.tamanoMaximoMb ? multimediaDetalle.tamanoMaximoMb * 1024 * 1024 : 20000000}
                        onSelect={(e) => {
                            const file = e.files?.[0];
                            if (!file) {
                                const maxMb = multimediaDetalle.tamanoMaximoMb || 20;
                                toast.current?.show({
                                    severity: 'error',
                                    summary: intl.formatMessage({ id: 'Archivo demasiado grande' }),
                                    detail: `${intl.formatMessage({ id: 'El archivo supera el tamaño máximo permitido de' })} ${maxMb} MB.`,
                                    life: 5000,
                                });
                                return;
                            }
                            seleccionarArchivo(multimediaDetalle, file);
                        }}
                        disabled={deshabilitado || estaSubiendo}
                        auto={false}
                        chooseLabel={estaSubiendo ?
                            intl.formatMessage({ id: 'Subiendo...' }) :
                            intl.formatMessage({ id: 'Seleccionar archivo' })
                        }
                        className="w-full"
                    />
                </div>
            </div>
        );
    };

    /**
     * Botón "Guardar Multimedia": sincroniza todos los registros de producto_multimedia
     * que tengan archivo con sus datos actuales en BD (URL, nombre, tipos de uso).
     */
    const guardarMultimedia = async () => {
        // Validar que todas las multimedia con archivo tengan tipo de uso asignado antes de guardar
        if (!validarTiposUsoObligatorios()) return;

        setGuardando(true);
        const usuario = getUsuarioSesion();

        try {
            for (const [multimediaId, valores] of Object.entries(valoresMultimedia)) {
                const datosGuardar = {
                    productoId: idProducto,
                    multimediaId: parseInt(multimediaId),
                    multimediaUrl: valores.url || null,
                    multimediaNombre: valores.archivo || null,
                    usuarioModificacion: usuario.id
                };

                if (valores.id) {
                    await patchProductoMultimedia(valores.id, datosGuardar);
                } else {
                    datosGuardar.usuarioCreacion = usuario.id;
                    await postProductoMultimedia(datosGuardar);
                }
            }

            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Éxito' }),
                detail: intl.formatMessage({ id: 'Multimedia guardado correctamente' }),
                life: 3000,
            });

            // Recargar desde BD para tener IDs y datos actualizados
            const mapaRecargado = await cargarValoresDesdeDB();
            setValoresMultimedia(mapaRecargado);

        } catch (error) {
            console.error('Error guardando multimedia:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: intl.formatMessage({ id: 'Error al guardar el multimedia' }),
                life: 3000,
            });
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return <div className="text-center p-4">{intl.formatMessage({ id: 'Cargando multimedia' })}...</div>;
    }

    if (!idProducto) {
        return <div className="text-center p-4">{intl.formatMessage({ id: 'Seleccione un producto' })}</div>;
    }

    if (!multimediaDefinidos.length) {
        return (
            <div className="text-center p-4">
                {intl.formatMessage({ id: 'No hay tipos de multimedia definidos para este tipo de producto' })}
            </div>
        );
    }

    return (
        <div>
            <Toast ref={toast} />

            {/* Dialog: el usuario debe asignar al menos un tipo de uso antes de subir archivos */}
            <Dialog
                visible={dialogoTipoUso}
                onHide={() => setDialogoTipoUso(false)}
                header={intl.formatMessage({ id: 'Tipo de uso requerido' })}
                style={{ width: '28rem', maxWidth: '95vw' }}
                modal
                footer={
                    <Button
                        label={intl.formatMessage({ id: 'Entendido' })}
                        onClick={() => setDialogoTipoUso(false)}
                        autoFocus
                    />
                }
            >
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
                    <p style={{ margin: 0 }}>
                        {intl.formatMessage({ id: 'Debe asignar al menos un Tipo de uso a esta multimedia antes de subir un archivo.' })}
                    </p>
                </div>
            </Dialog>

            {/* Dialog: confirmación antes de eliminar un archivo multimedia */}
            <Dialog
                visible={dialogoEliminar.visible}
                onHide={() => setDialogoEliminar({ visible: false, multimediaDetalleId: null, nombreArchivo: '' })}
                header={intl.formatMessage({ id: 'Confirmar eliminación' })}
                style={{ width: '30rem', maxWidth: '95vw' }}
                modal
                footer={
                    <div className="flex gap-2 justify-content-end">
                        <Button
                            label={intl.formatMessage({ id: 'Cancelar' })}
                            className="p-button-secondary"
                            onClick={() => setDialogoEliminar({ visible: false, multimediaDetalleId: null, nombreArchivo: '' })}
                        />
                        <Button
                            label={intl.formatMessage({ id: 'Eliminar' })}
                            icon="pi pi-trash"
                            className="p-button-danger"
                            onClick={ejecutarEliminarMultimedia}
                        />
                    </div>
                }
            >
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-red-500"></i>
                    <div>
                        <p style={{ margin: 0 }}>
                            {intl.formatMessage({ id: '¿Está seguro de que desea eliminar el archivo' })} <strong>"{dialogoEliminar.nombreArchivo}"</strong>?
                        </p>
                        <p className="text-sm text-gray-500 mt-2" style={{ margin: 0 }}>
                            {intl.formatMessage({ id: 'Esta acción no se puede deshacer.' })}
                        </p>
                    </div>
                </div>
            </Dialog>

            <div className="formgrid grid">
                {multimediaDefinidos
                    .sort((a, b) => {
                        const ordenA = a.orden || 0;
                        const ordenB = b.orden || 0;
                        if (ordenA !== ordenB) return ordenA - ordenB;
                        return (a.nombre || '').localeCompare(b.nombre || '');
                    })
                    .map((multimediaDetalle) => (
                        <div key={multimediaDetalle.id} className="field col-12 md:col-6 lg:col-4">
                            {renderizarCampoMultimedia(multimediaDetalle)}
                        </div>
                    ))}
            </div>

            {/* {estoyEditandoProducto && (
                <div className="flex justify-content-end mt-4">
                    <Button
                        label={guardando ?
                            `${intl.formatMessage({ id: 'Guardando' })}...` :
                            intl.formatMessage({ id: 'Guardar Multimedia' })
                        }
                        icon={guardando ? "pi pi-spin pi-spinner" : "pi pi-save"}
                        onClick={guardarMultimedia}
                        disabled={guardando}
                        className="p-button-primary"
                    />
                </div>
            )} */}
        </div>
    );
};

export default ProductoMultimedia;