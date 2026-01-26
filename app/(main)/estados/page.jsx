"use client";
import { deleteEstado, getEstados, getEstadosCount } from "@/app/api-endpoints/estado";
import Crud from "../../components/shared/crud";
import EditarEstado from "./editar";
import { useIntl } from 'react-intl'

const Estado = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'descripcion', header: intl.formatMessage({ id: 'Descripción' }), tipo: 'string' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Estados' })}
                getRegistros={getEstados}
                getRegistrosCount={getEstadosCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Estados"}
                filtradoBase={{}}
                editarComponente={<EditarEstado />}
                seccion={"Estados"}
                columnas={columnas}
                deleteRegistro={deleteEstado}
            />
        </div>
    );
};
export default Estado;