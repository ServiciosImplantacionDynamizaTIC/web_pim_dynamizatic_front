import { GrupoAtributoControllerApi, settings } from "@/app/api-programa";

const apiGrupoAtributo = new GrupoAtributoControllerApi(settings)

export const getGrupoAtributos = async (filtro) => {
    const { data: dataGrupoAtributos } = await apiGrupoAtributo.grupoAtributoControllerFind(filtro)
    return dataGrupoAtributos
}

export const getGrupoAtributosCount = async (filtro) => {
    const { data: dataGrupoAtributos } = await apiGrupoAtributo.grupoAtributoControllerCount(filtro)
    return dataGrupoAtributos
}

export const getGrupoAtributo = async (id) => {
    const { data: dataGrupoAtributo } = await apiGrupoAtributo.grupoAtributoControllerFindById(id)
    return dataGrupoAtributo
}

export const postGrupoAtributo = async (objGrupoAtributo) => {
    const { data: dataGrupoAtributo } = await apiGrupoAtributo.grupoAtributoControllerCreate(objGrupoAtributo)
    return dataGrupoAtributo
}

export const deleteGrupoAtributo = async (idGrupoAtributo) => {
    const { data: dataGrupoAtributo } = await apiGrupoAtributo.grupoAtributoControllerDeleteById(idGrupoAtributo)
    return dataGrupoAtributo
}

export const patchGrupoAtributo = async (idGrupoAtributo, objGrupoAtributo) => {
    const { data: dataGrupoAtributo } = await apiGrupoAtributo.grupoAtributoControllerUpdateById(idGrupoAtributo, objGrupoAtributo)
    return dataGrupoAtributo
}