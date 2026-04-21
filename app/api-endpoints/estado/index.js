import { EstadoControllerApi, settings } from "@/app/api-programa";

const apiEstado = new EstadoControllerApi(settings)

export const getEstados = async (filtro) => {
    const { data: dataEstados } = await apiEstado.estadoControllerFind(filtro)
    return dataEstados
}

export const getEstadosCount = async (filtro) => {
    const { data: dataEstados } = await apiEstado.estadoControllerCount(filtro)
    return dataEstados
}

export const getEstado = async (id) => {
    const { data: dataEstado } = await apiEstado.estadoControllerFindById(id)
    return dataEstado
}

export const postEstado = async (objEstado) => {
    const { data: dataEstado } = await apiEstado.estadoControllerCreate(objEstado)
    return dataEstado
}

export const deleteEstado = async (idEstado) => {
    const { data: dataEstado } = await apiEstado.estadoControllerDeleteById(idEstado)
    return dataEstado
}

export const patchEstado = async (idEstado, objEstado) => {
    const { data: dataEstado } = await apiEstado.estadoControllerUpdateById(idEstado, objEstado)
    return dataEstado
}