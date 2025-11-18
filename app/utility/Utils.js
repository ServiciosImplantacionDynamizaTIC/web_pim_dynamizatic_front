// --------------------------------- L I B R E R I A S --------------------------------------------//
import { format } from 'date-fns';
import { differenceInDays, parseISO } from 'date-fns';
import { checkVAT, countries } from 'jsvat';
// ------------------------------------------------------------------------------------------------//

// Recibe fecha de tipo String y retorna Fecha Formateada de tipo Date (dd/MM/yyyy)
export function formatearFechaString(fechaString) {
  return fechaString ? format(new Date(fechaString), 'dd/MM/yyyy') : 'N/A'
}

// Retorna la fecha en formato String
export function formatearFechaLocal_a_toISOString(fecha) {
  // Obtener la zona horaria del sistema
  const tzOffset = fecha.getTimezoneOffset() * 60000; // en milisegundos
  // Crear una nueva fecha en UTC ajustada con el offset de la zona horaria local
  const fechaLocal = new Date(fecha.getTime() - tzOffset);
  // Convertir la fecha a formato ISO 8601 con 'Z' indicando UTC
  return fechaLocal.toISOString().slice(0, -1) + 'Z';
};

// Recibe fecha de tipo Date y retorna Fecha Formateada de tipo Date (dd/MM/yyyy)
export function formatearFechaDate(fecha) {
  return fecha.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Recibe fecha de tipo Date y retorna Fecha Formateada de tipo Date (dd/MM/yyyy hh:mm:ss)
export function formatearFechaHoraDate(fecha) {
  return fecha.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Retorna el token del usuario que esta logueado
export function getAccessToken() {
  return JSON.parse(localStorage.getItem('userData'))?.accessToken
}
//Retorna un array de los datos del usuario que está logueado
export function getUsuarioSesion() {
  if (typeof localStorage !== 'undefined') {
    return JSON.parse(localStorage.getItem('userData'));
  }
  return null;
}

//Valida si el string es un documento de identidad valido
export function validaDocumentoIdentidad(documento, codigoPais) {
  //Si se ha marcado un pais en concreto a validar, se valida
  if (codigoPais) {
    const validacionJSON = checkVAT(`${codigoPais}${documento}`, countries)
    return validacionJSON.isValid;

  }
  //Si no prueba con los siguientes paises
  else {
    //Paises que va a validar
    const codigoPaises = ['ES', 'FR', 'DE', 'IT', 'GB', 'PT'];

    for (const codigoPais of codigoPaises) {
      // Comprobar si el documento es válido para los paises
      const validacionJSON = checkVAT(`${codigoPais}${documento}`, countries)
      if (validacionJSON.isValid) {
        return true;
      }
    }
  }
  //Si no es valido devuelve false
  return false;
}

//Funcion que bloquea o desbloquea toda la pantalla
export function bloquearPantalla(bloquear) {
  if (bloquear) {
    const div = document.createElement('div');
    div.style.width = '100vw';
    div.style.height = '100vh';
    div.style.position = 'fixed';
    div.style.top = 0;
    div.style.left = 0;
    div.style.backgroundColor = 'rgba(0, 0, 0, 0)'
    div.style.zIndex = 9999;
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.color = 'white';
    div.id = 'bloqueoPantalla';
    document.body.appendChild(div)
  }
  else {
    const div = document.getElementById('bloqueoPantalla')
    if (div) {
      document.body.removeChild(div)
    }
  }
}

// Retorna la ruta base de la API
export function devuelveBasePath() {
  let NEXT_PUBLIC_BACKEND_BASEPATH = process.env.NEXT_PUBLIC_BACKEND_BASEPATH_LOCAL
  if (process.env.NEXT_PUBLIC_ENTORNO == "DEV") {
    NEXT_PUBLIC_BACKEND_BASEPATH = process.env.NEXT_PUBLIC_BACKEND_BASEPATH_DEV
  }
  if (process.env.NEXT_PUBLIC_ENTORNO == "PRE") {
    NEXT_PUBLIC_BACKEND_BASEPATH = process.env.NEXT_PUBLIC_BACKEND_BASEPATH_PRE
  }
  if (process.env.NEXT_PUBLIC_ENTORNO == "PRO") {
    NEXT_PUBLIC_BACKEND_BASEPATH = process.env.NEXT_PUBLIC_BACKEND_BASEPATH_PRO
  }
  return NEXT_PUBLIC_BACKEND_BASEPATH
}

// Limpia la cache de la aplicacion
export async function emptyCache() {
  if ('caches' in window) {
    // Elimino todas las caches de forma asíncrona usando (Promise.All)
    caches.keys().then((names) => {
      return Promise.all(names.map(name => caches.delete(name)));
    }).then(() => {
      console.log('Caches eliminadas');
      // Una vez eliminadas, recargo la página
      window.location.reload();
    }).catch((error) => {
      console.error("Error al eliminar caches: ", error);
    });
  }
}

//Convierte el número pasado por parámetro en en formato 000,000.00  
//Dependiendo de si ponemos ge-GE saldrá este formato 000.000,00
export function formatNumber(value) {
  if (isNaN(value)) return '';
  if (Number.isInteger(value)) return value.toLocaleString('es-ES', { useGrouping: true });

  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
};
/**
 * Calcula la diferencia en días entre una fecha en formato ISO y la fecha actual.
 * @param {string} fechaISO - La fecha en formato ISO.
 * @returns {number} - La diferencia en días.
 */
//import { differenceInDays, parseISO } from 'date-fns';

export function calcularDiferenciaDias(fechaISO) {
  const fechaComparacion = parseISO(fechaISO);
  const fechaActual = new Date();
  return differenceInDays(fechaComparacion, fechaActual);
}

//
//Comprobamos que la url existe
//
export async function verificarUrlExiste(url) {
    try {
        const response = await fetch(url, { 
            method: 'HEAD',
            cache: 'no-cache'
        });
        return response.ok;
    } catch (error) {
        console.warn('Error verificando URL:', error);
        return false;
    }
};