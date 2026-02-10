import { ProductoAtributoControllerApi, settings } from "@/app/api-programa";

const apiProductoAtributo = new ProductoAtributoControllerApi(settings)

export const getProductosAtributo = async (filtro) => {
    const { data: dataProductosAtributo } = await apiProductoAtributo.productoAtributoControllerFind(filtro)
    return dataProductosAtributo
}

export const getProductosAtributoCount = async (filtro) => {
    const { data: dataProductosAtributo } = await apiProductoAtributo.productoAtributoControllerCount(filtro)
    return dataProductosAtributo
}

export const getProductoAtributo = async (id) => {
    const { data: dataProductoAtributo } = await apiProductoAtributo.productoAtributoControllerFindById(id)
    return dataProductoAtributo
}

export const postProductoAtributo = async (objProductoAtributo) => {
    const { data: dataProductoAtributo } = await apiProductoAtributo.productoAtributoControllerCreate(objProductoAtributo)
    return dataProductoAtributo
}

export const deleteProductoAtributo = async (idProductoAtributo) => {
    const { data: dataProductoAtributo } = await apiProductoAtributo.productoAtributoControllerDeleteById(idProductoAtributo)
    return dataProductoAtributo
}

export const patchProductoAtributo = async (idProductoAtributo, objProductoAtributo) => {
    const { data: dataProductoAtributo } = await apiProductoAtributo.productoAtributoControllerUpdateById(idProductoAtributo, objProductoAtributo)
    return dataProductoAtributo
}