"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getProductoSeo, postProductoSeo, patchProductoSeo } from "@/app/api-endpoints/producto_seo";
import EditarDatosProductoSeo from "./EditarDatosProductoSeo";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarProductoSeo = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [productoSeo, setProductoSeo] = useState(emptyRegistro || {
        productoId: null,
        meta_titulo: "",
        meta_descripcion: "",
        meta_robots: "",
        slug: "",
        url_canoncia: "",
        og_titulo: "",
        og_descripcion: "",
        og_imagen_url: "",
        twitter_titulo: "",
        twitter_descripcion: "",
        twitter_imagen_url: "",
        palabras_clave: "",
        palabras_clave_dos: ""
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setProductoSeo(registro);
                setIsEdit(true);
            }
        };
        fetchData();
    }, [idEditar, rowData]);

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
                resultado = await patchProductoSeo(idEditar, productoSeoDataLimpio);
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

            setIdEditar(0);
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
        setIdEditar(0);
        setProductoSeo(emptyRegistro || {
            productoId: null,
            meta_titulo: "",
            meta_descripcion: "",
            meta_robots: "",
            slug: "",
            url_canoncia: "",
            og_titulo: "",
            og_descripcion: "",
            og_imagen_url: "",
            twitter_titulo: "",
            twitter_descripcion: "",
            twitter_imagen_url: "",
            palabras_clave: "",
            palabras_clave_dos: ""
        });
    };

    return (
        <div className="card p-fluid">
            <Toast ref={toast} />
            
            <EditarDatosProductoSeo
                productoSeo={productoSeo}
                setProductoSeo={setProductoSeo}
                estadoGuardando={estadoGuardando}
                editable={editable}
            />

            <div className="p-d-flex p-jc-between p-mt-4">
                <Button
                    type="button"
                    label={intl.formatMessage({ id: 'Cancelar' })}
                    className="p-button-secondary"
                    onClick={cancelarEdicion}
                    disabled={estadoGuardandoBoton}
                />
                <Button
                    type="button"
                    label={intl.formatMessage({ id: 'Guardar' })}
                    className="p-button-primary"
                    onClick={guardarProductoSeo}
                    loading={estadoGuardandoBoton}
                    disabled={estadoGuardandoBoton || !editable}
                />
            </div>
        </div>
    );
};

export default EditarProductoSeo;