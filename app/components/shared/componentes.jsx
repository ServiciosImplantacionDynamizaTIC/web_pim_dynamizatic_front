"use client";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from 'primereact/dropdown';
import React, { useState } from "react";
import { parse } from 'json2csv';
import { devuelveBasePath, getUsuarioSesion } from "../../utility/Utils";
import { useIntl } from 'react-intl'
import { compruebaPermiso, getVistaEmpresaRolPermiso } from "../../api-endpoints/permisos";
import { Tooltip } from 'primereact/tooltip';
import VisualizadorDeImagen from './VisualizadorDeImagen';
import { getUrlImagenMiniatura, getUrlImagenGrande, UrlEsImagen as esUrlImagenUtil } from '../../utility/ImageUtils';
// import { getVistaEmpresaRolPermiso } from "@/app/api-endpoints/permisos";

const templateGenerico = (campo, cabecera) => (rowData) => {
    if (rowData[campo]?.length > 30) {
        return (
            <>
                <span className="p-column-title">{cabecera}</span>
                <Tooltip target=".templateGenerico"></Tooltip>
                {/* 30 - 1 caracteres de limite porque el '...' cuenta como un caracter */}
                <span style={{ width: '100%', display: 'block', maxWidth: '29ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="templateGenerico" data-pr-tooltip={rowData[campo]}>{rowData[campo]}</span>

            </>
        );
    }
    else {
        return (
            <>
                <span className="p-column-title">{cabecera}</span>
                <span>{rowData[campo]}</span>

            </>
        );
    }

};


//Obtiene los tipos de archivo de la seccion y los archivos que tiene el registro como si fuese el crud
export async function obtenerArchivosSeccion(registro, seccion) {
    //Obtiene los tipos de archivo de la seccion
    const queryParamsTiposArchivo = {
        where: {
            and: {
                nombreSeccion: seccion,
                activoSn: 'S'
            }

        },
        order: "orden ASC"
    };
    const registrosTipoArchivos = await getVistaTipoArchivoEmpresaSeccion(JSON.stringify(queryParamsTiposArchivo));

    if (registro && registro.id) {
        //Por cada tipo de archivo que tiene la seccion, intentamos obtener los archivos del tipo si existen
         for (const tipoArchivo of registrosTipoArchivos) {

            const queryParamsArchivo = {
                where: {
                    and: {
                        tipoArchivoId: tipoArchivo.id,
                        tablaId: registro.id
                    }
                }
            };
            const archivos = await getVistaArchivoEmpresa(JSON.stringify(queryParamsArchivo))
            //Comprueba si el archivo existe
            if (archivos.length > 0) {

                //Si solo existe 1, se guarda en forma de variable
                if (tipoArchivo.multiple !== 'S') {
                    //Guarda el archivo en el registro
                    let url = archivos[0].url;
                    if (url !== '/multimedia/Sistema/imagen-no-disponible.jpeg') {
                        if ((tipoArchivo.tipo).toLowerCase() === 'imagen') {
                            // Para imágenes, usar la miniatura (200x200)
                            url = getUrlImagenMiniatura(archivos[0].url);
                        }
                        //El id y el url de la imagen se almacenan en variables simples separades en vez de un objeto, para que a la
                        //hora de mostrar las imagenes se pueda acceder al url con un simple rowData.campo
                        registro[(tipoArchivo.nombre).toLowerCase()] = url
                        registro[`${(tipoArchivo.nombre).toLowerCase()}Id`] = archivos[0].id
                    }
                    else {
                        registro[(tipoArchivo.nombre).toLowerCase()] = null
                        registro[`${(tipoArchivo.nombre).toLowerCase()}Id`] = null
                    }
                }
                //Si existe mas de uno, se almacena en forma de array
                else {
                    const archivosArray = []
                    for (const archivo of archivos) {
                        let url = archivo.url;
                        if (esUrlImagenUtil(url) && url !== '/multimedia/Sistema/imagen-no-disponible.jpeg') {
                            // Para imágenes, usar la miniatura (200x200)
                            url = getUrlImagenMiniatura(archivo.url);
                        }
                        archivosArray.push({ url: url, id: archivo.id });
                    }
                    registro[(tipoArchivo.nombre).toLowerCase()] = archivosArray
                }
            }
            else {
                //Si no existe se guarda en null para que luego a futuro pueda ser rellenado el campo
                registro[(tipoArchivo.nombre).toLowerCase()] = null
                if (tipoArchivo.multiple !== 'S') {
                    registro[`${(tipoArchivo.nombre).toLowerCase()}Id`] = null
                }
            }
        }
    }
    return registrosTipoArchivos
}

const comprobarImagen = (campo, cabecera) => (rowData) => {
    // Estado local para el visor de imágenes dentro del scope del componente
    const [visualizadorDeImagenVisible, setVisualizadorDeImagenVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    const handleImageClick = (imageUrl) => {
        // Convertir thumbnail a webUrl (1250x850)
        const webImageUrl = getUrlImagenGrande(imageUrl);
        setSelectedImage(webImageUrl);
        setVisualizadorDeImagenVisible(true);
    };

    if (rowData[campo] !== null && !esUrlImagenUtil(rowData[campo])) {
        return (
            <>
                <a style={{ color: 'black' }} href={`${devuelveBasePath()}${rowData[campo]}`} target="_blank">
                    <i className="pi pi-file text-7xl"></i>
                </a>
                <span className="p-column-title">{cabecera}</span>
            </>
        );
    }
    
    return (
        <>
            <div 
                onClick={() => handleImageClick(rowData[campo] || "/multimedia/Sistema/200x200_imagen-no-disponible.jpeg")}
                style={{ cursor: 'pointer' }}
            >
                <img 
                    src={`${devuelveBasePath()}${rowData[campo] || "/multimedia/Sistema/200x200_imagen-no-disponible.jpeg"}`} 
                    alt="Imagen" 
                    style={{ width: '100px', height: 'auto' }} 
                />
            </div>
            <span className="p-column-title">{cabecera}</span>
            
            <VisualizadorDeImagen
                visible={visualizadorDeImagenVisible}
                onHide={() => setVisualizadorDeImagenVisible(false)}
                imageUrl={selectedImage}
                altText={cabecera}
            />
        </>
    );

};

//Funcion para comprobar a traves de solo el url si un archivo es una imagen
const esUrlImagen = (url) => {
    return esUrlImagenUtil(url);
}

const manejarCambioImagen = (event) => {
    return event.target.files[0];
};

const tieneUsuarioPermiso = async (controlador, permiso) => {    
    const usuario = getUsuarioSesion();
    return await compruebaPermiso(usuario.rolId, controlador, permiso);
}

const obtenerTodosLosPermisos = async accion => {
 const usuario = getUsuarioSesion();
 const permisos = await getVistaEmpresaRolPermiso(
  JSON.stringify({
   where: {
    and: {
     rolId: usuario.rolId,
     permisoAccion: accion
    }
   }
  })
 );
 return permisos;
};

const ErrorDetail = () => {
    const intl = useIntl();
    return (
        <div>
            {intl.formatMessage({ id: 'No ha sido posible eliminar el registro ya que tiene dependencias.' })}
        </div>
    )
};

const botonesDeAccionTemplate = (rowData, editar, confirmarEliminar) => {
    return (
        <>
            <Button
                icon="pi pi-pencil"
                className="mr-2"
                rounded
                severity="success"
                onClick={() => editar(rowData)}
            />
            <Button
                icon="pi pi-trash"
                rounded
                severity="warning"
                onClick={() => confirmarEliminar(rowData)}
            />
        </>
    );
};

const eliminarDialogFooter = (ocultarEliminarDialog, eliminar) => {
    return (
        <>
            <Button
                label={intl.formatMessage({ id: 'NO' })}
                icon="pi pi-times"
                text
                onClick={ocultarEliminarDialog}
            />
            <Button
                label={intl.formatMessage({ id: 'SI' })}
                icon="pi pi-check"
                text
                onClick={eliminar}
            />
        </>
    );
};

const Header = ({ crearNuevo, generarCSV, mostrarQR, enviarCorreo, limpiarFiltros, valorDeFiltroGlobal, manejarCambioFiltroGlobal, nombre, manejarBusquedaFiltroGlobal,
    operadorSeleccionado, setOperadorSeleccionado, listaOperadores,
}) => {
    const intl = useIntl()
    return <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex items-center mb-2 md:mb-0 md:mr-auto md:align-items-center">
            <h5 className="m-0 mr-2">{nombre}</h5>
            {(crearNuevo !== null && crearNuevo !== undefined) &&     //Si no se envia la funcion de crearNuevo, no muestra el boton
                (
                    <Button
                        label={intl.formatMessage({ id: 'Nuevo' })}
                        icon="pi pi-plus"
                        severity="success"
                        onClick={crearNuevo}
                        className="mr-2"
                    />
                )
            }
            {(generarCSV !== null && generarCSV !== undefined) &&     //Si no se envia la funcion de generarCSV, no muestra el boton
                (
                    <Button
                        label={`${intl.formatMessage({ id: 'Descargar' })} CSV`}
                        icon="pi pi-download"
                        severity="success"
                        onClick={generarCSV}
                        className="mr-2"
                    />
                )
            }
            {(mostrarQR !== null && mostrarQR !== undefined) &&     //Si no se envia la funcion de generarCSV, no muestra el boton
                (
                    <Button
                        label={`${intl.formatMessage({ id: 'Mostrar' })} QR`}
                        icon="pi pi-download"
                        severity="success"
                        onClick={mostrarQR}
                    />
                )
            }
            {(enviarCorreo !== null && enviarCorreo !== undefined) &&     //Si no se envia la funcion de generarCSV, no muestra el boton
                (
                    <Button
                        label={`${intl.formatMessage({ id: 'Enviar correos' })}`}
                        icon="pi pi-download"
                        severity="success"
                        onClick={enviarCorreo}
                    />
                )
            }
        </div>
        <div className="flex flex-wrap gap-2">
            <Dropdown
                value={operadorSeleccionado || 'or'}
                options={listaOperadores}
                onChange={(e) => setOperadorSeleccionado(e.value)}
                placeholder={intl.formatMessage({ id: 'Seleccionar operador' })}
                className="p-column-filter"
            //showClear
            />
            <span className="p-input-icon-left ml-2">
                <i className="pi pi-search" />
                <InputText value={valorDeFiltroGlobal} onChange={manejarCambioFiltroGlobal}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            manejarBusquedaFiltroGlobal()
                        }
                    }}
                    placeholder={intl.formatMessage({ id: 'Buscar por palabra clave' })} />
            </span>
            <Button className="p-button p-component mr-2 ml-2" type="button" icon="pi pi-search" label={intl.formatMessage({ id: 'Buscar' })} onClick={manejarBusquedaFiltroGlobal}>

            </Button>
            <Button type="button" icon="pi pi-filter-slash" label={intl.formatMessage({ id: 'Limpiar filtros' })} outlined onClick={limpiarFiltros} />
        </div>
    </div>
};

{/* B O T O N E S - D E - L A S - M O D A L E S */ }
const dialogFooter = (ocultarDialog, guardar) => {
    const intl = useIntl()
    return (
        <>
            <Button
                label={intl.formatMessage({ id: 'Cancelar' }).toUpperCase()}
                icon="pi pi-times"
                text
                onClick={ocultarDialog}
            />
            <Button
                label={intl.formatMessage({ id: 'Guardar' }).toUpperCase()}
                icon="pi pi-check"
                text
                onClick={guardar}
            />
        </>
    )
};

const EliminarDialog = ({ visible, ocultarEliminarDialog, eliminarRegisrtro, tabla, nombreAMostrar }) => {
    const intl = useIntl()
    return (
        <Dialog
            visible={visible}
            style={{ width: "450px" }}
            header={`${intl.formatMessage({ id: '¿Eliminar' })} ${nombreAMostrar}?`}
            modal
            footer={
                <>
                    <Button
                        label={intl.formatMessage({ id: 'NO' })}
                        icon="pi pi-times"
                        text
                        onClick={ocultarEliminarDialog}
                    />
                    <Button
                        label={intl.formatMessage({ id: 'SI' })}
                        icon="pi pi-check"
                        text
                        onClick={eliminarRegisrtro}
                    />
                </>
            }
            onHide={ocultarEliminarDialog}
        >
            <div className="flex align-items-center justify-content-center">
                <i
                    className="pi pi-exclamation-triangle mr-3"
                    style={{ fontSize: "2rem" }}
                />
                {tabla && (
                    <span>

                        {intl.formatMessage({ id: '¿Esta seguro de que desea eliminar el siguiente registro' })}: {" "}
                        <b>{tabla.nombre}</b>?
                    </span>
                )}
            </div>
        </Dialog>
    )
};

const filtroActivoSnTemplate = (options, opcionesActivoSn, opcionesActivoSnTemplate) => {
    const intl = useIntl()
    return (
        <Dropdown
            value={options.value}
            options={opcionesActivoSn}
            onChange={(e) => {
                options.filterCallback(e.value, options.index);
            }}
            itemTemplate={opcionesActivoSnTemplate}
            placeholder={intl.formatMessage({ id: 'Opciones' })}
            className="p-column-filter"
            showClear
        />
    );
};

const formatearBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
};

const opcionesActivoSnTemplate = (option, obtenerSeverity) => {
    return <Badge value={option} severity={obtenerSeverity(option)} />;
};
/**
 * Genera y descarga un archivo CSV.
 * @param {Array} registros - Los datos a incluir en el archivo CSV.
 * @param {Array} encabezados - Los encabezados para las columnas del CSV.
 * @param {string} nombreArchivo - Nombre del archivo CSV a descargar.
 */
const generarYDescargarCSV = (registros, encabezados, nombreArchivo) => {
    try {
        const csv = parse(registros, { fields: encabezados, header: true });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', nombreArchivo);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error al descargar el archivo CSV:', error);
        throw error;
    }
};

/**
 * Prepara los registros para exportarlos como CSV.
 * @param {Array} registros - Los registros originales.
 * @param {Array} columnas - Las columnas a incluir en el CSV.
 * @param {Function} [procesarDatosParaCSV] - Función opcional para transformar los datos.
 * @returns {Array} Registros transformados.
 */
const prepararRegistrosParaCSV = async (registros, columnas, procesarDatosParaCSV) => {
    if (procesarDatosParaCSV) {
        const resultados = await procesarDatosParaCSV(registros);
        return resultados
    } else {
        return registros.map(record => {
            const registroTransformado = {};
            columnas.forEach(columna => {
                registroTransformado[columna.header] = record[columna.campo];
            });
            return registroTransformado;
        });
    }
};

// Función para obtener el idioma desde localStorage
const getIdiomaDefecto = () => {
    if (typeof localStorage === 'undefined') {
        return 'es'; // Idioma por defecto si localStorage no está disponible
    }
    let idioma = localStorage.getItem('idioma');
    if (!idioma) {
        idioma = 'es'; // Idioma por defecto
        localStorage.setItem('idioma', idioma);
    }
    return idioma;
};

const descargarCSV = async (registros = [], columnas, procesarDatosParaCSV, getRegistros, setDescargarCSVDialog, nombreArchivo) => {
    try {
        let registrosTransformados = [];
        let archivoNombre;
        let registrosAdescargar = [];
        if (registros.length > 0) {
            registrosAdescargar = registros
            archivoNombre = `${nombreArchivo}-mostrados.csv`;
        } else {
            registrosAdescargar = await getRegistros(JSON.stringify({}));
            archivoNombre = `${nombreArchivo}-todos.csv`;
        }

        registrosTransformados = await Promise.resolve(
            prepararRegistrosParaCSV(registrosAdescargar, columnas, procesarDatosParaCSV)
        );

        const encabezados = Object.keys(registrosTransformados[0] || {});
        generarYDescargarCSV(registrosTransformados, encabezados, archivoNombre);
    } catch (err) {
        console.error('Error al descargar los registros:', err);
    }
    setDescargarCSVDialog(false);
};

const DescargarCSVDialog = ({
    visible,
    onHide,
    header = intl.formatMessage({ id: 'Descargar archivo CSV' }),
    labelMostrados = intl.formatMessage({ id: 'Registros mostrados' }),
    labelTodos = intl.formatMessage({ id: 'Todos los registros' }),
    registros,
    getRegistros,
    setDescargarCSVDialog,
    nombreArchivo,
    procesarDatosParaCSV,
    columnas
}) => {
    const footer = (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Button
                label={labelMostrados}
                icon="pi pi-download"
                text
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => descargarCSV(registros, columnas, procesarDatosParaCSV, getRegistros, setDescargarCSVDialog, nombreArchivo)}
            />
            <Button
                label={labelTodos}
                icon="pi pi-download"
                text
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => descargarCSV([], columnas, procesarDatosParaCSV, getRegistros, setDescargarCSVDialog, nombreArchivo)}
            />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            style={{ width: "450px" }}
            header={header}
            modal
            footer={footer}
            onHide={onHide}
        >
        </Dialog>
    );
};


export {
    comprobarImagen, manejarCambioImagen, templateGenerico, ErrorDetail,
    botonesDeAccionTemplate, eliminarDialogFooter, Header, dialogFooter,
    EliminarDialog, filtroActivoSnTemplate, opcionesActivoSnTemplate,
    generarYDescargarCSV, prepararRegistrosParaCSV, DescargarCSVDialog,
    formatearBytes, esUrlImagen, getIdiomaDefecto, tieneUsuarioPermiso,
    obtenerTodosLosPermisos,

};