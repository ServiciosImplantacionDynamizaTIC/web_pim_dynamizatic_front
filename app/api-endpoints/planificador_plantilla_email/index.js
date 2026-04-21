import { PlanificadorPlantillaEmailControllerApi, settings } from "@/app/api-programa";

const apiPlanificadorPlantillaEmail = new PlanificadorPlantillaEmailControllerApi(settings);

export const getPlanificadorPlantillaEmails = async (filtro) => {
    const { data } = await apiPlanificadorPlantillaEmail.planificadorPlantillaEmailControllerFind(filtro);
    return data;
};

export const postPlanificadorPlantillaEmail = async (objPlanificadorPlantillaEmail) => {
    const { data } = await apiPlanificadorPlantillaEmail.planificadorPlantillaEmailControllerCreate(objPlanificadorPlantillaEmail);
    return data;
};

export const deletePlanificadorPlantillaEmail = async (idPlanificadorPlantillaEmail) => {
    const { data } = await apiPlanificadorPlantillaEmail.planificadorPlantillaEmailControllerDeleteById(idPlanificadorPlantillaEmail);
    return data;
};
