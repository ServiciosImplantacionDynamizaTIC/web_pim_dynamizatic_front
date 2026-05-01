"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Fieldset } from "primereact/fieldset";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { useIntl } from "react-intl";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { getCategorias } from "@/app/api-endpoints/categoria";
import { getMarcas } from "@/app/api-endpoints/marca";
import { getCatalogos } from "@/app/api-endpoints/catalogo";
import { getVistaUsuarios } from "@/app/api-endpoints/usuario";
import Crud from "@/app/components/shared/crud";
import { tieneUsuarioPermiso } from "@/app/components/shared/componentes";
import { SECCIONES, OPCIONES_ACTIVO, COLUMNAS_POR_SECCION, CRUD_CONFIG_MAP, FILTROS_POR_SECCION } from "./buscador-global.config";
import { Tooltip } from "primereact/tooltip";
import { Badge } from "primereact/badge";
import { ProgressSpinner } from "primereact/progressspinner";

const activoSnTemplate = (cabecera) => (rowData) => (
    <>
        <span className="p-column-title">{cabecera}</span>
        {rowData.activoSn === "S" && <Badge value="Si" severity="success" />}
        {rowData.activoSn === "N" && <Badge value="No" severity="secondary" />}
    </>
);

// Replica del templateGenerico del crud — trunca textos largos con tooltip
const templateGenerico = (campo, cabecera) => (rowData) => {
    if (rowData[campo]?.length > 30) {
        return (
            <>
                <span className="p-column-title">{cabecera}</span>
                <Tooltip target=".tg-cell" />
                <span
                    className="tg-cell"
                    data-pr-tooltip={rowData[campo]}
                    style={{ display: "block", maxWidth: "29ch", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                    {rowData[campo]}
                </span>
            </>
        );
    }
    return (
        <>
            <span className="p-column-title">{cabecera}</span>
            <span>{rowData[campo]}</span>
        </>
    );
};

// Mapa de secciones: label, value, función de búsqueda y columnas a mostrar

const BuscadorGlobal = () => {
    const intl = useIntl();
    const toast = useRef(null);
    const empresaId = getUsuarioSesion()?.empresaId;

    const [filtros, setFiltros] = useState({
        seccion: null,
        nombre: "",
        descripcion: "",
        codigo: "",
        activoSn: null,
        fechaCreacionDesde: null,
        fechaCreacionHasta: null,
        fechaModificacionDesde: null,
        fechaModificacionHasta: null,
    });

    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [buscado, setBuscado] = useState(false);
    const [registroVer, setRegistroVer] = useState(null);
    const [cargandoVer, setCargandoVer] = useState(false);
    const [seccionesPermitidas, setSeccionesPermitidas] = useState([]);

    useEffect(() => {
        const cargarSeccionesPermitidas = async () => {
            const permitidas = await Promise.all(
                SECCIONES.map(async (seccion) => {
                    const controlador = CRUD_CONFIG_MAP[seccion.value]?.controlador;
                    const permitido = controlador ? await tieneUsuarioPermiso(controlador, 'acceder') : false;
                    return permitido ? seccion : null;
                })
            );
            setSeccionesPermitidas(permitidas.filter(Boolean));
        };
        cargarSeccionesPermitidas();
    }, []);

    const limpiarFiltros = () => {
        setFiltros({
            seccion: null,
            nombre: "",
            descripcion: "",
            codigo: "",
            activoSn: null,
            fechaCreacionDesde: null,
            fechaCreacionHasta: null,
            fechaModificacionDesde: null,
            fechaModificacionHasta: null,
        });
        setResultados([]);
        setBuscado(false);
    };

    /**
     * Construye el objeto de filtros (cláusula WHERE) para enviar a la API.
     * Solo añade una condición si el campo tiene valor — los vacíos se ignoran.
     * El resultado es un JSON con la forma: { where: { and: { campo: valor, ... } } }
     */
    const construirWhere = () => {
        // Siempre filtramos por la empresa del usuario en sesión
        const and = { empresaId }; // Declaramos el objeto "and" que contendrá todas las condiciones de filtrado, despues se añadiran las condiciones de filtrado dependiendo de los campos que el usuario haya rellenado en el formulario de filtros y cada condicion es un objeto 

        // --- Filtros de texto (búsqueda parcial con LIKE %valor%) --- 
        if (filtros.nombre)      and.nombre      = { like: `%${filtros.nombre}%` }; 
        if (filtros.descripcion) and.descripcion = { like: `%${filtros.descripcion}%` };
        if (filtros.codigo)      and.codigo      = { like: `%${filtros.codigo}%` };

        // --- Filtro de estado (valor exacto: "S" = activo, "N" = inactivo) ---
        if (filtros.activoSn) and.activoSn = filtros.activoSn;

        // Devolvemos el filtro serializado como string para pasarlo como query param
        return JSON.stringify({ where: { and } });
    };

    const buscar = async () => {
        if (!filtros.seccion) {
            toast.current?.show({ severity: "warn", summary: "Aviso", detail: "Selecciona una sección para buscar", life: 3000 });
            return;
        }
        setBuscando(true);
        setBuscado(false);
        try {
            const filtro = construirWhere();
            let datos = [];
            switch (filtros.seccion) {
                case "categorias":      datos = await getCategorias(filtro);       break;
                case "marcas":          datos = await getMarcas(filtro);           break;
                case "catalogos":       datos = await getCatalogos(filtro);        break;
                case "usuarios":        datos = await getVistaUsuarios(filtro);    break;
                default: datos = [];
            }
            setResultados(datos || []);
            setBuscado(true);
        } catch (error) {
            toast.current?.show({ severity: "error", summary: "Error", detail: "Error al realizar la búsqueda", life: 3000 });
        } finally {
            setBuscando(false);
        }
    };

    const columnas = filtros.seccion ? (COLUMNAS_POR_SECCION[filtros.seccion] || []) : [];

    const verRegistro = (seccion, id) => {
        setCargandoVer(true);
        setRegistroVer({ seccion, id });
        // Ocultamos el overlay una vez que el CRUD ha tenido tiempo de cargar y abrir el registro
        setTimeout(() => setCargandoVer(false), 1000);
    };

    const accionesTemplate = (rowData) => (
        <Button
            icon="pi pi-eye"
            className="mr-2"
            rounded
            title="Ver"
            severity="info"
            onClick={() => verRegistro(filtros.seccion, rowData.id)}
        />
    );

    return (
        <>
            <Toast ref={toast} />

            {/* Overlay de carga al navegar al registro */}
            {cargandoVer && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.6)',
                }}>
                    <ProgressSpinner
                        style={{ width: '50px', height: '50px' }}
                        strokeWidth="4"
                        animationDuration=".8s"
                    />
                </div>
            )}

            {/* Vista Ver — Crud en modo solo lectura */}
            {registroVer && (() => {
                const config = CRUD_CONFIG_MAP[registroVer.seccion];
                if (!config) return null;
                return (
                    <Crud
                        headerCrud={config.headerCrud}
                        getRegistros={config.getRegistros}
                        getRegistrosCount={config.getRegistrosCount}
                        botones={["ver"]}
                        controlador={config.controlador}
                        seccion={config.seccion}
                        editarComponente={config.editarComponente}
                        columnas={config.columnas}
                        filtradoBase={{ id: registroVer.id, empresaId }}
                        registroEditar={registroVer.id}
                        editableInicial={false}
                        onCancelar={() => setRegistroVer(null)}
                    />
                );
            })()}

            {/* Vista Buscador */}
            {!registroVer && (
                <div className="grid">
                    <div className="col-12">
                        <div className="card">

                            {/* Header */}
                            <div className="flex align-items-center justify-content-between mb-4">
                                <h5 className="m-0">{intl.formatMessage({ id: "Buscador Global" })}</h5>
                                <Button
                                    label={intl.formatMessage({ id: "Limpiar Filtros" })}
                                    icon="pi pi-filter-slash"
                                    outlined
                                    onClick={limpiarFiltros}
                                />
                            </div>

                            <Fieldset legend={intl.formatMessage({ id: "Filtros" })}>
                                <div className="formgrid grid">

                                    {/* Sección */}
                                    <div className="flex flex-column field gap-2 col-12 lg:col-4">
                                        <label htmlFor="seccion"><b>{intl.formatMessage({ id: "Sección" })}*</b></label>
                                        <Dropdown
                                            id="seccion"
                                            value={filtros.seccion}
                                            options={seccionesPermitidas}
                                            onChange={(e) => setFiltros({
                                                seccion: e.value,
                                                nombre: "",
                                                descripcion: "",
                                                codigo: "",
                                                activoSn: null,
                                            })}
                                            placeholder={intl.formatMessage({ id: "Seleccione sección" })}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Activo — solo si la sección lo soporta */}
                                    {filtros.seccion && FILTROS_POR_SECCION[filtros.seccion]?.includes("activoSn") && (
                                        <div className="flex flex-column field gap-2 col-12 lg:col-4">
                                            <label htmlFor="activoSn">{intl.formatMessage({ id: "Estado" })}</label>
                                            <Dropdown
                                                id="activoSn"
                                                value={filtros.activoSn}
                                                options={OPCIONES_ACTIVO}
                                                onChange={(e) => setFiltros({ ...filtros, activoSn: e.value })}
                                                placeholder={intl.formatMessage({ id: "Todos" })}
                                                className="w-full"
                                            />
                                        </div>
                                    )}

                                    {/* Nombre — solo si la sección lo soporta */}
                                    {filtros.seccion && FILTROS_POR_SECCION[filtros.seccion]?.includes("nombre") && (
                                        <div className="flex flex-column field gap-2 col-12 lg:col-4">
                                            <label htmlFor="nombre">{intl.formatMessage({ id: "Nombre" })}</label>
                                            <InputText
                                                id="nombre"
                                                value={filtros.nombre}
                                                onChange={(e) => setFiltros({ ...filtros, nombre: e.target.value })}
                                                placeholder={intl.formatMessage({ id: "Buscar por nombre..." })}
                                                className="w-full"
                                            />
                                        </div>
                                    )}

                                    {/* Descripción — solo si la sección lo soporta */}
                                    {filtros.seccion && FILTROS_POR_SECCION[filtros.seccion]?.includes("descripcion") && (
                                        <div className="flex flex-column field gap-2 col-12 lg:col-4">
                                            <label htmlFor="descripcion">{intl.formatMessage({ id: "Descripción" })}</label>
                                            <InputText
                                                id="descripcion"
                                                value={filtros.descripcion}
                                                onChange={(e) => setFiltros({ ...filtros, descripcion: e.target.value })}
                                                placeholder={intl.formatMessage({ id: "Buscar por descripción..." })}
                                                className="w-full"
                                            />
                                        </div>
                                    )}

                                    {/* Código — solo si la sección lo soporta */}
                                    {filtros.seccion && FILTROS_POR_SECCION[filtros.seccion]?.includes("codigo") && (
                                        <div className="flex flex-column field gap-2 col-12 lg:col-4">
                                            <label htmlFor="codigo">{intl.formatMessage({ id: "Código" })}</label>
                                            <InputText
                                                id="codigo"
                                                value={filtros.codigo}
                                                onChange={(e) => setFiltros({ ...filtros, codigo: e.target.value })}
                                                placeholder={intl.formatMessage({ id: "Buscar por código..." })}
                                                className="w-full"
                                            />
                                        </div>
                                    )}

                                </div>
                            </Fieldset>

                            {/* Botón buscar */}
                            <div className="flex gap-2 mt-4 mb-4 justify-content-end">
                                <Button
                                    label={intl.formatMessage({ id: "Buscar" })}
                                    icon="pi pi-search"
                                    onClick={buscar}
                                    loading={buscando}
                                />
                            </div>

                            {/* Resultados */}
                            <DataTable
                                className="datatable-responsive"
                                dataKey="id"
                                value={resultados}
                                removableSort
                                rowsPerPageOptions={[5, 10, 25]}
                                emptyMessage={
                                    buscado
                                        ? intl.formatMessage({ id: "No se han encontrado registros" })
                                        : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "35px" }}>
                                            <span style={{ fontWeight: "bold" }}>{intl.formatMessage({ id: "Realiza una búsqueda para mostrar los datos" })}</span>
                                          </div>
                                }
                                paginator={resultados.length > 0}
                                rows={10}
                            >
                                {columnas.map((col) => (
                                    <Column
                                        key={col.field}
                                        field={col.field}
                                        header={col.header}
                                        sortable
                                        body={col.field === "activoSn" ? activoSnTemplate(col.header) : templateGenerico(col.field, col.header)}
                                        headerStyle={{ minWidth: "15rem" }}
                                    />
                                ))}
                                <Column
                                    header="Acciones"
                                    body={accionesTemplate}
                                    headerStyle={{ minWidth: "10rem" }}
                                    style={{ minWidth: "10rem" }}
                                />
                            </DataTable>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BuscadorGlobal;
