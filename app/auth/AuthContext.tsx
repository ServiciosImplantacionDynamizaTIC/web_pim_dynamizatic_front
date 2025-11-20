"use client"
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { obtenerRolDashboard } from "@/app/api-endpoints/rol";
import Cookies from 'js-cookie';
import { emptyCache } from '../utility/Utils';
import jwt from "@/app/auth/jwt/useJwt";
import { getEmpresa } from "@/app/api-endpoints/empresa";
import { getIdioma } from "@/app/api-endpoints/idioma";
import { getVistaEmpresaRol } from "@/app/api-endpoints/rol";
import { registrarLoginExitoso, registrarLoginFallido, registrarAccesoBloqueado, registrarLogout } from "@/app/utility/LogAccesoUtils";
 import { getVistaArchivoEmpresa } from "@/app/api-endpoints/archivo";
import { getVistaTipoArchivoEmpresaSeccion } from "@/app/api-endpoints/tipo_archivo";
import { obtenerTodosLosPermisos } from "@/app/components/shared/componentes";

interface AuthContextProps {
  usuarioAutenticado: boolean;
  login: (token: string, rememberMe: boolean, data: any) => void;
  loginSinDashboard: (token: string, rememberMe: boolean, data: any) => void;
  logout: () => void;
  registrarAccesoFallido: (empresaId: number, usuarioId: number, motivoFallo: string) => Promise<void>;
  registrarAccesoBloqueado: (empresaId: number, usuarioId: number, motivoFallo: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const config = jwt.jwtConfig;

  useEffect(() => {
    const token = Cookies.get('authToken');
    //Si usuario esta autenticado o esta en la pagina de publica de autenticacion, se le permite el acceso
    if (token || pathname.includes('/auth/')) {
      setUsuarioAutenticado(true);
    } else {
      setUsuarioAutenticado(false);
      router.push('/auth/login');
    }
  }, [router]);

  const login = async (token: string, rememberMe: boolean, data: any) => {
    Cookies.set('authToken', token, { expires: rememberMe ? 7 : undefined });
    setUsuarioAutenticado(true);
    await almacenarLogin(data);
    //
    //Al loguearnos creamos un evento indicando la empresaId y userId para que el gestor de temas dinamicos pueda actualizar el tema
    //
    if (typeof window !== 'undefined') {
      //
      //Creamos el evento personalizado con los datos de empresaId y userId
      //
      const loginEvent = new CustomEvent('user-logged-in', {
        detail: { empresaId: data.empresaId, userId: data.id }
      });
      //
      //Lanzamos el evento para que lo escuche el gestor de temas dinamicos y aplique el tema correspondiente según los datos pasados
      //
      window.dispatchEvent(loginEvent);
    }
    
    router.push(await obtenerRolDashboard());
  };

  //Login que se usa cuando no queremos redirigir al usuario, util para cuando queremos entrar para hacer el registro del usuario
  const loginSinDashboard = async (token: string, rememberMe: boolean, data: any) => {
    Cookies.set('authToken', token, { expires: rememberMe ? 7 : undefined });
    await almacenarLogin(data);
    setUsuarioAutenticado(true);
    //router.push(await obtenerRolDashboard());
  };

  const getMenuLateral = async () => {
    // Este objeto contiene las rutas y los iconos asociados a cada permiso
    const jsonRutas: Record<string, Record<string, { path: string; icon: string }>> = {
      "Gestión": {
        "Usuarios": {
          "path": "/usuarios",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Empresas": {
          "path": "/empresas",
          "icon": "pi pi-fw pi-user-edit"
        }
      },
      "Tablas maestras": {
        "Archivos": {
          "path": "/tablas-maestras/archivo",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Enviar email": {
          "path": "/tablas-maestras/enviar-email",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Idiomas": {
          "path": "/tablas-maestras/idioma",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Logs de acceso": {
          "path": "/tablas-maestras/log-acceso",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Logs de acciones": {
          "path": "/tablas-maestras/log-acciones",
          "icon": "pi pi-fw pi-history"
        },
        "Configuración de logs": {
          "path": "/tablas-maestras/configuracion-logs",
          "icon": "pi pi-fw pi-cog"
        },
        "Permisos": {
          "path": "/tablas-maestras/permiso",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Planificador de categorias": {
          "path": "/tablas-maestras/planificador-categorias",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Planificador de estados": {
          "path": "/tablas-maestras/planificador-estados",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Plantillas de email": {
          "path": "/tablas-maestras/plantilla_email",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Roles": {
          "path": "/tablas-maestras/rol",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Sección": {
          "path": "/tablas-maestras/seccion",
          "icon": "pi pi-fw pi-user-edit"
        },
        "Tipos de archivo": {
          "path": "/tablas-maestras/tipo_archivo",
          "icon": "pi pi-fw pi-file"
        },
        "Traducción": {
          "path": "/tablas-maestras/traduccion",
          "icon": "pi pi-fw pi-user-edit"
        }
      }
    }
 
    // Obtener los permisos del usuario actual de "Acceder" a las rutas
    const permisos = await obtenerTodosLosPermisos();
    // Filtrar solo los permisos de tipo "Acceder"
    const permisosAcceder = Array.isArray(permisos) ? permisos.filter((permiso) => permiso.permisoAccion === 'Acceder') : [];
    // Declaramos el objeto que sera el menu final y le ponemos un titulo de menu
    const jsonPermisos: {
      label: string;
      icon: string;
      items: { label: string; icon: string; items: { label: string; icon: string; to: string; }[] }[];
    } = {
      label: "Menu",
      icon: "pi pi-fw pi-minus",
      items: []
    };

 
    // Recorremos las categorias y subcategorias del objeto jsonRutas
    for (const categoria in jsonRutas) {
      const categoriaItems = [];
      for (const subCategoria in jsonRutas[categoria] as Record<string, { path: string; icon: string }>) {
        if (Array.isArray(permisosAcceder)) {
          // Si existe un permiso en el array que tenga de nombre de controlador el nombre de la subcategoria,
          // Significa que el usuario tiene acceso a esa pantalla y por lo tanto la añadimos al menu
          if (permisosAcceder.some((permiso) => permiso.permisoControlador === subCategoria)) {
            categoriaItems.push({
              label: `${subCategoria}`,
              icon: jsonRutas[categoria][subCategoria].icon,
              // command: () => {
              //     router.push(jsonRutas[categoria][subCategoria].path, { shallow: true });
              // },
              to: jsonRutas[categoria][subCategoria].path,
            });
          }
        }
      }
      //Construimos las categorias que tendran sus items
      const categoriaJson = {
        label: `${categoria}`,
        icon: "pi pi-fw pi-minus",
        items: categoriaItems
      }
      // Si la categoria no tiene items, no la añadimos al menu
      if (categoriaItems.length > 0) {
        jsonPermisos['items'].push(categoriaJson);
      }
    }
    localStorage.setItem('menuLateral', JSON.stringify([jsonPermisos]));
  }

  const almacenarLogin = async (data: any) => {
    localStorage.setItem(config.storageTokenKeyName, JSON.stringify(data.accessToken));
    localStorage.setItem('userData', JSON.stringify({ ...data }));
    localStorage.setItem('empresa', data.empresaId);

    //Obtiene el idioma del usuario
    if (data && data.idiomaId) {
      const idioma = await getIdioma(data.idiomaId);
      localStorage.setItem('idioma', idioma.iso || '');
    }

    //Obtiene el timer de la empresa del usuario
    const empresa = await getEmpresa(data.empresaId);
    if (empresa?.tiempoInactividad && empresa?.tiempoInactividad > 0) {
      localStorage.setItem('tiempoDeEsperaInactividad', '' + empresa?.tiempoInactividad);
    }
    
    // Almacenar configuración de tema de la empresa
    if (empresa) {
      const themeConfig = {
        tema: empresa.tema || 'indigo',
        esquemaColor: empresa.esquemaColor || 'light',
        escala: empresa.escala || 14,
        temaRipple: empresa.temaRipple || 'N'
      };
      localStorage.setItem('empresaThemeConfig', JSON.stringify(themeConfig));
      console.log('💾 Configuración de tema almacenada:', themeConfig);
    }
    
    if (await compruebaRolUsuario({ ...data })) {
      //Si tiene que mostrar la empresa, obtenemos el logo
      localStorage.setItem('logoEmpresaUrl', await obtenerLogoEmpresa());
    }

    //Obtiene la ip del usuario usando la API de ipify, es de codigo abierto y tiene usos infinitos
    const response = await fetch('https://api.ipify.org?format=json');
    const ip = (await response.json()).ip;

    //Registra el login exitoso usando las nuevas utilidades
    try {
      await registrarLoginExitoso(data.empresaId, data.id, ip);
    } catch (error) {
      console.error('Error al registrar el log de acceso:', error);
      // No bloquear el login si falla el log
    }
    
    await getMenuLateral();
  }

  const compruebaRolUsuario = async (usuario: any) => {
    const queryParamsRol = {
      where: {
        and: {
          id: usuario.rolId
        }
      },
    };
    const rol = await getVistaEmpresaRol(JSON.stringify(queryParamsRol));
    //setMuestraEmpresa(rol[0].muestraEmpresa === 'S')
    return Array.isArray(rol) && rol[0]?.muestraEmpresa === 'S';
  }

  const obtenerLogoEmpresa = async () => {
    //Obtiene los tipos de archivo de la seccion
    const queryParamsTiposArchivo = {
      where: {
        and: {
          nombreSeccion: 'Empresa',
          nombre: 'Logo'
        }
    },
      order: "orden ASC"
    };
    const registrosTipoArchivos = await getVistaTipoArchivoEmpresaSeccion(JSON.stringify(queryParamsTiposArchivo));

    const queryParamsArchivo = {
      where: {
        and: {
         tipoArchivoId: Array.isArray(registrosTipoArchivos) && registrosTipoArchivos.length > 0 ? registrosTipoArchivos[0].id : undefined,
          tablaId: Number(localStorage.getItem('empresa'))
        }
      }
    };
    const archivoLogo = await getVistaArchivoEmpresa(JSON.stringify(queryParamsArchivo))
    if (Array.isArray(archivoLogo) && archivoLogo.length > 0) {
      return archivoLogo[0].url.replace(/(\/[^\/]+\/)([^\/]+\.\w+)$/, '$11250x850_$2');
    }
    return null;
  }

  const logout = (mensaje?: string) => {
    // Registrar el logout antes de limpiar los datos
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Usar la nueva utilidad para registrar logout
        registrarLogout(user.empresaId, user.id).catch(error => {
          console.error('Error al registrar logout:', error);
        });
      } catch (error) {
        console.error('Error al parsear datos del usuario para logout:', error);
      }
    }

    //Vaciamos localStorage y cookies
    Cookies.remove('authToken');
    localStorage.clear();

    // Disparar evento personalizado para notificar el logout
    if (typeof window !== 'undefined') {
      const logoutEvent = new CustomEvent('user-logged-out');
      window.dispatchEvent(logoutEvent);
      console.log('🔔 Evento de logout disparado para restaurar tema por defecto');
    }

    // Limio la caché y espero a que devuelva la respuesta para luego hacer el dispatch
    emptyCache().then(() => {
      //Marcamos el usuario como no logeado
      setUsuarioAutenticado(false);
      router.push('/auth/login');
      //En local esto no funciona porque el debugger esta roto y recarga la pagina siempre, en DEV si que funciona, paz y tranquilidad
      if (typeof mensaje === 'string' && mensaje) {
        localStorage.setItem('toastMensaje', mensaje);
      }
    }).catch((error) => {
      console.error("Error al vaciar el cache: ", error)
    })

  };

  // Función para registrar accesos fallidos
  const registrarAccesoFallido = async (empresaId: number, usuarioId: number, motivoFallo: string) => {
    try {
      await registrarLoginFallido(empresaId, usuarioId, motivoFallo);
    } catch (error) {
      console.error('Error al registrar el acceso fallido:', error);
    }
  };

  // Función para registrar accesos bloqueados
  const registrarAccesoBloqueado = async (empresaId: number, usuarioId: number, motivoFallo: string) => {
    try {
      await registrarAccesoBloqueado(empresaId, usuarioId, motivoFallo);
    } catch (error) {
      console.error('Error al registrar el acceso bloqueado:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ usuarioAutenticado, login, logout, loginSinDashboard, registrarAccesoFallido, registrarAccesoBloqueado }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};