import { MultimediaControllerApi, settings } from "@/app/api-programa";

const apiMultimedia = new MultimediaControllerApi(settings)

export const getMultimedias = async (filtro) => {
    const { data: dataMultimedias } = await apiMultimedia.multimediaControllerFind(filtro)
    return dataMultimedias
}

export const getMultimediasCount = async (filtro) => {
    const { data: dataMultimedias } = await apiMultimedia.multimediaControllerCount(filtro)
    return dataMultimedias
}

export const getMultimedia = async (id) => {
    const { data: dataMultimedia } = await apiMultimedia.multimediaControllerFindById(id)
    return dataMultimedia
}

export const postMultimedia = async (objMultimedia) => {
    const { data: dataMultimedia } = await apiMultimedia.multimediaControllerCreate(objMultimedia)
    return dataMultimedia
}

export const deleteMultimedia = async (idMultimedia) => {
    const { data: dataMultimedia } = await apiMultimedia.multimediaControllerDeleteById(idMultimedia)
    return dataMultimedia
}

export const patchMultimedia = async (idMultimedia, objMultimedia) => {
    const { data: dataMultimedia } = await apiMultimedia.multimediaControllerUpdateById(idMultimedia, objMultimedia)
    return dataMultimedia
}