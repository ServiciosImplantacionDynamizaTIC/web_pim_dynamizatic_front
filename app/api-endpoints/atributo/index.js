import { PropiedadControllerApi, settings } from "@/app/api-programa";

const apiPropiedad = new PropiedadControllerApi(settings)

export const gePropiedades = async (filtro) => {
    const { data: dataPropiedades } = await apiPropiedad.propiedadControllerFind(filtro)
    return dataPropiedades
}

export const gePropiedadesCount = async (filtro) => {
    const { data: dataPropiedades } = await apiPropiedad.propiedadControllerCount(filtro)
    return dataPropiedades
}

export const getPropiedad = async (id) => {
    const { data: dataPropiedad } = await apiPropiedad.propiedadControllerFindById(id)
    return dataPropiedad
}

export const postPropiedad = async (objPropiedad) => {
    const { data: dataPropiedad } = await apiPropiedad.propiedadControllerCreate(objPropiedad)
    return dataPropiedad
}

export const deletePropiedad = async (idPropiedad) => {
    const { data: dataPropiedad } = await apiPropiedad.propiedadControllerDeleteById(idPropiedad)
    return dataPropiedad
}

export const patchPropiedad = async (idPropiedad, objPropiedad) => {
    const { data: dataPropiedad } = await apiPropiedad.propiedadControllerUpdateById(idPropiedad, objPropiedad)
    return dataPropiedad
}