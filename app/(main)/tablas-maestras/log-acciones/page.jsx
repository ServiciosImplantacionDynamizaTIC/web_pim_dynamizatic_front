"use client";
import { getLogAcciones, getLogAccionesCount, deleteLogAccion, getEmpresasActivas, getUsuariosActivos } from "@/app/api-endpoints/log_acciones";
import EditarLogAcciones from "./editar";
import Crud from "../../../components/shared/crud";
import { useIntl } from 'react-intl';

const LogAcciones = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'nombre', header: intl.formatMessage({ id: 'Usuario' }), tipo: 'foraneo' },
        { campo: 'url', header: intl.formatMessage({ id: 'URL' }), tipo: 'string' },
        { campo: 'fechaInicio', header: intl.formatMessage({ id: 'Fecha Inicio' }), tipo: 'fechaHora' },
        { campo: 'fechaFin', header: intl.formatMessage({ id: 'Fecha Fin' }), tipo: 'fechaHora' },
        { campo: 'segundos', header: intl.formatMessage({ id: 'Segundos' }), tipo: 'numero' },
        { campo: 'resultado', header: intl.formatMessage({ id: 'Resultado' }), tipo: 'string' },
        { campo: 'endPoint', header: intl.formatMessage({ id: 'EndPoint' }), tipo: 'string' },
        { campo: 'tipo', header: intl.formatMessage({ id: 'Tipo' }), tipo: 'string' },
        { campo: 'controller', header: intl.formatMessage({ id: 'Controlador' }), tipo: 'string' },
        { campo: 'funcion', header: intl.formatMessage({ id: 'Función' }), tipo: 'string' },
    ];

    const getRegistrosForaneos = {
        empresaId: getEmpresasActivas,
        usuarioId: getUsuariosActivos
    };

    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Log de Acciones' })}
                getRegistros={getLogAcciones}
                getRegistrosCount={getLogAccionesCount}
                filtradoBase={{
                    empresaId: Number(localStorage.getItem('empresa'))
                }}
                botones={['ver', 'descargarCSV']}
                controlador={"Logs de acciones"}
                editarComponente={<EditarLogAcciones />}
                columnas={columnas}
                //deleteRegistro={deleteLogAccion}
                getRegistrosForaneos={getRegistrosForaneos}
                //mensajeEliminar="¿Está seguro de que desea eliminar este registro de acción? Esta acción no se puede deshacer."
            />
        </div>
    );
};

export default LogAcciones;
