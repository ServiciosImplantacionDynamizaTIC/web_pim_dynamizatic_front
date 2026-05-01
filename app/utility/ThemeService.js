// ============================================================================
// SERVICIO PARA GESTIÓN DINÁMICA DE TEMAS - Premite el cambio de temas en tiempo de ejecución
// ============================================================================

/**
 * Función para cambiar dinámicamente el tema en tiempo de ejecución
 * @param {string} currentTheme - Tema actual (puede ser colorScheme o theme)
 * @param {string} newTheme - Nuevo tema a aplicar
 * @param {string} linkElementId - ID del elemento link del tema (por defecto 'theme-link')
 * @param {Function} callback - Función callback a ejecutar después del cambio
 */
export const changeTheme = (currentTheme, newTheme, linkElementId = 'theme-link', callback) => {
    //
    //Obtenemos el tema actual
    //
    const linkElement = document.getElementById(linkElementId);
    //
    //Si no existe, salimos
    //
    if (!linkElement) {
        console.error(`No se encontró el elemento link con ID: ${linkElementId}`);
        return;
    }
    //
    //Obteemos la ruta actual para modificarla mas adelante
    //
    const currentHref = linkElement.getAttribute('href');
    let newHref;

    //
    //Controlamos si estamos cambiando el color de fondo o el color de los botones...
    //
    if (['light', 'dim', 'dark'].includes(newTheme)) {
        //
        // Cambio el color de fondo a las posibilidades: light/dim/dark
        //
        newHref = currentHref.replace(/theme-(light|dim|dark)/, `theme-${newTheme}`);
    } else {
        //
        // Cambio el color
        //
        const pathParts = currentHref.split('/');
        if (pathParts.length >= 4) {
            pathParts[pathParts.length - 2] = newTheme; // Reemplazar el nombre del tema
            newHref = pathParts.join('/');
        } else {
            console.error('Formato de href no válido para cambio de tema:', currentHref);
            return;
        }
    }

    // Verificar que el nuevo href sea diferente
    if (currentHref === newHref) {
        console.log('El tema ya está aplicado:', newTheme);
        if (callback) callback();
        return;
    }
    //
    // Cambiamos la url por la del nuevo tema
    //
    linkElement.setAttribute('href', newHref);    
    //
    // Ejecutamos el callback si lo hemos pasado
    //
    if (callback && typeof callback === 'function') {
        // Delay para asegurar que el CSS se cargue
        setTimeout(callback, 100);
    }
};

/**
 * Función para obtener la configuración actual del tema desde el DOM
 * @returns {Object} Objeto con colorScheme y theme actuales
 */
export const getCurrentThemeConfig = () => {
    //
    //Obtenemos el tema seleccionado
    //
    const linkElement = document.getElementById('theme-link');
    //
    //Si no existe, devolvemos valores por defecto
    //
    if (!linkElement) {
        return {
            colorScheme: 'light',
            theme: 'mitema'
        };
    }
    //
    //Obtenemos la url para cambiarla mas adelante
    //
    const href = linkElement.getAttribute('href') || '';
    //
    // Extraemos colorScheme y theme del href
    //
    const colorSchemeMatch = href.match(/theme-(light|dim|dark)/);
    const themeMatch = href.match(/theme-(?:light|dim|dark)\/([^\/]+)\/theme\.css/);
    //
    //Devolvemos los datos cambiados o el valor por defecto
    //
    return {
        colorScheme: colorSchemeMatch ? colorSchemeMatch[1] : 'light',
        theme: themeMatch ? themeMatch[1] : 'mitema'
    };
};

/**
 * Función para construir la URL del tema basada en colorScheme y theme
 * @param {string} colorScheme - Esquema de color (light/dim/dark)
 * @param {string} theme - Nombre del tema (indigo/blue/purple/etc.)
 * @returns {string} URL completa del tema
 */
export const buildThemeUrl = (colorScheme = 'light', theme = 'mitema') => {
    return `/theme/theme-${colorScheme}/${theme}/theme.css`;
};

/**
 * Función para aplicar configuración completa de tema
 * @param {Object} themeConfig - Configuración del tema
 * @param {string} themeConfig.colorScheme - Esquema de color
 * @param {string} themeConfig.theme - Nombre del tema
 * @param {Function} callback - Función callback
 */
export const applyThemeConfig = (themeConfig, callback) => {
    //
    //Obtenemos la url, el color y el tema actual
    //
    const { colorScheme, theme } = themeConfig;
    const newHref = buildThemeUrl(colorScheme, theme);
    //
    //Obtenemos el tema seleccionado si ha cambiado
    //
    const linkElement = document.getElementById('theme-link');
    //
    //Si existe, procedemos al cambio
    //
    if (linkElement) {
        //
        //Si la url actual es diferente a la nueva (porque hemos cambiado el tema) entramos en el if para realizar los cambios a todo 
        //
        // Quitamos el timestamp del href guardado antes de comparar para evitar bucles infinitos
        const currentHref = (linkElement.getAttribute('href') || '').split('?')[0];

        if (currentHref !== newHref) {
            linkElement.setAttribute('href', newHref);
            
            //
            // Aplicamos el nuevo tema
            //
            linkElement.onload = () => {
                if (callback && typeof callback === 'function') {
                    callback();
                }
            };
            
            //
            // Esperamos a que se cargue el nuevo CSS y ejecutamos el callback si viene informado
            //
            setTimeout(() => {
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }, 200);
            
        } else {
            //
            //si no hemos realizado cambios o cambiamos al mismo que tenemos no hacemos nada
            //
            console.log('La configuración de tema ya está aplicada');
            if (callback) callback();
        }
    } else {
        console.error('No se encontró el elemento theme-link');
        if (callback) callback();
    }
};