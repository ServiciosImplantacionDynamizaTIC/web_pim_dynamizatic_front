"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getIdiomas } from "@/app/api-endpoints/idioma";
import { postPlantillaEmail, patchPlantillaEmail } from "@/app/api-endpoints/plantilla_email";
import { esUrlImagen } from "@/app/components/shared/componentes";
import EditarDatosCorreoPlantilla from "./EditarDatosCorreoPlantilla";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { borrarFichero, postSubirImagen, postSubirFichero } from "@/app/api-endpoints/ficheros"
import { postArchivo, deleteArchivo } from "@/app/api-endpoints/archivo"
import { useIntl } from 'react-intl';

const EditarCorreoPlantilla = ({ 
    idEditar, 
    setIdEditar, 
    rowData, 
    emptyRegistro, 
    setRegistroResult, 
    listaTipoArchivos, 
    seccion, 
    editable 
}) => {
    const toast = useRef(null);
    const intl = useIntl();
    const [correoPlantilla, setCorreoPlantilla] = useState(emptyRegistro);
    const [listaIdiomas, setListaIdiomas] = useState([]);
    const [idiomaSeleccionado, setIdiomaSeleccionado] = useState(null);
    const [contenidoWysiwyg, setContenidoWysiwyg] = useState(null);
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [listaArchivosAntiguos, setListaArchivosAntiguos] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            // Obtenemos todos los idiomas
            const registrosIdiomas = await getIdiomas();
            const jsonIdiomas = registrosIdiomas.map(idioma => ({
                nombre: idioma.nombre,
                id: idioma.id,
                activoSn: idioma.activoSn
            })).sort((a, b) => a.nombre.localeCompare(b.nombre));

            //Quitamos los registros inactivos
            const jsonIdiomasActivos = jsonIdiomas.filter(registro => registro.activoSn === 'S');
            setListaIdiomas(jsonIdiomasActivos);
            
            // Si el idEditar es diferente de 0, entonces se va a editar o visualizar
            if (idEditar !== 0) {
                // Obtenemos el registro a editar por su ID
                const registro = rowData.find((element) => element.id === idEditar);
                setCorreoPlantilla(registro);
                // setContenidoWysiwyg(registro.cuerpo)
                 
                 // Como el campo es de tipo BLOB tenemos que Convertir el Buffer a string
                let cuerpoTexto = '';
                if (registro.cuerpo) {
                    if (registro.cuerpo.type === 'Buffer' && Array.isArray(registro.cuerpo.data)) {
                        // Intentar con diferentes codificaciones
                        try {
                            cuerpoTexto = new TextDecoder('utf-8').decode(new Uint8Array(registro.cuerpo.data));
                            if (cuerpoTexto.includes('�')) {
                                cuerpoTexto = new TextDecoder('iso-8859-1').decode(new Uint8Array(registro.cuerpo.data));
                            }
                        } catch (e) {
                            cuerpoTexto = new TextDecoder('iso-8859-1').decode(new Uint8Array(registro.cuerpo.data));
                        }
                    } else if (typeof registro.cuerpo === 'string') {
                        cuerpoTexto = registro.cuerpo;
                    } else {
                        cuerpoTexto = String(registro.cuerpo);
                    }
                }
                setContenidoWysiwyg(cuerpoTexto)

                // Obtenemos el nombre del idioma seleccionado
                const registroIdioma = registrosIdiomas.find((element) => element.id === registro.idiomaId).nombre;
                setIdiomaSeleccionado(registroIdioma);

                //Guardamos los archivos para luego poder compararlos
                const _listaArchivosAntiguos = {}
                for (const tipoArchivo of listaTipoArchivos) {
                    _listaArchivosAntiguos[tipoArchivo['nombre']] = registro[(tipoArchivo.nombre).toLowerCase()]
                }
                setListaArchivosAntiguos(_listaArchivosAntiguos)
            }
        };
        fetchData();
    }, [idEditar, rowData]);

    const validaciones = async () => {
        const vadlidaNombre = correoPlantilla.nombrePlantilla === undefined || correoPlantilla.nombrePlantilla === "";
        const validaIdioma = idiomaSeleccionado == null || idiomaSeleccionado === "";
        
        return (!vadlidaNombre && !validaIdioma)
    }

    const guardarPlantillaEmail = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            // Obtenemos el registro actual
            let objGuardar = { ...correoPlantilla };
            const usuarioActual = getUsuarioSesion()?.id;

            // Si estoy insertando uno nuevo
            if (idEditar === 0) {
                // Elimino y añado los campos que no se necesitan
                delete objGuardar.id;
                delete objGuardar.nombreIdioma;
                delete objGuardar.archivos;
                // Enviar el contenido como string (Axios lo enviará con UTF-8)
                objGuardar['cuerpo'] = contenidoWysiwyg || '';
                objGuardar['usuarioCreacion'] = usuarioActual;
                objGuardar['empresaId'] = Number(localStorage.getItem('empresa'));
                
                const registroSeleccionado = listaIdiomas.find(idioma => idioma.nombre === idiomaSeleccionado)
                if (registroSeleccionado) {
                    objGuardar['idiomaId'] = registroSeleccionado.id;
                }

                if (objGuardar.activoSn === '') {
                    objGuardar.activoSn = 'N';
                }

                try {
                    // Hacemos el insert del registro
                    const nuevoRegistro = await postPlantillaEmail(objGuardar);
                    
                    //Si se crea el registro mostramos el toast
                    if (nuevoRegistro?.id) {
                        //Sube las imagenes al servidor
                        if (correoPlantilla['archivos']) {
                            for (const archivo of correoPlantilla['archivos']) {
                                //Comprueba que el input haya sido modificado
                                if (archivo.type !== undefined) {
                                    await insertarArchivo(nuevoRegistro.id, archivo, seccion, usuarioActual)
                                }
                            }
                        }

                        //Usamos una variable que luego se cargara en el useEffect de la pagina principal para mostrar el toast
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
                } catch (error) {
                    if (error.status === 422) {
                        toast.current?.show({
                            severity: 'error',
                            summary: 'ERROR',
                            detail: intl.formatMessage({ id: 'No se pueden crear dos plantillas con el mismo nombre' }),
                            life: 3000,
                        });
                    }
                    else {
                        toast.current?.show({
                            severity: 'error',
                            summary: 'ERROR',
                            detail: intl.formatMessage({ id: 'Ha ocurrido un error creando el registro' }),
                            life: 3000,
                        });
                    }
                }

            } else {
                //Si se edita un registro existente Hacemos el patch del registro
                const registroSeleccionado = listaIdiomas.find(idioma => idioma.nombre === idiomaSeleccionado)
                if (registroSeleccionado) {
                    objGuardar['idiomaId'] = registroSeleccionado.id;
                }
                objGuardar['usuarioModificacion'] = getUsuarioSesion()?.id
                // Enviar el contenido como string (Axios lo enviará con UTF-8)
                objGuardar['cuerpo'] = contenidoWysiwyg || '';
                objGuardar['empresaId'] = Number(localStorage.getItem('empresa'));
                delete objGuardar.nombreIdioma;
                delete objGuardar.archivos;
                delete objGuardar.iso;
                
                if (objGuardar.activoSn === '') {
                    objGuardar.activoSn = 'N';
                }
                
                await patchPlantillaEmail(objGuardar.id, objGuardar);
                await editarArchivos(correoPlantilla, seccion)
                setIdEditar(null)
                setRegistroResult("editado");
            }
        }
        else {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Todos los campos deben de ser rellenados' }),
                life: 3000,
            });
        }
        setEstadoGuardandoBoton(false);
    };

    const cancelarEdicion = () => {
        setIdEditar(null)
    };

    //Compara los archivos del registro antes de ser editado para actualizar los archivos
    const editarArchivos = async (registro, seccion) => {
        for (const tipoArchivo of listaTipoArchivos) {
            if (listaArchivosAntiguos[tipoArchivo.nombre]) {
                //Recorre los archivos antiguos para eliminarlos en caso de que sea necesario
                for (const archivoAntiguo of listaArchivosAntiguos[tipoArchivo.nombre]) {
                    //Obtiene el nombre del archivo para compararlo
                    const archivoAntiguoNombre = archivoAntiguo.url.split('/').pop();
                    //Comprueba si el archivo antiguo existe en el registro
                    const archivoExisteEnRegistro = registro[(tipoArchivo.nombre).toLowerCase()].find(item => item.name === archivoAntiguoNombre || item.url === archivoAntiguo.url);

                    //Si es undefined, significa que no existe en el array de registro por lo que se ha eliminado
                    if (archivoExisteEnRegistro === undefined) {
                        await borrarFichero(archivoAntiguo.url);
                        await deleteArchivo(archivoAntiguo.id);
                        //Tambien borra la version sin redimensionar
                        //Funcion provisional porque no tengo manera de saber si x archivo de x tipo de input es imagen o no solo con el url
                        if (esUrlImagen(archivoAntiguo.url)) {
                            const url = (archivoAntiguo.url).replace(/(\/[^\/]+\/)1250x850_([^\/]+\.\w+)$/, '$1$2');
                            await borrarFichero(url);
                        }
                    }
                }
            }
            if (registro[(tipoArchivo.nombre).toLowerCase()]) {
                for (const archivoNuevo of registro[(tipoArchivo.nombre).toLowerCase()]) {
                    //Comprueba si el archivo antiguo existe en el registro
                    if (listaArchivosAntiguos[tipoArchivo.nombre]) {
                        const archivoExisteEnArchivosAntiguos = listaArchivosAntiguos[tipoArchivo.nombre].find(item => item.url.split('/').pop() === archivoNuevo.name || item.url === archivoNuevo.url);
                        //Si es undefined, significa que no existe en el array de los archivos antiguos por lo que se ha insertado
                        if (archivoExisteEnArchivosAntiguos === undefined) {
                            await insertarArchivo(registro.id, archivoNuevo, seccion, getUsuarioSesion()?.id);
                        }
                    }
                    else {
                        //Si antes no existia ni un solo archivo, no nos molestamos en comprobar si existe o no en el registro
                        await insertarArchivo(registro.id, archivoNuevo, seccion, getUsuarioSesion()?.id);
                    }
                }
            }
        }
    };

    const insertarArchivo = async (id, archivo, seccion, usuario) => {
        //Comprueba que el input haya sido modificado
        if (archivo?.type !== undefined) {
            //Comprueba si el tipo de archivo es una imagen para la subida
            let response = null;
            if ((archivo.type).includes('image/')) {
                response = await postSubirImagen(seccion, archivo.name, archivo);
            }
            else {
                response = await postSubirFichero(seccion, archivo.name, archivo);
            }
            //Hace el insert en la tabla de archivos
            const objArchivo = {}
            objArchivo['usuarioCreacion'] = usuario;
            objArchivo['empresaId'] = Number(localStorage.getItem('empresa'));
            objArchivo['tipoArchivoId'] = listaTipoArchivos[0].id;
            objArchivo['url'] = response.originalUrl;
            objArchivo['idTabla'] = id;
            objArchivo['tabla'] = seccion.toLowerCase();
            await postArchivo(objArchivo);
        }
    }

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: 'Editar' }) : intl.formatMessage({ id: 'Ver' })) : intl.formatMessage({ id: 'Nuevo' });

    return (
        <div>
            <div className="grid idioma">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Plantilla de correo' })).toLowerCase()}</h2>
                        <EditarDatosCorreoPlantilla
                            correoPlantilla={correoPlantilla}
                            setCorreoPlantilla={setCorreoPlantilla}
                            contenidoWysiwyg={contenidoWysiwyg}
                            setContenidoWysiwyg={setContenidoWysiwyg}
                            listaIdiomas={listaIdiomas}
                            idiomaSeleccionado={idiomaSeleccionado}
                            setIdiomaSeleccionado={setIdiomaSeleccionado}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                        />

                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })}
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarPlantillaEmail}
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

export default EditarCorreoPlantilla;