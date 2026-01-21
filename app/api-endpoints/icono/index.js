import { IconoControllerApi, settings } from "@/app/api-programa";

const apiIcono = new IconoControllerApi(settings)

export const getIconos = async (filtro) => {
    const { data: dataIconos } = await apiIcono.iconoControllerFind(filtro)
    return dataIconos
}

export const getIconosCount = async (filtro) => {
    const { data: dataIconos } = await apiIcono.iconoControllerCount(filtro)
    return dataIconos
}

export const getIcono = async (id) => {
    const { data: dataIcono } = await apiIcono.iconoControllerFindById(id)
    return dataIcono
}

export const postIcono = async (objIcono) => {
    const { data: dataIcono } = await apiIcono.iconoControllerCreate(objIcono)
    return dataIcono
}

export const deleteIcono = async (idIcono) => {
    const { data: dataIcono } = await apiIcono.iconoControllerDeleteById(idIcono)
    return dataIcono
}

export const patchIcono = async (idIcono, objIcono) => {
    const { data: dataIcono } = await apiIcono.iconoControllerUpdateById(idIcono, objIcono)
    return dataIcono
}