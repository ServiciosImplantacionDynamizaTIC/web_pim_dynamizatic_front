"use client";
import { deleteTipoProducto, getTiposProducto, getTiposProductoCount } from "@/app/api-endpoints/tipo_producto";
import Crud from "../../components/shared/crud";
import EditarTipoProducto from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "@/app/utility/Utils";
import { Button } from "primereact/button";
import { useRef } from "react";
import { Toast } from "primereact/toast";

const TiposProducto = () => {
    const intl = useIntl();
    const usuarioSesion = getUsuarioSesion();
    const toast = useRef(null);

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'descripcion', header: intl.formatMessage({ id: 'Descripción' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
   ]

    const filtradoBase = { empresaId: usuarioSesion?.empresaId };

    // Ejemplo de uso de botonesExtra: botón que muestra un Toast con info del registro
    const mostrarInfoRegistro = (rowData) => {
        toast.current?.show({
            severity: 'info',
            summary: intl.formatMessage({ id: 'Información' }),
            detail: `${intl.formatMessage({ id: 'Nombre' })}: ${rowData.nombre}`,
            life: 3000,
        });
    };

    const botonesExtra = [
        {
            boton: (
                <Button
                    icon="pi pi-info-circle"
                    className="mr-2"
                    rounded
                    title={intl.formatMessage({ id: 'Ver información' })}
                    severity="help"
                    permiso="ver"
                />
            ),
            funcionOnClick: mostrarInfoRegistro,
        }
    ];
    
    return (
        <div>
            <Toast ref={toast} position="top-right" />
            <Crud
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