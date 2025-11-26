import { ParametroGlobalControllerApi, EmpresaControllerApi, UsuariosControllerApi, settings } from "@/app/api-programa";

const apiParametroGlobal = new ParametroGlobalControllerApi(settings)
const apiEmpresa = new EmpresaControllerApi(settings)
const apiUsuario = new UsuariosControllerApi(settings)

export const getParametrosGlobales = async (filtro) => {
    const { data: dataParametrosGlobales } = await apiParametroGlobal.parametroGlobalControllerFind(filtro)
    return dataParametrosGlobales
}

export const getParametroGlobal = async (filtro) => {
    const { data: dataParametroGlobal } = await apiParametroGlobal.parametroGlobalControllerFindById(filtro)
    return dataParametroGlobal
}

export const getParametrosGlobalesCount = async (filtro) => {
    const { data: dataParametrosGlobales } = await apiParametroGlobal.parametroGlobalControllerCount(filtro)
    return dataParametrosGlobales
}

export const postParametroGlobal = async (objParametroGlobal) => {
    try {
        const { data: dataParametroGlobal } = await apiParametroGlobal.parametroGlobalControllerCreate(objParametroGlobal)
        return dataParametroGlobal
    } catch (error) {
        console.log(error)
        throw error
    }
}

export const patchParametroGlobal = async (idParametroGlobal, objParametroGlobal) => {
    const { data: dataParametroGlobal } = await apiParametroGlobal.parametroGlobalControllerUpdateById(idParametroGlobal, objParametroGlobal)
    return dataParametroGlobal
}

export const deleteParametroGlobal = async (idParametroGlobal) => {
    const { data: dataParametroGlobal } = await apiParametroGlobal.parametroGlobalControllerDeleteById(idParametroGlobal)
    return dataParametroGlobal
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