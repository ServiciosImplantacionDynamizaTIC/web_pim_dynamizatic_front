"use client";
import React, { useMemo, useRef } from "react";
import { Fieldset } from 'primereact/fieldset';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import { InputNumber } from 'primereact/inputnumber';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useIntl } from 'react-intl';

/**
 * Componente genérico que muestra una lista de ítems agrupados por grupos,
 * con checkboxes para seleccionar/deseleccionar y control de orden.
 *
 * Props:
 * - items:              Array de ítems a mostrar (ej: atributos, campos dinámicos)
 * - grupos:             Array de grupos (ej: grupo_atributo, grupo_campo_dinamico)
 * - seleccionados:      Array de IDs seleccionados
 * - onSeleccionChange:  Callback que recibe el nuevo array de IDs seleccionados
 * - grupoIdField:       Nombre del campo en cada ítem que apunta al grupo (ej: 'grupoAtributoId')
 * - cargando:           Boolean indicando si se están cargando los datos
 * - editable:           Boolean indicando si se pueden modificar las selecciones
 * - disabled:           Boolean adicional para deshabilitar (ej: estadoGuardando)
 * - renderItem:         Función (item) => JSX que renderiza el contenido de cada ítem
 * - textoVacio:         Mensaje cuando no hay ítems disponibles
 * - titulo:             Texto descriptivo mostrado arriba de los grupos
 * - prefixId:           Prefijo para los IDs de los checkboxes (ej: 'atributo', 'campo')
 * - mostrarOrden:       Boolean para mostrar inputs numéricos de orden en grupos e ítems
 * - onOrdenGrupoChange: Callback (grupoId, nuevoOrden) cuando cambia el orden de un grupo
 * - onOrdenItemChange:  Callback (itemId, nuevoOrden) cuando cambia el orden de un ítem
 */
const ListaCheckboxAgrupada = ({
    items = [],
    grupos = [],
    seleccionados = [],
    onSeleccionChange,
    grupoIdField,
    cargando = false,
    editable = true,
    disabled = false,
    renderItem,
    textoVacio,
    titulo,
    prefixId = 'item',
    mostrarOrden = false,
    onOrdenGrupoChange,
    onOrdenItemChange
}) => {
    const intl = useIntl();
    const isDisabled = !editable || disabled;

    // Guardamos el orden original de los grupos (de la BD) para que no se reordenen dinámicamente
    const ordenOriginalGrupos = useRef(null);

    // Agrupar ítems por su grupo y ordenar
    const itemsAgrupados = useMemo(() => {
        const mapa = new Map();

        grupos.forEach(grupo => {
            mapa.set(grupo.id, { grupo, items: [] });
        });

        items.forEach(item => {
            const grupoId = item[grupoIdField];
            if (grupoId && mapa.has(grupoId)) {
                mapa.get(grupoId).items.push(item);
            } else if (grupoId && !mapa.has(grupoId)) {
                mapa.set(grupoId, {
                    grupo: { id: grupoId, nombre: intl.formatMessage({ id: 'Grupo desconocido' }) },
                    items: [item]
                });
            }
        });

        const sinGrupo = items.filter(item => !item[grupoIdField]);

        // Ordenar grupos: usar el orden original de la BD (solo se establece una vez)
        const gruposConItems = Array.from(mapa.values()).filter(g => g.items.length > 0);
        
        if (!ordenOriginalGrupos.current && gruposConItems.length > 0) {
            // Primera carga: guardar el orden original y ordenar por él
            gruposConItems.sort((a, b) => {
                const ordenA = a.grupo.orden ?? Number.MAX_SAFE_INTEGER;
                const ordenB = b.grupo.orden ?? Number.MAX_SAFE_INTEGER;
                if (ordenA !== ordenB) return ordenA - ordenB;
                return (a.grupo.nombre || '').localeCompare(b.grupo.nombre || '');
            });
            ordenOriginalGrupos.current = gruposConItems.map(g => g.grupo.id);
        }

        // Aplicar el orden original guardado
        const gruposOrdenados = ordenOriginalGrupos.current
            ? gruposConItems.sort((a, b) => {
                const idxA = ordenOriginalGrupos.current.indexOf(a.grupo.id);
                const idxB = ordenOriginalGrupos.current.indexOf(b.grupo.id);
                const posA = idxA === -1 ? Number.MAX_SAFE_INTEGER : idxA;
                const posB = idxB === -1 ? Number.MAX_SAFE_INTEGER : idxB;
                return posA - posB;
            })
            : gruposConItems;

        // Ordenar ítems dentro de cada grupo por orden, luego por nombre (dinámico)
        const ordenarItems = (arr) => {
            arr.sort((a, b) => {
                const ordenA = a.orden ?? Number.MAX_SAFE_INTEGER;
                const ordenB = b.orden ?? Number.MAX_SAFE_INTEGER;
                if (ordenA !== ordenB) return ordenA - ordenB;
                return (a.nombre || '').localeCompare(b.nombre || '');
            });
        };

        gruposOrdenados.forEach(g => ordenarItems(g.items));
        ordenarItems(sinGrupo);

        return { gruposOrdenados, sinGrupo };
    }, [items, grupos, grupoIdField, intl]);

    const manejarCambio = (itemId, isChecked) => {
        const nuevaSeleccion = isChecked
            ? [...seleccionados, itemId]
            : seleccionados.filter(id => id !== itemId);
        onSeleccionChange(nuevaSeleccion);
    };

    const seleccionarTodos = () => {
        onSeleccionChange(items.map(item => item.id));
    };

    const deseleccionarTodos = () => {
        onSeleccionChange([]);
    };

    const seleccionarTodosDelGrupo = (grupoItems) => {
        const idsGrupo = grupoItems.map(item => item.id);
        const idsActualesSinGrupo = seleccionados.filter(id => !idsGrupo.includes(id));
        onSeleccionChange([...idsActualesSinGrupo, ...idsGrupo]);
    };

    const deseleccionarTodosDelGrupo = (grupoItems) => {
        const idsGrupo = new Set(grupoItems.map(item => item.id));
        onSeleccionChange(seleccionados.filter(id => !idsGrupo.has(id)));
    };

    const contarSeleccionadosEnGrupo = (grupoItems) => {
        return grupoItems.filter(item => seleccionados.includes(item.id)).length;
    };

    const renderCheckboxItem = (item) => (
        <div key={item.id} className="col-12 md:col-6 lg:col-4">
            <div className="field-checkbox p-3 border-1 border-round border-300 hover:border-primary transition-colors">
                <div className="flex align-items-center">
                    {mostrarOrden && (
                        <>
                            <div className="flex flex-column align-items-center mr-2">
                                <label className="text-xs font-semibold mb-1">{intl.formatMessage({ id: 'Orden' })}</label>
                                <InputNumber
                                    value={item.orden || 0}
                                    onChange={(e) => onOrdenItemChange?.(item.id, e.value || 0)}
                                    disabled={isDisabled}
                                    min={0}
                                    max={999}
                                    inputStyle={{ textAlign: 'right', width: '3.5rem' }}
                                    placeholder="0"
                                />
                            </div>
                            <Divider layout="vertical" className="mx-2" />
                        </>
                    )}
                    <Checkbox
                        inputId={`${prefixId}-${item.id}`}
                        checked={seleccionados.includes(item.id)}
                        onChange={(e) => manejarCambio(item.id, e.checked)}
                        disabled={isDisabled}
                    />
                    <label htmlFor={`${prefixId}-${item.id}`} className="ml-2 cursor-pointer">
                        {renderItem ? renderItem(item) : (
                            <div>
                                <div className="font-bold">{item.nombre}</div>
                            </div>
                        )}
                    </label>
                </div>
            </div>
        </div>
    );

    const renderBotonesGrupo = (grupoItems) => (
        <div>
            <button
                type="button"
                className="p-button p-button-text p-button-sm mr-2"
                onClick={() => seleccionarTodosDelGrupo(grupoItems)}
                disabled={isDisabled}
            >
                {intl.formatMessage({ id: 'Seleccionar Todos' })}
            </button>
            <button
                type="button"
                className="p-button p-button-text p-button-sm"
                onClick={() => deseleccionarTodosDelGrupo(grupoItems)}
                disabled={isDisabled}
            >
                {intl.formatMessage({ id: 'Deseleccionar Todos' })}
            </button>
        </div>
    );

    const renderGrupo = ({ grupo, items: grupoItems }) => {
        const seleccionadosEnGrupo = contarSeleccionadosEnGrupo(grupoItems);

        const legendContent = mostrarOrden ? (
            <div className="flex align-items-center gap-1">
                <span
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-column align-items-center">
                        <label className="text-xs font-semibold mb-1">{intl.formatMessage({ id: 'Orden' })}</label>
                        <InputNumber
                            value={grupo.orden || 0}
                            onChange={(e) => onOrdenGrupoChange?.(grupo.id, e.value || 0)}
                            disabled={isDisabled}
                            min={0}
                            max={999}
                            inputStyle={{ textAlign: 'right', width: '3.5rem' }}
                            placeholder="0"
                        />
                    </div>
                </span>
                <Divider layout="vertical" className="mx-2" />
                <span className="font-bold text-lg">{grupo.nombre} ({seleccionadosEnGrupo}/{grupoItems.length})</span>
            </div>
        ) : `${grupo.nombre} (${seleccionadosEnGrupo}/${grupoItems.length})`;

        return (
            <Fieldset key={grupo.id} legend={legendContent} collapsed={true} toggleable className="mb-3">
                <div className="flex justify-content-between align-items-center mb-2">
                    {grupo.descripcion
                        ? <small className="p-text-secondary">{grupo.descripcion}</small>
                        : <span />
                    }
                    {renderBotonesGrupo(grupoItems)}
                </div>
                <div className="grid">
                    {grupoItems.map(renderCheckboxItem)}
                </div>
            </Fieldset>
        );
    };

    if (cargando) {
        return (
            <div className="flex justify-content-center p-4">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-content-between align-items-center mb-3">
                {titulo && <h6>{titulo}</h6>}
                <div>
                    <button
                        type="button"
                        className="p-button p-button-text p-button-sm mr-2"
                        onClick={seleccionarTodos}
                        disabled={isDisabled || items.length === 0}
                    >
                        {intl.formatMessage({ id: 'Seleccionar Todos' })}
                    </button>
                    <button
                        type="button"
                        className="p-button p-button-text p-button-sm"
                        onClick={deseleccionarTodos}
                        disabled={isDisabled || items.length === 0}
                    >
                        {intl.formatMessage({ id: 'Deseleccionar Todos' })}
                    </button>
                </div>
            </div>

            {itemsAgrupados.gruposOrdenados.map(renderGrupo)}

            {itemsAgrupados.sinGrupo.length > 0 && (
                <Fieldset
                    legend={`${intl.formatMessage({ id: 'Sin grupo' })} (${contarSeleccionadosEnGrupo(itemsAgrupados.sinGrupo)}/${itemsAgrupados.sinGrupo.length})`}
                    collapsed={true}
                    toggleable
                    className="mb-3"
                >
                    <div className="flex justify-content-end mb-2">
                        {renderBotonesGrupo(itemsAgrupados.sinGrupo)}
                    </div>
                    <div className="grid">
                        {itemsAgrupados.sinGrupo.map(renderCheckboxItem)}
                    </div>
                </Fieldset>
            )}

            {items.length === 0 && (
                <div className="text-center p-4 text-500">
                    {textoVacio || intl.formatMessage({ id: 'No hay elementos disponibles' })}
                </div>
            )}
        </div>
    );
};

export default ListaCheckboxAgrupada;
