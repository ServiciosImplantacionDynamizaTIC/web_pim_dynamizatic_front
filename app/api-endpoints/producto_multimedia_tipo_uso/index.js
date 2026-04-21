import { ProductoMultimediaTipoUsoControllerApi, settings } from "@/app/api-programa";

const apiProductoMultimediaTipoUso = new ProductoMultimediaTipoUsoControllerApi(settings)

export const getProductoMultimediaTiposUso = async (filtro) => {
    const { data: dataProductoMultimediaTipoUso } = await apiProductoMultimediaTipoUso.productoMultimediaTipoUsoControllerFind(filtro)
    return dataProductoMultimediaTipoUso
}

export const getProductoMultimediaTiposUsoCount = async (filtro) => {
    const { data: dataProductoMultimediaTipoUso } = await apiProductoMultimediaTipoUso.productoMultimediaTipoUsoControllerCount(filtro)
    return dataProductoMultimediaTipoUso
}

export const getProductoMultimediaTipoUso = async (id) => {
    const { data: dataProductoMultimediaTipoUso } = await apiProductoMultimediaTipoUso.productoMultimediaTipoUsoControllerFindById(id)
    return dataProductoMultimediaTipoUso
}

export const postProductoMultimediaTipoUso = async (objProductoMultimediaTipoUso) => {
    const { data: dataProductoMultimediaTipoUso } = await apiProductoMultimediaTipoUso.productoMultimediaTipoUsoControllerCreate(objProductoMultimediaTipoUso)
    return dataProductoMultimediaTipoUso
}

export const deleteProductoMultimediaTipoUso = async (idProductoMultimediaTipoUso) => {
    const { data: dataProductoMultimediaTipoUso } = await apiProductoMultimediaTipoUso.productoMultimediaTipoUsoControllerDeleteById(idProductoMultimediaTipoUso)
    return dataProductoMultimediaTipoUso
}

export const patchProductoMultimediaTipoUso = async (idProductoMultimediaTipoUso, objProductoMultimediaTipoUso) => {
    const { data: dataProductoMultimediaTipoUso } = await apiProductoMultimediaTipoUso.productoMultimediaTipoUsoControllerUpdateById(idProductoMultimediaTipoUso, objProductoMultimediaTipoUso)
    return dataProductoMultimediaTipoUso
}
