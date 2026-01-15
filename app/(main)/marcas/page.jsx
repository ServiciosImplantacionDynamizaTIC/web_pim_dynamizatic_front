"use client";
import { deleteMarca, getMarcas, getMarcasCount } from "@/app/api-endpoints/marca";
import Crud from "../../components/shared/crud";
import EditarMarca from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Marca = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'imagen', header: intl.formatMessage({ id: 'Imagen' }), tipo: 'imagen' },
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'sitioWeb', header: intl.formatMessage({ id: 'Sitio Web' }), tipo: 'string' },
        { campo: 'paisOrigen', header: intl.formatMessage({ id: 'País Origen' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Marcas' })}
                getRegistros={getMarcas}
                getRegistrosCount={getMarcasCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Marcas"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarMarca />}
                seccion={"Marcas"}
                columnas={columnas}
                deleteRegistro={deleteMarca}
            />
        </div>
    );
};
export default Marca;