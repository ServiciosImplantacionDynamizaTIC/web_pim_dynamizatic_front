"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getCategoria, postCategoria, patchCategoria, getCategorias } from "@/app/api-endpoints/categoria";
import { editarArchivos, insertarArchivo, procesarArchivosNuevoRegistro, validarImagenes, crearListaArchivosAntiguos } from "@/app/utility/FileUtils"
import EditarDatosCategoria from "./EditarDatosCategoria";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';

const EditarCategoria = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [categoria, setCategoria] = useState(emptyRegistro || {
        nombre: "",
        descripcion: "",
        categoriaPadreId: null,
        imagen: "",
        orden: 0,
        activoSn: "S"
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [listaTipoArchivosAntiguos, setListaTipoArchivosAntiguos] = useState([]);
    const [listaCategoriasPadre, setListaCategoriasPadre] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            // Cargar categorías padre disponibles (excluyendo la categoría actual si está editando)
            try {
                const filtro = JSON.stringify({ where: { and: { empresaId: getUsuarioSesion().empresaId } } });
                            
                const categorias = await getCategorias(filtro);
                const categoriasFiltradas = idEditar !== 0 
                    ? categorias.filter(cat => cat.id !== idEditar)
                    : categorias;
                setListaCategoriasPadre(categoriasFiltradas || []);
            } catch (error) {
                console.error('Error cargando categorías padre:', error);
                setListaCategoriasPadre([]);
            }

            if (idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setCategoria(registro);
                
                const _listaArchivosAntiguos = crearListaArchivosAntiguos(registro, listaTipoArchivos);
                setListaTipoArchivosAntiguos(_listaArchivosAntiguos);
            }
        };
        fetchData();
    }, [idEditar, rowData]);  

    const validacionesImagenes = () => {
        return validarImagenes(categoria, listaTipoArchivos);
    }

    const validaciones = async () => {
        const validaNombre = categoria.nombre === undefined || categoria.nombre === "";
        const validaImagenes = validacionesImagenes();

        if (validaImagenes) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Las imagenes deben de tener el formato correcto' }),
                life: 3000,
            });
        }
        
        return (!validaNombre);
    };

    const guardarCategoria = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            let objGuardar = { ...categoria };
            const usuarioActual = getUsuarioSesion()?.id;
            objGuardar['orden'] = objGuardar.orden || 0;

            if (idEditar === 0) {
                delete objGuardar.id;
                objGuardar['usuarioCreacion'] = usuarioActual;
                objGuardar['empresaId'] = getUsuarioSesion()?.empresaId;
                if (objGuardar.activoSn === '') {
                    objGuardar.activoSn = 'S';
                }
                
                const nuevoRegistro = await postCategoria(objGuardar);

                if (nuevoRegistro?.id) {
                    await procesarArchivosNuevoRegistro(categoria, nuevoRegistro.id, listaTipoArchivos, seccion, usuarioActual);
                    setRegistroResult("insertado");
                    setIdEditar(null);
                } else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: intl.formatMessage({ id: 'Ha ocurrido un error creando el registro' }),
                        life: 3000,
                    });
                }
            } else {
                const categoriaAeditar = {
                    id: objGuardar.id,
                    nombre: objGuardar.nombre,
                    descripcion: objGuardar.descripcion,
                    categoriaPadreId: objGuardar.categoriaPadreId,
                    imagen: objGuardar.imagen,
                    orden: objGuardar.orden || 0,
                    activoSn: objGuardar.activoSn || 'N',
                    usuarioModificacion: usuarioActual,
                };
                
                await patchCategoria(objGuardar.id, categoriaAeditar);
                await editarArchivos(categoria, objGuardar.id, listaTipoArchivos, listaTipoArchivosAntiguos, seccion, usuarioActual);
                setIdEditar(null);
                setRegistroResult("editado");
            }
        } else {
            let errorMessage = intl.formatMessage({ id: 'Todos los campos obligatorios deben ser rellenados' });
                        
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: errorMessage,
                life: 3000,
            });
        }
        setEstadoGuardandoBoton(false);
        setEstadoGuardando(false);
    };

    const cancelarEdicion = () => {
        setIdEditar(null);
    };

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: 'Editar' }) : intl.formatMessage({ id: 'Ver' })) : intl.formatMessage({ id: 'Nuevo' });

    return (
        <div>
            <div className="grid Categoria">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Categoría' })).toLowerCase()}</h2>
                        <EditarDatosCategoria
                            categoria={categoria}
                            setCategoria={setCategoria}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                            listaCategoriasPadre={listaCategoriasPadre}
                        />
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarCategoria}
                                    className="mr-2"
                                    disabled={estadoGuardandoBoton}
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

export default EditarCategoria;