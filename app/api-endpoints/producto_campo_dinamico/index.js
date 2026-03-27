import { ProductoCampoDinamicoControllerApi, settings } from "@/app/api-programa";

const apiProductoCampoDinamico = new ProductoCampoDinamicoControllerApi(settings);

export const getProductoCampoDinamicos = async (filtro) => {
    const { data: dataRegistros } = await apiProductoCampoDinamico.productoCampoDinamicoControllerFind(filtro);
    return dataRegistros;
};

export const postProductoCampoDinamico = async (objRegistro) => {
    const { data: dataRegistro } = await apiProductoCampoDinamico.productoCampoDinamicoControllerCreate(objRegistro);
    return dataRegistro;
};

export const patchProductoCampoDinamico = async (idRegistro, objRegistro) => {
    const { data: dataRegistro } = await apiProductoCampoDinamico.productoCampoDinamicoControllerUpdateById(idRegistro, objRegistro);
    return dataRegistro;
};

export const deleteProductoCampoDinamico = async (idRegistro) => {
    const { data: dataRegistro } = await apiProductoCampoDinamico.productoCampoDinamicoControllerDeleteById(idRegistro);
    return dataRegistro;
};
