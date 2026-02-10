import { ProductoMultimediaControllerApi, settings } from "@/app/api-programa";

const apiProductoMultimedia = new ProductoMultimediaControllerApi(settings)

export const getProductosMultimedia = async (filtro) => {
    const { data: dataProductosMultimedia } = await apiProductoMultimedia.productoMultimediaControllerFind(filtro)
    return dataProductosMultimedia
}

export const getProductosMultimediaCount = async (filtro) => {
    const { data: dataProductosMultimedia } = await apiProductoMultimedia.productoMultimediaControllerCount(filtro)
    return dataProductosMultimedia
}

export const getProductoMultimedia = async (id) => {
    const { data: dataProductoMultimedia } = await apiProductoMultimedia.productoMultimediaControllerFindById(id)
    return dataProductoMultimedia
}

export const postProductoMultimedia = async (objProductoMultimedia) => {
    const { data: dataProductoMultimedia } = await apiProductoMultimedia.productoMultimediaControllerCreate(objProductoMultimedia)
    return dataProductoMultimedia
}

export const deleteProductoMultimedia = async (idProductoMultimedia) => {
    const { data: dataProductoMultimedia } = await apiProductoMultimedia.productoMultimediaControllerDeleteById(idProductoMultimedia)
    return dataProductoMultimedia
}

export const patchProductoMultimedia = async (idProductoMultimedia, objProductoMultimedia) => {
    const { data: dataProductoMultimedia } = await apiProductoMultimedia.productoMultimediaControllerUpdateById(idProductoMultimedia, objProductoMultimedia)
    return dataProductoMultimedia
}