"use client";
import { getVistaPlantillaEmailIdioma, getVistaPlantillaEmailIdiomaCount, deletePlantillaEmail } from "@/app/api-endpoints/plantilla_email";
import EditarCorreoPlantilla from "./editar";
import Crud from "../../../components/shared/crud";
import { useIntl } from 'react-intl'
const CorreoPlantilla = () => {
    const intl = useIntl();
    const columnas = [
        { campo: 'nombrePlantilla', header: intl.formatMessage({ id: 'Nombre de Plantilla' }), tipo: 'string' },
        { campo: 'titulo', header: intl.formatMessage({ id: 'Título del Mail' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
 
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Plantillas de email' })}
                seccion={"Correo plantilla"}
                getRegistros={getVistaPlantillaEmailIdioma}
                getRegistrosCount={getVistaPlantillaEmailIdiomaCount}
                filtradoBase={{
                    empresaId: Number(localStorage.getItem('empresa'))
                }}
                botones={['nuevo','ver', 'editar', 'descargarCSV']}
                controlador={"Plantillas de email"}
                editarComponente={<EditarCorreoPlantilla />}
                columnas={columnas}
                deleteRegistro={deletePlantillaEmail}
            />
        </div>
    );
};
export default CorreoPlantilla;