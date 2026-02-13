"use client";
import React, { useState, useEffect, useRef } from "react";
import { useIntl } from 'react-intl';
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { MultiSelect } from "primereact/multiselect";
import { getProducto } from "@/app/api-endpoints/producto";
import { getTipoProductoAtributoDetalles } from "@/app/api-endpoints/tipo_producto_atributo_detalle";
import { getProductosAtributo, postProductoAtributo, patchProductoAtributo } from "@/app/api-endpoints/producto_atributo";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { InputTextarea } from "primereact/inputtextarea";

const ProductoAtributo = ({ idProducto, tipoProductoId, estoyEditandoProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);
    
    const [atributosDefinidos, setAtributosDefinidos] = useState([]);
    const [valoresAtributos, setValoresAtributos] = useState({});
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            if (!idProducto) {
                setCargando(false);
                return;
            }

            try {
                //
                // Obtenemos los atributos definidos para el tipo de producto
                //
                const filtroTipoProducto = JSON.stringify({
                    where: { and: { tipoProductoId: tipoProductoId }},
                    order: 'orden ASC'
                });
                const atributosOrdenados = await getTipoProductoAtributoDetalles(filtroTipoProducto);                
                
                setAtributosDefinidos(atributosOrdenados);
                //
                // Obtenenemos los valores actuales de atributos del producto
                //
                const filtroProductoAtributos = JSON.stringify({
                    where: { and: { productoId: idProducto }},
                    order: 'ordenEnGrupo ASC'
                });
                const valoresData = await getProductosAtributo(filtroProductoAtributos);
                //
                // Creamos un objeto con los valores indexados por atributoId
                //
                const valoresMap = {};
                valoresData.forEach(valor => {
                    valoresMap[valor.atributoId] = {
                        id: valor.id,
                        valor: valor.valor,
                        unidad: valor.unidad,
                        ordenEnGrupo: valor.ordenEnGrupo
                    };
                });
                
                setValoresAtributos(valoresMap);
                
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

    const actualizarValorAtributo = (atributoId, campo, valor) => {
        setValoresAtributos(prev => ({
            ...prev,
            [atributoId]: {
                ...prev[atributoId],
                [campo]: valor
            }
        }));
    };

    const renderizarCampoAtributo = (atributoDetalle) => {
        const valorActual = valoresAtributos[atributoDetalle.id] || {};
        const deshabilitado = !estoyEditandoProducto || guardando;

        console.log('Renderizando atributo:', atributoDetalle, 'Valor actual:', valorActual);

        switch (atributoDetalle.tipoDato) {
            case 'texto':
                return (
                    <InputText
                        value={valorActual.valor || ''}
                        onChange={(e) => actualizarValorAtributo(atributoDetalle.id, 'valor', e.target.value)}
                        placeholder={intl.formatMessage({ id: 'Ingrese el valor' })}
                        disabled={deshabilitado}
                        className="w-full"
                    />
                );

            case 'numero':
                return (
                    <InputNumber
                        value={valorActual.valor ? parseFloat(valorActual.valor) : null}
                        onChange={(e) => actualizarValorAtributo(atributoDetalle.id, 'valor', e.value?.toString() || '')}
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
                        onChange={(e) => actualizarValorAtributo(atributoDetalle.id, 'valor', e.value?.toISOString().split('T')[0] || '')}
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
                        onChange={(e) => actualizarValorAtributo(atributoDetalle.id, 'valor', e.value ? 'S' : 'N')}
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
                        onChange={(e) => actualizarValorAtributo(atributoDetalle.id, 'valor', e.value || '')}
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
                        onChange={(e) => actualizarValorAtributo(atributoDetalle.id, 'valor', e.value.join(', '))}
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
                        onChange={(e) => actualizarValorAtributo(atributoDetalle.id, 'valor', e.target.value)}
                        placeholder={intl.formatMessage({ id: 'Ingrese el valor' })}
                        disabled={deshabilitado}
                        rows={3}
                        className="w-full"
                    />
                );
        }
    };

    const guardarAtributos = async () => {
        setGuardando(true);
        const usuario = getUsuarioSesion();

        try {
            const promesasGuardado = [];

            for (const [atributoId, valores] of Object.entries(valoresAtributos)) {
                // Solo guardar si hay un valor
                if (valores.valor !== undefined && valores.valor !== null && valores.valor.toString().trim() !== '') {
                    const datosAtributo = {
                        productoId: idProducto,
                        atributoId: parseInt(atributoId),
                        valor: valores.valor.toString(),
                        unidad: valores.unidad || '',
                        ordenEnGrupo: valores.ordenEnGrupo || 0,
                        usuarioCreacion: usuario.id,
                        usuarioModificacion: usuario.id
                    };

                    if (valores.id) {
                        // Actualizar existente
                        promesasGuardado.push(patchProductoAtributo(valores.id, datosAtributo));
                    } else {
                        // Crear nuevo
                        promesasGuardado.push(postProductoAtributo(datosAtributo));
                    }
                }
            }

            await Promise.all(promesasGuardado);

            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Éxito' }),
                detail: intl.formatMessage({ id: 'Atributos guardados correctamente' }),
                life: 3000,
            });

            // Recargar solo los datos de atributos en lugar de toda la página
            const filtroProductoAtributos = JSON.stringify({
                where: { productoId: idProducto }
            });
            const valoresData = await getProductosAtributo(filtroProductoAtributos);
            const valoresMap = {};
            valoresData.forEach(valor => {
                valoresMap[valor.atributoId] = {
                    id: valor.id,
                    valor: valor.valor,
                    unidad: valor.unidad,
                    ordenEnGrupo: valor.ordenEnGrupo
                };
            });
            setValoresAtributos(valoresMap);

        } catch (error) {
            console.error('Error guardando atributos:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: intl.formatMessage({ id: 'Error al guardar los atributos' }),
                life: 3000,
            });
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return <div className="text-center p-4">{intl.formatMessage({ id: 'Cargando atributos' })}...</div>;
    }

    if (!idProducto) {
        return <div className="text-center p-4">{intl.formatMessage({ id: 'Seleccione un producto' })}</div>;
    }

    if (!atributosDefinidos.length) {
        return (
            <Card title={intl.formatMessage({ id: 'Atributos del Producto' })}>
                <div className="text-center p-4">
                    {intl.formatMessage({ id: 'No hay atributos definidos para este tipo de producto' })}
                </div>
            </Card>
        );
    }

    return (
        <div>
            <Toast ref={toast} />
            <Card title={intl.formatMessage({ id: 'Atributos del Producto' })}>
                <div className="formgrid grid">
                    {atributosDefinidos
                        .sort((a, b) => {
                            // Obtener el orden de cada atributo
                            const ordenA = valoresAtributos[a.id]?.ordenEnGrupo || 0;
                            const ordenB = valoresAtributos[b.id]?.ordenEnGrupo || 0;
                            
                            // Ordenar por ordenEnGrupo, luego por orden del atributo, luego por nombre
                            if (ordenA !== ordenB) {
                                return ordenA - ordenB;
                            }
                            
                            const ordenAtributoA = a.orden || 0;
                            const ordenAtributoB = b.orden || 0;
                            if (ordenAtributoA !== ordenAtributoB) {
                                return ordenAtributoA - ordenAtributoB;
                            }
                            
                            const nombreA = a.nombre || '';
                            const nombreB = b.nombre || '';
                            return nombreA.localeCompare(nombreB);
                        })
                        .map((atributoDetalle) => {
                        const valorActual = valoresAtributos[atributoDetalle.id] || {};
                                                
                        return (
                            <div key={atributoDetalle.id} className="field col-12 md:col-6 lg:col-4">
                                <div className="flex align-items-center mb-2">
                                    <InputNumber
                                        id={`orden_${atributoDetalle.id}`}
                                        value={valorActual.ordenEnGrupo || 0}
                                        onChange={(e) => actualizarValorAtributo(atributoDetalle.id, 'ordenEnGrupo', e.value || 0)}
                                        disabled={!estoyEditandoProducto || guardando}
                                        min={0}
                                        max={999}
                                        inputStyle={{ textAlign: 'right', width: '4rem' }}
                                        size="small"
                                        placeholder="000"
                                    />
                                    <label htmlFor={`atributo_${atributoDetalle.id}`} className="block font-medium ml-2">
                                        <b>{atributoDetalle.nombre}</b>
                                        {atributoDetalle.obligatorioSn === 'S' && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                </div>
                                <div className="mb-2">
                                    <div className="flex align-items-center gap-2">
                                        <div className="flex-1">
                                            {renderizarCampoAtributo(atributoDetalle)}
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
                        );
                    })}
                </div>

                {estoyEditandoProducto && (
                    <div className="flex justify-content-end mt-4">
                        <Button
                            label={guardando ? 
                                `${intl.formatMessage({ id: 'Guardando' })}...` : 
                                intl.formatMessage({ id: 'Guardar Atributos' })
                            }
                            icon={guardando ? "pi pi-spin pi-spinner" : "pi pi-save"}
                            onClick={guardarAtributos}
                            disabled={guardando}
                            className="p-button-primary"
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ProductoAtributo;