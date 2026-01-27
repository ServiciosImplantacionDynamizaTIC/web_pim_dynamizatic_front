"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getProductoSeo, postProductoSeo, patchProductoSeo } from "@/app/api-endpoints/producto_seo";
import EditarDatosProductoSeo from "./EditarDatosProductoSeo";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarProductoSeo = ({ idEditar: idEditarSeo, setIdEditar: setIdEditarSeo, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable, idProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [productoSeo, setProductoSeo] = useState(emptyRegistro || {
        productoId: null,
        metaTitulo: "",
        metaDescripcion: "",
        metaRobots: "",
        slug: "",
        urlCanonica: "",
        ogTitulo: "",
        ogDescripcion: "",
        ogImagenUrl: "",
        twitterTitulo: "",
        twitterDescripcion: "",
        twitterImagenUrl: "",
        palabrasClave: "",
        palabrasClaveDos: ""
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditarSeo !== 0) {
                const registro = rowData.find((element) => element.id === idEditarSeo);
                setProductoSeo(registro);
                setIsEdit(true);
            }
        };
        fetchData();
    }, [idEditarSeo, rowData]);

    const guardarProductoSeo = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        try {
            const usuarioSesion = getUsuarioSesion();
            
            const productoSeoData = {
                ...productoSeo,
                ...(isEdit 
                    ? { usuarioModificacion: usuarioSesion.id } 
                    : { usuarioCreacion: usuarioSesion.id })
            };
            //
            // Limpiamos los campos nulos, undefined y vacíos
            //
            const productoSeoDataLimpio = Object.fromEntries(
                Object.entries(productoSeoData).filter(([key, value]) => 
                    value !== null && value !== undefined && value !== ""
                )
            );

            let resultado;
            if (isEdit) {
                resultado = await patchProductoSeo(idEditarSeo, productoSeoDataLimpio);
            } else {
                resultado = await postProductoSeo(productoSeoDataLimpio);
            }

            setRegistroResult(resultado);
            
            toast.current.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Éxito' }),
                detail: intl.formatMessage({ 
                    id: isEdit ? 'Registro actualizado correctamente' : 'Registro creado correctamente' 
                }),
                life: 3000
            });

            setIdEditarSeo(null);  // null para volver al CRUD
            setIsEdit(false);
        } catch (error) {
            console.error('Error al guardar:', error);
            toast.current.show({
                severity: 'error',
                summary: intl.formatMessage({ id: 'Error' }),
                detail: intl.formatMessage({ id: 'Error al guardar el registro' }),
                life: 3000
            });
        } finally {
            setEstadoGuardando(false);
            setEstadoGuardandoBoton(false);
        }
    };

    const cancelarEdicion = () => {
        setIdEditarSeo(null);  // null para volver al CRUD
        setIsEdit(false);
        // Usar el emptyRegistro si está disponible, o crear uno nuevo manteniendo el idProducto
        const registroReset = emptyRegistro || {
            productoId: idProducto || null,
            metaTitulo: "",
            metaDescripcion: "",
            metaRobots: "",
            slug: "",
            urlCanonica: "",
            ogTitulo: "",
            ogDescripcion: "",
            ogImagenUrl: "",
            twitterTitulo: "",
            twitterDescripcion: "",
            twitterImagenUrl: "",
            palabrasClave: "",
            palabrasClaveDos: ""
        };
        setProductoSeo(registroReset);
    };

    return (
        <div>
            <div className="grid ProductoSeo">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} />
                        
                        <EditarDatosProductoSeo
                            productoSeo={productoSeo}
                            setProductoSeo={setProductoSeo}
                            estadoGuardando={estadoGuardando}
                            editable={editable}
                            idProducto={idProducto}
                        />

                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={intl.formatMessage({ id: 'Guardar' })}
                                    className="mr-2"
                                    onClick={guardarProductoSeo}
                                    loading={estadoGuardandoBoton}
                                    disabled={estadoGuardandoBoton || !editable}
                                />
                            )}
                            <Button label={intl.formatMessage({ id: 'Cancelar' })} onClick={cancelarEdicion} className="p-button-secondary" />
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditarProductoSeo;