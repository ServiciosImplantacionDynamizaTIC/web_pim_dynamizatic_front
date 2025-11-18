"use client";

import React, { useEffect, useRef, useState } from "react";
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { comprobarImagen, templateGenerico, Header, esUrlImagen, DescargarCSVDialog, getIdiomaDefecto, tieneUsuarioPermiso } from "@/app/components/shared/componentes";
import { formatearFechaDate, formatearFechaHoraDate, formatearFechaLocal_a_toISOString, formatNumber, getUsuarioSesion } from "@/app/utility/Utils";
import CodigoQR from "./codigo_qr";
import { Divider } from "primereact/divider";
import { postEnviarQR } from "@/app/api-endpoints/plantilla_email";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from 'primereact/inputtext';
import { obtenerArchivosSeccion } from "@/app/components/shared/componentes";
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from "primereact/calendar";
import { Badge } from 'primereact/badge';
import { Paginator } from 'primereact/paginator';
import { getVistaTipoArchivoEmpresaSeccion } from "@/app/api-endpoints/tipo_archivo";
import { getVistaArchivoEmpresa } from "@/app/api-endpoints/archivo";
import { borrarFichero } from "@/app/api-endpoints/ficheros"
import { useIntl } from 'react-intl'
import { formatPhoneNumberIntl } from 'react-phone-number-input'
import PhoneInput from 'react-phone-input-2'
import es from 'react-phone-input-2/lang/es.json'
import { useRouter } from 'next/navigation';
import { useTheme } from "@/app/providers/ThemeProvider";
const Crud = ({ getRegistros, getRegistrosCount, botones, columnas, deleteRegistro, headerCrud, seccion,
    editarComponente, editarComponenteParametrosExtra, filtradoBase, procesarDatosParaCSV, controlador,
    parametrosEliminar, mensajeEliminar, registroEditar, urlQR, getRegistrosForaneos, validarEliminar, validarEditar }) => {
    const intl = useIntl()
    const router = useRouter();
    const { themeConfig } = useTheme(); // Hook para obtener el tema actual

    // Función para obtener el color primario del tema actual
    const obtenerColorPrimario = () => {
        const coloresTemas = {
            'indigo': '#6366F1',
            'blue': '#3B82F6', 
            'purple': '#8B5CF6',
            'teal': '#14B8A6',
            'cyan': '#06B6D4',
            'green': '#10B981',
            'orange': '#F59E0B',
            'pink': '#EC4899',
            'mitema': '#db336e' // Color por defecto
        };
        
        return coloresTemas[themeConfig?.theme] || coloresTemas['mitema'];
    };

    //Crea el registro vacio con solo id para luego crear el resto de campos vacios dinamicamente
    let emptyRegistro = {
        id: ""
    };
    let filtros = {}

    for (const columna of columnas) {
        //Crea los registros vacios
        if (columna.tipo === 'booleano') {
            emptyRegistro[columna.campo] = 'S';

        } else {
            emptyRegistro[columna.campo] = '';
        }
        //Crea los filtros que va a usar el dataTable a partir de la variable columnas
        if (columna.tipo !== 'imagen') {
            filtros[((columna.campo))] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] };
        }

    }

    const [registros, setRegistros] = useState([]);
    const [registro, setRegistro] = useState(emptyRegistro);
    const [registroEditarFlag, setRegistroEditarFlag] = useState(registroEditar != null);
    const [registroResult, setRegistroResult] = useState("");
    const [idEditar, setIdEditar] = useState(null);
    const [registrosTipoArchivos, setRegistrosTipoArchivos] = useState([]);

    const [eliminarRegistroDialog, setEliminarRegistroDialog] = useState(false);
    const [descargarCSVDialog, setDescargarCSVDialog] = useState(false);
    const [mostarQRDialog, setMostarQRDialog] = useState(false);
    const [correoEnviarQR, setCorreoEnviarQR] = useState("");
    const [urlQREncriptado, setUrlQREncriptado] = useState("");
    const [valorDeFiltroGlobal, setValorDeFiltroGlobal] = useState("");
    const [opcionesActivoSn] = useState(['S', 'N']);
    const toast = useRef(null);
    const referenciaDataTable = useRef(null);
    const [editable, setEditable] = useState(false);
    const [puedeCrear, setPuedeCrear] = useState(true);
    const [puedeVer, setPuedeVer] = useState(true);
    const [puedeEditar, setPuedeEditar] = useState(true);
    const [puedeBorrar, setPuedeBorrar] = useState(true);
    const [puedeRealizar, setPuedeRealizar] = useState(true);
    const [busquedaRealizada, setBusquedaRealizada] = useState(false);
    const [registrosForaneos, setRegistrosForaneos] = useState({});
    const [operadorSeleccionado, setOperadorSeleccionado] = useState('or');

    const [totalRegistros, setTotalRegistros] = useState(0);
    //Parametros del dataTable que usara para cargar los datos
    const [parametrosCrud, setParametrosCrud] = useState(() => {
        const primeraColumnaNoImagen = columnas.find(columna => columna.tipo !== 'imagen');
        return {
            first: 0,
            rows: 10,
            sortField: primeraColumnaNoImagen ? primeraColumnaNoImagen.campo : columnas[0].campo, // Por defecto se ordena por la primera columna que no sea de tipo "imagen", si no existe, la primera columna
            sortOrder: 1, // Por defecto se ordena en ascendente
            filters: filtros,
        };
    });

    const obtenerDatos = async () => {
        // Crear parámetros de consulta dinámicamente
        const whereFiltro = {
            ...crearFiltros(parametrosCrud.filters, operadorSeleccionado),
        };
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

        //Si no se ha ordenado ningun campo se manda el order en null
        let order = null
        if (parametrosCrud.sortField !== null && parametrosCrud.sortOrder !== null) {
            order = `${parametrosCrud.sortField} ${parametrosCrud.sortOrder === 1 ? 'ASC' : 'DESC'}`
        }
        //Por defecto se ordena por la primera columna en ascendente
        // else{
        //     order = `${columnas[0].campo} ASC`
        // }

        //Parametros para la peticion a la api
        const queryParams = {
            limit: parametrosCrud.rows,
            offset: parametrosCrud.first,
            order: order,
            where: whereFiltro
        };

        try {
            //Obtenemos los registros para rellenar el crud
            const registros = await getRegistros(JSON.stringify(queryParams));

            //Comprueba si alguna columna recibida es una fecha para poder formatearla en formato dia/mes/año
            if (columnas.some(obj => obj.tipo === 'fecha' || obj.tipo === 'fechaHora')) {
                for (const columna of columnas) {
                    if (columna.tipo === 'fecha' || columna.tipo === 'fechaHora') {
                        //Formatea las fechas del registro
                        for (const registro of registros) {
                            if (registro[columna.campo] === null) {
                                registro[columna.campo] = ''
                            } else {
                                const campoDeFechaFormateado = new Date(registro[columna.campo])
                                registro[columna.campo] = campoDeFechaFormateado
                            }
                        }
                    }
                }
            }
            //Si seccion no es null significa que la pantalla del crud tiene archivos, por lo que hay que obtenerlos
            if (seccion) {
                //Obtiene los tipos de archivo de la seccion
                const queryParamsTiposArchivo = {
                    where: {
                        and: {
                            nombreSeccion: seccion || '',
                            activoSn: 'S'
                        }

                    },
                    order: "orden ASC"
                };
                const registrosTipoArchivos = await getVistaTipoArchivoEmpresaSeccion(JSON.stringify(queryParamsTiposArchivo));

                //Por cada tipo de archivo que tiene la seccion, intentamos obtener los archivos del tipo si existen
                for (const tipoArchivo of registrosTipoArchivos) {
                    for (const registro of registros) {
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
                                //Guarda el archivo redimensionado en el registro
                                let url = archivos[0].url;
                                if (url !== '/multimedia/sistemaNLE/imagen-no-disponible.jpeg') {
                                    if ((tipoArchivo.tipo).toLowerCase() === 'imagen') {
                                        url = archivos[0].url.replace(/(\/[^\/]+\/)([^\/]+\.\w+)$/, '$11250x850_$2');
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
                                    if (esUrlImagen(url) && url !== '/multimedia/sistemaNLE/imagen-no-disponible.jpeg') {
                                        url = archivo.url.replace(/(\/[^\/]+\/)([^\/]+\.\w+)$/, '$11250x850_$2');
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
                setRegistrosTipoArchivos(registrosTipoArchivos)
            }
            setRegistros(registros);

            //Obtenemos el numero del total de registros
            const registrosTotal = await getRegistrosCount(JSON.stringify(whereFiltro));
            if (typeof registrosTotal === 'number') {
                setTotalRegistros(registrosTotal);
            }
            else if (Array.isArray(registrosTotal)) {
                setTotalRegistros(registrosTotal[0].count);
            }
            else {
                setTotalRegistros(registrosTotal.count);
            }

            if (registroEditarFlag) {
                setEditable(true);
                setIdEditar(registroEditar);
            }

        } catch (err) {
            console.log(err.message);
        } finally {
            console.log('Carga completa');
        }
    };

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
        setPuedeRealizar(await tieneUsuarioPermiso(controlador, 'actualizar'));

    }

    useEffect(() => {
        //Si no hay un controlador declarado, no se revisan los permisos
        if (controlador) {
            obtenerPermisos()
        }
        //Si hay que obtener los datos foraneos, se obtienen al montar el componente
        obtenerDatosForaneos();
        //Encriptamos el url del qr
        if (urlQR) {
            const urlEncriptado = `${urlQR.normal}${btoa(urlQR.encriptado)}`;
            setUrlQREncriptado(urlEncriptado);
        }
        //Cada vez que se modifica lazyParams o registroResult, se obtienen los datos
        //Solo se obtienen datos si hay algun filtro de busqueda
        for (const campo in parametrosCrud.filters) {
            if (parametrosCrud.filters[campo]) {
                //Como el objeto filters es distinto para booleanos, tenemos que hacer una comprobación para aplicar bien los cambios
                //Comprueba si es un filtro booleano
                if (parametrosCrud.filters[campo].value) {
                    setBusquedaRealizada(true);
                    obtenerDatos();
                    break;
                }
                else {
                    //Si el filtro no es booleano
                    if (parametrosCrud.filters[campo].constraints[0].value !== null) {
                        setBusquedaRealizada(true);
                        obtenerDatos();
                        break;
                    }
                }
            }
            else {
                setBusquedaRealizada(false);
            }
        }
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
        if (registroEditarFlag) {
            obtenerDatos();
        }
        setRegistroResult("");
    }, [registroResult, parametrosCrud]);

    const obtenerDatosForaneos = async () => {
        if (getRegistrosForaneos) {
            for (const key in getRegistrosForaneos) {
                if (getRegistrosForaneos.hasOwnProperty(key)) {
                    //Recorre el objeto getRegistrosForaneos y obtiene los registros foraneos
                    //Para luego poder usarlos en los dropdown de los filtros de las columnas
                    const registrosForaneo = await getRegistrosForaneos[key]();

                    //Como no podemos usar el get para filtrar por empresaId, porque no sabemos si la tabla tiene la propiedad,
                    //Primero almacenamos la propiedad empresaId o empresa_id, y asi en caso de que tengan empresa tendremos su valor
                    const jsonDeForaneo = registrosForaneo.map(foraneo => ({
                        id: foraneo.id,
                        nombre: foraneo.nombre,
                        empresaId: foraneo.empresaId || foraneo.empresa_id
                    })).sort((a, b) => a.nombre.localeCompare(b.nombre));
                    //Si empresaId no tiene valor, lo eliminamos del array porque significa que la tabla esa columna
                    if (!jsonDeForaneo.every(foraneo => foraneo.empresaId === undefined || foraneo.empresaId === null)) {
                        jsonDeForaneo.forEach((foraneo, index) => {
                            if (foraneo.empresaId !== getUsuarioSesion().empresaId) {
                                jsonDeForaneo.splice(index, 1);
                            }
                        });
                    }

                    const arrayForaneo = jsonDeForaneo.map(foraneo => foraneo.nombre);
                    setRegistrosForaneos(prevState => ({
                        ...prevState,
                        [key]: arrayForaneo
                    }));
                }
            }
        }

    }

    {/* F I L T R O S */ }
    const limpiarFiltros = () => {
        //Limpia el filtro seleccionado de params y guarda los cambios
        const _parametrosCrud = { ...parametrosCrud };

        // //Recorre el objeto filtros y cambia el valor a null de todos los filtros
        // for (const [key, value] of Object.entries(_parametrosCrud.filters)) {
        //     //Comprueba si es un filtro booleano
        //     if (_parametrosCrud.filters[key].value) {
        //         _parametrosCrud.filters[key].value = null
        //     }
        //     else {
        //         //Si el filtro no es booleano
        //         _parametrosCrud.filters[key] = { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] };
        //     }
        // }
        setValorDeFiltroGlobal("")

        // Recorre las columnas dinámicas y activa el evento filterClearTemplate si está definido
        const filtros = {}

        for (const columna of columnas) {
            //Crea los registros vacios
            if (columna.tipo === 'booleano') {
                emptyRegistro[columna.campo] = 'S';

            } else {
                emptyRegistro[columna.campo] = '';
            }
            //Crea los filtros que va a usar el dataTable a partir de la variable columnas
            if (columna.tipo !== 'imagen') {
                //Importante meter como valor un string vacio para que el useEffect capte que queremos hacer una busqueda con filtro vacio
                //Si fuese null el valor, no buscaria porque se entenderia que no hay filtro
                filtros[((columna.campo))] = { operator: FilterOperator.OR, constraints: [{ value: "", matchMode: FilterMatchMode.EQUALS }] };
            }

        }
        _parametrosCrud.filters = filtros;
        setParametrosCrud(_parametrosCrud);

        //Obtenemos los datos de nuevo
        //obtenerDatos();
    };

    //Guarda el valor del input para luego usarlo de filtro
    const manejarCambioFiltroGlobal = (e) => {
        const valor = e.target.value;
        setValorDeFiltroGlobal(valor);
    };

    //Aplica el valor del filtro global
    const manejarBusquedaFiltroGlobal = () => {
        //Sobreescribe todos los filtros con el valor del input
        const _parametrosCrud = { ...parametrosCrud };

        //Recorre el objeto filtros y cambia el valor a null de todos los filtros
        for (const [key, value] of Object.entries(_parametrosCrud.filters)) {
            //Comprueba si es un filtro booleano
            if (_parametrosCrud.filters[key].value) {
                _parametrosCrud.filters[key].value = valorDeFiltroGlobal
            }
            else {
                //Si el filtro no es booleano
                _parametrosCrud.filters[key].constraints[0].value = valorDeFiltroGlobal
            }
        }

        setParametrosCrud(_parametrosCrud);
    };

    //Limpia el filtro seleccionado y guarda los cambios
    const filtroLimpiar = (columna) => {
        const _parametrosCrud = { ...parametrosCrud };
        _parametrosCrud.filters[columna].constraints[0].value = null
        setParametrosCrud(_parametrosCrud);
    };

    //Funcion que se activa cuando limpiamos un filtro
    const limpiarFiltrosTemplate = (options) => {
        let filtroField = '';
        //Obtiene el nombre del campo y el valor para limpiar el filtro
        if (options.filterModel !== undefined) {
            filtroField = options.field;
        }
        return <Button type="button" className="p-button-outlined p-component p-button-sm" onClick={() => {
            options.filterClearCallback();
            filtroLimpiar(filtroField);
        }}>
            <span>{intl.formatMessage({ id: 'Limpiar' })}</span>
        </Button>;
    };
    // Generar filtros dinámicos a partir de los filtros de PrimeReact
    const crearFiltros = (filtros, condicional) => {
        const queryFilters = {
            or: {},
            and: {},
            orNot: {},
            andNot: {}
        };
        for (const campo in filtros) {
            if (filtros[campo]) {
                //Como el objeto filters es distinto para booleanos, tenemos que hacer una comprobación para aplicar bien los cambios
                //Comprueba si es un filtro booleano
                if (filtros[campo].value) {
                    //Si es null, no lo añade
                    if (filtros[campo].value !== null) {
                        queryFilters[condicional][campo] = filtros[campo].value;
                    }

                }
                else {
                    //Si el filtro no es booleano
                    //Si es null, no lo añade
                    if (filtros[campo].constraints[0].value !== null) {
                        //Si es una fecha, se formatea a string
                        if (filtros[campo].constraints[0].value instanceof Date) {
                            queryFilters[condicional][campo] = filtros[campo].constraints[0].value.toLocaleDateString('sv-SE');
                        }
                        else {
                            queryFilters[condicional][campo] = filtros[campo].constraints[0].value;
                        }
                    }
                }
            }
        }
        return queryFilters;
    };


    const filtroActivoSnTemplate = (options) => {
        return <Dropdown value={options.value} options={opcionesActivoSn} onChange={(e) => {
            options.filterCallback(e.value, options.index);
        }} itemTemplate={opcionesActivoSnTemplate} placeholder={intl.formatMessage({ id: 'OpcionesActivoSN' })} className="p-column-filter" showClear />;
    };

    const obtenerSeverity = (opcion) => {
        switch (opcion) {
            case 'S':
                return 'success';

            case 'N':
                return 'secondary';
        }
    };

    const obtenerValueSN = (opcion) => {
        switch (opcion) {
            case 'S':
                return intl.formatMessage({ id: 'SI' });
            case 'N':
                return intl.formatMessage({ id: 'NO' });
        }
    };

    const opcionesActivoSnTemplate = (option) => {
        return <Badge value={obtenerValueSN(option)} severity={obtenerSeverity(option)} />;
    };

    const activoSNTemplate = (campo) => (rowData) => {
        //const activo = rowData.campo === "S" ? intl.formatMessage({ id: 'SI' }) : intl.formatMessage({ id: 'NO' });
        return (
            <>
                <span className="p-column-title" >activoSN</span>
                {rowData[campo] === "S" && <Badge value={intl.formatMessage({ id: 'SI' })} severity="success"></Badge>}
                {rowData[campo] === "N" && <Badge value={intl.formatMessage({ id: 'NO' })} severity="secondary"></Badge>}
            </>
        );
    };

    const filtroAplicarTemplate = (options) => {
        return <Button type="button" className="p-button p-component p-button-sm" onClick={options.filterApplyCallback} label={intl.formatMessage({ id: 'Aplicar' })}></Button>;
    };

    const filtroFechaTemplate = (options) => {
        return <Calendar value={options.value} onChange={(e) => options.filterCallback(e.value, options.index)} dateFormat="dd/mm/yy" locale={getIdiomaDefecto()} placeholder="dd/mm/yyyy" mask="99/99/9999" />;
    };

    const filtroTelefonoTemplate = (options) => {
        return <PhoneInput
            //country={getIdiomaDefecto() === 'es' ? 'es' : getIdiomaDefecto() === 'en' ? 'gb' : 'gb'}
            localization={getIdiomaDefecto() === 'es' ? es : getIdiomaDefecto() === 'en' ? 'en' : 'en'}
            international
            value={options.value || ""}
            countryCallingCodeEditable={false}
            onChange={(e) => {
                options.filterCallback(`+${e}`, options.index);
            }}
            limitMaxLength={true}
            inputClass='p-inputtext p-component p-filled w-full'
            inputStyle={{ padding: '0.75rem 0px 0.75rem 60px' }}
        />;
    };

    const filtroForaneoTemplate = (options) => {
        const registroForaneo = registrosForaneos[options.field] || [];

        return <Dropdown placeholder={intl.formatMessage({ id: 'Selecciona una opción' })}
            value={options.value} options={registroForaneo} onChange={(e) => {
                options.filterCallback(e.value, options.index);
            }} className="p-column-filter" showClear />;
    };

    // Función para validar si se puede eliminar un registro
    const puedeEliminarRegistro = (rowData) => {
        // Si no hay validación, permitir eliminar
        if (!validarEliminar) return true;
        
        if (validarEliminar.campo && validarEliminar.valores) {
            const valorCampo = rowData[validarEliminar.campo];
            // Retornar true si el valor NO está en la lista (permitir eliminar)
            return !validarEliminar.valores.includes(valorCampo);
        }
        
        return true;
    };

    // Función para validar si se puede editar un registro
    const puedeEditarRegistro = (rowData) => {
        // Si no hay validación, permitir editar
        if (!validarEditar) return true;
        
        if (validarEditar.campo && validarEditar.valores) {
            const valorCampo = rowData[validarEditar.campo];
            // Retornar true si el valor NO está en la lista (permitir editar)
            return !validarEditar.valores.includes(valorCampo);
        }
        
        return true;
    };

    const botonesDeAccionTemplate = (rowData) => {

        return (
            <>
                {((botones.includes('ver') && puedeVer)) && (
                    <Button
                        icon="pi pi-eye"
                        className="mr-2"
                        rounded
                        title={intl.formatMessage({ id: 'Ver' })}
                        severity="info"
                        onClick={() => verRegistro(rowData)}
                    />
                )}
                {(botones.includes('editar') && puedeEditar && puedeEditarRegistro(rowData)) && (
                    <Button
                        icon="pi pi-pencil"
                        className="mr-2"
                        rounded
                        title={intl.formatMessage({ id: 'Editar' })}
                        severity="success"
                        onClick={() => editarRegistro(rowData)}
                    />
                )}
                {(botones.includes('eliminar') && puedeBorrar && puedeEliminarRegistro(rowData)) && (
                    <Button
                        icon="pi pi-trash"
                        rounded
                        title={intl.formatMessage({ id: 'Eliminar' })}
                        severity="warning"
                        onClick={() => confirmarEliminarRegistro(rowData)}
                    />
                )}                
            </>
        );
    };

    // Función para actualizar cambios en los parametros del crud
    const actualizarParametrosCrud = (event) => {
        setParametrosCrud(event);
    }

    // Manejar los cambios en los filtros
    const manejarCambioFiltro = (event) => {
        const { filters } = event;
        setParametrosCrud({
            ...parametrosCrud,
            first: 0, // Como se va a volver a realizar una carga de datos, marcamos el inicio de los datos al principio, para reiniciar la paginación
            filters,  // Actualizar los filtros
        });
    };

    const crearNuevoRegistro = async () => {
        //Hacemos esto sin el await para obtener los archivos de la seccion
        //obtenerDatos()

        // Verificamos que no falten campos de archivos
        if (seccion && registrosTipoArchivos.length === 0) {
            const listaTipoArchivos = await obtenerArchivosSeccion(registro, seccion)
            console.log('Lista de tipos de archivos:', listaTipoArchivos)
            setRegistrosTipoArchivos(listaTipoArchivos)
        }
        setEditable(true);
        setIdEditar(0);
    };

    const mostrarQRDialog = () => {
        setMostarQRDialog(true);
    };

    const mostrarEnvioMail = () => {
        const obtenerUsuariosActivos = async () => {
            try {
                const usuariosActivos = await getRegistros(JSON.stringify({
                    where: {
                        and: {
                            activoSn: 'S',
                            empresaId: getUsuarioSesion().empresaId
                        }
                    },
                    order: 'nombre ASC'
                })
                );
                const usuariosFormateados = usuariosActivos.map(usuario => ({
                    nombre: `${usuario.nombre} (${usuario.mail})`,
                    email: usuario.mail
                }));
                localStorage.setItem('usuariosMail', JSON.stringify(usuariosFormateados));

                router.push('/tablas-maestras/enviar_email');
            } catch (error) {
                console.error('Error al obtener usuarios activos:', error);
            }
        };

        obtenerUsuariosActivos();
    };


    const ocultarQRDialog = () => {
        setMostarQRDialog(false);
    };

    const enviarCorreoQR = async () => {
        const parametrosQR = {
            empresaId: getUsuarioSesion().empresaId,
            emails: [correoEnviarQR],
        }
        await postEnviarQR(urlQREncriptado, JSON.stringify(parametrosQR))
        setMostarQRDialog(false);
        toast.current?.show({
            severity: "success",
            summary: "OK",
            detail: intl.formatMessage({ id: 'Email enviado correctamente.' }),
            life: 3000,
        });
    }

    const confirmarDescargarArchivoCSV = () => {
        setDescargarCSVDialog(true);
    };

    const ocultarDescargarCSVDialog = () => {
        setDescargarCSVDialog(false);
    };

    const editarRegistro = (registro) => {
        setEditable(true);
        setIdEditar(registro.id);
    };

    const verRegistro = (registro) => {
        setEditable(false);
        setIdEditar(registro.id);
    };


    //Funcion que renderiza el compontente que servira para editar el registro
    const renderizarEditarComponente = () => {
        // Devuelve el componente con las propiedades aplicadas, MUY IMPORTANTE que el componente reciba las mismas propiedades
        return React.cloneElement(editarComponente, {
            idEditar: idEditar,
            editable: editable,
            setIdEditar: setIdEditar,
            rowData: registros,
            emptyRegistro: emptyRegistro,
            setRegistroResult: setRegistroResult,
            listaTipoArchivos: registrosTipoArchivos,
            seccion: seccion,
            setRegistroEditarFlag: setRegistroEditarFlag,
            ...editarComponenteParametrosExtra
        });
    }

    //Funcion que renderiza el componente header
    const renderizarHeader = () => {
        // Devuelve el componente con las propiedades aplicadas, MUY IMPORTANTE que el componente reciba las mismas propiedades
        const propiedadesHeader = {
            limpiarFiltros: limpiarFiltros,
            valorDeFiltroGlobal: valorDeFiltroGlobal,
            manejarCambioFiltroGlobal: manejarCambioFiltroGlobal,
            manejarBusquedaFiltroGlobal: manejarBusquedaFiltroGlobal,
            nombre: headerCrud,
            operadorSeleccionado: operadorSeleccionado,
            setOperadorSeleccionado: setOperadorSeleccionado,
            listaOperadores: [
                { label: intl.formatMessage({ id: 'OR' }), value: 'or' },
                { label: intl.formatMessage({ id: 'AND' }), value: 'and' },
                { label: intl.formatMessage({ id: 'OR NOT' }), value: 'orNot' },
                { label: intl.formatMessage({ id: 'AND NOT' }), value: 'andNot' },
            ],
        }

        if (botones.includes('nuevo') && puedeCrear) {
            propiedadesHeader['crearNuevo'] = crearNuevoRegistro
        }
        if (botones.includes('mostrarQR') && puedeCrear) {
            propiedadesHeader['mostrarQR'] = mostrarQRDialog
        }
        if (botones.includes('enviarCorreo')) {
            propiedadesHeader['enviarCorreo'] = mostrarEnvioMail
        }
        if (botones.includes('descargarCSV')) {
            propiedadesHeader['generarCSV'] = confirmarDescargarArchivoCSV
        }
        return React.cloneElement(<Header />, propiedadesHeader);
    }


    const confirmarEliminarRegistro = (registro) => {
        setRegistro({ ...registro });
        setEliminarRegistroDialog(true);
    };

    const eliminarRegistro = async () => {
        try {
            //Si tiene la seccion declarada, significa que tiene archivos, por lo que hay que borrar los archivos
            if (seccion) {
                for (const tipoArchivo of registrosTipoArchivos) {
                    if (registro[(tipoArchivo.nombre).toLowerCase()] !== null) {
                        //Si el archivo es unico
                        if (typeof registro[(tipoArchivo.nombre).toLowerCase()] === 'string') {
                            //Borra la version sin redimensionar
                            const url = (registro[(tipoArchivo.nombre).toLowerCase()]).replace(/(\/[^\/]+\/)1250x850_([^\/]+\.\w+)$/, '$1$2');
                            await borrarFichero(url);
                            if ((tipoArchivo.tipo).toLowerCase() === 'imagen') {
                                //Tambien borra la version redimensionada
                                await borrarFichero(registro[(tipoArchivo.nombre).toLowerCase()]);
                            }
                        }
                        //En cambio si el archivo contiene vario se borran todos
                        else if ((Array.isArray(registro[(tipoArchivo.nombre).toLowerCase()]))) {
                            for (const archivo of registro[(tipoArchivo.nombre).toLowerCase()]) {
                                const url = (archivo.url).replace(/(\/[^\/]+\/)1250x850_([^\/]+\.\w+)$/, '$1$2');
                                await borrarFichero(url);
                                //Comprueba la extension del archivo para comprobar el tipo, porque al ser un campo con multiples archivos
                                //ya no sirve comprobarlo por el tipoArchivo
                                const imagenExtensionesRegex = /\.(jpeg|png|webp|tiff|avif|jpg)$/i;
                                if (imagenExtensionesRegex.test(archivo.url)) {
                                    //Tambien borra la version sin redimensionar
                                    await borrarFichero(archivo.url);
                                }
                            }
                        }

                    }
                }
            }
            // Si se han asignado parametros customizados para eliminar, se elimina a partir de esos campos 
            // PARA QUE FUNCIONE ESTOS TIENEN QUE SER IDS, ESTO ES SOLO PARA CASOS DONDE EL CRUD TRATA DE UNA VISTA CON VARIOS IDS
            if (parametrosEliminar && parametrosEliminar.length > 0) {
                for (const parametroEliminar of parametrosEliminar) {
                    await deleteRegistro(registro[parametroEliminar]);
                }
            }
            else {
                await deleteRegistro(registro.id);
            }


            // Si se ha podido borrar el registro muestra un toast y los datos cambiados
            toast.current?.show({
                severity: "success",
                summary: "OK",
                detail: intl.formatMessage({ id: 'Registro elmininado correctamente.' }),
                life: 3000,
            });
            setRegistro(emptyRegistro);
            obtenerDatos();
        } catch (error) {
            //Si ha habido un error borrando el registro lo muestra
            if (error.message === 'Request failed with status code 500' || error.response.data.error.message === "No se pudo eliminar el registro porque tiene otros registros relacionados.") {
                toast.current?.show({
                    severity: "error",
                    summary: "ERROR",
                    detail: intl.formatMessage({ id: 'El registro no se puede eliminar porque tiene otros registros hijos.' }),
                    life: 3000,
                });
            }
            else {
                toast.current?.show({
                    severity: "error",
                    summary: "ERROR",
                    detail: error.message,

                });
            }

        }
        setEliminarRegistroDialog(false);
    };
    const ocultarEliminarRegistroDialog = () => {
        setEliminarRegistroDialog(false);
    };

    const eliminarRegistroDialogFooter = (
        <>
            <Button
                label={intl.formatMessage({ id: 'NO' })}
                icon="pi pi-times"
                text
                onClick={ocultarEliminarRegistroDialog}
            />
            <Button
                label={intl.formatMessage({ id: 'SI' })}
                icon="pi pi-check"
                text
                onClick={eliminarRegistro}
            />
        </>
    );

    const mostrarQRDialogFooter = (
        <>
            <div className="formgrid grid">
                <div className="flex field gap-2 mt-2 col-2" style={{ alignItems: 'center' }}>
                    <label htmlFor="paisNombre">{intl.formatMessage({ id: 'Email' })}</label>
                </div>
                <div className="flex field gap-2 mt-2 col-7">
                    <InputText value={correoEnviarQR}
                        style={{ width: '100%' }}
                        onChange={(e) => setCorreoEnviarQR(e.target.value)}
                        rows={5} cols={30} maxLength={150} />
                </div>

                <div className="flex field gap-2 mt-2 col-3">
                    <Button
                        label={intl.formatMessage({ id: 'Enviar' })}
                        text
                        onClick={enviarCorreoQR}
                    />
                </div>
            </div>
        </>
    );

    //Muestra cuantos registros tiene el paginator
    const paginatorTemplate = {
        layout: 'RowsPerPageDropdown PrevPageLink PageLinks NextPageLink CurrentPageReport',
        CurrentPageReport: (options) => {
            return (
                <span style={{ color: 'var(--text-color)', userSelect: 'none' }}>
                    {intl.formatMessage({ id: 'Mostrando' })} {options.first} {intl.formatMessage({ id: 'a' })} {options.last} {intl.formatMessage({ id: 'de' })} {options.totalRecords} {intl.formatMessage({ id: 'registros' })}
                </span>
            );
        }
    };

    const manejarCambioDePagina = (event) => {
        const _parametrosCrud = { ...parametrosCrud }
        _parametrosCrud.first = event.first
        _parametrosCrud.rows = event.rows
        setParametrosCrud(_parametrosCrud)
    };

    const costeTemplate = (campo) => (rowData) => {
        if (rowData[campo].length > 30) {
            return (
                <>
                    <Tooltip target=".costeTemplate"></Tooltip>
                    {/* 30 - 1 caracteres de limite porque el '...' cuenta como un caracter */}
                    <span style={{
                        width: '100%', display: 'block', maxWidth: '29ch', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }} className="costeTemplate" data-pr-tooltip={rowData[campo]}>{formatNumber(parseFloat(rowData[campo]))}</span>
                </>
            );
        }
        else {
            return (
                <span>{formatNumber(parseFloat(rowData[campo]))}</span>
            );
        }
    };

    const porcentajeTemplate = (campo) => (rowData) => {
        if (rowData[campo].length > 30) {
            return (
                <>
                    <Tooltip target=".porcentajeTemplate"></Tooltip>
                    {/* 30 - 2 caracteres de limite porque el '...' y el '%' cuentan como caracter */}
                    <span style={{
                        width: '100%', display: 'block', maxWidth: '28ch', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }} className="porcentajeTemplate" data-pr-tooltip={rowData[campo]}>{formatNumber(parseFloat(rowData[campo]))}%</span>
                </>
            );
        }
        else {
            return (
                <span>{formatNumber(parseFloat(rowData[campo]))}%</span>
            );
        }

    };

    const telefonoTemplate = (campo) => (rowData) => {
        console.log(rowData[campo], formatPhoneNumberIntl(rowData[campo]))
        return (
            <span>{formatPhoneNumberIntl(rowData[campo])}</span>
        );
    };
    const fechaTemplate = (campo) => (rowData) => {
        if (rowData[campo] === '' || rowData[campo] === null) {
            return (
                <span>{''}</span>
            );
        } else {
            return (
                <span>{formatearFechaDate(rowData[campo])}</span>
            );
        }

    };

    const fechaHoraTemplate = (campo) => (rowData) => {
        const fecha = formatearFechaHoraDate(rowData[campo])
        console.log(fecha)
        return (
            <span>{fecha}</span>
        );
    };

    // Crear columnas dinámicas
    const columnasDinamicas = [];
    for (const columna of columnas) {
        const filterPlaceholder = `${intl.formatMessage({ id: 'Buscar por' })} ${(columna.header).toLowerCase()}`

        //Depende del tipo del columna se genera una u otra
        switch (columna.tipo) {
            case 'booleano':
                columnasDinamicas.push(
                    <Column
                        key={columna.campo}
                        field={columna.campo}
                        header={columna.header}
                        sortable
                        body={activoSNTemplate(columna.campo)}
                        filterMenuStyle={{ width: '14rem' }}
                        headerStyle={{ minWidth: "15rem" }}
                        filter
                        filterClear={limpiarFiltrosTemplate}
                        filterElement={filtroActivoSnTemplate}
                        filterApply={filtroAplicarTemplate}
                        showFilterMatchModes={false}
                        showFilterOperator={false}
                        showFilterMenuOptions={false}
                    ></Column>
                )
                break;
            case 'numero':
                columnasDinamicas.push(
                    <Column
                        key={columna.campo}
                        field={columna.campo}
                        header={columna.header}
                        align={"right"}
                        sortable
                        filter
                        showFilterMatchModes={false}
                        showFilterOperator={false}
                        showFilterMenuOptions={false}
                        body={costeTemplate(columna.campo)}
                        filterClear={limpiarFiltrosTemplate}
                        filterApply={filtroAplicarTemplate}
                        filterPlaceholder={filterPlaceholder}
                        headerStyle={{ minWidth: "15rem" }}
                    ></Column>
                );
                break;
            case 'porcentaje':
                columnasDinamicas.push(
                    <Column
                        key={columna.campo}
                        field={columna.campo}
                        header={columna.header}
                        align={"right"}
                        sortable
                        filter
                        showFilterMatchModes={false}
                        showFilterOperator={false}
                        showFilterMenuOptions={false}
                        body={porcentajeTemplate(columna.campo)}
                        filterClear={limpiarFiltrosTemplate}
                        filterApply={filtroAplicarTemplate}
                        filterPlaceholder={filterPlaceholder}
                        headerStyle={{ minWidth: "15rem" }}
                    ></Column>
                );
                break;
            case 'fecha':
                columnasDinamicas.push(
                    <Column
                        field={columna.campo}
                        header={columna.header}
                        sortable
                        body={fechaTemplate(columna.campo)}
                        filterMenuStyle={{ width: '14rem' }}
                        headerStyle={{ minWidth: "15rem" }}
                        filter
                        filterClear={limpiarFiltrosTemplate}
                        filterApply={filtroAplicarTemplate}
                        filterElement={filtroFechaTemplate}
                        showFilterMatchModes={false}
                        showFilterOperator={false}
                        showFilterMenuOptions={false}
                    ></Column>
                )
                break;
            case 'fechaHora':
                columnasDinamicas.push(
                    <Column
                        field={columna.campo}
                        header={columna.header}
                        sortable
                        body={fechaHoraTemplate(columna.campo)}
                        filterMenuStyle={{ width: '14rem' }}
                        headerStyle={{ minWidth: "15rem" }}
                        filter
                        filterClear={limpiarFiltrosTemplate}
                        filterApply={filtroAplicarTemplate}
                        filterElement={filtroFechaTemplate}
                        showFilterMatchModes={false}
                        showFilterOperator={false}
                        showFilterMenuOptions={false}
                    ></Column>
                )
                break;
            case 'imagen':
                columnasDinamicas.push(
                    <Column
                        field={columna.campo}
                        header={columna.header}
                        //sortable
                        //filter
                        //showFilterMatchModes={false}
                        //showFilterOperator={false}
                        //showFilterMenuOptions={false}
                        body={comprobarImagen(columna.campo, columna.header)}
                        filterClear={limpiarFiltrosTemplate}
                        filterPlaceholder={filterPlaceholder}
                        headerStyle={{ minWidth: "15rem" }}
                    ></Column>
                );
                break;
            case 'telefono':
                columnasDinamicas.push(
                    <Column
                        key={columna.campo}
                        field={columna.campo}
                        header={columna.header}
                        //align={"right"}
                        sortable
                        filter
                        showFilterMatchModes={false}
                        showFilterOperator={false}
                        showFilterMenuOptions={false}
                        filterApply={filtroAplicarTemplate}
                        filterElement={filtroTelefonoTemplate}
                        body={telefonoTemplate(columna.campo)}
                        filterClear={limpiarFiltrosTemplate}
                        filterPlaceholder={filterPlaceholder}
                        headerStyle={{ minWidth: "15rem" }}
                    ></Column>
                );
                break;
            case 'foraneo':
                columnasDinamicas.push(
                    <Column
                        key={columna.campo}
                        field={columna.campo}
                        header={columna.header}
                        sortable
                        filter
                        showFilterMatchModes={false}
                        showFilterOperator={true}
                        showFilterMenuOptions={false}
                        body={templateGenerico(columna.campo, columna.header)}
                        filterClear={limpiarFiltrosTemplate}
                        filterApply={filtroAplicarTemplate}
                        filterElement={filtroForaneoTemplate}
                        filterPlaceholder={filterPlaceholder}
                        headerStyle={{ minWidth: "15rem" }}
                        style={{}}
                    ></Column>
                );
                break;
            default:
                columnasDinamicas.push(
                    <Column
                        key={columna.campo}
                        field={columna.campo}
                        header={columna.header}
                        sortable
                        filter
                        showFilterMatchModes={false}
                        showFilterOperator={false}
                        showFilterMenuOptions={false}
                        body={templateGenerico(columna.campo, columna.header)}
                        filterClear={limpiarFiltrosTemplate}
                        filterApply={filtroAplicarTemplate}
                        filterPlaceholder={filterPlaceholder}
                        headerStyle={{ minWidth: "15rem" }}
                        style={{}}
                    ></Column>
                );
                break;
        }
    }

    return (
        <div>
            {(idEditar === null) && (
                <div className="grid">
                    <div className="col-12">
                        <div className="card">
                            <Toast ref={toast} position="top-right" />
                            {/* ENCABEZADO PRINCIPAL */}
                            <DataTable
                                className="datatable-responsive"
                                ref={referenciaDataTable}
                                header={renderizarHeader()}
                                dataKey="id"
                                value={registros}
                                filters={parametrosCrud.filters}
                                removableSort
                                rowsPerPageOptions={[5, 10, 25]}
                                //currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                                lazy
                                rows={parametrosCrud.rows}
                                totalRecords={totalRegistros}
                                first={parametrosCrud.first}
                                onPage={actualizarParametrosCrud}
                                onSort={actualizarParametrosCrud}
                                onFilter={manejarCambioFiltro}
                                sortField={parametrosCrud.sortField}
                                sortOrder={parametrosCrud.sortOrder}
                                emptyMessage={
                                    busquedaRealizada ?
                                        <span>{intl.formatMessage({ id: 'No se han encontrado registros' })}</span> :
                                        <div className="w-100" style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            height: '35px', backgroundColor: obtenerColorPrimario(), marginTop: '-0.5rem', marginRight: '-1rem', marginBottom: '-0.5rem', marginLeft: '-1rem'
                                        }}>
                                            <span style={{ color: 'white', fontWeight: 'bold' }}>{intl.formatMessage({ id: 'Realiza una búsqueda para mostrar los datos' })}</span>
                                        </div>

                                }
                            >
                                {
                                    ...columnasDinamicas //Muestra las columnas generadas
                                }
                                {(botones.length > 0 && !(botones.length === 1 && botones.includes('descargarCSV'))) && (
                                    <Column
                                        body={(rowData) => botonesDeAccionTemplate(rowData, botones)}
                                        header={intl.formatMessage({ id: 'Acciones' })}
                                        headerStyle={{ minWidth: "10rem" }}
                                        style={{ minWidth: '200px' }}
                                    ></Column>
                                )}
                            </DataTable>

                            <Paginator
                                first={parametrosCrud.first}
                                rows={parametrosCrud.rows}
                                totalRecords={totalRegistros}
                                rowsPerPageOptions={[5, 10, 20]}
                                onPageChange={manejarCambioDePagina}
                                template={paginatorTemplate}
                            />

                            {/* MODAL DE (ELIMINAR) REGISTRO */}
                            <Dialog
                                visible={eliminarRegistroDialog}
                                style={{ width: "450px" }}
                                header={intl.formatMessage({ id: '¿Eliminar registro?' })}
                                modal
                                footer={eliminarRegistroDialogFooter}
                                onHide={ocultarEliminarRegistroDialog}
                            >
                                <div className="flex align-items-center justify-content-center">
                                    <i
                                        className="pi pi-exclamation-triangle mr-3"
                                        style={{ fontSize: "2rem" }}
                                    />
                                    {registro && (
                                        <span>
                                            {intl.formatMessage({ id: mensajeEliminar || '¿Está seguro de que desea eliminar este registro?' })}
                                        </span>
                                    )}
                                </div>
                            </Dialog>
                            {/* MODAL DE (DESCARGAR CSV) */}
                            <DescargarCSVDialog
                                visible={descargarCSVDialog}
                                setDescargarCSVDialog={setDescargarCSVDialog}
                                onHide={ocultarDescargarCSVDialog}
                                registros={registros}
                                getRegistros={getRegistros}
                                nombreArchivo={headerCrud}
                                procesarDatosParaCSV={procesarDatosParaCSV}
                                columnas={columnas}
                                header={intl.formatMessage({ id: 'Descargar archivo CSV' })}
                                labelMostrados={intl.formatMessage({ id: 'Registros mostrados' })}
                                labelTodos={intl.formatMessage({ id: 'Todos los registros' })}
                            />
                            {/* MODAL DE MOSTRAR QR */}
                            <Dialog
                                visible={mostarQRDialog}
                                style={{ width: "450px" }}
                                //header={intl.formatMessage({ id: '¿Eliminar registro?' })}
                                modal
                                footer={mostrarQRDialogFooter}
                                onHide={ocultarQRDialog}
                            >
                                <div className="flex flex-column align-items-center justify-content-center">
                                    <p style={{ width: '100%' }}>
                                        {intl.formatMessage({ id: 'El sistema ha generado el siguiente Qr para completar el proceso de registro y activar una cuenta, puede escanear el código QR que se muestra a continuación con un dispositivo móvil.' })}:
                                    </p>

                                    <CodigoQR url={urlQREncriptado || ''} /><p></p>
                                    <span style={{ width: '100%' }}>
                                        {intl.formatMessage({ id: 'o pulsar el siguiente enlance' })}:
                                    </span>
                                    <a style={{ overflowWrap: 'anywhere' }} href={urlQREncriptado}>
                                        {urlQREncriptado}
                                    </a>
                                    <p></p>
                                    <p>
                                        {intl.formatMessage({ id: 'También tiene la posibilidad de enviarlo por mail introduciendo el email destinatario en el siguiente campo' })}:
                                    </p>
                                </div>
                            </Dialog>
                        </div>
                    </div>
                </div>
            )}

            {(idEditar === 0 || idEditar > 0) && //Se hace la comprobacion asi en vez de >= porque tecnicamente null tambien es 0 
                renderizarEditarComponente()
            }
        </div>
    );
};

export default Crud;