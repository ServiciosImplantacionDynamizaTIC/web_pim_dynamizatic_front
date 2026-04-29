"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { getIdiomas } from "@/app/api-endpoints/idioma";
import { postPlantillaEmail, deletePlantillaEmail } from "@/app/api-endpoints/plantilla_email";
import { esUrlImagen } from "@/app/components/shared/componentes";
import EditarDatosEnvioPlantilla from "./EditarDatosEnvioPlantilla";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { borrarFichero, postSubirImagen, postSubirFichero } from "@/app/api-endpoints/ficheros"
import { postArchivo, deleteArchivo } from "@/app/api-endpoints/archivo"
import { useIntl } from 'react-intl';
import { getVistaPlantillaEmail, postEnviarEmails } from "@/app/api-endpoints/plantilla_email";
import { obtenerArchivosSeccion } from "@/app/components/shared/componentes";
import { useRouter } from 'next/navigation';

const EnviarCorreoPlantilla = ({ }) => {
    const toast = useRef(null);
    const router = useRouter();
    const intl = useIntl();
    const [correoPlantilla, setCorreoPlantilla] = useState({});
    const [listaPlantillas, setListaPlantillas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
    const [listaIdiomas, setListaIdiomas] = useState([]);
    const [idiomaSeleccionado, setIdiomaSeleccionado] = useState(null);
    const [contenidoWysiwyg, setContenidoWysiwyg] = useState(null);
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [listaTipoArchivos, setListaTipoArchivos] = useState([]);
    const [listaArchivosAntiguos, setListaArchivosAntiguos] = useState([]);
    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState(null);

    useEffect(() => {
        const fetchData = async () => {

            if (plantillaSeleccionada) {
                // Obtenemos el registro a editar
                const registroArr = await getVistaPlantillaEmail(JSON.stringify({
                    where: {
                        and: {
                            id: plantillaSeleccionada
                        }
                    },
                }));
                const registro = registroArr[0];
                setContenidoWysiwyg(registro.cuerpo)

                // Obtenemos el nombre del idioma seleccionado
                const registrosIdiomas = await getIdiomas();
                const registroIdioma = registrosIdiomas.find((element) => element.id === registro.idiomaId).nombre;
                setIdiomaSeleccionado(registroIdioma);

                //Obtenemos los tipos de archivos
                const listaTipoArchivosUsuario = await obtenerArchivosSeccion(registro, 'Correo plantilla')
                setListaTipoArchivos(listaTipoArchivosUsuario);
                setCorreoPlantilla(registro);
                //Guardamos los archivos para luego poder compararlos
                const _listaArchivosAntiguos = {}
                for (const tipoArchivo of listaTipoArchivosUsuario) {
                    _listaArchivosAntiguos[tipoArchivo['nombre']] = registro[(tipoArchivo.nombre).toLowerCase()]
                }
                setListaArchivosAntiguos(_listaArchivosAntiguos);
            }

        };
        fetchData();
    }, [plantillaSeleccionada]);

    useEffect(() => {
        const fetchData = async () => {
            // Obtenemos los usuarios de localStorage si existe la variable usuariosMail
            const usuariosMail = localStorage.getItem('usuariosMail');
            if (usuariosMail) {
                const usuariosArray = JSON.parse(usuariosMail).map(usuario => ({
                    id: usuario.id,
                    email: usuario.email,
                    nombre: usuario.nombre,
                }));
                setUsuarios(usuariosArray);
                localStorage.removeItem('usuariosMail');
            }
            else{
                window.location.href = '/error';
                return;
            }
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

            // Obtenemos las Plantillas de email
            const registrosPlantillas = await getVistaPlantillaEmail(JSON.stringify({
                where: {
                    and: {
                        empresaId: Number(localStorage.getItem('empresa')),
                    }
                },
                order: 'nombrePlantilla ASC'
            }));
            const jsonPlantillas = registrosPlantillas.map(plantilla => ({
                nombre: plantilla.nombrePlantilla,
                id: plantilla.id,
                accion: plantilla.accion,
            })).sort((a, b) => a.nombre.localeCompare(b.nombre));
            //Quitamos los registros inactivos
            const jsonPlantillasActivas = jsonPlantillas.filter(registro => registro.accion === 'Enviar un email a usuarios');
            setListaPlantillas(jsonPlantillasActivas);

        };
        fetchData();
    }, []);

    const validaciones = async () => {
        const vadlidaNombre = correoPlantilla.nombrePlantilla === undefined || correoPlantilla.nombrePlantilla === "";
        const validaTitulo = correoPlantilla.titulo === undefined || correoPlantilla.titulo === "";
        const validaCuerpo = contenidoWysiwyg === null || contenidoWysiwyg === "";
        const validaIdioma = idiomaSeleccionado == null || idiomaSeleccionado.id === "";
        const validaUsuarios = usuariosSeleccionados === null || usuariosSeleccionados.length === 0;
        //
        //Si existe algún bloque vacio entonces no se puede guardar
        //
        return (!vadlidaNombre && !validaCuerpo && !validaTitulo && !validaIdioma && !validaUsuarios);
    }

    const guardarPlantillaEmail = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        if (await validaciones()) {
            // Obtenemos el registro actual y solo entramos si tiene nombre y contenido
            let objGuardar = { ...correoPlantilla };
            const usuarioActual = getUsuarioSesion()?.id;

            // Elimino y añado los campos que no se necesitan
            delete objGuardar.nombreIdioma;
            delete objGuardar.archivos;
            objGuardar['cuerpo'] = contenidoWysiwyg;
            objGuardar['usuarioCreacion'] = usuarioActual;
            //objGuardar['accion'] = 'Enviar un email a usuarios';
            objGuardar['nombrePlantilla'] = correoPlantilla.nombrePlantilla + '-Temp';
            objGuardar['empresaId'] = Number(localStorage.getItem('empresa'));
            const registroSeleccionado = listaIdiomas.find(idioma => idioma.nombre === idiomaSeleccionado)
            if (registroSeleccionado) {
                objGuardar['idiomaId'] = registroSeleccionado.id;
            }
            delete objGuardar.id;
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
                                await insertarArchivo(nuevoRegistro.id, archivo, 'Correo plantilla', usuarioActual)
                            }
                        }
                    }
                    const emailsUsuarios = usuariosSeleccionados.map(usuario => usuario.email);
                    await postEnviarEmails(nuevoRegistro.id, emailsUsuarios);
                    //Eliminamos los archivos antiguos
                    nuevoRegistro['archivos'] = [];
                    await editarArchivos(nuevoRegistro, 'Correo plantilla');

                    //Elimnamos la plantilla
                    await deletePlantillaEmail(nuevoRegistro.id)
                    //Mostramos el toast de éxito
                    toast.current?.show({
                        severity: 'success',
                        summary: 'ÉXITO',
                        detail: intl.formatMessage({ id: 'Registro creado correctamente' }),
                        life: 3000,
                    });
                    router.back();

                } else {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'ERROR',
                        detail: intl.formatMessage({ id: 'Ha ocurrido un error creando el registro' }),
                        life: 3000,
                    });
                }
            } catch (error) {

                toast.current?.show({
                    severity: 'error',
                    summary: 'ERROR',
                    detail: intl.formatMessage({ id: 'Ha ocurrido un error creando el registro' }),
                    life: 3000,
                });

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
        //setAccion("consulta");
        ////setIdEditar(null);
    };

    const cancelarEdicion = () => {
        //setIdEditar(null)
        //setAccion("consulta");
        router.back();
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

    return (
        <div>
            <div className="grid idioma">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{intl.formatMessage({ id: 'Enviar' })} {(intl.formatMessage({ id: 'Plantilla de correo' })).toLowerCase()}</h2>
                        <EditarDatosEnvioPlantilla
                            correoPlantilla={correoPlantilla}
                            setCorreoPlantilla={setCorreoPlantilla}
                            contenidoWysiwyg={contenidoWysiwyg}
                            setContenidoWysiwyg={setContenidoWysiwyg}
                            listaIdiomas={listaIdiomas}
                            idiomaSeleccionado={idiomaSeleccionado}
                            setIdiomaSeleccionado={setIdiomaSeleccionado}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                            usuarios={usuarios}
                            plantillaSeleccionada={plantillaSeleccionada}
                            setPlantillaSeleccionada={setPlantillaSeleccionada}
                            listaPlantillas={listaPlantillas}
                            usuariosSeleccionados={usuariosSeleccionados}
                            setUsuariosSeleccionados={setUsuariosSeleccionados}
                        />

                        <div className="flex justify-content-end mt-2">
                            <Button
                                label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Enviando' })}...` : intl.formatMessage({ id: 'Enviar' })}
                                icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                onClick={guardarPlantillaEmail}
                                className="mr-2"
                                disabled={estadoGuardandoBoton}
                            />
                            <Button label={intl.formatMessage({ id: 'Cancelar' })} onClick={cancelarEdicion} className="p-button-secondary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnviarCorreoPlantilla;