import { AtributoControllerApi, settings } from "@/app/api-programa";

const apiAtributo = new AtributoControllerApi(settings)

export const getAtributos = async (filtro) => {
    const { data: dataAtributos } = await apiAtributo.atributoControllerFind(filtro)
    return dataAtributos
}

export const getAtributosCount = async (filtro) => {
    const { data: dataAtributos } = await apiAtributo.atributoControllerCount(filtro)
    return dataAtributos
}

export const getAtributo = async (id) => {
    const { data: dataAtributo } = await apiAtributo.atributoControllerFindById(id)
    return dataAtributo
}

export const postAtributo = async (objAtributo) => {
    const { data: dataAtributo } = await apiAtributo.atributoControllerCreate(objAtributo)
    return dataAtributo
}

export const deleteAtributo = async (idAtributo) => {
    const { data: dataAtributo } = await apiAtributo.atributoControllerDeleteById(idAtributo)
    return dataAtributo
}

export const patchAtributo = async (idAtributo, objAtributo) => {
    const { data: dataAtributo } = await apiAtributo.atributoControllerUpdateById(idAtributo, objAtributo)
    return dataAtributo
}