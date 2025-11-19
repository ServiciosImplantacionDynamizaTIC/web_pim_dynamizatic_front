"use client";

import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { esUrlImagen, getIdiomaDefecto, tieneUsuarioPermiso } from "@/app/components/shared/componentes";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { useIntl } from 'react-intl'
import { devuelveBasePath } from "@/app/utility/Utils"

const CrudIconos = ({ getRegistros, editarComponente, editarComponenteParametrosExtra, filtradoBase, controlador,
    registroEditar, headerCrud, campoIcono, jsonIconos, campoIconoCustom, seccion, iconoPorDefecto, headerNuevo }) => {
    const intl = useIntl()
    const toast = useRef(null);
    const [registros, setRegistros] = useState([]);
    const [registroResult, setRegistroResult] = useState("");
    const [anchoPantalla, setAnchoPantalla] = useState(window.innerWidth);
    const [puedeCrear, setPuedeCrear] = useState(false);
    const [puedeVer, setPuedeVer] = useState(false);
    const [puedeEditar, setPuedeEditar] = useState(false);
    const [puedeBorrar, setPuedeBorrar] = useState(false);
    const [idEditar, setIdEditar] = useState(null);
    const [registrosTipoArchivos, setRegistrosTipoArchivos] = useState([]);
    let emptyRegistro = {
        id: ""
    };

    const obtenerDatos = async () => {
        const whereFiltro = { and: {} };
        //Si se pasa un filtro base, se añade al whereFiltro
        if (filtradoBase) {
            for (const [key, value] of Object.entries(filtradoBase)) {
                //Si el objeto es or
                if (key === 'or') {
                    whereFiltro['and']["or"] = {};
                    for (const [keyOr, valueOr] of Object.entries(value)) {
                        whereFiltro['and']['or'][keyOr] = valueOr;
                    }
                }
                else {
                    if (key === 'not') {
                        whereFiltro['and']["not"] = {};
                        for (const [keyNot, valueNot] of Object.entries(value)) {
                            whereFiltro['and']['not'][keyNot] = valueNot;
                        }
                    }
                    whereFiltro['and'][key] = value;
                }


            }
        }
        //Obtenemos registros
        const registros = await getRegistros(JSON.stringify({where: whereFiltro}));

        //Si seccion no es null significa que la pantalla del crud tiene archivos, por lo que hay que obtenerlos
        // if (seccion) {
        //     //Obtiene los tipos de archivo de la seccion
        //     const queryParamsTiposArchivo = {
        //         where: {
        //             and: {
        //                 nombreSeccion: seccion || '',
        //                 activoSn: 'S'
        //             }

        //         },
        //         order: "orden ASC"
        //     };
        //     const registrosTipoArchivos = await getVistaTipoArchivoEmpresaSeccion(JSON.stringify(queryParamsTiposArchivo));

        //     //Por cada tipo de archivo que tiene la seccion, intentamos obtener los archivos del tipo si existen
        //     for (const tipoArchivo of registrosTipoArchivos) {
        //         for (const registro of registros) {
        //             const queryParamsArchivo = {
        //                 where: {
        //                     and: {
        //                         tipoArchivoId: tipoArchivo.id,
        //                         tablaId: registro.id
        //                     }
        //                 }
        //             };
        //             const archivos = await getVistaArchivoEmpresa(JSON.stringify(queryParamsArchivo))
        //             //Comprueba si el archivo existe
        //             if (archivos.length > 0) {

        //                 //Si solo existe 1, se guarda en forma de variable
        //                 if (tipoArchivo.multiple !== 'S') {
        //                     //Guarda el archivo redimensionado en el registro
        //                     let url = archivos[0].url;
        //                     if (url !== '/multimedia/Sistema/imagen-no-disponible.jpeg') {
        //                         if ((tipoArchivo.tipo).toLowerCase() === 'imagen') {
        //                             url = archivos[0].url.replace(/(\/[^\/]+\/)([^\/]+\.\w+)$/, '$11250x850_$2');
        //                         }
        //                         //El id y el url de la imagen se almacenan en variables simples separades en vez de un objeto, para que a la
        //                         //hora de mostrar las imagenes se pueda acceder al url con un simple rowData.campo
        //                         registro[(tipoArchivo.nombre).toLowerCase()] = url
        //                         registro[`${(tipoArchivo.nombre).toLowerCase()}Id`] = archivos[0].id
        //                     }
        //                     else {
        //                         registro[(tipoArchivo.nombre).toLowerCase()] = null
        //                         registro[`${(tipoArchivo.nombre).toLowerCase()}Id`] = null
        //                     }
        //                 }
        //                 //Si existe mas de uno, se almacena en forma de array
        //                 else {
        //                     const archivosArray = []
        //                     for (const archivo of archivos) {
        //                         let url = archivo.url;
        //                         if (esUrlImagen(url) && url !== '/multimedia/Sistema/imagen-no-disponible.jpeg') {
        //                             url = archivo.url.replace(/(\/[^\/]+\/)([^\/]+\.\w+)$/, '$11250x850_$2');
        //                         }
        //                         archivosArray.push({ url: url, id: archivo.id });
        //                     }
        //                     registro[(tipoArchivo.nombre).toLowerCase()] = archivosArray
        //                 }

        //             }
        //             else {
        //                 //Si no existe se guarda en null para que luego a futuro pueda ser rellenado el campo
        //                 registro[(tipoArchivo.nombre).toLowerCase()] = null
        //                 if (tipoArchivo.multiple !== 'S') {
        //                     registro[`${(tipoArchivo.nombre).toLowerCase()}Id`] = null
        //                 }

        //             }
        //         }
        //     }
        //     setRegistrosTipoArchivos(registrosTipoArchivos)
        // }

        setRegistros(registros);
    }
    const obtenerPermisos = async () => {
        //Obtiene los permisos del usuario
        if (!registroEditar) {
            const sePuedeAcceder = await tieneUsuarioPermiso(controlador, 'acceder')
            if (!sePuedeAcceder) {
                //Si no puede acceder, redirige a la pantalla de error
                window.location.href = '/error';
            }
        }

        setPuedeCrear(await tieneUsuarioPermiso(controlador, 'nuevo'))
        setPuedeVer(await tieneUsuarioPermiso(controlador, 'ver'))
        setPuedeEditar(await tieneUsuarioPermiso(controlador, 'actualizar'))
        setPuedeBorrar(await tieneUsuarioPermiso(controlador, 'borrar'))
    }

    useEffect(() => {
        //Si no hay un controlador declarado, no se revisan los permisos
        if (controlador) {
            obtenerPermisos()
        }
        obtenerDatos();

        //obtenerDatos();
        //En caso de que haya que mostrar el resultado de una edicion de la bbdd se muestra
        if (registroResult === "editado") {
            toast.current?.show({
                severity: "success",
                summary: "OK",
                detail: intl.formatMessage({ id: 'Registro editado correctamente' }),
                life: 3000,
            });
        }
        else if (registroResult === "insertado") {
            toast.current?.show({
                severity: "success",
                summary: "OK",
                detail: intl.formatMessage({ id: 'Registro insertado correctamente' }),
                life: 3000,
            });
        }
        else if (registroResult === "eliminado") {
            toast.current?.show({
                severity: "success",
                summary: "OK",
                detail: intl.formatMessage({ id: 'Registro elmininado correctamente.' }),
                life: 3000,
            });
        }

        setRegistroResult("");
    }, [registroResult]);

    //Evento que maneja el cambio de tamaño de la pantalla
    window.addEventListener('resize', () => {
        setAnchoPantalla(window.innerWidth);
    });

    //Funcion que renderiza el compontente que servira para editar el registro
    const renderizarEditarComponente = () => {
        // Devuelve el componente con las propiedades aplicadas, MUY IMPORTANTE que el componente reciba las mismas propiedades
        return React.cloneElement(editarComponente, {
            idEditar: idEditar,
            //editable: editable,
            setIdEditar: setIdEditar,
            rowData: registros,
            emptyRegistro: emptyRegistro,
            setRegistroResult: setRegistroResult,
            listaTipoArchivos: registrosTipoArchivos,
            seccion: seccion,
            //setRegistroEditarFlag: setRegistroEditarFlag,
            puedeBorrar: puedeBorrar,
            ...editarComponenteParametrosExtra
        });
    }
    const crearNuevoRegistro = () => {
        //setEditable(true);
        setIdEditar(0);
    };

    const editarRegistro = (registro) => {
        //setEditable(true);
        if (puedeEditar) {
            setIdEditar(registro.id);
        }
    };
    return (
        <div>
            {(idEditar === null) && (
                <div className="grid" style={{ gap: '25px' }}>
                    <div className="col-12" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0 }}>{(intl.formatMessage({ id: headerCrud }))}</h2>
                        {puedeCrear && (
                            <Button label={headerNuevo} icon="pi pi-plus" onClick={crearNuevoRegistro} />
                        )}
                    </div>

                    <div className="col-12">
                        <div className="card" style={{ padding: '50px' }}>
                            <Toast ref={toast} position="top-right" />
                            <div
                                className="grid"
                                style={{
                                    gap: '25px',
                                    display: 'grid',
                                    gridTemplateColumns: anchoPantalla > 1000 ? 'repeat(5, 1fr)' : 'repeat(3, 1fr)',
                                }}
                            >
                                {registros.map((registro, index) => (
                                    <div
                                        key={index}
                                        className="text-center"
                                        style={{
                                            cursor: puedeEditar ? 'pointer' : 'default',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: '0px',
                                            boxShadow: '5px 5px 10px rgba(0, 0, 0, 0.3)',
                                            borderRadius: '5px',
                                            padding: '10px',
                                        }}
                                        onClick={() => puedeEditar && editarRegistro(registro)}
                                    >
                                        {jsonIconos && campoIcono && (
                                            <img
                                                src={`${(devuelveBasePath())}${jsonIconos[registro[campoIcono]] || iconoPorDefecto || '/multimedia/Sistema/imagen-no-disponible.jpeg'}`}
                                                alt=""
                                                style={{ width: '100%', objectFit: 'cover' }}
                                            />
                                        )}
                                        {campoIconoCustom && (
                                            <img
                                                src={`${(devuelveBasePath())}${registro[campoIconoCustom] || iconoPorDefecto || '/multimedia/Sistema/imagen-no-disponible.jpeg'}`}
                                                alt=""
                                                style={{ width: '100%', objectFit: 'cover' }}
                                            />
                                        )}
                                        <Divider></Divider>
                                        <span
                                            style={{
                                                display: 'block',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                width: '100%',
                                                minwidth: '0px',
                                            }}
                                        >
                                            {registro.nombre}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(idEditar === 0 || idEditar > 0) && //Se hace la comprobacion asi en vez de >= porque tecnicamente null tambien es 0 
                renderizarEditarComponente()
            }
        </div>
    );
}
export default CrudIconos;