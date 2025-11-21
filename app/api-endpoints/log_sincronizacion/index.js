import { LogSincronizacionControllerApi, EmpresaControllerApi, UsuariosControllerApi, settings } from "@/app/api-programa";

const apiLogSincronizacion = new LogSincronizacionControllerApi(settings)
const apiEmpresa = new EmpresaControllerApi(settings)
const apiUsuario = new UsuariosControllerApi(settings)

export const getLogSincronizaciones = async (filtro) => {
    const { data: dataLogSincronizaciones } = await apiLogSincronizacion.logSincronizacionControllerFind(filtro)
    return dataLogSincronizaciones
}

export const getLogSincronizacion = async (filtro) => {
    const { data: dataLogSincronizacion } = await apiLogSincronizacion.logSincronizacionControllerFindById(filtro)
    return dataLogSincronizacion
}

export const getLogSincronizacionesCount = async (filtro) => {
    const { data: dataLogSincronizacionesCount } = await apiLogSincronizacion.logSincronizacionControllerCount(filtro)
    return dataLogSincronizacionesCount
}

export const postLogSincronizacion = async (objLogSincronizacion) => {
    try {
        const { data: dataLogSincronizacion } = await apiLogSincronizacion.logSincronizacionControllerCreate(objLogSincronizacion)
        return dataLogSincronizacion
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const patchLogSincronizacion = async (idLogSincronizacion, objLogSincronizacion) => {
    const { data: dataLogSincronizacion } = await apiLogSincronizacion.logSincronizacionControllerUpdateById(idLogSincronizacion, objLogSincronizacion)
    return dataLogSincronizacion
}

export const deleteLogSincronizacion = async (idLogSincronizacion) => {
    const { data: dataLogSincronizacion } = await apiLogSincronizacion.logSincronizacionControllerDeleteById(idLogSincronizacion)
    return dataLogSincronizacion
}

export const getEmpresasActivas = async () => {
    try {
        const filtro = {
            where: {
                activoSn: 'S'
            },
            order: ['nombre ASC']
        }
        const { data: dataEmpresas } = await apiEmpresa.empresaControllerFind(filtro)
        return dataEmpresas
    } catch (error) {
        console.error('Error al obtener empresas activas:', error)
        return []
    }
}

export const getUsuariosActivos = async () => {
    try {
        const filtro = {
            where: {
                activoSn: 'S'
            },
            order: ['nombre ASC']
        }
        const { data: dataUsuarios } = await apiUsuario.usuariosControllerFind(filtro)
        return dataUsuarios
    } catch (error) {
        console.error('Error al obtener usuarios activos:', error)
        return []
    }
}
