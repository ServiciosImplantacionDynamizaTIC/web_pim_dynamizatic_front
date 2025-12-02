import { TraduccionLiteralControllerApi, IdiomaControllerApi, settings } from "@/app/api-programa";

const apiTraduccion = new TraduccionLiteralControllerApi(settings)
const apiIdioma = new IdiomaControllerApi(settings)

export const getTraduccionLiterales = async (filtrar) => {
    const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerFind(filtrar)
    return dataTraduccionLiterales
}

export const getTraduccionLiteralesCount = async (filtrar) => {
    const { data: dataTraduccionLiteralesCount } = await apiTraduccion.traduccionLiteralControllerCount(filtrar)
    return dataTraduccionLiteralesCount
}

export const postTraduccionLiteral = async (objTraduccion) => {
    const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerCreate(objTraduccion)
    return dataTraduccionLiterales
}

export const patchTraduccionLiteral = async (idTraduccion, objTraduccion) => {
    const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerUpdateById(idTraduccion, objTraduccion)
    return dataTraduccionLiterales
}

export const deleteTraduccionLiteral = async (idTraduccion) => {
    const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerDeleteById(idTraduccion)
    return dataTraduccionLiterales
}

// export const getVistaTraduccionLiteralIdioma = async (filtrar) => {
//     const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerVistaTraduccionLiteralIdioma(filtrar)
//     return dataTraduccionLiterales
// }

// export const getVistaTraduccionLiteralIdiomaCount = async (filtrar) => {
//     const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerVistaTraduccionLiteralIdiomaCount(filtrar)
//     return dataTraduccionLiterales
// }

export const buscaTraduccionLiteral = async (iso) => {
    try {
        console.log('🔍 Buscando traducciones para idioma:', iso);
        
        // Usar el filtro para buscar traducciones por idioma ISO
        const filtro = {
            where: {
                idioma: iso
            }
        };
        
        const { data: dataTraduccionLiterales } = await apiTraduccion.traduccionLiteralControllerFind(filtro);
        
        console.log('✅ Traducciones raw obtenidas:', dataTraduccionLiterales);
        console.log('🔍 Primera traducción de ejemplo:', dataTraduccionLiterales[0]);
        console.log('🔍 Estructura de la primera traducción:', {
            clave: dataTraduccionLiterales[0]?.clave,
            valor: dataTraduccionLiterales[0]?.valor,
            idioma: dataTraduccionLiterales[0]?.idioma,
            keys: Object.keys(dataTraduccionLiterales[0] || {})
        });
        
        const newLanguageObj = {}; // {"Announcements": "Comunicados"}

        dataTraduccionLiterales?.forEach((traduccion, index) => {
            console.log(`🔍 Procesando traducción ${index}:`, {
                clave: traduccion?.clave,
                valor: traduccion?.valor,
                valorLength: traduccion?.valor?.length,
                tieneValor: !!(traduccion?.valor?.length)
            });
            
            if (traduccion?.valor?.length) {
                newLanguageObj[`${traduccion.clave}`] = traduccion.valor;
                console.log(`✅ Agregada: ${traduccion.clave} = ${traduccion.valor}`);
            } else {
                console.log(`❌ NO agregada: ${traduccion.clave}, valor: "${traduccion.valor}"`);
            }
        });

        console.log('✅ Objeto de traducciones procesado:', newLanguageObj);
        return newLanguageObj;
    } catch (error) {
        console.error('❌ Error en buscaTraduccionLiteral:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            data: error.response?.data
        });
        return {}; // Devolver objeto vacío en caso de error
    }
};

export const getIdiomas = async () => {
    const { data: dataTraducciones } = await apiIdioma.idiomaControllerFind()
    return dataTraducciones
}

export const crearVistaTraduccionesDinamica = async () => {
    try {
        // Obtener todos los idiomas activos
        const idiomas = await getIdiomas();
        
        // Crear la consulta dinámica
        let query = `
            CREATE OR REPLACE VIEW vista_traducciones_dinamica AS
            SELECT 
                t.clave,
                ${idiomas.map(idioma => `
                    MAX(CASE WHEN t.idiomaId = ${idioma.id} THEN t.valor END) as ${idioma.iso.toLowerCase()}
                `).join(',\n')}
            FROM traduccion t
            GROUP BY t.clave
        `;

        // Ejecutar la consulta
        const { data } = await apiTraduccion.traduccionControllerExecuteQuery(query);
        return data;
    } catch (error) {
        console.error('Error al crear la vista dinámica:', error);
        throw error;
    }
}

export const getVistaTraduccionesDinamica = async (filtro) => {
    try {
        const { data } = await apiTraduccion.traduccionControllerVistaTraduccionesDinamica(filtro);
        return data;
    } catch (error) {
        console.error('Error al obtener la vista dinámica:', error);
        throw error;
    }
}