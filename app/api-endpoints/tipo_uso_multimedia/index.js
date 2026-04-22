import { TipoUsoMultimediaControllerApi, settings } from "@/app/api-programa";

const apiTipoUsoMultimedia = new TipoUsoMultimediaControllerApi(settings)

export const getTiposUsoMultimedia = async (filtro) => {
    const { data: dataTiposUsoMultimedia } = await apiTipoUsoMultimedia.tipoUsoMultimediaControllerFind(filtro)
    return dataTiposUsoMultimedia
}

export const getTiposUsoMultimediaCount = async (filtro) => {
    const { data: dataTiposUsoMultimedia } = await apiTipoUsoMultimedia.tipoUsoMultimediaControllerCount(filtro)
    return dataTiposUsoMultimedia
}

export const getTipoUsoMultimedia = async (id) => {
    const { data: dataTipoUsoMultimedia } = await apiTipoUsoMultimedia.tipoUsoMultimediaControllerFindById(id)
    return dataTipoUsoMultimedia
}

export const postTipoUsoMultimedia = async (objTipoUsoMultimedia) => {
    const { data: dataTipoUsoMultimedia } = await apiTipoUsoMultimedia.tipoUsoMultimediaControllerCreate(objTipoUsoMultimedia)
    return dataTipoUsoMultimedia
}

export const deleteTipoUsoMultimedia = async (idTipoUsoMultimedia) => {
    const { data: dataTipoUsoMultimedia } = await apiTipoUsoMultimedia.tipoUsoMultimediaControllerDeleteById(idTipoUsoMultimedia)
    return dataTipoUsoMultimedia
}

export const patchTipoUsoMultimedia = async (idTipoUsoMultimedia, objTipoUsoMultimedia) => {
    const { data: dataTipoUsoMultimedia } = await apiTipoUsoMultimedia.tipoUsoMultimediaControllerUpdateById(idTipoUsoMultimedia, objTipoUsoMultimedia)
    return dataTipoUsoMultimedia
}