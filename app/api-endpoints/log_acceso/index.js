import { LogAccesoControllerApi, EmpresaControllerApi, UsuariosControllerApi, settings } from "@/app/api-programa";

const apiLogAcceso = new LogAccesoControllerApi(settings)
const apiEmpresa = new EmpresaControllerApi(settings)
const apiUsuario = new UsuariosControllerApi(settings)

export const getLogAccesos = async (filtro) => {
    const { data: dataLogAccesos } = await apiLogAcceso.logAccesoControllerFind(filtro)
    return dataLogAccesos
}

export const getLogAcceso = async (filtro) => {
    const { data: dataLogAcceso } = await apiLogAcceso.logAccesoControllerFindById(filtro)
    return dataLogAcceso
}

export const getLogAccesosCount = async (filtro) => {
    const { data: dataLogAccesosCount } = await apiLogAcceso.logAccesoControllerCount(filtro)
    return dataLogAccesosCount
}

export const postLogAcceso = async (objLogAcceso) => {
    try {
        const { data: dataLogAcceso } = await apiLogAcceso.logAccesoControllerCreate(objLogAcceso)
        return dataLogAcceso
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const patchLogAcceso = async (idLogAcceso, objLogAcceso) => {
    const { data: dataLogAcceso } = await apiLogAcceso.logAccesoControllerUpdateById(idLogAcceso, objLogAcceso)
    return dataLogAcceso
}

export const deleteLogAcceso = async (idLogAcceso) => {
    const { data: dataLogAcceso } = await apiLogAcceso.logAccesoControllerDeleteById(idLogAcceso)
    return dataLogAcceso
}

export const getEmpresasActivas = async () => {
    try {
        const filtro = JSON.stringify({
            where: {
                activoSn: 'S'
            },
            order: ['nombre ASC']
        })
        const { data: dataEmpresas } = await apiEmpresa.empresaControllerFind(filtro)
        return dataEmpresas
    } catch (error) {
        console.error('Error al obtener empresas activas:', error)
        throw error
    }
}

export const getUsuariosActivos = async () => {
    try {
        const filtro = JSON.stringify({
            where: {
                activoSn: 'S'
            },
            order: ['nombre ASC']
        })
        const { data: dataUsuarios } = await apiUsuario.usuariosControllerFind(filtro)
        return dataUsuarios
    } catch (error) {
        console.error('Error al obtener usuarios activos:', error)
        throw error
    }
}
