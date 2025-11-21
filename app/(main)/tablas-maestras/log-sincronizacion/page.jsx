"use client";
import { getLogSincronizaciones, getLogSincronizacionesCount, deleteLogSincronizacion, getEmpresasActivas, getUsuariosActivos } from "@/app/api-endpoints/log_sincronizacion";
import EditarLogSincronizacion from "./editar";
import Crud from "../../../components/shared/crud";
import { useIntl } from 'react-intl'

const LogSincronizacion = () => {
    const intl = useIntl();

    const columnas = [
        { campo: 'tipoSincronizacion', header: intl.formatMessage({ id: 'Tipo' }), tipo: 'string' },
        { campo: 'sistemaExterno', header: intl.formatMessage({ id: 'Sistema Externo' }), tipo: 'string' },
        { campo: 'estado', header: intl.formatMessage({ id: 'Estado' }), tipo: 'string' },
        { campo: 'registrosProcesados', header: intl.formatMessage({ id: 'Procesados' }), tipo: 'string' },
        { campo: 'registrosExitosos', header: intl.formatMessage({ id: 'Exitosos' }), tipo: 'string' },
        { campo: 'registrosConError', header: intl.formatMessage({ id: 'Errores' }), tipo: 'string' },
        { campo: 'fechaInicio', header: intl.formatMessage({ id: 'Fecha Inicio' }), tipo: 'fechaHora' },
        { campo: 'fechaFin', header: intl.formatMessage({ id: 'Fecha Fin' }), tipo: 'fechaHora' },
    ]

    const getRegistrosForaneos = {
        empresaId: getEmpresasActivas,
        usuarioId: getUsuariosActivos
    };

    return (
        <div>
            <Crud
                headerCrud={intl.formatMessage({ id: 'Log de Sincronización' })}
                getRegistros={getLogSincronizaciones}
                getRegistrosCount={getLogSincronizacionesCount}
                filtradoBase={{
                    empresaId: Number(localStorage.getItem('empresa'))
                }}
                botones={['ver', 'descargarCSV']}
                controlador={"Logs de sincronización"}
                editarComponente={<EditarLogSincronizacion />}
                columnas={columnas}
                //deleteRegistro={deleteLogSincronizacion}
                getRegistrosForaneos={getRegistrosForaneos}
                //mensajeEliminar="¿Está seguro de que desea eliminar este registro de sincronización? Esta acción no se puede deshacer."
            />
        </div>
    );
};

export default LogSincronizacion;
