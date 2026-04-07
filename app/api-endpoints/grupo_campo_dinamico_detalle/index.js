import { GrupoCampoDinamicoDetalleControllerApi, settings } from "@/app/api-programa";

const apiGrupoCampoDinamicoDetalle = new GrupoCampoDinamicoDetalleControllerApi(settings);

export const getGrupoCampoDinamicoDetalles = async (filtro) => {
    const { data: dataRegistros } = await apiGrupoCampoDinamicoDetalle.grupoCampoDinamicoDetalleControllerFind(filtro);
    return dataRegistros;
};

export const getGrupoCampoDinamicoDetallesCount = async (filtro) => {
    const { data: dataRegistros } = await apiGrupoCampoDinamicoDetalle.grupoCampoDinamicoDetalleControllerCount(filtro);
    return dataRegistros;
};

export const getGrupoCampoDinamicoDetalle = async (idRegistro) => {
    const { data: dataRegistro } = await apiGrupoCampoDinamicoDetalle.grupoCampoDinamicoDetalleControllerFindById(idRegistro);
    return dataRegistro;
};

export const postGrupoCampoDinamicoDetalle = async (objRegistro) => {
    const { data: dataRegistro } = await apiGrupoCampoDinamicoDetalle.grupoCampoDinamicoDetalleControllerCreate(objRegistro);
    return dataRegistro;
};

export const patchGrupoCampoDinamicoDetalle = async (idRegistro, objRegistro) => {
    const { data: dataRegistro } = await apiGrupoCampoDinamicoDetalle.grupoCampoDinamicoDetalleControllerUpdateById(idRegistro, objRegistro);
    return dataRegistro;
};

export const deleteGrupoCampoDinamicoDetalle = async (idRegistro) => {
    const { data: dataRegistro } = await apiGrupoCampoDinamicoDetalle.grupoCampoDinamicoDetalleControllerDeleteById(idRegistro);
    return dataRegistro;
};
