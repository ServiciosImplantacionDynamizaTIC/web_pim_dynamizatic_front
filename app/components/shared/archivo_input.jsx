import React, { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { devuelveBasePath } from "../../utility/Utils";
import { useIntl } from "react-intl";
import VisualizadorDeImagen from './VisualizadorDeImagen';
import { getUrlImagenMiniatura, getUrlImagenGrande } from '../../utility/ImageUtils';

const ArchivoInput = ({ registro, setRegistro, archivoTipo, archivoHeader, campoNombre }) => {
    const intl = useIntl();
    const [archivoIcono, setArchivoIcono] = useState(null);
    const [primeraCarga, setPrimeraCarga] = useState(true);
    const [inputArchivo, setInputArchivo] = useState(null);
    const [labelArchivo, setLabelArchivo] = useState(null);
    const [cargarUrlCliente, setCargarUrlCliente] = useState(false);
    const [visualizadorDeImagenVisible, setVisualizadorDeImagenVisible] = useState(false);
    const [imagenSeleccionada, setImagenSeleccionada] = useState('');
    const [contenidoImagen, setContenidoImagen] = useState(null); // Nuevo estado para manejar el contenido de la imagen
    useEffect(() => {
        if (primeraCarga) {
            setPrimeraCarga(false)
            //Forzamos la carga de la imagen
            registro[campoNombre] = registro[campoNombre];
        }
    }, []);
    
    // Funciones auxiliares
    const crearInputArchivo = (esImagen = false) => {
        const accept = esImagen ? ".jpg, .jpeg, .png, .webp, .tiff, .avif" : undefined;
        return <input accept={accept} onChange={cambioArchivoHandler} type='file' style={{ display: 'none' }} />;
    };

    const configurarArchivoNoImagen = (archivo) => {
        setInputArchivo(crearInputArchivo());
        
        if (typeof archivo === 'string') {
            const iconoArchivo = <i className="pi pi-file text-6xl"></i>;
            const esArchivoNoDisponible = archivo.includes('imagen-no-disponible');
            
            const archivoIcono = esArchivoNoDisponible ? iconoArchivo : (
                <a href={`${devuelveBasePath()}${archivo}`} target="_blank" rel="noopener noreferrer">
                    {iconoArchivo}
                </a>
            );
            setArchivoIcono(archivoIcono);
        } else {
            setArchivoIcono(<i className="pi pi-file text-6xl"></i>);
        }
        setContenidoImagen(null);
    };
    
    useEffect(() => {
        const esImagen = archivoTipo.toLowerCase() === 'imagen';
        
        if (registro[campoNombre]) {
            if (typeof registro[campoNombre] !== 'string') {
                // Cliente ha cargado un archivo
                const archivoUrl = URL.createObjectURL(registro[campoNombre]);
                setLabelArchivo(registro[campoNombre].name);
                
                if (esImagen) {
                    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/tiff", "image/avif"];
                    const imagenValida = tiposPermitidos.includes(registro[campoNombre].type);
                    const urlImagen = imagenValida ? archivoUrl : `${devuelveBasePath()}/multimedia/Sistema/imagen-no-disponible.jpeg`;
                    mostrarImagen(urlImagen);
                } else {
                    configurarArchivoNoImagen(registro[campoNombre]);
                }
            } else {
                // Archivo previamente cargado
                setLabelArchivo(registro[campoNombre].split('/').pop());
                
                if (esImagen) {
                    mostrarImagen(`${devuelveBasePath()}${registro[campoNombre]}`);
                } else {
                    configurarArchivoNoImagen(registro[campoNombre]);
                }
            }
        } else {
            // Sin archivo
            setLabelArchivo(intl.formatMessage({ id: 'Seleccione un archivo' }));
            
            if (esImagen) {
                setInputArchivo(crearInputArchivo(true));
                mostrarImagen(`${devuelveBasePath()}/multimedia/Sistema/imagen-no-disponible.jpeg`);
            } else {
                configurarArchivoNoImagen(null);
            }
        }
    }, [registro[campoNombre]]);

    const cambioArchivoHandler = (event) => {
        const file = event.target.files[0];
        setCargarUrlCliente(true)
        // Realiza los cambios al registro

        setRegistro((prevRegistro) => ({
            ...prevRegistro,
            [campoNombre]: file,
        }));
    };

    const limpiarArchivoHandler = () => {
        try{
            setLabelArchivo(intl.formatMessage({ id: 'Seleccione un archivo' }));
            //
            // Limpiamos la imágen o el archivo mostrado
            //
            if (archivoTipo.toLowerCase() === 'imagen') {
                setContenidoImagen(
                    <i className="pi pi-image text-6xl"></i>
                );
            } else {
                setArchivoIcono(
                    <i className="pi pi-file text-6xl"></i>
                );
            }
            //
            // Cambiamos el registro para eliminar el archivo asociado
            //
            const _registro = { ...registro };
            _registro[campoNombre] = null;
            setRegistro(_registro);
        } catch (error) {
            console.error("Error al limpiar el archivo:", error);
        }
    };

    const mostrarImagen = (imgUrl) => {
        //
        // Creamos el contenido de la imagen con la funcionalidad de visor ampliado
        //
        const handleClick = () => {
            if (!imgUrl.includes('imagen-no-disponible')) {
                let urlParaVisor;
                if (typeof imgUrl === 'string' && !imgUrl.includes('blob:') && imgUrl.includes('/multimedia/')) {
                    // Extraer solo la parte de la URL sin el basePath
                    const urlSinBase = imgUrl.replace(devuelveBasePath(), '');
                    urlParaVisor = getUrlImagenGrande(urlSinBase);
                } else {
                    urlParaVisor = imgUrl.replace(devuelveBasePath(), '');
                }
                setImagenSeleccionada(urlParaVisor);
                setVisualizadorDeImagenVisible(true);
            }
        };

        let imagenSrc = imgUrl;
        // Si es una URL del servidor (string), convertir a thumbnail
        if (typeof imgUrl === 'string' && !imgUrl.includes('blob:') && imgUrl.includes('/multimedia/')) {
            imagenSrc = getUrlImagenMiniatura(imgUrl);
        }

        const contenidoImg = (
            <div 
                style={{ 
                    cursor: imgUrl.includes('imagen-no-disponible') ? 'default' : 'pointer', 
                    width: '100%' 
                }}
                onClick={handleClick}
            >
                <img 
                    src={imagenSrc} 
                    alt="Imagen" 
                    style={{ width: '100%' }}
                />
            </div>
        );

        setContenidoImagen(contenidoImg);
        setArchivoIcono(null);
    };

    return (
        <>
            <div className='grid formgrid text-center' width='100%' style={{ gap: '0px' }}>
                <div
                    className='col-2 field'
                    style={{
                        display: 'flex',
                        minWidth: '0px',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    {contenidoImagen || archivoIcono}
                </div>
                <div className="col-10 field flex flex-column">
                    <label style={{textAlign: 'left'}} htmlFor="imagen">{intl.formatMessage({ id: archivoHeader })}</label>
                    <div className="flex" >
                        <label
                            className="inputtext p-component flex-1 w-100"
                            style={{
                                border: '1px solid #ccc',
                                padding: '6px 12px',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                minWidth: '0px',        
                                overflow: 'hidden',
                                textAlign: 'left',
                            }}
                        >
                            {labelArchivo && labelArchivo.length > 20 ? `${labelArchivo.substring(0, 20)}...` : labelArchivo}
                        </label>
                        <label
                            className="inputtext p-component flex-0 flex-shrink-0"
                            style={{
                                border: '1px solid #ccc',
                                padding: '6px 12px',
                                cursor: 'pointer',
                            }}
                        >
                            Subir
                            {inputArchivo}
                        </label>
                        <Button
                            onClick={limpiarArchivoHandler}
                            className="ml-2 p-button p-component p-button-icon-only p-button-rounded p-button-danger"
                        >
                            <span className="p-button-icon p-c pi pi-times"></span>
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* Visor de imágenes ampliadas */}
            <VisualizadorDeImagen
                visible={visualizadorDeImagenVisible}
                onHide={() => setVisualizadorDeImagenVisible(false)}
                imageUrl={imagenSeleccionada}
                altText={intl.formatMessage({ id: archivoHeader })}
            />
        </>
    );
};

export default ArchivoInput;
