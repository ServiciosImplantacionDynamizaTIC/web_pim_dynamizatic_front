"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { getEmpresas } from "@/app/api-endpoints/empresa";
import { postRol, patchRol } from "@/app/api-endpoints/rol";
import 'primeicons/primeicons.css';
import { getUsuarioSesion } from "@/app/utility/Utils";
import EditarDatosRol from "./EditarDatosRol";
import { useIntl } from 'react-intl';
const EditarRol = ({ idEditar, setIdEditar, rowData, emptyRegistro, setRegistroResult, listaTipoArchivos, seccion, editable }) => {
    const toast = useRef(null);
    const [rol, setRol] = useState(emptyRegistro);
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [pantallaDashboardSeleccionada, setPantallaDashboardSeleccionada] = useState(null);
    const intl = useIntl();
    const pantallasDashboard = [
        { nombre: intl.formatMessage({ id: 'Empresas' }), url: '/empresas/' },
        { nombre: intl.formatMessage({ id: 'Usuarios' }), url: '/usuarios/' },

    ];
    useEffect(() => {
        //
        //Lo marcamos aquí como saync ya que useEffect no permite ser async porque espera que la función que le pases devueva undefined o una función para limpiar el efecto. 
        //Una función async devuelve una promesa, lo cual no es compatible con el comportamiento esperado de useEffect.
        //
        const fetchData = async () => {

            // Si el idEditar es diferente de nuevo, entonces se va a editar
            if (idEditar !== 0) {
                // Obtenemos el registro a editar
                const registro = rowData.find((element) => element.id === idEditar);
                const pantallaDashboard = (pantallasDashboard.find(cod => cod.url === registro.dashboardUrl));
                if (pantallaDashboard) {
                    setPantallaDashboardSeleccionada(pantallaDashboard.nombre)
                }
                setRol(registro);
            }
        };
        fetchData();
    }, [idEditar, rowData]);

    const validaciones = async () => {

        //Valida el bloque de nivel idioma
        const validaNombre = rol.nombre === undefined || rol.nombre === "";
        //
        //Si existe algún bloque vacio entonces no se puede guardar
        //
        return (!validaNombre)
    }

    const guardarTipoTransporte = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);
        if (await validaciones()) {
            // Obtenemos el registro actual y solo entramos si tiene nombre y contenido
            let objGuardar = { ...rol };
            const usuarioActual = getUsuarioSesion()?.id;

            // Si estoy insertando uno nuevo
            if (idEditar === 0) {
                // Elimino y añado los campos que no se necesitan
                delete objGuardar.id;
                delete objGuardar.nombreEmpresa;
                objGuardar['usuarioCreacion'] = usuarioActual;
                objGuardar['empresaId'] = getUsuarioSesion()?.empresaId;
                if(pantallaDashboardSeleccionada){
                    objGuardar['dashboardUrl'] = pantallasDashboard.find(dashboard => dashboard.nombre === pantallaDashboardSeleccionada).url;
                }
                
                // Hacemos el insert del registro
                const nuevoRegistro = await postRol(objGuardar);

                //Si se crea el registro mostramos el toast
                if (nuevoRegistro?.id) {

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
            } else {
                //Si se edita un registro existente Hacemos el patch del registro
                const registroActualizar = {
                    activoSn: objGuardar.activoSn,
                    empresaId: getUsuarioSesion()?.empresaId,
                    nombre: objGuardar.nombre,
                    muestraEmpresa: objGuardar.muestraEmpresa,
                    usuarioModificacion: usuarioActual,
                    dashboardUrl: objGuardar.dashboardUrl
                }
                if(pantallaDashboardSeleccionada){
                    objGuardar['dashboardUrl'] = pantallasDashboard.find(dashboard => dashboard.nombre === pantallaDashboardSeleccionada).url;
                }
                await patchRol(objGuardar.id, registroActualizar);
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
        //setAccion("consulta");
        //setIdEditar(null);
    };

    const cancelarEdicion = () => {
        setIdEditar(null)
        //setAccion("consulta");
    };

    const header = idEditar > 0 ? (editable ? intl.formatMessage({ id: 'Editar' }) : intl.formatMessage({ id: 'Ver' })) : intl.formatMessage({ id: 'Nuevo' });

    return (
        <div>
            <div className="grid Empresa">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} position="top-right" />
                        <h2>{header} {(intl.formatMessage({ id: 'Rol' })).toLowerCase()}</h2>
                        <EditarDatosRol
                            rol={rol}
                            setRol={setRol}
                            estadoGuardando={estadoGuardando}
                            pantallasDashboard={pantallasDashboard}
                            pantallaDashboardSeleccionada={pantallaDashboardSeleccionada} 
                            setPantallaDashboardSeleccionada={setPantallaDashboardSeleccionada}
                        />

                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={estadoGuardandoBoton ? `${intl.formatMessage({ id: 'Guardando' })}...` : intl.formatMessage({ id: 'Guardar' })}
                                    icon={estadoGuardandoBoton ? "pi pi-spin pi-spinner" : null}
                                    onClick={guardarTipoTransporte}
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

export default EditarRol;