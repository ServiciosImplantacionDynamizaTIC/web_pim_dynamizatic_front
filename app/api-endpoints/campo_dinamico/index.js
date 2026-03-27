import { CampoDinamicoControllerApi, settings } from "@/app/api-programa";

const apiCampoDinamico = new CampoDinamicoControllerApi(settings);

export const getCamposDinamicos = async (filtro) => {
    const { data: dataCamposDinamicos } = await apiCampoDinamico.campoDinamicoControllerFind(filtro);
    return dataCamposDinamicos;
};

export const getCamposDinamicosCount = async (filtro) => {
    const { data: dataCamposDinamicos } = await apiCampoDinamico.campoDinamicoControllerCount(filtro);
    return dataCamposDinamicos;
};

export const getCampoDinamico = async (id) => {
    const { data: dataCampoDinamico } = await apiCampoDinamico.campoDinamicoControllerFindById(id);
    return dataCampoDinamico;
};

export const postCampoDinamico = async (objCampoDinamico) => {
    const { data: dataCampoDinamico } = await apiCampoDinamico.campoDinamicoControllerCreate(objCampoDinamico);
    return dataCampoDinamico;
};

export const deleteCampoDinamico = async (idCampoDinamico) => {
    const { data: dataCampoDinamico } = await apiCampoDinamico.campoDinamicoControllerDeleteById(idCampoDinamico);
    return dataCampoDinamico;
};

export const patchCampoDinamico = async (idCampoDinamico, objCampoDinamico) => {
    const { data: dataCampoDinamico } = await apiCampoDinamico.campoDinamicoControllerUpdateById(idCampoDinamico, objCampoDinamico);
    return dataCampoDinamico;
};
