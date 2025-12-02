/***
 * Este código gestiona la autenticación basada en JWT, 
 * intercepta peticiones para añadir el token de acceso,
 * maneja respuestas para refrescar tokens cuando sea necesario y ofrece métodos para el login,
 * registro y renovación de tokens.
 ***/
import axios from 'axios'
import jwtDefaultConfig from './jwtDefaultConfig'
import { UsuariosControllerApi, settings } from '@/app/api-programa'
import { getAccessToken } from '@/app/utility/Utils'
import { getIdiomaIdFromStorage } from '@/app/contexts/IdiomaContext'

const api = new UsuariosControllerApi(settings)

export default class JwtService {
  
  jwtConfig = { ...jwtDefaultConfig } //-> Configuración de JWT que puede ser sobrescrita al instanciar la clase.

  isAlreadyFetchingAccessToken = false //-> Bandera para evitar múltiples solicitudes de refresco de token simultáneas.

  subscribers = [] //-> Lista de suscriptores para manejar la actualización del token de acceso.

  //El constructor permite sobrescribir la configuración de JWT.
  constructor(jwtOverrideConfig) {
    this.jwtConfig = { ...this.jwtConfig, ...jwtOverrideConfig }

    // Intercepta todas las peticiones salientes.
    axios.interceptors.request.use(
      config => {
        const accessToken = this.getToken() //-> Obtiene el token de localStorage

        //Si hay un token de acceso presente, lo añade al encabezado Authorization de la petición.
        if (accessToken) {
          config.headers.Authorization = `${this.jwtConfig.tokenType} ${accessToken}`
        }
        
        // Agregar header x-idioma-id para todas las peticiones
        const idiomaId = getIdiomaIdFromStorage()
        if (idiomaId) {
          config.headers['x-idioma-id'] = idiomaId
        }
        
        return config
      },
      error => Promise.reject(error)
    )

    // Intercepta todas las respuestas.
    axios.interceptors.response.use(
      response => response,
      error => {
        const { config, response } = error
        const originalRequest = config

        // Si una respuesta tiene un estado 401 (no autorizado), intenta refrescar el token.
        if (response && response.status === 401) {
          if (!this.isAlreadyFetchingAccessToken) {
            this.isAlreadyFetchingAccessToken = true
            this.refreshToken().then(r => {
              this.isAlreadyFetchingAccessToken = false

              // Actualiza accessToken en el localStorage
              this.setToken(r.data.accessToken)
              this.setRefreshToken(r.data.refreshToken)

              this.onAccessTokenFetched(r.data.accessToken)
            })
          }
          // Si se obtiene un nuevo token, reintenta la solicitud original con el nuevo token.
          const retryOriginalRequest = new Promise(resolve => {
            this.addSubscriber(accessToken => {
              // Cambia el encabezado de la Authorization
              originalRequest.headers.Authorization = `${this.jwtConfig.tokenType} ${accessToken}`
              resolve(this.axios(originalRequest))
            })
          })
          return retryOriginalRequest
        }
        if (error) {
          // const objetoJson = JSON.stringify(error.response.data.error)
          // const objeto = JSON.parse(objetoJson)
          console.log('JWTError: ', error)
          localStorage.setItem('JWTError', error)
        }
        return Promise.reject(error)
      }
    )
  }

  // Notifica a todos los suscriptores con el nuevo token de acceso.
  onAccessTokenFetched(accessToken) {
    this.subscribers = this.subscribers.filter(callback => callback(accessToken))
  }

  // Añade suscriptores que serán notificados cuando se obtenga un nuevo token de acceso.
  addSubscriber(callback) {
    this.subscribers.push(callback)
  }

  // Obtiene el token de acceso del almacenamiento local.
  getToken() {
    return getAccessToken()
  }

  // Obtiene el token de refresco del almacenamiento local.
  getRefreshToken() {
    return localStorage.getItem(this.jwtConfig.storageRefreshTokenKeyName)
  }

  //Guardan el token en el almacenamiento local.
  setToken(value) {
    localStorage.setItem(this.jwtConfig.storageTokenKeyName, value)
  }

  //Guardan el token de refresco en el almacenamiento local.
  setRefreshToken(value) {
    localStorage.setItem(this.jwtConfig.storageRefreshTokenKeyName, value)
  }

  // Inicia sesión llamando al método correspondiente del API del controlador de usuario.
  login(...args) {
    return api.usuariosControllerLogin(...args)
  }

  // Similar a login, pero se usa para renovar la sesión.
  loginRefresh(...args) {
    return api.usuariosControllerLogin(...args)
  }

  // Registra un nuevo usuario.
  register(...args) {
    return axios.post(this.jwtConfig.registerEndpoint, ...args)
  }

  // Refresca el token de acceso utilizando el token de refresco.
  refreshToken() {
    return axios.post(this.jwtConfig.refreshEndpoint, {
      refreshToken: this.getRefreshToken()
    })
  }
}
