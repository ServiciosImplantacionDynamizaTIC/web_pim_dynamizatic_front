"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { TabView, TabPanel } from 'primereact/tabview';
import { MultiSelect } from "primereact/multiselect";
import { postProducto, patchProducto } from "@/app/api-endpoints/producto";
import { editarArchivos, procesarArchivosNuevoRegistro, crearListaArchivosAntiguos } from "@/app/utility/FileUtils"
import { postSubirImagen } from "@/app/api-endpoints/ficheros";
import EditarDatosProducto from "./EditarDatosProducto";
import ProductoSeo from "../producto-seo/page";
import ProductoIcono from "../producto-icono/page";
import ProductoMarketplace from "../producto-marketplace/page";
import ProductoMultimedia from "../producto-multimedia/page";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';
import ProductoAtributo from "../producto-atributo/page";
import ProductoCamposDinamicos from "../producto-campos-dinamicos/page";
import { getGruposCampoDinamicos } from "@/app/api-endpoints/grupo_campo_dinamico";
import { getProductosGrupoCampoDinamico } from "@/app/api-endpoints/producto_grupo_campo_dinamico";

const EditarProducto = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    const productoActivoRef = useRef(idEditar ?? 0);
    
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
        marcaId: null,
        activoSn: "S"
    });
    const [idsGruposCamposDinamicosSeleccionados, setIdsGruposCamposDinamicosSeleccionados] = useState([]);
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [listaTipoArchivosAntiguos, setListaTipoArchivosAntiguos] = useState([]);
    const [guardarGruposFn, setGuardarGruposFn] = useState(null);
    const [guardarCamposFn, setGuardarCamposFn] = useState(null);
    const [opcionesGruposCamposDinamicos, setOpcionesGruposCamposDinamicos] = useState([]);
    const [cargandoGruposCamposDinamicos, setCargandoGruposCamposDinamicos] = useState(false);

    const obtenerIdsUnicos = (lista = []) =>
        Array.from(
            new Set(
                (lista || [])
                    .map((id) => Number(id))
                    .filter((id) => Number.isFinite(id) && id > 0)
            )
        );

    useEffect(() => {
        productoActivoRef.current = idEditar ?? 0;

        // Al cambiar de producto, limpiamos primero cualquier estado dependiente
        // para no arrastrar grupos o callbacks del producto anterior.
        setIdsGruposCamposDinamicosSeleccionados([]);
        setGuardarGruposFn(null);
        setGuardarCamposFn(null);

        if (idEditar && idEditar !== 0) {
            const registro = rowData.find((element) => element.id === idEditar);
            setProducto(registro);

            const _listaArchivosAntiguos = crearListaArchivosAntiguos(registro, listaTipoArchivos);
            setListaTipoArchivosAntiguos(_listaArchivosAntiguos);
            return;
        }

        setProducto(emptyRegistro || {
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
            marcaId: null,
            activoSn: "S"
        });
        setListaTipoArchivosAntiguos([]);
    }, [emptyRegistro, idEditar, listaTipoArchivos, rowData]);  

    useEffect(() => {
        let ignorarRespuesta = false;

        const cargarSelectorGruposCamposDinamicos = async () => {
            setCargandoGruposCamposDinamicos(true);
            setIdsGruposCamposDinamicosSeleccionados([]);

            try {
                const empresaId = getUsuarioSesion()?.empresaId;
                const grupos = await getGruposCampoDinamicos(
                    JSON.stringify({
                        where: {
                            and: {
                                ...(empresaId ? { empresaId } : {}),
                                activoSn: "S",
                            },
                        },
                        order: ["orden ASC", "nombre ASC"],
                    })
                );

                if (ignorarRespuesta) {
                    return;
                }

                setOpcionesGruposCamposDinamicos(
                    (grupos || [])
                        .map((grupo) => ({
                            label: grupo?.nombre || `${grupo?.id}`,
                            value: Number(grupo?.id || 0),
                        }))
                        .filter((opcion) => opcion.value > 0)
                );

                if (!idEditar || idEditar === 0) {
                    return;
                }

                const productoIdActual = Number(idEditar);
                const relaciones = await getProductosGrupoCampoDinamico(
                    JSON.stringify({
                        where: { and: { productoId: productoIdActual } },
                        order: ["id ASC"],
                    })
                );

                if (ignorarRespuesta || Number(idEditar) !== productoIdActual) {
                    return;
                }

                const ids = obtenerIdsUnicos(
                    (relaciones || []).map(
                        (registro) => registro?.grupoCampoDinamicoId ?? registro?.grupo_campo_dinamico_id
                    )
                );
                setIdsGruposCamposDinamicosSeleccionados(ids);
            } catch (error) {
                if (ignorarRespuesta) {
                    return;
                }
                console.error("Error cargando selector de grupos de campos dinamicos:", error);
                setOpcionesGruposCamposDinamicos([]);
                setIdsGruposCamposDinamicosSeleccionados([]);
            } finally {
                if (!ignorarRespuesta) {
                    setCargandoGruposCamposDinamicos(false);
                }
            }
        };

        cargarSelectorGruposCamposDinamicos();

        return () => {
            ignorarRespuesta = true;
        };
    }, [idEditar]);

    // Valida los campos obligatorios del formulario.
    const validaciones = async () => {
        const validaSku = producto.sku === undefined || producto.sku === "";
        const validaEan = producto.ean === undefined || producto.ean === "";
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
        
        return (!validaSku && !validaEan && !validaNombre && !validaCategoria && !validaEstado && !validaMarca && !validaTipoProducto);
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

    // Guarda la relacion entre el producto y los grupos seleccionados.
    const guardarGruposCampoDinamicoProducto = async (idProductoGuardar, usuarioActual) => {
        if (!guardarGruposFn) {
            return true;
        }
        const idsActuales = obtenerIdsUnicos(idsGruposCamposDinamicosSeleccionados);
        return guardarGruposFn(idProductoGuardar, usuarioActual, idsActuales);
    };

    // Guarda los valores de campos dinamicos del producto.
    const guardarCamposDinamicosProducto = async () => {
        if (!guardarCamposFn) {
            return true;
        }
        return guardarCamposFn();
    };

    const manejarCambioGruposCamposDinamicos = async (idsSeleccionados = []) => {
        const idsNormalizados = obtenerIdsUnicos(idsSeleccionados);
        const productoIdActual = Number(idEditar || 0);
        setIdsGruposCamposDinamicosSeleccionados(idsNormalizados);

        // Si el producto ya existe, persistimos al momento para que la pestaña
        // de campos dinamicos pueda cargar sin tener que guardar y reabrir.
        if (!productoIdActual) {
            return;
        }

        if (!guardarGruposFn) {
            return;
        }

        try {
            const usuarioActual = getUsuarioSesion()?.id;
            await guardarGruposFn(productoIdActual, usuarioActual, idsNormalizados);

            if (Number(productoActivoRef.current || 0) !== productoIdActual) {
                return;
            }

            // Fuerza refresco de la dependencia por referencia para recargar datos.
            setIdsGruposCamposDinamicosSeleccionados([...idsNormalizados]);
        } catch (error) {
            console.error("Error guardando grupos de campos dinamicos al vuelo:", error);
        }
    };

    // Crea o actualiza el producto y guarda datos relacionados.
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
                    await guardarGruposCampoDinamicoProducto(nuevoRegistro.id, usuarioActual);
                    
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
                    toast.current?.show({
                        severity: 'success',
                        summary: intl.formatMessage({ id: 'Producto creado' }),
                        detail: intl.formatMessage({ id: 'El producto se ha creado correctamente. Ahora puedes completar el resto de información.' }),
                        life: 5000,
                    });
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

                await guardarGruposCampoDinamicoProducto(objGuardar.id, usuarioActual);
                const guardadoCamposOk = await guardarCamposDinamicosProducto();
                if (!guardadoCamposOk) {
                    setEstadoGuardandoBoton(false);
                    setEstadoGuardando(false);
                    return;
                }

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
                            selectorGruposCampoDinamico={
                                <>
                                    <div className="flex flex-column field gap-2 mt-2 col-12">
                                        <label htmlFor="gruposCampoDinamico">
                                            <b>{intl.formatMessage({ id: "Grupos de campos dinamicos" })}</b>
                                        </label>
                                        <MultiSelect
                                            key={`multiselect-grupos-campos-dinamicos-${idEditar ?? 0}`}
                                            inputId="gruposCampoDinamico"
                                            value={obtenerIdsUnicos(idsGruposCamposDinamicosSeleccionados || [])}
                                            options={opcionesGruposCamposDinamicos}
                                            onChange={(e) => manejarCambioGruposCamposDinamicos(e.value || [])}
                                            optionLabel="label"
                                            optionValue="value"
                                            placeholder={intl.formatMessage({ id: "Seleccionar grupos" })}
                                            filter
                                            display="chip"
                                            className="w-full"
                                            style={{ width: "100%" }}
                                            panelStyle={{ minWidth: "36rem" }}
                                            disabled={estadoGuardando || cargandoGruposCamposDinamicos}
                                        />
                                    </div>
                                    <ProductoCamposDinamicos
                                        key={`selector-grupos-campos-dinamicos-${idEditar ?? 0}`}
                                        idProducto={idEditar}
                                        idsGruposSeleccionadosExternos={idsGruposCamposDinamicosSeleccionados}
                                        registrarGuardadoGrupos={true}
                                        mostrarCampos={false}
                                        onGuardarGruposListo={setGuardarGruposFn}
                                    />
                                </>
                            }
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
                                        tipoProductoId={producto?.tipoProductoId}
                                        estoyEditandoProducto={(idEditar && idEditar > 0) ? (editable ? true : false) : true} />
                                    </TabPanel>
                                    <TabPanel header={intl.formatMessage({ id: 'Multimedia del Producto' })}>
                                        <ProductoMultimedia
                                        idProducto={idEditar}
                                        tipoProductoId={producto?.tipoProductoId}
                                        estoyEditandoProducto={(idEditar && idEditar > 0) ? (editable ? true : false) : true} />
                                    </TabPanel>
                                    <TabPanel header={intl.formatMessage({ id: 'Campos dinámicos' })}>
                                        <ProductoCamposDinamicos
                                            key={`tab-campos-dinamicos-${idEditar ?? 0}`}
                                            idProducto={idEditar}
                                            idsGruposSeleccionadosExternos={idsGruposCamposDinamicosSeleccionados}
                                            registrarGuardadoGrupos={true}
                                            mostrarCampos={true}
                                            estoyEditandoProducto={(idEditar && idEditar > 0) ? (editable ? true : false) : true}
                                            onGuardarGruposListo={setGuardarGruposFn}
                                            onGuardarCamposListo={setGuardarCamposFn}
                                        />
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
