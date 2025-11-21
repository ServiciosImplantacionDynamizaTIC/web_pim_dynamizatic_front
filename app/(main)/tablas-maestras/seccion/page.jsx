"use client";
import { getSecciones, getSeccionesCount, deleteSeccion } from "@/app/api-endpoints/seccion";
import EditarSeccion from "./editar";
import Crud from "../../../components/shared/crud";
import { useIntl } from 'react-intl'
const Seccion = () => {
    const intl = useIntl();
    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
    ]

    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Secciones' })}
                getRegistros={getSecciones}
                getRegistrosCount={getSeccionesCount}
                botones={['nuevo','ver', 'editar', 'descargarCSV']}
                controlador={"Secciones"}
                editarComponente={<EditarSeccion />}
                columnas={columnas}
                deleteRegistro={deleteSeccion}
                //validarEliminar={{ campo: 'nombre', valores: ['Correo plantilla'] }} // No permitir eliminar esta seccion
                validarEditar={{ campo: 'nombre', valores: ['Correo plantilla'] }} // No permitir editar esta seccion
            />
        </div>
    );
};
export default Seccion;