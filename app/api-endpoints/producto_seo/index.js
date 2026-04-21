import { ProductoSeoControllerApi, settings } from "@/app/api-programa";

const apiProductoSeo = new ProductoSeoControllerApi(settings)

export const getProductosSeo = async (filtro) => {
    const { data: dataProductosSeo } = await apiProductoSeo.productoSeoControllerFind(filtro)
    return dataProductosSeo
}

export const getProductosSeoCount = async (filtro) => {
    const { data: dataProductosSeo } = await apiProductoSeo.productoSeoControllerCount(filtro)
    return dataProductosSeo
}

export const getProductoSeo = async (id) => {
    const { data: dataProductoSeo } = await apiProductoSeo.productoSeoControllerFindById(id)
    return dataProductoSeo
}

export const postProductoSeo = async (objProductoSeo) => {
    const { data: dataProductoSeo } = await apiProductoSeo.productoSeoControllerCreate(objProductoSeo)
    return dataProductoSeo
}

export const deleteProductoSeo = async (idProductoSeo) => {
    const { data: dataProductoSeo } = await apiProductoSeo.productoSeoControllerDeleteById(idProductoSeo)
    return dataProductoSeo
}

export const patchProductoSeo = async (idProductoSeo, objProductoSeo) => {
    const { data: dataProductoSeo } = await apiProductoSeo.productoSeoControllerUpdateById(idProductoSeo, objProductoSeo)
    return dataProductoSeo
}