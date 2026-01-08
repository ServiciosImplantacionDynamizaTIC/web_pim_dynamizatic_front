"use client";
import { deleteMarca, getMarcas, getMarcasCount } from "@/app/api-endpoints/marca";
import Crud from "../../components/shared/crud";
import EditarMarca from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Marca = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'descripcion', header: intl.formatMessage({ id: 'Descripción' }), tipo: 'string' },
        { campo: 'logo', header: intl.formatMessage({ id: 'Logo' }), tipo: 'imagen' },
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
                botones={['nuevo', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Marcas"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarMarca />}
                columnas={columnas}
                deleteRegistro={deleteMarca}
            />
        </div>
    );
};
export default Marca;