import React, { useEffect, useState, useRef } from "react";
import { Button } from "primereact/button";
import { devuelveBasePath } from "../../utility/Utils";
import { useIntl } from "react-intl";
import VisualizadorDeImagen from './VisualizadorDeImagen';
import { getUrlImagenMiniatura, getUrlImagenGrande, esUrlImagen as esUrlImagenUtil } from '../../utility/ImageUtils';

const ArchivoInput = ({ registro, setRegistro, archivoTipo, archivoHeader, campoNombre }) => {
    const intl = useIntl();
    const divImagen = useRef(null); // Usa useRef para el contenedor de la imagen
    const [archivoIcono, setArchivoIcono] = useState(null);
    const [primeraCarga, setPrimeraCarga] = useState(true);
    const [inputArchivo, setInputArchivo] = useState(null);
    const [labelArchivo, setLabelArchivo] = useState(null);
    const [cargarUrlCliente, setCargarUrlCliente] = useState(false);
    const [visualizadorDeImagenVisible, setVisualizadorDeImagenVisible] = useState(false);
    const [imagenSeleccionada, setImagenSeleccionada] = useState('');
    useEffect(() => {
        if (primeraCarga) {
            setPrimeraCarga(false)
            //Forzamos la carga de la imagen
            registro[campoNombre] = registro[campoNombre];
        }
    }, []);
    useEffect(() => {
        if (registro[campoNombre]) {
            if (typeof registro[campoNombre] !== 'string') {
                //Si el cliente ha cargado una imagen, se muestra si es valida
                const archivoUrl = URL.createObjectURL(registro[campoNombre]);
                setLabelArchivo(registro[campoNombre].name);
                if (archivoTipo.toLowerCase() === 'imagen') {
                    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "image/tiff", "image/avif"];
                    if (tiposPermitidos.includes(registro[campoNombre].type)) {
                        mostrarImagen(archivoUrl);
                    }
                    else {
                        mostrarImagen(`${(devuelveBasePath())}/multimedia/Sistema/imagen-no-disponible.jpeg`);
                    }

                }
                else {
                    const _inputArchivo = (
                        <input onChange={cambioArchivoHandler} type='file' style={{ display: 'none' }} />
                    );
                    setInputArchivo(_inputArchivo);

                    const _archivoIcono = (
                        <i className="pi pi-file text-6xl"></i>
                    );
                    setArchivoIcono(_archivoIcono);
                }
            }
            else {
                // Si ya hay una imagen previamente cargada en el registro, la mostramos
                setLabelArchivo(registro[campoNombre].split('/').pop());
                if (archivoTipo.toLowerCase() === 'imagen') {
                    mostrarImagen(`${devuelveBasePath()}${registro[campoNombre]}`);
                }
                else {
                    const _inputArchivo = (
                        <input onChange={cambioArchivoHandler} type='file' style={{ display: 'none' }} />
                    );
                    setInputArchivo(_inputArchivo);

                    const _archivoIcono = (
                        <i className="pi pi-file text-6xl"></i>
                    );
                    setArchivoIcono(_archivoIcono);
                }

            }
        }
        else {
            if (archivoTipo.toLowerCase() === 'imagen') {
                //Depende del tipo del archivo crea el input
                const _inputArchivo = (
                    <input accept=".jpg, .jpeg, .png, .webp, .tiff, .avif" onChange={cambioArchivoHandler} type='file' style={{ display: 'none' }} />
                );
                setInputArchivo(_inputArchivo);

                mostrarImagen(`${devuelveBasePath()}/multimedia/Sistema/imagen-no-disponible.jpeg`);
            } else {
                const _inputArchivo = (
                    <input onChange={cambioArchivoHandler} type='file' style={{ display: 'none' }} />
                );
                setInputArchivo(_inputArchivo);

                const _archivoIcono = (
                    <i className="pi pi-file text-6xl"></i>
                );
                setArchivoIcono(_archivoIcono);
            }
            setLabelArchivo(intl.formatMessage({ id: 'Seleccione un archivo' }));
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
        if (divImagen.current) {
            divImagen.current.innerHTML = '';
            const imgIcon = document.createElement('i');
            if (archivoTipo.toLowerCase() === 'imagen') {
                imgIcon.className = 'pi pi-image text-6xl';
            }
            else {
                imgIcon.className = 'pi pi-file text-6xl';
            }
            divImagen.current.append(imgIcon);
        }
        setLabelArchivo(intl.formatMessage({ id: 'Seleccione un archivo' }));
        // Realiza los cambios al registro
        const _registro = { ...registro };
        _registro[campoNombre] = null;
        setRegistro(_registro);
    };

    const mostrarImagen = (imgUrl) => {
        if (divImagen.current) {
            divImagen.current.innerHTML = '';
            
            // Crear contenedor clickeable
            const imgContainer = document.createElement('div');
            imgContainer.style.cursor = 'pointer';
            imgContainer.style.width = '100%';
            
            const img = document.createElement('img');
            
            // Si es una URL del servidor (string), convertir a thumbnail (Imagen miniatura 200x200)
            if (typeof imgUrl === 'string' && !imgUrl.includes('blob:') && imgUrl.includes('/multimedia/')) {
                const thumbnailUrl = getUrlImagenMiniatura(imgUrl);
                img.src = thumbnailUrl;
                
                // Al hacer clic, mostrar en el viewer con la versión 1250x850
                imgContainer.onclick = () => {
                    // Extraer solo la parte de la URL sin el basePath
                    const urlSinBase = imgUrl.replace(devuelveBasePath(), '');
                    const webUrl = getUrlImagenGrande(urlSinBase);
                    setImagenSeleccionada(webUrl);
                    setVisualizadorDeImagenVisible(true);
                };
            } else {
                // Para URLs temporales (blob) o imagen no disponible
                img.src = imgUrl;
                
                // Si es la imagen no disponible, no hacer nada al clic
                if (!imgUrl.includes('imagen-no-disponible')) {
                    imgContainer.onclick = () => {
                        const urlSinBase = imgUrl.replace(devuelveBasePath(), '');
                        setImagenSeleccionada(urlSinBase);
                        setVisualizadorDeImagenVisible(true);
                    };
                }
            }
            
            img.setAttribute('width', '100%');
            imgContainer.append(img);
            divImagen.current.append(imgContainer);
        }
    };

    return (
        <>
            <div className='grid formgrid text-center' width='100%' style={{ gap: '0px' }}>
                <div
                    ref={divImagen}
                    className='col-2 field'
                    style={{
                        display: 'flex',
                        minWidth: '0px',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    {archivoIcono}
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
