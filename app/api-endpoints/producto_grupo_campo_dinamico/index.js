import { ProductoGrupoCampoDinamicoControllerApi, settings } from "@/app/api-programa";

const apiProductoGrupoCampoDinamico = new ProductoGrupoCampoDinamicoControllerApi(settings);

export const getProductosGrupoCampoDinamico = async (filtro) => {
    const { data: dataRegistros } = await apiProductoGrupoCampoDinamico.productoGrupoCampoDinamicoControllerFind(filtro);
    return dataRegistros;
};

export const getProductosGrupoCampoDinamicoCount = async (filtro) => {
    const { data: dataRegistros } = await apiProductoGrupoCampoDinamico.productoGrupoCampoDinamicoControllerCount(filtro);
    return dataRegistros;
};

export const getProductoGrupoCampoDinamico = async (idRegistro) => {
    const { data: dataRegistro } = await apiProductoGrupoCampoDinamico.productoGrupoCampoDinamicoControllerFindById(idRegistro);
    return dataRegistro;
};

export const postProductoGrupoCampoDinamico = async (objRegistro) => {
    const { data: dataRegistro } = await apiProductoGrupoCampoDinamico.productoGrupoCampoDinamicoControllerCreate(objRegistro);
    return dataRegistro;
};

export const patchProductoGrupoCampoDinamico = async (idRegistro, objRegistro) => {
    const { data: dataRegistro } = await apiProductoGrupoCampoDinamico.productoGrupoCampoDinamicoControllerUpdateById(idRegistro, objRegistro);
    return dataRegistro;
};

export const deleteProductoGrupoCampoDinamico = async (idRegistro) => {
    const { data: dataRegistro } = await apiProductoGrupoCampoDinamico.productoGrupoCampoDinamicoControllerDeleteById(idRegistro);
    return dataRegistro;
};
