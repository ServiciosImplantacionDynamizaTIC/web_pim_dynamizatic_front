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
import { getProducto } from "@/app/api-endpoints/producto";
import { getTipoProductoPropiedadDetalles } from "@/app/api-endpoints/tipo_producto_atributo_detalle";
import { getProductosPropiedad, postProductoPropiedad, patchProductoPropiedad } from "@/app/api-endpoints/producto_atributo";
import { getGrupoPropiedades } from "@/app/api-endpoints/grupo_atributo";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { InputTextarea } from "primereact/inputtextarea";

const ProductoPropiedad = ({ idProducto, tipoProductoId, estoyEditandoProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [atributosDefinidos, setPropiedadesDefinidos] = useState([]);
    const [gruposPropiedades, setGruposPropiedades] = useState([]);
    const [valoresPropiedades, setValoresPropiedades] = useState({});
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [erroresValidacion, setErroresValidacion] = useState(new Set());

    useEffect(() => {
        const cargarDatos = async () => {
            if (!idProducto) {
                setCargando(false);
                return;
            }

            try {
                const usuarioSesion = getUsuarioSesion();

                const filtroTipoProducto = JSON.stringify({
                    where: { and: { tipoProductoId: tipoProductoId }},
                    order: 'orden ASC'
                });

                const filtroProductoPropiedades = JSON.stringify({
                    where: { and: { productoId: idProducto }},
                    order: 'ordenEnGrupo ASC'
                });

                const filtroGrupos = JSON.stringify({
                    where: {
                        and: {
                            empresaId: usuarioSesion?.empresaId,
                            activoSn: 'S'
                        }
                    },
                    order: 'orden ASC'
                });

                const [atributosOrdenados, valoresData, gruposData] = await Promise.all([
                    getTipoProductoPropiedadDetalles(filtroTipoProducto),
                    getProductosPropiedad(filtroProductoPropiedades),
                    getGrupoPropiedades(filtroGrupos)
                ]);

                setPropiedadesDefinidos(atributosOrdenados);
                setGruposPropiedades(gruposData);

                const valoresMap = {};
                valoresData.forEach(valor => {
                    valoresMap[valor.atributoId] = {
                        id: valor.id,
                        valor: valor.valor,
                        unidad: valor.unidad,
                        ordenEnGrupo: valor.ordenEnGrupo
                    };
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
    }, [idProducto]);

    const actualizarValorPropiedad = (atributoId, campo, valor) => {
        setValoresPropiedades(prev => ({
            ...prev,
            [atributoId]: {
                ...prev[atributoId],
                [campo]: valor
            }
        }));
        // Limpiar error de validación al modificar el valor
        if (campo === 'valor' && erroresValidacion.has(atributoId)) {
            setErroresValidacion(prev => {
                const nuevo = new Set(prev);
                nuevo.delete(atributoId);
                return nuevo;
            });
        }
    };

    const renderizarCampoPropiedad = (atributoDetalle) => {
        const valorActual = valoresPropiedades[atributoDetalle.id] || {};
        const deshabilitado = !estoyEditandoProducto || guardando;

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
                        value={valorActual.valor || ''}
                        options={opcionesLista}
                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'valor', e.value || '')}
                        placeholder={intl.formatMessage({ id: 'Seleccione una opción' })}
                        disabled={deshabilitado}
                        className="w-full"
                        emptyMessage={intl.formatMessage({ id: 'No hay opciones disponibles' })}
                    />
                );

            case 'multiselect':
                const opcionesMulti = atributoDetalle.valoresPermitidos ? 
                    atributoDetalle.valoresPermitidos.split(';').map(v => ({ label: v.trim(), value: v.trim() })) : [];
                const valoresSeleccionados = valorActual.valor ? valorActual.valor.split(',').map(v => v.trim()) : [];
                return (
                    <MultiSelect
                        value={valoresSeleccionados}
                        options={opcionesMulti}
                        onChange={(e) => actualizarValorPropiedad(atributoDetalle.id, 'valor', e.value.join(', '))}
                        placeholder={intl.formatMessage({ id: 'Seleccione opciones' })}
                        disabled={deshabilitado}
                        className="w-full"
                        display="chip"
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

        atributosDefinidos.forEach(atributo => {
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

        try {
            const promesasGuardado = [];

            for (const [atributoId, valores] of Object.entries(valoresPropiedades)) {
                // Solo guardar si hay un valor
                if (valores.valor !== undefined && valores.valor !== null && valores.valor.toString().trim() !== '') {
                    const datosPropiedad = {
                        productoId: idProducto,
                        atributoId: parseInt(atributoId),
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
                }
            }

            await Promise.all(promesasGuardado);

            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Éxito' }),
                detail: intl.formatMessage({ id: 'Propiedades guardados correctamente' }),
                life: 3000,
            });

            const filtroProductoPropiedades = JSON.stringify({
                where: { productoId: idProducto }
            });
            const valoresData = await getProductosPropiedad(filtroProductoPropiedades);
            const valoresMap = {};
            valoresData.forEach(valor => {
                valoresMap[valor.atributoId] = {
                    id: valor.id,
                    valor: valor.valor,
                    unidad: valor.unidad,
                    ordenEnGrupo: valor.ordenEnGrupo
                };
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

    // Agrupar propiedades por grupo y ordenar por ordenEnGrupo
    const atributosAgrupados = useMemo(() => {
        const mapa = new Map();

        gruposPropiedades.forEach(grupo => {
            mapa.set(grupo.id, { grupo, items: [] });
        });

        atributosDefinidos.forEach(atributo => {
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

        const sinGrupo = atributosDefinidos.filter(a => !a.grupoPropiedadId);

        const gruposConItems = Array.from(mapa.values()).filter(g => g.items.length > 0);

        // Ordenar grupos por su campo orden
        gruposConItems.sort((a, b) => {
            const ordenA = a.grupo.orden ?? Number.MAX_SAFE_INTEGER;
            const ordenB = b.grupo.orden ?? Number.MAX_SAFE_INTEGER;
            if (ordenA !== ordenB) return ordenA - ordenB;
            return (a.grupo.nombre || '').localeCompare(b.grupo.nombre || '');
        });

        // Ordenar ítems dentro de cada grupo:
        // 1. Items sin orden asignado (ordenEnGrupo=0 o undefined) van PRIMERO, ordenados por atributo.orden
        // 2. Items con orden asignado (ordenEnGrupo>0) van DESPUÉS, ordenados por ordenEnGrupo
        // 3. Si NINGUNO tiene orden asignado, se mantiene el orden por defecto (atributo.orden)
        const ordenarItems = (arr) => {
            arr.sort((a, b) => {
                const ordenEnGrupoA = valoresPropiedades[a.id]?.ordenEnGrupo;
                const ordenEnGrupoB = valoresPropiedades[b.id]?.ordenEnGrupo;

                const tieneOrdenA = ordenEnGrupoA && ordenEnGrupoA > 0;
                const tieneOrdenB = ordenEnGrupoB && ordenEnGrupoB > 0;

                // Ambos sin orden: ordenar por atributo.orden (orden por defecto)
                if (!tieneOrdenA && !tieneOrdenB) {
                    const ordenAttrA = a.orden ?? Number.MAX_SAFE_INTEGER;
                    const ordenAttrB = b.orden ?? Number.MAX_SAFE_INTEGER;
                    if (ordenAttrA !== ordenAttrB) return ordenAttrA - ordenAttrB;
                    return (a.nombre || '').localeCompare(b.nombre || '');
                }

                // Sin orden va primero que con orden
                if (!tieneOrdenA) return -1;
                if (!tieneOrdenB) return 1;

                // Ambos con orden: ordenar por ordenEnGrupo
                if (ordenEnGrupoA !== ordenEnGrupoB) return ordenEnGrupoA - ordenEnGrupoB;
                return (a.nombre || '').localeCompare(b.nombre || '');
            });
        };

        gruposConItems.forEach(g => ordenarItems(g.items));
        ordenarItems(sinGrupo);

        return { gruposOrdenados: gruposConItems, sinGrupo };
    }, [atributosDefinidos, gruposPropiedades, valoresPropiedades, intl]);

    const renderPropiedadCard = (atributoDetalle) => {
        const valorActual = valoresPropiedades[atributoDetalle.id] || {};
        const deshabilitado = !estoyEditandoProducto || guardando;

        return (
            <div key={atributoDetalle.id} className="field col-12 md:col-6 lg:col-4">
                <div className={`p-3 border-1 border-round ${erroresValidacion.has(atributoDetalle.id) ? 'border-red-500 bg-red-50' : 'border-300'}`}>
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
                    <div className="mb-2">
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
                        <small className="text-gray-600 block mt-1">
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
                collapsed={false}
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

    if (!atributosDefinidos.length) {
        return (
            <Card title={intl.formatMessage({ id: 'Propiedades del Producto' })}>
                <div className="text-center p-4">
                    {intl.formatMessage({ id: 'No hay propiedades definidos para este tipo de producto' })}
                </div>
            </Card>
        );
    }

    return (
        <div>
            <Toast ref={toast} />
            <Card title={intl.formatMessage({ id: 'Propiedades del Producto' })}>
                {atributosAgrupados.gruposOrdenados.map(renderGrupoPropiedades)}

                {atributosAgrupados.sinGrupo.length > 0 && (
                    <Fieldset
                        legend={`${intl.formatMessage({ id: 'Sin grupo' })} (${atributosAgrupados.sinGrupo.length})`}
                        collapsed={false}
                        toggleable
                        className="mb-3"
                    >
                        <div className="formgrid grid">
                            {atributosAgrupados.sinGrupo.map(renderPropiedadCard)}
                        </div>
                    </Fieldset>
                )}

                {estoyEditandoProducto && (
                    <div className="flex justify-content-end mt-4">
                        <Button
                            label={guardando ? 
                                `${intl.formatMessage({ id: 'Guardando' })}...` : 
                                intl.formatMessage({ id: 'Guardar Propiedades' })
                            }
                            icon={guardando ? "pi pi-spin pi-spinner" : "pi pi-save"}
                            onClick={guardarPropiedades}
                            disabled={guardando}
                            className="p-button-primary"
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ProductoPropiedad;