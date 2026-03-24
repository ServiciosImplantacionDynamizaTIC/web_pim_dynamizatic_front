"use client";
import React, { useState, useEffect, useRef } from "react";
import { useIntl } from 'react-intl';
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { FileUpload } from "primereact/fileupload";
import { Image } from "primereact/image";
import { Dropdown } from "primereact/dropdown";
import { getTipoProductoMultimediaDetalles } from "@/app/api-endpoints/tipo_producto_multimedia_detalle";
import { getProductosMultimedia, postProductoMultimedia, patchProductoMultimedia, deleteProductoMultimedia } from "@/app/api-endpoints/producto_multimedia";
import { postSubirImagen } from "@/app/api-endpoints/ficheros";
import { getTiposUsoMultimedia } from "@/app/api-endpoints/tipo_uso_multimedia";
import { getUsuarioSesion } from "@/app/utility/Utils";

const ProductoMultimedia = ({ idProducto, tipoProductoId, estoyEditandoProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [multimediaDefinidos, setMultimediaDefinidos] = useState([]);
    const [valoresMultimedia, setValoresMultimedia] = useState({});
    const [tiposUso, setTiposUso] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [subiendo, setSubiendo] = useState({});

    useEffect(() => {
        const cargarDatos = async () => {
            if (!idProducto || !tipoProductoId) {
                setCargando(false);
                return;
            }

            try {
                // Cargamos los tipos de uso multimedia
                const tiposUsoData = await getTiposUsoMultimedia();
                const tiposUsoFormateados = tiposUsoData.map(tipo => ({
                    label: tipo.nombre,
                    value: tipo.id
                }));
                setTiposUso(tiposUsoFormateados);
                
                // Obtenemos los tipos de multimedia definidos para el tipo de producto
                const filtroTipoProducto = JSON.stringify({
                    where: { and: { tipoProductoId: tipoProductoId }},
                    order: 'orden ASC'
                });
                const multimediaOrdenados = await getTipoProductoMultimediaDetalles(filtroTipoProducto);
                
                setMultimediaDefinidos(multimediaOrdenados);
                
                // Obtenemos los multimedia actuales del producto
                const filtroProductoMultimedia = JSON.stringify({
                    where: { and: { productoId: idProducto }},
                    order: 'ordenEnGrupo ASC'
                });
                const valoresData = await getProductosMultimedia(filtroProductoMultimedia);
                
                // Creamos un objeto con los valores indexados por multimediaId
                const valoresMap = {};
                valoresData.forEach(valor => {
                    valoresMap[valor.multimediaId] = {
                        id: valor.id,
                        archivo: valor.multimediaNombre,
                        url: valor.multimediaUrl,
                        tipoUsoMultimediaId: valor.tipoUsoMultimediaId,
                        ordenEnGrupo: valor.ordenEnGrupo || 0
                    };
                });
                
                setValoresMultimedia(valoresMap);
                
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

    // Limpiar URLs de objeto al desmontar el componente
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

    const seleccionarArchivo = (multimediaDetalle, archivo) => {
        // Crear URL local para previsualización inmediata
        const urlLocal = URL.createObjectURL(archivo);
        
        // Actualizar el estado con la información del archivo seleccionado
        actualizarValorMultimedia(multimediaDetalle.id, 'archivo', archivo.name);
        actualizarValorMultimedia(multimediaDetalle.id, 'url', urlLocal);
        actualizarValorMultimedia(multimediaDetalle.id, 'archivoLocal', archivo);
        actualizarValorMultimedia(multimediaDetalle.id, 'pendienteSubir', true);
        
        // Subir automáticamente el archivo
        subirArchivo(multimediaDetalle, archivo);
    };

    const subirArchivo = async (multimediaDetalle, archivo) => {
        setSubiendo(prev => ({ ...prev, [multimediaDetalle.id]: true }));
        
        try {
            const carpeta = `producto/${idProducto}/multimedia`;
            const response = await postSubirImagen(carpeta, archivo.name, archivo);
            
            // Limpiar la URL local y actualizar con la URL del servidor
            const valorActual = valoresMultimedia[multimediaDetalle.id];
            if (valorActual?.url && valorActual.url.startsWith('blob:')) {
                URL.revokeObjectURL(valorActual.url);
            }
            
            actualizarValorMultimedia(multimediaDetalle.id, 'archivo', archivo.name);
            actualizarValorMultimedia(multimediaDetalle.id, 'url', response.originalUrl);
            actualizarValorMultimedia(multimediaDetalle.id, 'archivoLocal', null);
            actualizarValorMultimedia(multimediaDetalle.id, 'pendienteSubir', false);
            
            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Éxito' }),
                detail: intl.formatMessage({ id: 'Archivo subido correctamente' }),
                life: 3000,
            });
            
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            // En caso de error, mantener la previsualización local
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

    const eliminarMultimedia = async (multimediaDetalleId) => {
        const valorActual = valoresMultimedia[multimediaDetalleId];
        
        // Limpiar URL local si existe
        if (valorActual?.url && valorActual.url.startsWith('blob:')) {
            URL.revokeObjectURL(valorActual.url);
        }
        
        if (valorActual?.id) {
            try {
                await deleteProductoMultimedia(valorActual.id);
                
                // Limpiar del estado
                const nuevosValores = { ...valoresMultimedia };
                delete nuevosValores[multimediaDetalleId];
                setValoresMultimedia(nuevosValores);
                
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
            // Si no tiene id, solo limpiar del estado
            const nuevosValores = { ...valoresMultimedia };
            delete nuevosValores[multimediaDetalleId];
            setValoresMultimedia(nuevosValores);
        }
    };

    const renderizarCampoMultimedia = (multimediaDetalle) => {
        const valorActual = valoresMultimedia[multimediaDetalle.id] || {};
        const deshabilitado = !estoyEditandoProducto || guardando;
        const estaSubiendo = subiendo[multimediaDetalle.id];

        return (
            <div className="flex flex-column gap-3">
                {/* Campo de subida de archivo */}
                <div>
                    <FileUpload
                        mode="basic"
                        accept="image/*,video/*,audio/*,.pdf"
                        maxFileSize={10000000} // 10MB
                        onSelect={(e) => seleccionarArchivo(multimediaDetalle, e.files[0])}
                        disabled={deshabilitado || estaSubiendo}
                        auto={false}
                        chooseLabel={estaSubiendo ? 
                            intl.formatMessage({ id: 'Subiendo...' }) : 
                            intl.formatMessage({ id: 'Seleccionar archivo' })
                        }
                        className="w-full"
                    />
                    {valorActual.pendienteSubir && (
                        <small className="text-orange-500 mt-1 block">
                            <i className="pi pi-clock mr-1"></i>
                            {intl.formatMessage({ id: 'Subiendo archivo...' })}
                        </small>
                    )}
                </div>

                {/* Previsualización del archivo */}
                {valorActual.url && (
                    <div className="flex align-items-center gap-2">
                        {valorActual.archivo && (
                            <>
                                {/* Previsualización de imágenes */}
                                {valorActual.archivo.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ? (
                                    <Image
                                        src={valorActual.url}
                                        alt={valorActual.archivo}
                                        width="100"
                                        height="100"
                                        preview
                                        className="border-round shadow-2"
                                    />
                                ) : valorActual.archivo.match(/\.(mp4|webm|ogg|avi|mov)$/i) ? (
                                    /* Previsualización de videos */
                                    <div className="border-round overflow-hidden shadow-2">
                                        <video 
                                            width="100" 
                                            height="100" 
                                            controls 
                                            style={{ objectFit: 'cover' }}
                                        >
                                            <source src={valorActual.url} />
                                            Tu navegador no soporta el elemento video.
                                        </video>
                                    </div>
                                ) : valorActual.archivo.match(/\.(mp3|wav|ogg|flac|m4a)$/i) ? (
                                    /* Previsualización de audio */
                                    <div className="flex align-items-center gap-2 p-3 border-1 border-round surface-border shadow-2" style={{minWidth: '100px'}}>
                                        <i className="pi pi-volume-up text-2xl text-blue-500"></i>
                                        <div>
                                            <div className="text-sm font-medium">{intl.formatMessage({ id: 'Audio' })}</div>
                                            <audio controls style={{width: '150px', height: '30px'}}>
                                                <source src={valorActual.url} />
                                                Tu navegador no soporta el elemento audio.
                                            </audio>
                                        </div>
                                    </div>
                                ) : valorActual.archivo.match(/\.pdf$/i) ? (
                                    /* Previsualización de PDF */
                                    <div className="flex align-items-center gap-2 p-3 border-1 border-round surface-border shadow-2">
                                        <i className="pi pi-file-pdf text-2xl text-red-500"></i>
                                        <span className="text-sm font-medium">{intl.formatMessage({ id: 'Documento PDF' })}</span>
                                    </div>
                                ) : (
                                    /* Otros archivos */
                                    <div className="flex align-items-center gap-2 p-3 border-1 border-round surface-border shadow-2">
                                        <i className="pi pi-file text-2xl text-gray-500"></i>
                                        <span className="text-sm font-medium">{valorActual.archivo}</span>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* Información y acciones */}
                        <div className="flex flex-column gap-1">
                            <span className="text-xs text-gray-600">{valorActual.archivo}</span>
                            {valorActual.pendienteSubir ? (
                                <span className="text-xs text-orange-500">
                                    <i className="pi pi-clock mr-1"></i>
                                    {intl.formatMessage({ id: 'Subiendo...' })}
                                </span>
                            ) : (
                                <a 
                                    href={valorActual.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 text-xs"
                                >
                                    <i className="pi pi-external-link mr-1"></i>
                                    {intl.formatMessage({ id: 'Ver archivo' })}
                                </a>
                            )}
                        </div>
                        
                        {estoyEditandoProducto && (
                            <Button
                                icon="pi pi-trash"
                                className="p-button-danger p-button-text p-button-sm"
                                onClick={() => eliminarMultimedia(multimediaDetalle.id)}
                                disabled={guardando}
                                tooltip={intl.formatMessage({ id: 'Eliminar' })}
                            />
                        )}
                    </div>
                )}

                {/* Tipo de uso */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        <b>{intl.formatMessage({ id: 'Tipo de Uso' })}*</b>
                    </label>
                    <Dropdown
                        value={valorActual.tipoUsoMultimediaId}
                        options={tiposUso}
                        onChange={(e) => actualizarValorMultimedia(multimediaDetalle.id, 'tipoUsoMultimediaId', e.value)}
                        placeholder={intl.formatMessage({ id: 'Seleccione el tipo de uso' })}
                        disabled={deshabilitado}
                        className="w-full"
                    />
                </div>

            </div>
        );
    };

    const validacionesGuardarMultimedia = (datosMultimedia) => {
        if (!datosMultimedia.tipoUsoMultimediaId) {
            toast.current?.show({
                severity: 'error',
                summary: intl.formatMessage({ id: 'Error' }),
                detail: intl.formatMessage({ id: 'El tipo de uso es obligatorio' }),
                life: 3000,
            });
            return false;
        }
        return true;
    }

    const guardarMultimedia = async () => {
        setGuardando(true);
        const usuario = getUsuarioSesion();

        try {
            const promesasGuardado = [];
            let esCorrecto = true;

            for (const [multimediaId, valores] of Object.entries(valoresMultimedia)) {
                //
                //Comprueba que la variable esCorrecto sea true ya que en el momento en el que un multimedia no cumpla las validaciones, se establecerá a false y se parará el proceso de guardado
                //
                if (esCorrecto) {
                    const datosMultimedia = {
                        productoId: idProducto,
                        multimediaId: parseInt(multimediaId),
                        tipoUsoMultimediaId: valores.tipoUsoMultimediaId,
                        ordenEnGrupo: valores.ordenEnGrupo || 0,
                        usuarioCreacion: usuario.id,
                        usuarioModificacion: usuario.id
                    };
                    //
                    //Lanzamos las validaciones, si encontramos algún error, se establecerá la variable esCorrecto a false y se parará el proceso de guardado
                    //
                    if(esCorrecto = validacionesGuardarMultimedia(datosMultimedia)){
                        if (valores.id) {
                            // Actualizar existente
                            promesasGuardado.push(patchProductoMultimedia(valores.id, datosMultimedia));
                        } else {
                            // Crear nuevo
                            promesasGuardado.push(postProductoMultimedia(datosMultimedia));
                        }
                    }
                }
            }
            //
            //Si todos los multimedia tratados cumplen las validaciones, guardamos los cambios
            //
            if (esCorrecto) {

                await Promise.all(promesasGuardado);

                toast.current?.show({
                    severity: 'success',
                    summary: intl.formatMessage({ id: 'Éxito' }),
                    detail: intl.formatMessage({ id: 'Multimedia guardado correctamente' }),
                    life: 3000,
                });

                // Recargar los datos
                /*const filtroProductoMultimedia = JSON.stringify({
                    where: { and: { productoId: idProducto }}
                });
                const valoresData = await getProductosMultimedia(filtroProductoMultimedia);
                const valoresMap = {};
                valoresData.forEach(valor => {
                    valoresMap[valor.multimediaId] = {
                        id: valor.id,
                        archivo: valor.multimediaNombre,
                        url: valor.multimediaUrl,
                        tipoUsoMultimediaId: valor.tipoUsoMultimediaId,
                        ordenEnGrupo: valor.ordenEnGrupo || 0
                    };
                });
                setValoresMultimedia(valoresMap);*/
            }

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
            <Card title={intl.formatMessage({ id: 'Multimedia del Producto' })}>
                <div className="text-center p-4">
                    {intl.formatMessage({ id: 'No hay tipos de multimedia definidos para este tipo de producto' })}
                </div>
            </Card>
        );
    }

    return (
        <div>
            <Toast ref={toast} />
            <Card title={intl.formatMessage({ id: 'Multimedia del Producto' })}>
                <div className="formgrid grid">
                    {multimediaDefinidos
                        .sort((a, b) => {
                            // Obtener el orden de cada multimedia
                            const ordenA = valoresMultimedia[a.id]?.ordenEnGrupo || 0;
                            const ordenB = valoresMultimedia[b.id]?.ordenEnGrupo || 0;
                            
                            // Ordenar por orden del multimedia, luego por nombre
                            if (ordenA !== ordenB) {
                                return ordenA - ordenB;
                            }
                            
                            const ordenMultimediaA = a.orden || 0;
                            const ordenMultimediaB = b.orden || 0;
                            if (ordenMultimediaA !== ordenMultimediaB) {
                                return ordenMultimediaA - ordenMultimediaB;
                            }
                            
                            const nombreA = a.nombre || '';
                            const nombreB = b.nombre || '';
                            return nombreA.localeCompare(nombreB);
                        })
                        .map((multimediaDetalle) => {
                        const valorActual = valoresMultimedia[multimediaDetalle.id] || {};
                                                
                        return (
                            <div key={multimediaDetalle.id} className="field col-12 md:col-6 lg:col-6">
                                <div className="flex align-items-center mb-2">
                                    <InputNumber
                                        id={`orden_${multimediaDetalle.id}`}
                                        value={valorActual.ordenEnGrupo || 0}
                                        onChange={(e) => actualizarValorMultimedia(multimediaDetalle.id, 'ordenEnGrupo', e.value || 0)}
                                        disabled={!estoyEditandoProducto || guardando}
                                        min={0}
                                        max={999}
                                        inputStyle={{ textAlign: 'right', width: '4rem' }}
                                        size="small"
                                        placeholder="000"
                                    />
                                    <label htmlFor={`multimedia_${multimediaDetalle.id}`} className="block font-medium ml-2">
                                        <b>{multimediaDetalle.nombre}</b>
                                        {multimediaDetalle.obligatorioSn === 'S' && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                </div>
                                <div className="mb-2">
                                    {renderizarCampoMultimedia(multimediaDetalle)}
                                </div>

                                {multimediaDetalle.descripcion && (
                                    <small className="text-gray-600 block mt-1">
                                       <b>{intl.formatMessage({ id: 'Descripción' })}:</b> {multimediaDetalle.descripcion}
                                    </small>
                                )}
                            </div>
                        );
                    })}
                </div>

                {estoyEditandoProducto && (
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
                )}
            </Card>
        </div>
    );
};

export default ProductoMultimedia;