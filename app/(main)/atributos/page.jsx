"use client";
import { deleteAtributo, getAtributos, getAtributosCount } from "@/app/api-endpoints/atributo";
import Crud from "../../components/shared/crud";
import EditarAtributo from "./editar";
import { useIntl } from 'react-intl'
import { getUsuarioSesion } from "../../utility/Utils";

const Atributo = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'grupoAtributonombre', header: intl.formatMessage({ id: 'Grupo Atributo' }), tipo: 'string' },
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'tipoDato', header: intl.formatMessage({ id: 'Tipo de Dato' }), tipo: 'string' },
        { campo: 'unidadMedida', header: intl.formatMessage({ id: 'Unidad Medida' }), tipo: 'string' },
        { campo: 'obligatorioSn', header: intl.formatMessage({ id: 'Obligatorio' }), tipo: 'booleano' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]
    
    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Atributos' })}
                getRegistros={getAtributos}
                getRegistrosCount={getAtributosCount}
                botones={['nuevo', 'editar', 'eliminar', 'descargarCSV']}
                controlador={"Atributos"}
                filtradoBase={{empresaId: getUsuarioSesion()?.empresaId}}
                editarComponente={<EditarAtributo />}
                columnas={columnas}
                deleteRegistro={deleteAtributo}
            />
        </div>
    );
};
export default Atributo;