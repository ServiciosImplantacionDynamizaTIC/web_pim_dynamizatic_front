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
                        orden: valor.orden
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

    const actualizarValorMultimedia = (multimediaId, campo, valor) => {
        setValoresMultimedia(prev => ({
            ...prev,
            [multimediaId]: {
                ...prev[multimediaId],
                [campo]: valor
            }
        }));
    };

    const subirArchivo = async (multimediaDetalle, archivo) => {
        setSubiendo(prev => ({ ...prev, [multimediaDetalle.id]: true }));
        
        try {
            const carpeta = `producto/${idProducto}/multimedia`;
            const response = await postSubirImagen(carpeta, archivo.name, archivo);
            
            actualizarValorMultimedia(multimediaDetalle.id, 'archivo', archivo.name);
            actualizarValorMultimedia(multimediaDetalle.id, 'url', response.originalUrl);
            
            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Éxito' }),
                detail: intl.formatMessage({ id: 'Archivo subido correctamente' }),
                life: 3000,
            });
            
        } catch (error) {
            console.error('Error subiendo archivo:', error);
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
                        onSelect={(e) => subirArchivo(multimediaDetalle, e.files[0])}
                        disabled={deshabilitado || estaSubiendo}
                        auto={true}
                        chooseLabel={estaSubiendo ? 
                            intl.formatMessage({ id: 'Subiendo...' }) : 
                            intl.formatMessage({ id: 'Seleccionar archivo' })
                        }
                        className="w-full"
                    />
                </div>

                {/* Previsualización del archivo */}
                {valorActual.url && (
                    <div className="flex align-items-center gap-2">
                        {valorActual.archivo && valorActual.archivo.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <Image
                                src={valorActual.url}
                                alt={valorActual.archivo}
                                width="100"
                                height="100"
                                preview
                                className="border-round"
                            />
                        ) : (
                            <div className="flex align-items-center gap-2 p-2 border-1 border-round surface-border">
                                <i className="pi pi-file text-2xl"></i>
                                <span className="text-sm">{valorActual.archivo}</span>
                            </div>
                        )}
                        <a 
                            href={valorActual.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 text-sm"
                        >
                            {intl.formatMessage({ id: 'Ver archivo' })}
                        </a>
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
                        {intl.formatMessage({ id: 'Tipo de Uso' })}
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

    const guardarMultimedia = async () => {
        setGuardando(true);
        const usuario = getUsuarioSesion();

        try {
            const promesasGuardado = [];

            for (const [multimediaId, valores] of Object.entries(valoresMultimedia)) {
                // Solo guardar si hay un archivo
                if (valores.url && valores.archivo) {
                    const datosMultimedia = {
                        productoId: idProducto,
                        multimediaId: parseInt(multimediaId),
                        tipoUsoMultimediaId: valores.tipoUsoMultimediaId,
                        orden: valores.orden || 0,
                        usuarioCreacion: usuario.id,
                        usuarioModificacion: usuario.id
                    };

                    if (valores.id) {
                        // Actualizar existente
                        promesasGuardado.push(patchProductoMultimedia(valores.id, datosMultimedia));
                    } else {
                        // Crear nuevo
                        promesasGuardado.push(postProductoMultimedia(datosMultimedia));
                    }
                }
            }

            await Promise.all(promesasGuardado);

            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Éxito' }),
                detail: intl.formatMessage({ id: 'Multimedia guardado correctamente' }),
                life: 3000,
            });

            // Recargar los datos
            const filtroProductoMultimedia = JSON.stringify({
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
                    orden: valor.orden
                };
            });
            setValoresMultimedia(valoresMap);

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
                            const ordenA = valoresMultimedia[a.id]?.orden || 0;
                            const ordenB = valoresMultimedia[b.id]?.orden || 0;
                            
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
                                        value={valorActual.orden || 0}
                                        onChange={(e) => actualizarValorMultimedia(multimediaDetalle.id, 'orden', e.value || 0)}
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