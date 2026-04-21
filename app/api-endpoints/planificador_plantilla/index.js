import { PlanificadorPlantillaControllerApi, settings } from "@/app/api-programa";

const apiPlanificadorPlantilla = new PlanificadorPlantillaControllerApi(settings);

export const getPlanificadorPlantillas = async (filtro) => {
    const { data } = await apiPlanificadorPlantilla.planificadorPlantillaControllerFind(filtro);
    return data;
};

export const getPlanificadorPlantillasCount = async (filtro) => {
    const { data } = await apiPlanificadorPlantilla.planificadorPlantillaControllerCount(filtro);
    return data;
};

export const postPlanificadorPlantilla = async (objPlanificadorPlantilla) => {
    const { data } = await apiPlanificadorPlantilla.planificadorPlantillaControllerCreate(objPlanificadorPlantilla);
    return data;
};

export const patchPlanificadorPlantilla = async (idPlanificadorPlantilla, objPlanificadorPlantilla) => {
    const { data } = await apiPlanificadorPlantilla.planificadorPlantillaControllerUpdateById(idPlanificadorPlantilla, objPlanificadorPlantilla);
    return data;
};

export const deletePlanificadorPlantilla = async (idPlanificadorPlantilla) => {
    const { data } = await apiPlanificadorPlantilla.planificadorPlantillaControllerDeleteById(idPlanificadorPlantilla);
    return data;
};
