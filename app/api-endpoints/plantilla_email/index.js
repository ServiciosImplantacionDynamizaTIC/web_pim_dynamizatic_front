import { PlantillaEmailControllerApi, settings } from "@/app/api-programa";

const apiPlantillaEmail = new PlantillaEmailControllerApi(settings)

export const getPlantillaEmails = async (filtro) => {
    try {
        const { data: dataPlantillaEmail } = await apiPlantillaEmail.plantillaEmailControllerFind(filtro)
        return dataPlantillaEmail
    } catch (error) {
        console.error('Error en getPlantillaEmails:', error);
        throw error;
    }
}


export const getPlantillaEmailsCount = async (filtro) => {
    const { data: dataPlantillaEmail } = await apiPlantillaEmail.plantillaEmailControllerCount(filtro)
    return dataPlantillaEmail
}

export const postEnviarQR = async (url, objPlantillaEmail) => {
    const { data: dataPlantillaEmail } = await apiPlantillaEmail.plantillaEmailControllerEnviarQR(url, objPlantillaEmail)
    return dataPlantillaEmail
}

export const postEnviarEmails = async (plantillaEmailId, emails) => {
    const { data: dataPlantillaEmail } = await apiPlantillaEmail.plantillaEmailControllerEnviarEmails(plantillaEmailId, { emails: emails })
    return dataPlantillaEmail
}

export const postPlantillaEmail = async (objPlantillaEmail) => {
    const { data: dataPlantillaEmail } = await apiPlantillaEmail.plantillaEmailControllerCreate(objPlantillaEmail)
    return dataPlantillaEmail
}

export const patchPlantillaEmail = async (idPlantillaEmail, objPlantillaEmail) => {
    const { data: dataPlantillaEmail } = await apiPlantillaEmail.plantillaEmailControllerUpdateById(idPlantillaEmail, objPlantillaEmail)
    return dataPlantillaEmail
}

export const deletePlantillaEmail = async (idPlantillaEmail) => {
    const { data: dataPlantillaEmail } = await apiPlantillaEmail.plantillaEmailControllerDeleteById(idPlantillaEmail)
    return dataPlantillaEmail
}

export const getVistaPlantillaEmail = async (filtrar) => {
    const { data: dataPlantillaEmail } = await apiPlantillaEmail.plantillaEmailControllerVistaPlantillaEmail(filtrar)
    return dataPlantillaEmail
}

export const getVistaPlantillaEmailCount = async (filtrar) => {
    const { data: dataPlantillaEmail } = await apiPlantillaEmail.plantillaEmailControllerVistaPlantillaEmailCount(filtrar)
    return dataPlantillaEmail
}