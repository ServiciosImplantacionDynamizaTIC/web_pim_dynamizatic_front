"use client";
import { getParametrosGlobales, getParametrosGlobalesCount, deleteParametroGlobal, getEmpresasActivas, getUsuariosActivos } from "@/app/api-endpoints/parametro_global";
import EditarParametroGlobal from "./editar";
import Crud from "../../../components/shared/crud";
import { useIntl } from 'react-intl';

const ParametroGlobal = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'clave', header: intl.formatMessage({ id: 'Clave' }), tipo: 'string' },
        { campo: 'valor', header: intl.formatMessage({ id: 'Valor' }), tipo: 'string' },
        { campo: 'descripcion', header: intl.formatMessage({ id: 'Descripción' }), tipo: 'string' },
        { campo: 'tipoDato', header: intl.formatMessage({ id: 'Tipo de Dato' }), tipo: 'string' },
        { campo: 'modificable', header: intl.formatMessage({ id: 'Modificable' }), tipo: 'booleano' },
        { campo: 'fechaCreacion', header: intl.formatMessage({ id: 'Fecha Creación' }), tipo: 'fechaHora' },
    ];

    const getRegistrosForaneos = {
        empresaId: getEmpresasActivas,
        usuarioCreacion: getUsuariosActivos,
        usuarioModificacion: getUsuariosActivos
    };

    const validarEliminar = {
        campo: 'clave',
        valores: ['correosEnvioLimpiezaLog'] // Claves que no se permiten eliminar
    };

    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Parámetros Globales' })}
                getRegistros={getParametrosGlobales}
                getRegistrosCount={getParametrosGlobalesCount}
                filtradoBase={{
                    empresaId: Number(localStorage.getItem('empresa'))
                }}
                botones={['nuevo', 'ver', 'editar', 'eliminar', 'descargarCSV']}
                validarEliminar={validarEliminar}
                controlador={"Parámetros globales"}
                editarComponente={<EditarParametroGlobal />}
                columnas={columnas}
                deleteRegistro={deleteParametroGlobal}
                getRegistrosForaneos={getRegistrosForaneos}
                mensajeEliminar="¿Está seguro de que desea eliminar este parámetro global? Esta acción no se puede deshacer."
            />
        </div>
    );
};

export default ParametroGlobal;