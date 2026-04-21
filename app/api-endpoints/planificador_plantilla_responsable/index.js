import { PlanificadorPlantillaResponsableControllerApi, settings } from "@/app/api-programa";

const apiPlanificadorPlantillaResponsable = new PlanificadorPlantillaResponsableControllerApi(settings);

export const getPlanificadorPlantillaResponsables = async (filtro) => {
    const { data } = await apiPlanificadorPlantillaResponsable.planificadorPlantillaResponsableControllerFind(filtro);
    return data;
};

export const postPlanificadorPlantillaResponsable = async (objPlanificadorPlantillaResponsable) => {
    const { data } = await apiPlanificadorPlantillaResponsable.planificadorPlantillaResponsableControllerCreate(objPlanificadorPlantillaResponsable);
    return data;
};

export const deletePlanificadorPlantillaResponsable = async (idPlanificadorPlantillaResponsable) => {
    const { data } = await apiPlanificadorPlantillaResponsable.planificadorPlantillaResponsableControllerDeleteById(idPlanificadorPlantillaResponsable);
    return data;
};
