"use client";

import React, { useEffect, useRef, useState } from "react";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { getPermiso, postPermiso, patchPermiso, deletePermiso, getVistaEmpresaRolPermiso, getListaPermisos } from "@/app/api-endpoints/permisos";
import { getRol, getNombreRol } from "@/app/api-endpoints/rol";
import { formatearFechaLocal_a_toISOString, getUsuarioSesion } from "@/app/utility/Utils";
import { Checkbox } from "primereact/checkbox";
import { bloquearPantalla } from "@/app/utility/Utils"
import { useIntl } from 'react-intl';
const Permiso = () => {
    const intl = useIntl();
    const [permisos, setPermisos] = useState([]);
    const [columnasRoles, setColumnasRoles] = useState([]);
    const [columnaPrincipal, setColumnaPrincipal] = useState([]);
    const [filtros, setFiltros] = useState(null);
    const toast = useRef(null);
    const referenciaDataTable = useRef(null);
    const [marcado, setMarcado] = useState(false);
    const [listaPermisosMarcados, setListaPermisosMarcados] = useState(new Set());
    const [datosUsuario, setDatosUsuario] = useState(null);

    useEffect(() => {
        obtenerDatos();
    }, []);

    //Lista donde se iran añadiendo los nuevos permisos
    //
    const obtenerDatos = async () => {
        try {
            //Obtenemos las tablas maestras
            const listaPermisos = [
                // Empresas
                { header: intl.formatMessage({ id: 'Empresas' }), seccion: 'Empresas' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Empresas-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Empresas-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Empresas-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Empresas-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Empresas-Borrar' },

                // Idiomas
                { header: intl.formatMessage({ id: 'Idiomas' }), seccion: 'Idiomas' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Idiomas-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Idiomas-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Idiomas-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Idiomas-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Idiomas-Borrar' },

                // Logs de acceso
                { header: intl.formatMessage({ id: 'Logs de acceso' }), seccion: 'Logs de acceso' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Logs de acceso-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Logs de acceso-Ver' },
                
                // Logs de sincronización
                { header: intl.formatMessage({ id: 'Logs de sincronización' }), seccion: 'Logs de sincronización' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Logs de sincronización-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Logs de sincronización-Ver' },

                // Logs de acciones
                { header: intl.formatMessage({ id: 'Logs de acciones' }), seccion: 'Logs de acciones' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Logs de acciones-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Logs de acciones-Ver' },

                // Configuración de logs
                { header: intl.formatMessage({ id: 'Configuración de logs' }), seccion: 'Configuración de logs' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Configuración de logs-Acceder' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Configuración de logs-Actualizar' },

                // Tipos de archivo
                { header: intl.formatMessage({ id: 'Tipos de archivo' }), seccion: 'Tipos de archivo' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Tipos de archivo-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Tipos de archivo-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Tipos de archivo-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Tipos de archivo-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Tipos de archivo-Borrar' },

                // Plantillas de email
                { header: intl.formatMessage({ id: 'Plantillas de email' }), seccion: 'Plantillas de email' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Plantillas de email-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Plantillas de email-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Plantillas de email-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Plantillas de email-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Plantillas de email-Borrar' },

                // Secciones
                { header: intl.formatMessage({ id: 'Secciones' }), seccion: 'Secciones' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Secciones-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Secciones-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Secciones-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Secciones-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Secciones-Borrar' },

                // Archivos
                { header: intl.formatMessage({ id: 'Archivos' }), seccion: 'Archivos' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Archivos-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Archivos-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Archivos-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Archivos-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Archivos-Borrar' },

                // Traducciones
                { header: intl.formatMessage({ id: 'Traducciones' }), seccion: 'Traducciones' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Traducciones-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Traducciones-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Traducciones-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Traducciones-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Traducciones-Borrar' },

                // Roles
                { header: intl.formatMessage({ id: 'Roles' }), seccion: 'Roles' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Roles-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Roles-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Roles-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Roles-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Roles-Borrar' },

                // Permisos
                { header: intl.formatMessage({ id: 'Permisos' }), seccion: 'Permisos' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Permisos-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Permisos-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Permisos-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Permisos-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Permisos-Borrar' },

                // Usuarios
                { header: intl.formatMessage({ id: 'Usuarios' }), seccion: 'Usuarios' },
                { header: intl.formatMessage({ id: 'VerPerfil' }), seccion: 'Usuarios-VerPerfil' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Usuarios-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Usuarios-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Usuarios-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Usuarios-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Usuarios-Borrar' },
                { header: intl.formatMessage({ id: 'Ver Histórico Contraseñas' }), seccion: 'Usuarios-VerHistoricoPassword' },

                // Parámetros globales
                { header: intl.formatMessage({ id: 'Parámetros globales' }), seccion: 'Parámetros globales' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Parámetros globales-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Parámetros globales-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Parámetros globales-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Parámetros globales-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Parámetros globales-Borrar' },

                // Grupos de Atributos
                { header: intl.formatMessage({ id: 'Grupos de Atributos' }), seccion: 'GrupoAtributos' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'GrupoAtributos-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'GrupoAtributos-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'GrupoAtributos-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'GrupoAtributos-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'GrupoAtributos-Borrar' },

                // Atributos
                { header: intl.formatMessage({ id: 'Atributos' }), seccion: 'Atributos' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Atributos-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Atributos-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Atributos-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Atributos-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Atributos-Borrar' },

                // Catálogos
                { header: intl.formatMessage({ id: 'Catálogos' }), seccion: 'Catalogos' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Catalogos-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Catalogos-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Catalogos-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Catalogos-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Catalogos-Borrar' },

                // Categorías
                { header: intl.formatMessage({ id: 'Categorías' }), seccion: 'Categorias' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Categorias-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Categorias-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Categorias-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Categorias-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Categorias-Borrar' },

                // Iconos
                { header: intl.formatMessage({ id: 'Iconos' }), seccion: 'Iconos' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Iconos-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Iconos-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Iconos-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Iconos-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Iconos-Borrar' },

                // Marcas
                { header: intl.formatMessage({ id: 'Marcas' }), seccion: 'Marcas' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Marcas-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Marcas-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Marcas-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Marcas-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Marcas-Borrar' },

                // Multimedia
                { header: intl.formatMessage({ id: 'Multimedia' }), seccion: 'Multimedia' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Multimedia-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Multimedia-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Multimedia-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Multimedia-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Multimedia-Borrar' },

                // Productos
                { header: intl.formatMessage({ id: 'Productos' }), seccion: 'Productos' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Productos-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Productos-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Productos-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Productos-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Productos-Borrar' },

                // Estados
                { header: intl.formatMessage({ id: 'Estados' }), seccion: 'Estados' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Estados-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Estados-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Estados-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Estados-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Estados-Borrar' },
                
                //Marketplace
                { header: intl.formatMessage({ id: 'Marketplaces' }), seccion: 'Marketplaces' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Marketplaces-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Marketplaces-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Marketplaces-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Marketplaces-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Marketplaces-Borrar' },
                //ProductoSeo
                { header: intl.formatMessage({ id: 'SEO de Productos' }), seccion: 'ProductoSeo' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'ProductoSeo-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'ProductoSeo-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'ProductoSeo-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'ProductoSeo-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'ProductoSeo-Borrar' },

                //ProductoIcono
                { header: intl.formatMessage({ id: 'Iconos de Productos' }), seccion: 'ProductoIcono' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'ProductoIcono-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'ProductoIcono-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'ProductoIcono-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'ProductoIcono-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'ProductoIcono-Borrar' },
                
                //ProductoMarketplace
                { header: intl.formatMessage({ id: 'Marketplaces de Productos' }), seccion: 'ProductoMarketplace' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'ProductoMarketplace-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'ProductoMarketplace-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'ProductoMarketplace-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'ProductoMarketplace-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'ProductoMarketplace-Borrar' },
                
                //Logs de sincronización Marketplaces
                { header: intl.formatMessage({ id: 'Logs de sincronización Marketplaces' }), seccion: 'Logs de sincronización Marketplaces' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Logs de sincronización Marketplaces-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Logs de sincronización Marketplaces-Ver' },

                //Atributos de Productos
                { header: intl.formatMessage({ id: 'Atributos de Productos' }), seccion: 'Atributos de Productos' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Atributos de Productos-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Atributos de Productos-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Atributos de Productos-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Atributos de Productos-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Atributos de Productos-Borrar' },

                //Tipos de Producto
                { header: intl.formatMessage({ id: 'Tipos de Producto' }), seccion: 'Tipos de Producto' },
                { header: intl.formatMessage({ id: 'Acceder' }), seccion: 'Tipos de Producto-Acceder' },
                { header: intl.formatMessage({ id: 'Ver' }), seccion: 'Tipos de Producto-Ver' },
                { header: intl.formatMessage({ id: 'Nuevo' }), seccion: 'Tipos de Producto-Nuevo' },
                { header: intl.formatMessage({ id: 'Actualizar' }), seccion: 'Tipos de Producto-Actualizar' },
                { header: intl.formatMessage({ id: 'Borrar' }), seccion: 'Tipos de Producto-Borrar' },

            ];
            // Obtenemos los roles
            const filtroRol = JSON.stringify({ where: { and: { empresaId: getUsuarioSesion().empresaId } } });
            const registrosRoles = await getRol(filtroRol);
            const nombresColumnas = Array.from(new Set(registrosRoles.map(registro => registro.nombre)));
            // Crear un objeto para almacenar las acciones por controlador
            setColumnaPrincipal(listaPermisos);
            setColumnasRoles(nombresColumnas);
            const registros = await getPermiso(filtroRol);
            setPermisos(registros);

            //Obtener los datos del usuario
            const storedData = localStorage.getItem('userData');
            const parsedData = JSON.parse(storedData);
            setDatosUsuario(parsedData);

            //Marcar los que esten dentro de la vista.
            const permisosMarcados = await getVistaEmpresaRolPermiso(filtroRol);
            // Crear un nuevo conjunto con el formato especificado
            const permisosSet = new Set(permisosMarcados.map(permisoMarcado =>
                `${permisoMarcado.permisoControlador}-${permisoMarcado.permisoAccion}-${permisoMarcado.rolNombre}-${permisoMarcado.permisoId}`
            ));
            //setListaPermisosMarcados(new Set([ ...permisosSet]));
            setListaPermisosMarcados(permisosSet);
        } catch (err) {
            console.log(err.message);
        } finally {
            console.log('Carga completa');
        }
    };

    {/* C O L U M N A S */ }

    const nombrePermisos = (rowData) => {
        const seCambiaEstilo = rowData.seccion.includes('-');
        const style = seCambiaEstilo ? {} : { color: 'black', fontSize: '1.5em' };
        const mostrarValor = rowData.header

        return (
            <div style={style}>
                {mostrarValor}
            </div>
        );
    };

    //Si existe en la listaPermisosMarcados, se marca el checkbox
    const estaMarcado = (rowData, listaPermisosMarcados) => {
        const listaPermisosSinId = new Set(
            Array.from(listaPermisosMarcados).map(permiso => {
                const partes = permiso.split('-');
                partes.pop(); // Eliminar la última parte (id)
                return partes.join('-'); // Unir las partes restantes
            })
        );
        return listaPermisosSinId.has(rowData);
    };

    //Evento para marcar o desmarcar los checkbox aparte de añadirlo a la BBDD
    const handlePermisoMarcado = async (permiso, evento) => {
        try {
            bloquearPantalla(true);
            document.body.style.cursor = 'wait';
            
            if (evento.checked) {
                //añadir a la BBDD y al set
                const partesPermiso = permiso.split('-');
                const rolId = await getNombreRol(partesPermiso[2]);
                const nuevoPermiso = {
                    rolId: rolId[0].id,
                    controlador: partesPermiso[0],
                    accion: partesPermiso[1],
                    usuarioCreacion: datosUsuario.id,
                };
                await postPermiso(nuevoPermiso);
                
                // Actualizar el estado local
                setListaPermisosMarcados(prevSet => {
                    const newSet = new Set(prevSet);
                    newSet.add(permiso);
                    return newSet;
                });
            } else {
                const partesPermiso = permiso.split('-');
                if (partesPermiso[2] !== 'Sistemas') {
                    // Eliminar de la BBDD y del set
                    const listadoPermisos = Array.from(listaPermisosMarcados);
                    // Eliminar el sufijo '-id' de los roles y crear un mapa de roles a sus IDs
                    const listaSinId = listadoPermisos.reduce((map, permisos) => {
                        const [key, id] = permisos.split(/-(?=[^-]+$)/); // Divide en el último '-'
                        map[key] = id;
                        return map;
                    }, {});
                    // Buscar coincidencias y extraer sus IDs
                    if (listaSinId.hasOwnProperty(permiso)) {
                        await deletePermiso(parseInt(listaSinId[permiso]));
                        
                        // Actualizar el estado local
                        setListaPermisosMarcados(prevSet => {
                            const newSet = new Set(prevSet);
                            newSet.delete(permiso + '-' + listaSinId[permiso]);
                            return newSet;
                        });
                    }
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se puede eliminar permisos del rol de Sistemas' });
                }
            }
            
            // Recargar datos para sincronizar
            await obtenerDatos();
            
        } catch (error) {
            console.error('Error al manejar permiso:', error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Error al procesar el permiso' });
        } finally {
            // Asegurar que siempre se resetee el cursor y se desbloquee la pantalla
            document.body.style.cursor = 'default';
            bloquearPantalla(false);
        }
    };

    //LLamada al componente que generar checkbox
    const generarCheckbox = (rowData, columna) => {
        return (
            <CustomCheckbox
                rowData={rowData}
                columna={columna}
                listaPermisosMarcados={listaPermisosMarcados}
                setListaPermisosMarcados={setListaPermisosMarcados}
            />
        );
    };

    //El checkbox personalizado que se añade a la tabla
    const CustomCheckbox = React.memo(({ rowData, columna, listaPermisosMarcados, setListaPermisosMarcados }) => {
        const verCheckBox = rowData.seccion.includes('-');

        if (!verCheckBox) return null;

        return (
            <Checkbox
                key={`checkbox-${rowData.seccion}`} // Agregar key único
                name={`checkbox-${rowData.seccion}`} // Nombre único
                id={`checkbox-${rowData.seccion}-${columna}`} // Id único
                checked={estaMarcado(`${rowData.seccion}-${columna}`, listaPermisosMarcados)} // Verificar si está en listaPermisosMarcados
                onChange={(evento) =>
                    handlePermisoMarcado(`${rowData.seccion}-${columna}`, evento)
                }
                className="mr-2"
            />
        );
    });

    {/* E N C A B E Z A D O - T A B L A */ }
    const header = (
        <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex items-center mb-2 md:mb-0 md:mr-auto md:align-items-center">
                <h5 className="m-0 mr-2">{intl.formatMessage({ id: 'Permisos' })}</h5>
            </div>
        </div>
    );

    const rowClass = (data) => {
        const seCambiaEstilo = !data.seccion.includes('-');
        return {
            'bg-gray-50': seCambiaEstilo
        };
    };

    return (
        <div className="grid Permiso">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} position="center" />
                    {/* ENCABEZADO PRINCIPAL */}
                    {/* <Toolbar className="mb-4" left={barraDeHerramientasIzquierda}></Toolbar> */}

                    {/* TABLA DE REGISTROS */}
                    <DataTable
                        className="datatable-responsive"
                        ref={referenciaDataTable}
                        header={header}
                        dataKey="seccion"
                        value={columnaPrincipal}
                        responsiveLayout="scroll"
                        rowClassName={rowClass}
                    >
                        <Column
                            field='controlador'
                            header={intl.formatMessage({ id: 'Controlador' })}
                            headerStyle={{ minWidth: "15rem" }}
                            body={nombrePermisos}
                        />
                        {columnasRoles.map((columna) => (
                            <Column
                                key={`column-${columna}`}
                                field={columna}
                                header={columna}
                                headerStyle={{ minWidth: "15rem" }}
                                body={(rowData) => generarCheckbox(rowData, columna)} // Usa la función personalizada
                            />
                        ))}
                    </DataTable>
                </div>
            </div>
        </div>
    );
};
export default Permiso;
