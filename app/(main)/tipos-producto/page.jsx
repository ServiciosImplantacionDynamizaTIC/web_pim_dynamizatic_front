"use client";
import { deleteTipoProducto, getTiposProducto, getTiposProductoCount, postTipoProducto } from "@/app/api-endpoints/tipo_producto";
import { getTipoProductoPropiedadDetalles, postTipoProductoPropiedadDetalle } from "@/app/api-endpoints/tipo_producto_propiedad_detalle";
import { getTipoProductoMultimediaDetalles, postTipoProductoMultimediaDetalle } from "@/app/api-endpoints/tipo_producto_multimedia_detalle";
import Crud from "../../components/shared/crud";
import EditarTipoProducto from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "@/app/utility/Utils";
import { Button } from "primereact/button";
import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";

const TiposProducto = () => {
    const intl = useIntl();
    const usuarioSesion = getUsuarioSesion();
    const crudRef = useRef(null);
    const toast = useRef(null);
    const [estadoClonado, setEstadoClonado] = useState(false);
    const [mostrarConfirmacionClonado, setMostrarConfirmacionClonado] = useState(false);
    const [tipoPendienteClonado, setTipoPendienteClonado] = useState(null);

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'descripcion', header: intl.formatMessage({ id: 'Descripción' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]

    const filtradoBase = { empresaId: usuarioSesion?.empresaId };

    // --- Lógica de clonado de tipo de producto ---

    const clonarTipoProducto = async (tipoOrigen) => {
        if (estadoClonado || !tipoOrigen?.id) return;

        setEstadoClonado(true);

        try {
            // 1. Crear el nuevo tipo de producto con nombre + "_COPIA"
            const nuevoTipo = await postTipoProducto({
                empresaId: tipoOrigen.empresaId || usuarioSesion?.empresaId,
                nombre: `${tipoOrigen.nombre}_COPIA`,
                descripcion: tipoOrigen.descripcion || null,
                activoSn: tipoOrigen.activoSn || 'S',
                usuarioCreacion: usuarioSesion?.id || null,
            });

            const nuevoTipoId = nuevoTipo?.id;
            if (!nuevoTipoId) {
                throw new Error('No se pudo obtener el ID del tipo de producto clonado');
            }

            // 2. Obtener y clonar los propiedades asociados (tipo_producto_atributo_detalle)
            const filtroPropiedades = JSON.stringify({
                where: { and: { tipoProductoId: tipoOrigen.id } }
            });
            const atributosDetalle = await getTipoProductoPropiedadDetalles(filtroPropiedades);
            let atributosClonados = 0;

            if (atributosDetalle && atributosDetalle.length > 0) {
                const promesasPropiedades = atributosDetalle.map(detalle =>
                    postTipoProductoPropiedadDetalle({
                        tipoProductoId: nuevoTipoId,
                        atributoId: detalle.id,
                    })
                );
                await Promise.all(promesasPropiedades);
                atributosClonados = atributosDetalle.length;
            }

            // 3. Obtener y clonar los multimedia asociados (tipo_producto_multimedia_detalle)
            const filtroMultimedias = JSON.stringify({
                where: { and: { tipoProductoId: tipoOrigen.id } }
            });
            const multimediasDetalle = await getTipoProductoMultimediaDetalles(filtroMultimedias);
            let multimediasClonados = 0;

            if (multimediasDetalle && multimediasDetalle.length > 0) {
                const promesasMultimedias = multimediasDetalle.map(detalle =>
                    postTipoProductoMultimediaDetalle({
                        tipoProductoId: nuevoTipoId,
                        multimediaId: detalle.id,
                    })
                );
                await Promise.all(promesasMultimedias);
                multimediasClonados = multimediasDetalle.length;
            }

            // 4. Mostrar resumen del clonado
            // const detalles = [
            //     `${atributosClonados} ${intl.formatMessage({ id: 'propiedades' })}`,
            //     `${multimediasClonados} ${intl.formatMessage({ id: 'multimedia' })}`,
            // ].join(' | ');

            toast.current?.show({
                severity: 'success',
                summary: intl.formatMessage({ id: 'Tipo de producto clonado' }),
                detail: `${intl.formatMessage({ id: 'Nuevo nombre' })}: "${nuevoTipo.nombre}"`,
                life: 5000,
            });

            // 5. Recargar datos del CRUD
            crudRef.current?.recargarDatos?.();
        } catch (error) {
            console.error('[CLONAR TIPO PRODUCTO][ERROR]', error);
            toast.current?.show({
                severity: 'error',
                summary: 'ERROR',
                detail: intl.formatMessage({ id: 'Ha ocurrido un error clonando el tipo de producto' }),
                life: 5000,
            });
        } finally {
            setEstadoClonado(false);
        }
    };

    const abrirConfirmacionClonado = (tipoOrigen) => {
        if (estadoClonado) return;
        setTipoPendienteClonado(tipoOrigen);
        setMostrarConfirmacionClonado(true);
    };

    const cerrarConfirmacionClonado = () => {
        if (estadoClonado) return;
        setMostrarConfirmacionClonado(false);
        setTipoPendienteClonado(null);
    };

    const confirmarClonado = async () => {
        const tipoOrigen = tipoPendienteClonado;
        setMostrarConfirmacionClonado(false);
        setTipoPendienteClonado(null);
        if (!tipoOrigen) return;
        await clonarTipoProducto(tipoOrigen);
    };

    const nombreTipoConfirmacion = tipoPendienteClonado?.nombre || intl.formatMessage({ id: 'este tipo de producto' });

    const botonesExtra = [
        {
            boton: (
                <Button
                    icon={estadoClonado ? "pi pi-spin pi-spinner" : "pi pi-copy"}
                    className="mr-2"
                    rounded
                    title={intl.formatMessage({ id: 'Clonar tipo de producto' })}
                    severity="help"
                    permiso="ver"
                    disabled={estadoClonado}
                />
            ),
            funcionOnClick: abrirConfirmacionClonado,
        }
    ];
    
    return (
        <div>
            <Toast ref={toast} position="top-right" />
            <Dialog
                visible={mostrarConfirmacionClonado}
                onHide={cerrarConfirmacionClonado}
                header={intl.formatMessage({ id: 'Confirmar clonado' })}
                style={{ width: '36rem', maxWidth: '95vw' }}
                modal
                closable={!estadoClonado}
                footer={
                    <div className="flex gap-2 justify-content-end">
                        <Button
                            label={intl.formatMessage({ id: 'Cancelar' })}
                            className="p-button-secondary"
                            onClick={cerrarConfirmacionClonado}
                            disabled={estadoClonado}
                        />
                        <Button
                            label={estadoClonado ? intl.formatMessage({ id: 'Clonando...' }) : intl.formatMessage({ id: 'Clonar' })}
                            icon={estadoClonado ? "pi pi-spin pi-spinner" : "pi pi-copy"}
                            onClick={confirmarClonado}
                            disabled={estadoClonado}
                        />
                    </div>
                }
            >
                <p style={{ margin: 0 }}>
                    {intl.formatMessage({ id: 'Se va a clonar el tipo de producto' })} <strong>"{nombreTipoConfirmacion}"</strong>.
                    {' '}{intl.formatMessage({ id: 'Se duplicarán todos los propiedades y multimedia asociados.' })}
                    {' '}{intl.formatMessage({ id: 'El nuevo nombre será' })}: <strong>"{nombreTipoConfirmacion}_COPIA"</strong>.
                    <br /><br />
                    {intl.formatMessage({ id: '¿Estás seguro?' })}
                </p>
            </Dialog>
            <Crud
                ref={crudRef}
                headerCrud={intl.formatMessage({ id: 'Tipos de Producto' })}
                getRegistros={() => getTiposProducto(JSON.stringify({ where: { and: filtradoBase } }))}
                getRegistrosCount={() => getTiposProductoCount(JSON.stringify({ where: { and: filtradoBase } }))}
                deleteRegistro={deleteTipoProducto}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Tipos de Producto"}
                filtradoBase={filtradoBase}
                editarComponente={<EditarTipoProducto 
                    emptyRegistro={{
                        empresaId: usuarioSesion?.empresaId,
                        nombre: "",
                        descripcion: "",
                        atributosIds: [],
                        multimediasIds: [],
                        activoSn: 'S'
                    }} />}
                columnas={columnas}
                botonesExtra={botonesExtra}
            />
        </div>
    );
};

export default TiposProducto;