import { CatalogoControllerApi, settings } from "@/app/api-programa";

const apiCatalogo = new CatalogoControllerApi(settings)

export const getCatalogos = async (filtro) => {
    const { data: dataCatalogos } = await apiCatalogo.catalogoControllerFind(filtro)
    return dataCatalogos
}

export const getCatalogosCount = async (filtro) => {
    const { data: dataCatalogos } = await apiCatalogo.catalogoControllerCount(filtro)
    return dataCatalogos
}

export const getCatalogo = async (id) => {
    const { data: dataCatalogo } = await apiCatalogo.catalogoControllerFindById(id)
    return dataCatalogo
}

export const postCatalogo = async (objCatalogo) => {
    const { data: dataCatalogo } = await apiCatalogo.catalogoControllerCreate(objCatalogo)
    return dataCatalogo
}

export const deleteCatalogo = async (idCatalogo) => {
    const { data: dataCatalogo } = await apiCatalogo.catalogoControllerDeleteById(idCatalogo)
    return dataCatalogo
}

export const patchCatalogo = async (idCatalogo, objCatalogo) => {
    const { data: dataCatalogo } = await apiCatalogo.catalogoControllerUpdateById(idCatalogo, objCatalogo)
    return dataCatalogo
}