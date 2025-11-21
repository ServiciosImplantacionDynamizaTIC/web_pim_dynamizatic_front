
import { LogAccionControllerApi, EmpresaControllerApi, UsuariosControllerApi, settings } from "@/app/api-programa";

const apiLogAccion = new LogAccionControllerApi(settings)
const apiEmpresa = new EmpresaControllerApi(settings)
const apiUsuario = new UsuariosControllerApi(settings)

export const getLogAcciones = async (filtro) => {
    const { data: dataLogAcciones } = await apiLogAccion.logAccionControllerFind(filtro)
    return dataLogAcciones
}

export const getLogAccion = async (filtro) => {
    const { data: dataLogAccion } = await apiLogAccion.logAccionControllerFindById(filtro)
    return dataLogAccion
}

export const getLogAccionesCount = async (filtro) => {
    const { data: dataLogAccionesCount } = await apiLogAccion.logAccionControllerCount(filtro)
    return dataLogAccionesCount
}

export const postLogAccion = async (objLogAccion) => {
    try {
        const { data: dataLogAccion } = await apiLogAccion.logAccionControllerCreate(objLogAccion)
        return dataLogAccion
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const patchLogAccion = async (idLogAccion, objLogAccion) => {
    const { data: dataLogAccion } = await apiLogAccion.logAccionControllerUpdateById(idLogAccion, objLogAccion)
    return dataLogAccion
}

export const deleteLogAccion = async (idLogAccion) => {
    const { data: dataLogAccion } = await apiLogAccion.logAccionControllerDeleteById(idLogAccion)
    return dataLogAccion
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
        throw error
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
        throw error
    }
}