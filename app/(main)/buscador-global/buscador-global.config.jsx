/**
 * buscador-global.config.jsx
 *
 * Archivo de configuración centralizada del Buscador Global.
 * Contiene todas las definiciones estáticas que necesita la página buscador-global/page.jsx:
 *
 *  - SECCIONES            → opciones del dropdown "Sección" del formulario de búsqueda
 *  - OPCIONES_ACTIVO      → opciones del dropdown "Estado" (Todos / Activo / Inactivo)
 *  - COLUMNAS_POR_SECCION → columnas que muestra la DataTable de resultados por sección
 *  - CRUD_CONFIG_MAP      → configuración completa para montar el componente <Crud> en modo
 *                           solo lectura cuando el usuario pulsa "Ver" en un resultado
 *
 * ─── CÓMO AÑADIR UNA NUEVA SECCIÓN ────────────────────────────────────────────
 *  1. Importa sus funciones de API (getXxx, getXxxCount) y su componente EditarXxx.
 *  2. Añade una entrada en SECCIONES con { label, value }.
 *  3. Añade su array de columnas en COLUMNAS_POR_SECCION (columnas de la tabla de resultados).
 *  4. Añade su bloque en CRUD_CONFIG_MAP con todos los campos descritos abajo.
 * ───────────────────────────────────────────────────────────────────────────────
 */

import { getCategorias, getCategoriasCount } from "@/app/api-endpoints/categoria";
import { getMarcas, getMarcasCount } from "@/app/api-endpoints/marca";
import { getAtributos, getAtributosCount } from "@/app/api-endpoints/atributo";
import { getGrupoAtributos, getGrupoAtributosCount } from "@/app/api-endpoints/grupo_atributo";
import { getCatalogos, getCatalogosCount } from "@/app/api-endpoints/catalogo";
import { getUsuarios, getUsuariosCount } from "@/app/api-endpoints/usuario";
import EditarCategoria from "../categorias/editar";
import EditarMarca from "../marcas/editar";
import EditarAtributo from "../atributos/editar";
import EditarGrupoAtributo from "../grupo-atributos/editar";
import EditarCatalogo from "../catalogos/editar";
import EditarUsuario from "../usuarios/editar";

/**
 * Opciones del dropdown "Sección" del formulario de búsqueda.
 * - label : texto visible en el desplegable
 * - value : clave interna usada en COLUMNAS_POR_SECCION y CRUD_CONFIG_MAP
 */
export const SECCIONES = [
    { label: "Categorías",          value: "categorias" },
    { label: "Marcas",              value: "marcas" },
    { label: "Atributos",           value: "atributos" },
    { label: "Grupos de atributos", value: "grupo_atributos" },
    { label: "Catálogos",           value: "catalogos" },
    { label: "Usuarios",            value: "usuarios" },
];

/**
 * Opciones del dropdown "Estado" del formulario de búsqueda.
 * Permite filtrar por el campo activoSn de cada registro.
 * - value: null  → sin filtro (muestra todos)
 * - value: "S"   → solo registros activos
 * - value: "N"   → solo registros inactivos
 */
export const OPCIONES_ACTIVO = [
    { label: "Todos",    value: null },
    { label: "Activo",   value: "S" },
    { label: "Inactivo", value: "N" },
];

/**
 * Columnas que muestra la DataTable de resultados del buscador para cada sección.
 * Estas columnas son independientes de las del <Crud> que se abre al pulsar "Ver";
 * son columnas simplificadas pensadas para mostrar un resumen rápido.
 *
 * Cada objeto tiene:
 * - field  : nombre del campo en el objeto de datos devuelto por la API
 * - header : texto de cabecera visible en la tabla
 */
export const COLUMNAS_POR_SECCION = {
    categorias:      [{ field: "nombre", header: "Nombre" }, { field: "descripcion", header: "Descripción" }, { field: "activoSn", header: "Activo" }],
    marcas:          [{ field: "nombre", header: "Nombre" }, { field: "sitioWeb", header: "Sitio Web" }, { field: "activoSn", header: "Activo" }],
    atributos:       [{ field: "nombre", header: "Nombre" }, { field: "descripcion", header: "Descripción" }, { field: "tipo", header: "Tipo" }, { field: "activoSn", header: "Activo" }],
    grupo_atributos: [{ field: "nombre", header: "Nombre" }, { field: "descripcion", header: "Descripción" }, { field: "activoSn", header: "Activo" }],
    catalogos:       [{ field: "nombre", header: "Nombre" }, { field: "descripcion", header: "Descripción" }, { field: "tipo", header: "Tipo" }, { field: "estado", header: "Estado" }],
    usuarios:        [{ field: "nombre", header: "Nombre" }, { field: "email", header: "Email" }, { field: "activoSn", header: "Activo" }],
};

/**
 * Mapa de configuración para montar el componente <Crud> en modo solo lectura
 * cuando el usuario pulsa el botón "Ver" en un resultado del buscador.
 *
 * La clave de cada entrada coincide con el value de SECCIONES.
 *
 * Cada entrada contiene:
 * - headerCrud        : título que muestra el <Crud> en su cabecera
 * - getRegistros      : función de API para obtener la lista de registros
 * - getRegistrosCount : función de API para obtener el total de registros (paginación)
 * - controlador       : nombre del controlador usado por el sistema de permisos
 * - seccion           : nombre de la sección usado para cargar tipos de archivo asociados
 * - editarComponente  : componente <EditarXxx /> que renderiza el formulario de detalle
 * - columnas          : columnas internas del <Crud> (más completas que las de COLUMNAS_POR_SECCION)
 *                       Cada columna: { campo, header, tipo }
 *                       Tipos válidos: "string" | "number" | "booleano" | "fecha" | "fechaHora" | "imagen"
 */
export const CRUD_CONFIG_MAP = {
    categorias: {
        headerCrud: "Categorías",
        getRegistros: getCategorias,
        getRegistrosCount: getCategoriasCount,
        controlador: "Categorias",
        seccion: "Categorias",
        editarComponente: <EditarCategoria />,
        columnas: [
            { campo: "nombre",              header: "Nombre",          tipo: "string" },
            { campo: "descripcion",         header: "Descripción",     tipo: "string" },
            { campo: "categoriaPadreNombre",header: "Categoría Padre", tipo: "string" },
            { campo: "orden",               header: "Orden",           tipo: "number" },
            { campo: "activoSn",            header: "Activo",          tipo: "booleano" },
        ],
    },
    marcas: {
        headerCrud: "Marcas",
        getRegistros: getMarcas,
        getRegistrosCount: getMarcasCount,
        controlador: "Marcas",
        seccion: "Marcas",
        editarComponente: <EditarMarca />,
        columnas: [
            { campo: "imagen",     header: "Imagen",      tipo: "imagen" },
            { campo: "nombre",     header: "Nombre",      tipo: "string" },
            { campo: "sitioWeb",   header: "Sitio Web",   tipo: "string" },
            { campo: "paisOrigen", header: "País Origen", tipo: "string" },
            { campo: "activoSn",   header: "Activo",      tipo: "booleano" },
        ],
    },
    atributos: {
        headerCrud: "Atributos",
        getRegistros: getAtributos,
        getRegistrosCount: getAtributosCount,
        controlador: "Atributos",
        seccion: "Atributos",
        editarComponente: <EditarAtributo />,
        columnas: [
            { campo: "grupoAtributonombre", header: "Grupo Atributo", tipo: "string" },
            { campo: "nombre",              header: "Nombre",         tipo: "string" },
            { campo: "tipoDato",            header: "Tipo de Dato",   tipo: "string" },
            { campo: "unidadMedida",        header: "Unidad Medida",  tipo: "string" },
            { campo: "obligatorioSn",       header: "Obligatorio",    tipo: "booleano" },
            { campo: "activoSn",            header: "Activo",         tipo: "booleano" },
        ],
    },
    grupo_atributos: {
        headerCrud: "Grupos de Atributos",
        getRegistros: getGrupoAtributos,
        getRegistrosCount: getGrupoAtributosCount,
        controlador: "GrupoAtributos",
        seccion: "GrupoAtributos",
        editarComponente: <EditarGrupoAtributo />,
        columnas: [
            { campo: "nombre",   header: "Nombre", tipo: "string" },
            { campo: "orden",    header: "Orden",  tipo: "number" },
            { campo: "activoSn", header: "Activo", tipo: "booleano" },
        ],
    },
    catalogos: {
        headerCrud: "Catálogos",
        getRegistros: getCatalogos,
        getRegistrosCount: getCatalogosCount,
        controlador: "Catalogos",
        seccion: "Catalogos",
        editarComponente: <EditarCatalogo />,
        columnas: [
            { campo: "nombre",           header: "Nombre",             tipo: "string" },
            { campo: "tipo",             header: "Tipo",               tipo: "string" },
            { campo: "estado",           header: "Estado",             tipo: "string" },
            { campo: "fechaPublicacion", header: "Fecha Publicación",  tipo: "fecha" },
            { campo: "activoSn",         header: "Activo",             tipo: "booleano" },
        ],
    },
    usuarios: {
        headerCrud: "Usuarios",
        getRegistros: getUsuarios,
        getRegistrosCount: getUsuariosCount,
        controlador: "Usuarios",
        seccion: "Usuarios",
        editarComponente: <EditarUsuario />,
        columnas: [
            { campo: "avatar",     header: "Avatar",  tipo: "imagen" },
            { campo: "nombre",     header: "Nombre",  tipo: "string" },
            { campo: "nombreRol",  header: "Rol",     tipo: "string" },
            { campo: "mail",       header: "Email",   tipo: "string" },
            { campo: "activoSn",   header: "Activo",  tipo: "booleano" },
        ],
    },
};
