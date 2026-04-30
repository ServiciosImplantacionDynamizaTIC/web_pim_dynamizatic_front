import { CategoriaControllerApi, settings } from "@/app/api-programa";

const apiCategoria = new CategoriaControllerApi(settings)

export const getCategorias = async (filtro) => {
    const { data: dataCategorias } = await apiCategoria.categoriaControllerFind(filtro)
    return dataCategorias
}

export const getCategoriasCount = async (filtro) => {
    const { data: dataCategorias } = await apiCategoria.categoriaControllerCount(filtro)
    return dataCategorias
}

export const getCategoria = async (id) => {
    const { data: dataCategoria } = await apiCategoria.categoriaControllerFindById(id)
    return dataCategoria
}

export const postCategoria = async (objCategoria) => {
    try {
        const { data: dataCategoria } = await apiCategoria.categoriaControllerCreate(objCategoria)
        return dataCategoria
    } catch (error) {
        console.error('Error en postCategoria:', error);
        throw error;
    }
}

export const deleteCategoria = async (idCategoria) => {
    const { data: dataCategoria } = await apiCategoria.categoriaControllerDeleteById(idCategoria)
    return dataCategoria
}

export const patchCategoria = async (idCategoria, objCategoria) => {
    const { data: dataCategoria } = await apiCategoria.categoriaControllerUpdateById(idCategoria, objCategoria)
    return dataCategoria
}