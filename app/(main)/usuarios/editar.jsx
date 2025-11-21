"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { TabView, TabPanel } from 'primereact/tabview';
import { getUsuarios, postUsuario, patchUsuario } from "@/app/api-endpoints/usuario";
import { getRol } from "@/app/api-endpoints/rol";
import { getIdiomas } from "@/app/api-endpoints/idioma";
import { editarArchivos, insertarArchivo, procesarArchivosNuevoRegistro, validarImagenes, crearListaArchivosAntiguos } from "@/app/utility/FileUtils"
import EditarDatosUsuario from "./EditarDatosUsuario";
import PasswordHistorico from "./passwordHistorico";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';
import { tieneUsuarioPermiso } from "@/app/components/shared/componentes";

const EditarUsuario = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const intl = useIntl();
    const toast = useRef(null);
    const [usuario, setUsuario] = useState(emptyRegistro || {
        nombre: "",
        mail: "",
        telefono: "",
        empresaId: Number(localStorage.getItem('empresa')),
        rolId: null,
        idiomaId: null,
        activoSn: "S"
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [puedeVerHistorico, setPuedeVerHistorico] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [listaTipoArchivosAntiguos, setListaTipoArchivosAntiguos] = useState([]);
    const [listaRoles, setListaRoles] = useState([]);
    const [listaIdiomas, setListaIdiomas] = useState([]);

    useEffect(() => {
        //
        //Lo marcamos aquí como saync ya que useEffect no permite ser async porque espera que la función que le pases devueva undefined o una función para limpiar el efecto. 
        //Una función async devuelve una promesa, lo cual no es compatible con el comportamiento esperado de useEffect.
        //
        const fetchData = async () => {
            // Cargar roles e idiomas
            try {
                const queryParamsRol = {
                    where: {
                        and: {
                            empresaId: Number(localStorage.getItem('empresa'))
                        }
                    }
                };
                const rolesData = await getRol(JSON.stringify(queryParamsRol));
                setListaRoles(rolesData || []);
                
                const idiomasData = await getIdiomas();
                setListaIdiomas(idiomasData || []);
            } catch (error) {
                console.error("Error cargando datos:", error);
            }

            // Si el idEditar es diferente de nuevo, entonces se va a editar
            if (idEditar !== 0) {
                // Obtenemos el registro a editar
                const registro = rowData.find((element) => element.id === idEditar);
                setUsuario(registro);
                
                //Guardamos los archivos para luego poder compararlos
                const _listaArchivosAntiguos = crearListaArchivosAntiguos(registro, listaTipoArchivos);
                setListaTipoArchivosAntiguos(_listaArchivosAntiguos);
            }
                    
            // Verificar permiso para ver historial de contraseñas
            const permiso = await tieneUsuarioPermiso('Usuarios', 'VerHistoricoPassword');
            setPuedeVerHistorico(!!permiso);

        };
        fetchData();
    }, [idEditar, rowData]);  

    const validacionesImagenes = () => {
        return validarImagenes(usuario, listaTipoArchivos);
    }

    const validaciones = async () => {
        // Valida que los campos obligatorios no estén vacíos
        const validaNombre = usuario.nombre === undefined || usuario.nombre === "";
        const validaMail = usuario.mail === undefined || usuario.mail === "";
        const validaRol = usuario.rolId === undefined || usuario.rolId === null;
        const validaIdioma = usuario.idiomaId === undefined || usuario.idiomaId === null;
        const validaImagenes = validacionesImagenes();

        if (validaImagenes) {
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Las imagenes deben de tener el formato correcto' }),
                life: 3000,
            });
        }
        
        // Si existe algún campo obligatorio vacío, no se puede guardar
        return (!validaNombre && !validaMail && !validaRol && !validaIdioma);
    };

    const guardarUsuario = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        
        if (await validaciones()) {
            // Obtenemos el registro actual
            let objGuardar = { ...usuario };
            const usuarioActual = getUsuarioSesion()?.id;
            delete objGuardar.nombreIdioma;
            delete objGuardar.nombreRol;

            // Si estoy insertando uno nuevo
            if (idEditar === 0) {
                // Elimino y añado los campos que no se necesitan
                delete objGuardar.id;
                delete objGuardar.avatar;
                delete objGuardar.avatarId;

                objGuardar['usuarioCreacion'] = usuarioActual;
                objGuardar['empresaId'] = Number(localStorage.getItem('empresa'));
                
                if (objGuardar.activoSn === '') {
                    objGuardar.activoSn = 'S';
                }
                
                // Hacemos el insert del registro
                const nuevoRegistro = await postUsuario(objGuardar);

                // Si se crea el registro mostramos el toast
                if (nuevoRegistro?.id) {
                    //Sube las imagenes al servidor
                    await procesarArchivosNuevoRegistro(usuario, nuevoRegistro.id, listaTipoArchivos, seccion, usuarioActual);
                    // Usamos una variable que luego se cargará en el useEffect de la página principal para mostrar el toast
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
                // Si se edita un registro existente, hacemos el patch del registro

                const usuarioAeditar = {
                    id: objGuardar.id,
                    nombre: objGuardar.nombre,
                    mail: objGuardar.mail,
                    telefono: objGuardar.telefono || '',
                    empresaId: objGuardar.empresaId,
                    rolId: objGuardar.rolId,
                    idiomaId: objGuardar.idiomaId,
                    activoSn: objGuardar.activoSn || 'N',
                    usuarioModificacion: usuarioActual,
                };
                
                await patchUsuario(objGuardar.id, usuarioAeditar);
                await editarArchivos(usuario, objGuardar.id, listaTipoArchivos, listaTipoArchivosAntiguos, seccion, usuarioActual);
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
            <div className="grid Usuario">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Usuario' })).toLowerCase()}</h2>
                        <EditarDatosUsuario
                            usuario={usuario}
                            setUsuario={setUsuario}
                            listaRoles={listaRoles}
                            listaIdiomas={listaIdiomas}
                            listaTipoArchivos={listaTipoArchivos}
                            estadoGuardando={estadoGuardando}
                            isEdit={isEdit}
                        />
                        
                        <Divider type="solid" />
                        
                        {puedeVerHistorico && idEditar !== 0 && (
                            <TabView scrollable>
                                <TabPanel header={intl.formatMessage({ id: 'Historico de contraseñas' })}>
                                    <PasswordHistorico usuarioId={idEditar}/>
                                </TabPanel>
                            </TabView>
                        )}

                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })} 
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarUsuario}
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

export default EditarUsuario;