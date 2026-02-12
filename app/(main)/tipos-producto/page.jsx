"use client";
import { deleteTipoProducto, getTiposProducto, getTiposProductoCount } from "@/app/api-endpoints/tipo_producto";
import Crud from "../../components/shared/crud";
import EditarTipoProducto from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "@/app/utility/Utils";

const TiposProducto = () => {
    const intl = useIntl();
    const usuarioSesion = getUsuarioSesion();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'descripcion', header: intl.formatMessage({ id: 'Descripción' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
   ]

    const filtradoBase = { empresaId: usuarioSesion?.empresaId };
    
    return (
        <div>
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
            />
        </div>
    );
};

export default TiposProducto;