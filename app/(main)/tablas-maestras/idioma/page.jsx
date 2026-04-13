"use client";
import { getIdiomas, getIdiomasCount, deleteIdioma } from "@/app/api-endpoints/idioma";
import EditarIdioma from "./editar";
import Crud from "../../../components/shared/crud";
import { useIntl } from 'react-intl'

const Idioma = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Nombre' }), tipo: 'string' },
        { campo: 'iso', header: intl.formatMessage({ id: 'Iso' }), tipo: 'string' },
        { campo: 'activoSn', header: intl.formatMessage({ id: 'Activo' }), tipo: 'booleano' },
    ]

    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Idiomas' })}
                getRegistros={getIdiomas}
                getRegistrosCount={getIdiomasCount}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV', 'importar']}
                controlador={"Idiomas"}
                empresaId={null}
                editarComponente={<EditarIdioma />}
                columnas={columnas}
                importarTabla="idioma"
                deleteRegistro={deleteIdioma}
                validarEliminar={{ campo: 'nombre', valores: ['Español', 'Inglés'] }}
                validarEditar={{ campo: 'nombre', valores: ['Español', 'Inglés'] }}
            />
        </div>
    );
};
export default Idioma;
