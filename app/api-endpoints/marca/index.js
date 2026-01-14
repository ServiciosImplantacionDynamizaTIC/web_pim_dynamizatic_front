import { MarcaControllerApi, settings } from "@/app/api-programa";

const apiMarca = new MarcaControllerApi(settings)

export const getMarcas = async (filtro) => {
    const { data: dataMarcas } = await apiMarca.marcaControllerFind(filtro)
    return dataMarcas
}

export const getMarcasCount = async (filtro) => {
    const { data: dataMarcas } = await apiMarca.marcaControllerCount(filtro)
    return dataMarcas
}

export const getMarca = async (id) => {
    const { data: dataMarca } = await apiMarca.marcaControllerFindById(id)
    return dataMarca
}

export const postMarca = async (objMarca) => {
    const { data: dataMarca } = await apiMarca.marcaControllerCreate(objMarca)
    return dataMarca
}

export const deleteMarca = async (idMarca) => {
    const { data: dataMarca } = await apiMarca.marcaControllerDeleteById(idMarca)
    return dataMarca
}

export const patchMarca = async (idMarca, objMarca) => {
    const { data: dataMarca } = await apiMarca.marcaControllerUpdateById(idMarca, objMarca)
    return dataMarca
}