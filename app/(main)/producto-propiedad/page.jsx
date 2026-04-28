"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useIntl } from 'react-intl';
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Fieldset } from "primereact/fieldset";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { MultiSelect } from "primereact/multiselect";
import { ProgressSpinner } from "primereact/progressspinner";
import { getProducto, patchProducto } from "@/app/api-endpoints/producto";
import { getTipoProductoPropiedadDetalles } from "@/app/api-endpoints/tipo_producto_propiedad_detalle";
import { getTipoProductoGrupoPropiedadDetalles } from "@/app/api-endpoints/tipo_producto_grupo_propiedad_detalle";
import { getProductosPropiedad, postProductoPropiedad, patchProductoPropiedad, deleteProductoPropiedad } from "@/app/api-endpoints/producto_propiedad";
import { getGrupoPropiedades } from "@/app/api-endpoints/grupo_propiedad";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { InputTextarea } from "primereact/inputtextarea";
import { tieneUsuarioPermiso } from "@/app/components/shared/componentes";

/**
 * ProductoPropiedad — Componente genérico para gestionar propiedades de un producto.
 *
 * Recibe `tipoDePropiedad` ('atributo' | 'campo_dinamico') para filtrar
 * y gestionar solo las propiedades del tipo correspondiente.
 * Cada instancia tiene su propio botón de guardar y validación independiente.
 */
const ProductoPropiedad = ({ idProducto, tipoProductoId, estoyEditandoProducto, tipoDePropiedad = 'atributo' }) => {
    const intl = useIntl();
    const toast = useRef(null);

    const esAtributo = tipoDePropiedad === 'atributo';
    const tipoGrupoCorrespondiente = esAtributo ? 'grupo_atributos' : 'grupo_campos_dinamicos';
    const tituloSeccion = esAtributo
        ? intl.formatMessage({ id: 'Atributos del Producto' })
        : intl.formatMessage({ id: 'Campos Dinámicos del Producto' });
    const textoVacio = esAtributo
        ? intl.formatMessage({ id: 'No hay atributos definidos para este tipo de producto' })
        : intl.formatMessage({ id: 'No hay campos dinámicos definidos para este tipo de producto' });
    const textoGuardar = esAtributo
        ? intl.formatMessage({ id: 'Guardar Atributos' })
        : intl.formatMessage({ id: 'Guardar Campos Dinámicos' });
    const textoGuardadoOk = esAtributo
        ? intl.formatMessage({ id: 'Atributos guardados correctamente' })
        : intl.formatMessage({ id: 'Campos dinámicos guardados correctamente' });
    
    const [propiedadesDefinidas, setPropiedadesDefinidas] = useState([]);
    const [gruposPropiedades, setGruposPropiedades] = useState([]);
    const [valoresPropiedades, setValoresPropiedades] = useState({});
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [erroresValidacion, setErroresValidacion] = useState(new Set());

    const permisoVerPestana = esAtributo ? 'AtributosVer' : 'CamposDinamicosVer';
    const permisoEditarPestana = esAtributo ? 'AtributosActualizar' : 'CamposDinamicosActualizar';

    const [puedeEditarPestana, setPuedeEditarPestana] = useState(false);

    // Cargo los permisos internos de la pestaña.
    useEffect(() => {
        const cargarPermisosPestana = async () => {
            const permisoEditar = await tieneUsuarioPermiso('Productos', permisoEditarPestana);
            setPuedeEditarPestana(Boolean(permisoEditar));
        };

        cargarPermisosPestana();
    }, [permisoEditarPestana]);

    useEffect(() => {
        const cargarDatos = async () => {
            if (!idProducto) {
                setCargando(false);
                return;
            }

            try {
                const usuarioSesion = getUsuarioSesion();

                // Cargar todas las propiedades del tipo de producto desde la vista
                const filtroTipoProducto = JSON.stringify({
                    where: { and: { tipoProductoId: tipoProductoId }}
                });

                // Cargar valores ya guardados para este producto
                const filtroProductoPropiedades = JSON.stringify({
                    where: { and: { productoId: idProducto }}
                });

                // Cargar solo los grupos del tipo correspondiente (alfabético por defecto)
                const filtroGrupos = JSON.stringify({
                    where: {
                        and: {
                            empresaId: usuarioSesion?.empresaId,
                            activoSn: 'S',
                            tipoDeGrupoPropiedad: tipoGrupoCorrespondiente
                        }
                    },
                    order: 'nombre ASC'
                });

                const [todasPropiedades, valoresData, gruposData, gruposDetalle] = await Promise.all([
                    getTipoProductoPropiedadDetalles(filtroTipoProducto),
                    getProductosPropiedad(filtroProductoPropiedades),
                    getGrupoPropiedades(filtroGrupos),
                    getTipoProductoGrupoPropiedadDetalles(filtroTipoProducto)
                ]);

                // Filtrar propiedades que pertenecen a grupos del tipo correspondiente
                const grupoIdsSet = new Set(gruposData.map(g => g.id));
                const propiedadesFiltradas = todasPropiedades.filter(p => grupoIdsSet.has(p.grupoPropiedadId));

                // Aplicar órdenes específicos de este tipo de producto a los grupos
                // (desde tipo_producto_grupo_propiedad_detalle.orden, sin fallback global)
                const ordenPorGrupo = {};
                if (gruposDetalle && gruposDetalle.length > 0) {
                    gruposDetalle.forEach(d => {
                        if (d.orden !== undefined && d.orden !== null) {
                            ordenPorGrupo[d.grupoPropiedadId] = d.orden;
                        }
                    });
                }
                // Grupos: orden per-tipo o null (se ordenará alfabéticamente)
                const gruposConOrden = gruposData.map(g => ({
                    ...g,
                    orden: ordenPorGrupo[g.id] !== undefined ? ordenPorGrupo[g.id] : null
                }));

                // Solo aseguro que null quede null para el orden alfabético
                const propiedadesConOrden = propiedadesFiltradas.map(p => ({
                    ...p,
                    orden: (p.orden !== undefined && p.orden !== null) ? p.orden : null
                }));

                setPropiedadesDefinidas(propiedadesConOrden);
                setGruposPropiedades(gruposConOrden);

                // Mapear valores existentes (solo los que corresponden a propiedades filtradas)
                const propiedadIdsSet = new Set(propiedadesFiltradas.map(p => p.id));
                const valoresMap = {};
                valoresData.forEach(valor => {
                    if (propiedadIdsSet.has(valor.propiedadId)) {
                        valoresMap[valor.propiedadId] = {
                            id: valor.id,
                            valor: valor.valor,
                            unidad: valor.unidad,
                            ordenEnGrupo: valor.ordenEnGrupo
                        };
                    }
                });
                setValoresPropiedades(valoresMap);
                
            } catch (error) {
                console.error('Error cargando datos:', error);
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: intl.formatMessage({ id: 'Error al cargar los datos' }),
                    life: 3000,
                });
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, [idProducto, tipoProductoId, tipoDePropiedad]);

    const actualizarValorPropiedad = (propiedadId, campo, valor) => {
        setValoresPropiedades(prev => ({
            ...prev,
            [propiedadId]: {
                ...prev[propiedadId],
                [campo]: valor
            }
        }));
        // Limpiar error de validación al modificar el valor
        if (campo === 'valor' && erroresValidacion.has(propiedadId)) {
            setErroresValidacion(prev => {
                const nuevo = new Set(prev);
                nuevo.delete(propiedadId);
                return nuevo;
            });
        }
    };

    const renderizarCampoPropiedad = (atributoDetalle) => {
        const valorActual = valoresPropiedades[atributoDetalle.id] || {};
        const deshabilitado = !estoyEditandoProducto || guardando || !puedeEditarPestana;

        console.log('Renderizando atributo:', atributoDetalle, 'Valor actual:', valorActual);

        switch (atributoDetalle.tipoDato) {
            case 'texto':
                return (
                    <InputText
                        value={valorActual.valor || ''}
                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'valor', e.target.value)}
                        placeholder={intl.formatMessage({ id: 'Ingrese el valor' })}
                        disabled={deshabilitado}
                        className="w-full"
                    />
                );

            case 'numero':
                return (
                    <InputNumber
                        value={valorActual.valor ? parseFloat(valorActual.valor) : null}
                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'valor', e.value?.toString() || '')}
                        placeholder={intl.formatMessage({ id: 'Ingrese el número' })}
                        disabled={deshabilitado}
                        inputStyle={{ textAlign: 'right' }}
                        className="w-full"
                    />
                );

            case 'fecha':
                return (
                    <Calendar
                        value={valorActual.valor ? new Date(valorActual.valor) : null}
                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'valor', e.value?.toISOString().split('T')[0] || '')}
                        disabled={deshabilitado}
                        placeholder={intl.formatMessage({ id: 'Seleccione la fecha' })}
                        dateFormat="dd/mm/yy"
                        className="w-full"
                    />
                );

            case 'booleano':
                return (
                    <InputSwitch
                        checked={valorActual.valor === 'true' || valorActual.valor === '1' || valorActual.valor === 'S'}
                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'valor', e.value ? 'S' : 'N')}
                        disabled={deshabilitado}
                    />
                );

            case 'lista':
                const opcionesLista = atributoDetalle.valoresPermitidos ? 
                    atributoDetalle.valoresPermitidos.split(';').map(v => ({ label: v.trim(), value: v.trim() })) : [];
                return (
                    <Dropdown
                        value={valorActual.valor || null}
                        options={opcionesLista}
                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'valor', e.value || '')}
                        placeholder={intl.formatMessage({ id: 'Seleccione una opción' })}
                        disabled={deshabilitado}
                        className="w-full"
                        showClear
                        emptyMessage={intl.formatMessage({ id: 'No hay opciones disponibles' })}
                    />
                );

            case 'multiselect':
                const opcionesMulti = atributoDetalle.valoresPermitidos ? 
                    atributoDetalle.valoresPermitidos.split(';').map(v => ({ label: v.trim(), value: v.trim() })) : [];
                const valoresSeleccionados = valorActual.valor ? valorActual.valor.split(';').map(v => v.trim()).filter(v => v !== '') : [];
                return (
                    <MultiSelect
                        value={valoresSeleccionados}
                        options={opcionesMulti}
                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'valor', e.value.join(';'))}
                        placeholder={intl.formatMessage({ id: 'Seleccione opciones' })}
                        disabled={deshabilitado}
                        className="w-full"
                        display="chip"
                    />
                );

            case 'textarea':
                return (
                    <InputTextarea
                        value={valorActual.valor || ''}
                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'valor', e.target.value)}
                        placeholder={intl.formatMessage({ id: 'Ingrese el texto' })}
                        disabled={deshabilitado}
                        rows={4}
                        // autoResize
                        className="w-full"
                    />
                );

            default:
                return (
                    <InputTextarea
                        value={valorActual.valor || ''}
                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'valor', e.target.value)}
                        placeholder={intl.formatMessage({ id: 'Ingrese el valor' })}
                        disabled={deshabilitado}
                        rows={3}
                        className="w-full"
                    />
                );
        }
    };

    const validarObligatorios = () => {
        const errores = new Set();
        const camposFaltantes = [];

        propiedadesDefinidas.forEach(atributo => {
            if (atributo.obligatorioSn === 'S') {
                const valor = valoresPropiedades[atributo.id]?.valor;
                const vacio = valor === undefined || valor === null || valor.toString().trim() === '';
                if (vacio) {
                    errores.add(atributo.id);
                    const grupo = gruposPropiedades.find(g => g.id === atributo.grupoPropiedadId);
                    camposFaltantes.push({
                        grupo: grupo?.nombre || intl.formatMessage({ id: 'Sin grupo' }),
                        atributo: atributo.nombre
                    });
                }
            }
        });

        setErroresValidacion(errores);

        if (camposFaltantes.length > 0) {
            // Agrupar por grupo para un mensaje claro
            const porGrupo = {};
            camposFaltantes.forEach(({ grupo, atributo }) => {
                if (!porGrupo[grupo]) porGrupo[grupo] = [];
                porGrupo[grupo].push(atributo);
            });

            const detalle = (
                <div>
                    {Object.entries(porGrupo).map(([grupo, attrs]) => (
                        <div key={grupo} className="mb-2">
                            <b>{grupo}:</b>
                            <ul className="m-0 pl-3 mt-1">
                                {attrs.map(attr => <li key={attr}>{attr}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            );

            toast.current?.show({
                severity: 'error',
                summary: intl.formatMessage({ id: 'Campos obligatorios vacíos' }),
                detail: detalle,
                life: 6000,
                sticky: false
            });
            return false;
        }
        return true;
    };

    const guardarPropiedades = async () => {
        if (!validarObligatorios()) return;

        setGuardando(true);
        const usuario = getUsuarioSesion();

        // Solo guardar valores de las propiedades que pertenecen a este tipo
        const propiedadIdsSet = new Set(propiedadesDefinidas.map(p => p.id));

        try {
            const promesasGuardado = [];

            for (const [propiedadId, valores] of Object.entries(valoresPropiedades)) {
                if (!propiedadIdsSet.has(parseInt(propiedadId))) continue;

                const tieneValor = valores.valor !== undefined && valores.valor !== null && valores.valor.toString().trim() !== '';

                if (tieneValor) {
                    // Guardar o actualizar el valor
                    const datosPropiedad = {
                        productoId: idProducto,
                        propiedadId: parseInt(propiedadId),
                        valor: valores.valor.toString(),
                        unidad: valores.unidad || '',
                        ordenEnGrupo: valores.ordenEnGrupo || 0,
                        usuarioCreacion: usuario.id,
                        usuarioModificacion: usuario.id
                    };

                    if (valores.id) {
                        promesasGuardado.push(patchProductoPropiedad(valores.id, datosPropiedad));
                    } else {
                        promesasGuardado.push(postProductoPropiedad(datosPropiedad));
                    }
                } else if (valores.id) {
                    // Valor vaciado y existe registro en BD: eliminar el registro
                    promesasGuardado.push(deleteProductoPropiedad(valores.id));
                }
            }

            await Promise.all(promesasGuardado);

            // Guardar también el tipoProductoId en el producto para mantener consistencia
            if (idProducto && tipoProductoId) {
                await patchProducto(idProducto, {
                    tipoProductoId: tipoProductoId,
                    usuarioModificacion: usuario.id
                });
            }

            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Éxito' }),
                detail: textoGuardadoOk,
                life: 3000,
            });

            // Recargar valores guardados para este producto (solo los de este tipo)
            const filtroProductoPropiedades = JSON.stringify({
                where: { and: { productoId: idProducto } },
                order: 'ordenEnGrupo ASC'
            });
            const valoresData = await getProductosPropiedad(filtroProductoPropiedades);
            const valoresMap = {};
            valoresData.forEach(valor => {
                if (propiedadIdsSet.has(valor.propiedadId)) {
                    valoresMap[valor.propiedadId] = {
                        id: valor.id,
                        valor: valor.valor,
                        unidad: valor.unidad,
                        ordenEnGrupo: valor.ordenEnGrupo
                    };
                }
            });
            setValoresPropiedades(valoresMap);

        } catch (error) {
            console.error('Error guardando propiedades:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: intl.formatMessage({ id: 'Error al guardar los propiedades' }),
                life: 3000,
            });
        } finally {
            setGuardando(false);
        }
    };

    // Agrupar propiedades por grupo y ordenar
    const propiedadesAgrupadas = useMemo(() => {
        const mapa = new Map();

        gruposPropiedades.forEach(grupo => {
            mapa.set(grupo.id, { grupo, items: [] });
        });

        propiedadesDefinidas.forEach(atributo => {
            const grupoId = atributo.grupoPropiedadId;
            if (grupoId && mapa.has(grupoId)) {
                mapa.get(grupoId).items.push(atributo);
            } else if (grupoId && !mapa.has(grupoId)) {
                mapa.set(grupoId, {
                    grupo: { id: grupoId, nombre: intl.formatMessage({ id: 'Grupo desconocido' }) },
                    items: [atributo]
                });
            }
        });

        const sinGrupo = propiedadesDefinidas.filter(a => !a.grupoPropiedadId);

        const gruposConItems = Array.from(mapa.values()).filter(g => g.items.length > 0);

        // Ordenar grupos: por orden per-tipo si existe, si no alfabéticamente
        gruposConItems.sort((a, b) => {
            const tieneOrdenA = a.grupo.orden !== null && a.grupo.orden !== undefined;
            const tieneOrdenB = b.grupo.orden !== null && b.grupo.orden !== undefined;

            if (tieneOrdenA && tieneOrdenB) {
                if (a.grupo.orden !== b.grupo.orden) return a.grupo.orden - b.grupo.orden;
                return (a.grupo.nombre || '').localeCompare(b.grupo.nombre || '');
            }
            if (tieneOrdenA) return -1;
            if (tieneOrdenB) return 1;
            return (a.grupo.nombre || '').localeCompare(b.grupo.nombre || '');
        });

        // Ordenar propiedades: por orden per-tipo si existe, si no alfabéticamente
        const ordenarItems = (arr) => {
            arr.sort((a, b) => {
                const tieneOrdenA = a.orden !== null && a.orden !== undefined;
                const tieneOrdenB = b.orden !== null && b.orden !== undefined;

                if (tieneOrdenA && tieneOrdenB) {
                    if (a.orden !== b.orden) return a.orden - b.orden;
                    return (a.nombre || '').localeCompare(b.nombre || '');
                }
                if (tieneOrdenA) return -1;
                if (tieneOrdenB) return 1;
                return (a.nombre || '').localeCompare(b.nombre || '');
            });
        };

        gruposConItems.forEach(g => ordenarItems(g.items));
        ordenarItems(sinGrupo);

        return { gruposOrdenados: gruposConItems, sinGrupo };
    }, [propiedadesDefinidas, gruposPropiedades, valoresPropiedades, intl]);

    const renderPropiedadCard = (atributoDetalle) => {
        const valorActual = valoresPropiedades[atributoDetalle.id] || {};
        const deshabilitado = !estoyEditandoProducto || guardando || !puedeEditarPestana;

        return (
            <div key={atributoDetalle.id} className="field col-12 md:col-6 lg:col-4">
                <div className={`p-3 border-1 border-round h-full flex flex-column ${erroresValidacion.has(atributoDetalle.id) ? 'border-red-500 bg-red-50' : 'border-300'}`}>
                    <div className="flex align-items-center mb-2">
                        {estoyEditandoProducto && (
                            <>
                                {/* <div className="flex flex-column align-items-center mr-2">
                                    <label className="text-xs font-semibold mb-1">{intl.formatMessage({ id: 'Orden' })}</label>
                                    <InputNumber
                                        value={valorActual.ordenEnGrupo || 0}
                                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'ordenEnGrupo', e.value || 0)}
                                        disabled={deshabilitado}
                                        min={0}
                                        max={999}
                                        inputStyle={{ textAlign: 'right', width: '3.5rem' }}
                                        placeholder="0"
                                    />
                                </div>
                                <Divider layout="vertical" className="mx-2" /> */}
                            </>
                        )}
                        <label className="block font-medium">
                            <b>{atributoDetalle.nombre}</b>
                            {atributoDetalle.obligatorioSn === 'S' && <span className="text-red-500 ml-1">*</span>}
                        </label>
                    </div>
                    <div className="mb-2 flex-grow-1">
                        <div className="flex align-items-center gap-2">
                            <div className="flex-1">
                                {renderizarCampoPropiedad(atributoDetalle)}
                            </div>
                            {atributoDetalle.unidadMedida && (
                                <span className="text-sm text-gray-600 font-medium ml-2">
                                    {atributoDetalle.unidadMedida}
                                </span>
                            )}
                        </div>
                    </div>
                    {atributoDetalle.descripcion && (
                        <small className="text-gray-600 block mt-auto">
                            {atributoDetalle.descripcion}
                        </small>
                    )}
                </div>
            </div>
        );
    };

    const renderGrupoPropiedades = ({ grupo, items: grupoItems }) => {
        return (
            <Fieldset
                key={grupo.id}
                legend={`${grupo.nombre} (${grupoItems.length})`}
                collapsed={true}
                toggleable
                className="mb-3"
            >
                {grupo.descripcion && (
                    <small className="p-text-secondary block mb-3">{grupo.descripcion}</small>
                )}
                <div className="formgrid grid">
                    {grupoItems.map(renderPropiedadCard)}
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

    if (!idProducto) {
        return <div className="text-center p-4">{intl.formatMessage({ id: 'Seleccione un producto' })}</div>;
    }

    if (!propiedadesDefinidas.length) {
        return (
            <div className="text-center p-4 text-gray-500">
                {textoVacio}
            </div>
        );
    }

    return (
        <div>
            <Toast ref={toast} />
            {propiedadesAgrupadas.gruposOrdenados.map(renderGrupoPropiedades)}

            {propiedadesAgrupadas.sinGrupo.length > 0 && (
                <Fieldset
                    legend={`${intl.formatMessage({ id: 'Sin grupo' })} (${propiedadesAgrupadas.sinGrupo.length})`}
                    collapsed={true}
                    toggleable
                    className="mb-3"
                >
                    <div className="formgrid grid">
                        {propiedadesAgrupadas.sinGrupo.map(renderPropiedadCard)}
                    </div>
                </Fieldset>
            )}

            {estoyEditandoProducto && (
                <div className="flex justify-content-end mt-4">
                    <Button
                        label={guardando ? 
                            `${intl.formatMessage({ id: 'Guardando' })}...` : 
                            textoGuardar
                        }
                        icon={guardando ? "pi pi-spin pi-spinner" : "pi pi-save"}
                        onClick={guardarPropiedades}
                        disabled={guardando || !puedeEditarPestana}
                        className="p-button-primary"
                    />
                </div>
            )}
        </div>
    );
};

export default ProductoPropiedad;
