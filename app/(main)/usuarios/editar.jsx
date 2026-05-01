"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
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
import { useRouter } from 'next/navigation';

const EditarUsuario = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable, setRegistroEditarFlag }) => {
    const intl = useIntl();
    const router = useRouter();
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
    const [puedeAccederTabla, setPuedeAccederTabla] = useState(true);
    const [isEdit, setIsEdit] = useState(false);
    const [listaTipoArchivosAntiguos, setListaTipoArchivosAntiguos] = useState([]);
    const [listaRoles, setListaRoles] = useState([]);
    const [listaIdiomas, setListaIdiomas] = useState([]);
    const [mostrarDialogUsuarioCreado, setMostrarDialogUsuarioCreado] = useState(false);
    const [dialogExito, setDialogExito] = useState(true);

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

            // Verificar si el usuario puede acceder a la tabla de usuarios
            const permisoAcceder = await tieneUsuarioPermiso('Usuarios', 'acceder');
            setPuedeAccederTabla(!!permisoAcceder);

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
                try {
                    const resultado = await postUsuario(objGuardar);
                    const nuevoRegistro = resultado?.usuario || resultado;

                    // Si se crea el registro mostramos el toast
                    if (nuevoRegistro?.id) {
                        //Sube las imagenes al servidor
                        await procesarArchivosNuevoRegistro(usuario, nuevoRegistro.id, listaTipoArchivos, seccion, usuarioActual);
                        // Determinar el resultado según el estado del email
                        const emailOk = resultado?.emailStatus?.status === 'OK';
                        setDialogExito(emailOk);
                        setMostrarDialogUsuarioCreado(true);
                    } else {
                        toast.current?.show({
                            severity: 'error',
                            summary: 'ERROR',
                            detail: intl.formatMessage({ id: 'Ha ocurrido un error creando el registro' }),
                            life: 3000,
                        });
                    }
                } catch (error) {
                    const errorData = error?.response?.data?.error;
                    if (errorData?.code === 'EMAIL_SEND_FAILED') {
                        toast.current?.show({
                            severity: 'error',
                            summary: intl.formatMessage({ id: 'Usuario no creado' }),
                            detail: intl.formatMessage({ id: 'Ha fallado el envío del correo de bienvenida. Inténtalo de nuevo o hable con un administrador.' }),
                            life: 7000,
                        });
                    } else if (errorData?.code === 'ER_DUP_ENTRY') {
                        toast.current?.show({
                            severity: 'error',
                            summary: intl.formatMessage({ id: 'No se pudo crear el usuario' }),
                            detail: intl.formatMessage({ id: 'Ya existe una cuenta asociada a este correo electrónico. Prueba con otro email o inicia sesión.' }),
                            life: 7000,
                        });
                    } else {
                        toast.current?.show({
                            severity: 'error',
                            summary: intl.formatMessage({ id: 'ERROR' }),
                            detail: intl.formatMessage({ id: 'Ha ocurrido un error creando el usuario' }),
                            life: 3000,
                        });
                    }
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
                setRegistroEditarFlag?.(false);
                if (!puedeAccederTabla) {
                    router.push('/');
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
        setRegistroEditarFlag?.(false);
        if (!puedeAccederTabla) {
            router.push('/');
            return;
        }
        setIdEditar(null);
    };

    const cerrarDialogUsuarioCreado = () => {
        setMostrarDialogUsuarioCreado(false);
        setRegistroEditarFlag?.(false);
        setRegistroResult(dialogExito ? "insertado" : "no_insertado");
        setIdEditar(null);
    };

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: 'Editar' }) : intl.formatMessage({ id: 'Ver' })) : intl.formatMessage({ id: 'Nuevo' });

    return (
        <>
            <Dialog
                header={intl.formatMessage({ id: dialogExito ? 'Usuario creado correctamente' : 'Error al crear el usuario' })}
                visible={mostrarDialogUsuarioCreado}
                style={{ width: '30rem' }}
                onHide={cerrarDialogUsuarioCreado}
                footer={
                    <Button
                        label={intl.formatMessage({ id: 'Aceptar' })}
                        icon="pi pi-check"
                        onClick={cerrarDialogUsuarioCreado}
                        autoFocus
                    />
                }
            >
                <div className="flex align-items-start gap-3">
                    <i
                        className={`pi ${dialogExito ? 'pi-envelope' : 'pi-times-circle'} mt-1`}
                        style={{ fontSize: '1.5rem', color: dialogExito ? 'var(--green-500)' : 'var(--red-500)' }}
                    ></i>
                    <div>
                        <p className="m-0 mb-2" style={{ fontWeight: '600' }}>
                            {dialogExito
                                ? intl.formatMessage({ id: 'El usuario ha sido creado con éxito.' })
                                : intl.formatMessage({ id: 'No se ha podido crear el usuario.' })
                            }
                        </p>
                        <p className="m-0 text-600">
                            {dialogExito
                                ? intl.formatMessage({ id: 'Se le ha enviado un correo electrónico con un enlace y un código de verificación para que pueda establecer su contraseña y acceder al sistema.' })
                                : intl.formatMessage({ id: 'Ha ocurrido un error al enviar el correo de bienvenida al usuario. Por favor, inténtalo de nuevo o contacta con un administrador.' })
                            }
                        </p>
                    </div>
                </div>
            </Dialog>
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
                                    <PasswordHistorico usuarioId={idEditar} />
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
        </>
    );
};

export default EditarUsuario;