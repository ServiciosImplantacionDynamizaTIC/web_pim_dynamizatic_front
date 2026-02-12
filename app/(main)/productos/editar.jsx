"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { TabView, TabPanel } from 'primereact/tabview';
import { getProducto, postProducto, patchProducto } from "@/app/api-endpoints/producto";
import { editarArchivos, insertarArchivo, procesarArchivosNuevoRegistro, validarImagenes, crearListaArchivosAntiguos } from "@/app/utility/FileUtils"
import { postSubirImagen, borrarFichero } from "@/app/api-endpoints/ficheros";
import EditarDatosProducto from "./EditarDatosProducto";
import ProductoSeo from "../producto-seo/page";
import ProductoIcono from "../producto-icono/page";
import ProductoMarketplace from "../producto-marketplace/page";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';
import ProductoAtributo from "../producto-atributo/page";

const EditarProducto = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [producto, setProducto] = useState(emptyRegistro || {
        sku: "",
        ean: "",
        nombre: "",
        descripcionCorta: "",
        descripcionLarga: "",
        tituloSeo: "",
        palabrasClave: "",
        puntosClave: "",
        estadoId: null,
        finalizadoSn: "N",
        imagenPrincipal: "",
        ordenAtributos: "",
        dimensiones: "",
        color: "",
        peso: null,
        categoriaId: null,
        marcaId: null,
        activoSn: "S"
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [listaTipoArchivosAntiguos, setListaTipoArchivosAntiguos] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditar && idEditar !== 0) {
                const registro = rowData.find((element) => element.id === idEditar);
                setProducto(registro);
                
                const _listaArchivosAntiguos = crearListaArchivosAntiguos(registro, listaTipoArchivos);
                setListaTipoArchivosAntiguos(_listaArchivosAntiguos);
            }
        };
        fetchData();
    }, [idEditar, rowData]);  

    const validacionesImagenes = () => {
        return validarImagenes(producto, listaTipoArchivos);
    }

    const validaciones = async () => {
        const validaSku = producto.sku === undefined || producto.sku === "";
        const validaNombre = producto.nombre === undefined || producto.nombre === "";
        const validaCategoria = producto.categoriaId === undefined || producto.categoriaId === null || producto.categoriaId === "";
        const validaEstado = producto.estadoId === undefined || producto.estadoId === null || producto.estadoId === "";
        const validaMarca = producto.marcaId === undefined || producto.marcaId === null || producto.marcaId === "";
        const validaTipoProducto = producto.tipoProductoId === undefined || producto.tipoProductoId === null || producto.tipoProductoId.length === 0;
        /*const validaImagenes = validacionesImagenes();

        if (validaImagenes) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Las imagenes deben de tener el formato correcto' }),
                life: 3000,
            });
        }*/
        
        return (!validaSku && !validaNombre && !validaCategoria && !validaEstado && !validaMarca && !validaTipoProducto);
    };

    const procesarImagenPrincipal = async (productoId) => {
        // Si hay un archivo de imagen seleccionado, subirlo al servidor
        if (producto.imagenPrincipalFile) {
            try {
                const carpeta = `producto/${productoId}`;
                const response = await postSubirImagen(carpeta, producto.imagenPrincipalFile.name, producto.imagenPrincipalFile);
                return response.originalUrl;
            } catch (error) {
                console.error('Error subiendo imagen principal:', error);
                return null;
            }
        }
        // Si no hay archivo nuevo pero hay una URL existente (editando), mantenerla
        return producto.imagenPrincipal && !producto.imagenPrincipal.startsWith('blob:') ? producto.imagenPrincipal : null;
    };

    const guardarProducto = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            let objGuardar = { ...producto };
            const usuarioActual = getUsuarioSesion()?.id;

            if (!idEditar || idEditar === 0) {

                objGuardar = {
                    empresaId: getUsuarioSesion()?.empresaId,
                    categoriaId: objGuardar.categoriaId,
                    marcaId: objGuardar.marcaId,
                    sku: objGuardar.sku,
                    ean: objGuardar.ean,
                    nombre: objGuardar.nombre,
                    descripcionCorta: objGuardar.descripcionCorta,
                    descripcionLarga: objGuardar.descripcionLarga,
                    puntosClave: objGuardar.puntosClave,
                    estadoId: objGuardar.estadoId,
                    finalizadoSn: objGuardar.finalizadoSn || 'N',
                    imagenPrincipal: '', // Se procesará después de crear el registro
                    activoSn: objGuardar.activoSn || 'S',
                    usuarioCreacion: usuarioActual,
                    tipoProductoId: objGuardar.tipoProductoId || []
                };
                
                const nuevoRegistro = await postProducto(objGuardar);

                if (nuevoRegistro?.id) {
                    // Procesar imagen principal después de crear el registro
                    const rutaImagen = await procesarImagenPrincipal(nuevoRegistro.id);
                    if (rutaImagen) {
                        await patchProducto(nuevoRegistro.id, { imagenPrincipal: rutaImagen });
                    }
                    
                    await procesarArchivosNuevoRegistro(producto, nuevoRegistro.id, listaTipoArchivos, seccion, usuarioActual);
                    
                    // Actualizar el producto con los datos del registro recién creado
                    const productoActualizado = { 
                        ...producto, 
                        id: nuevoRegistro.id,
                        imagenPrincipal: rutaImagen || producto.imagenPrincipal || ""
                    };
                    setProducto(productoActualizado);
                    
                    // Crear lista de archivos antiguos para el nuevo registro
                    const _listaArchivosAntiguos = crearListaArchivosAntiguos(productoActualizado, listaTipoArchivos);
                    setListaTipoArchivosAntiguos(_listaArchivosAntiguos);
                    
                    setRegistroResult("insertado");
                    setIdEditar(nuevoRegistro.id);
                } else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: intl.formatMessage({ id: 'Ha ocurrido un error creando el registro' }),
                        life: 3000,
                    });
                }
            } else {
                // Procesar imagen principal antes de actualizar
                const rutaImagen = await procesarImagenPrincipal(objGuardar.id);
                
                const productoAeditar = {
                    id: objGuardar.id,
                    categoriaId: objGuardar.categoriaId,
                    marcaId: objGuardar.marcaId,
                    sku: objGuardar.sku,
                    ean: objGuardar.ean,
                    nombre: objGuardar.nombre,
                    descripcionCorta: objGuardar.descripcionCorta,
                    descripcionLarga: objGuardar.descripcionLarga,
                    puntosClave: objGuardar.puntosClave,
                    estadoId: objGuardar.estadoId,
                    finalizadoSn: objGuardar.finalizadoSn || 'N',
                    imagenPrincipal: rutaImagen,
                    activoSn: objGuardar.activoSn || 'S',
                    usuarioModificacion: usuarioActual,
                    tipoProductoId: objGuardar.tipoProductoId || []
                };
                
                await patchProducto(objGuardar.id, productoAeditar);
                await editarArchivos(producto, objGuardar.id, listaTipoArchivos, listaTipoArchivosAntiguos, seccion, usuarioActual);
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

    const header = (idEditar && idEditar > 0) ? (editable ? intl.formatMessage({ id: 'Editar' }) : intl.formatMessage({ id: 'Ver' })) : intl.formatMessage({ id: 'Nuevo' });

    return (
        <div>
            <div className="grid Producto">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Producto' })).toLowerCase()}</h2>
                        <EditarDatosProducto
                            producto={producto}
                            setProducto={setProducto}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                            estoyEditandoProducto={(idEditar && idEditar > 0) ? (editable ? true : false) : true}
                        />
                        
                        {(idEditar != null && idEditar !== 0) && (
                            <div className="mt-4">
                                <TabView scrollable>
                                    <TabPanel header={intl.formatMessage({ id: 'SEO del Producto' })}>
                                        <ProductoSeo
                                        idProducto={idEditar}
                                        estoyEditandoProducto={(idEditar && idEditar > 0) ? (editable ? true : false) : true} />
                                    </TabPanel>
                                    <TabPanel header={intl.formatMessage({ id: 'Iconos del Producto' })}>
                                        <ProductoIcono
                                        idProducto={idEditar}
                                        estoyEditandoProducto={(idEditar && idEditar > 0) ? (editable ? true : false) : true} />
                                    </TabPanel>
                                    <TabPanel header={intl.formatMessage({ id: 'Marketplaces del Producto' })}>
                                        <ProductoMarketplace
                                        idProducto={idEditar}
                                        estoyEditandoProducto={(idEditar && idEditar > 0) ? (editable ? true : false) : true} />
                                    </TabPanel>
                                    <TabPanel header={intl.formatMessage({ id: 'Atributos del Producto' })}>
                                        <ProductoAtributo
                                        idProducto={idEditar}
                                        estoyEditandoProducto={(idEditar && idEditar > 0) ? (editable ? true : false) : true} />
                                    </TabPanel>
                                </TabView>
                            </div>
                        )}
                       
                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarProducto}
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

export default EditarProducto;