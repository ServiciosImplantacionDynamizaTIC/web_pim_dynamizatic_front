import React, { useState, useEffect } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputSwitch } from 'primereact/inputswitch';
import { FileUpload } from 'primereact/fileupload';
import { Image } from 'primereact/image';
import { getCategorias } from "@/app/api-endpoints/categoria";
import { getMarcas } from "@/app/api-endpoints/marca";
import { getEstados } from "@/app/api-endpoints/estado";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from 'react-intl';
import { devuelveBasePath } from "../../utility/Utils";

const EditarDatosProducto = ({ producto, setProducto, estadoGuardando, isEdit, listaTipoArchivos }) => {
    const intl = useIntl();
    
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [estados, setEstados] = useState([]);
    const [cargandoCategorias, setCargandoCategorias] = useState(false);
    const [cargandoMarcas, setCargandoMarcas] = useState(false);
    const [cargandoEstados, setCargandoEstados] = useState(false);
    const [imagenPrincipalPreview, setImagenPrincipalPreview] = useState(null);

    // Cargar categorías
    useEffect(() => {
        const cargarCategorias = async () => {
            setCargandoCategorias(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                             empresaId: getUsuarioSesion()?.empresaId,
                             activoSn: 'S' 
                            }
                    }
                });
                const data = await getCategorias(filtro);
                const categoriasFormateadas = data.map(cat => ({
                    label: cat.nombre,
                    value: cat.id
                }));
                setCategorias(categoriasFormateadas);
            } catch (error) {
                console.error('Error cargando categorías:', error);
            } finally {
                setCargandoCategorias(false);
            }
        };

        cargarCategorias();
    }, []);

    // Cargar marcas
    useEffect(() => {
        const cargarMarcas = async () => {
            setCargandoMarcas(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        and: {
                             empresaId: getUsuarioSesion()?.empresaId,
                             activoSn: 'S' 
                            }
                    }
                });
                const data = await getMarcas(filtro);
                const marcasFormateadas = data.map(marca => ({
                    label: marca.nombre,
                    value: marca.id
                }));
                setMarcas(marcasFormateadas);
            } catch (error) {
                console.error('Error cargando marcas:', error);
            } finally {
                setCargandoMarcas(false);
            }
        };

        cargarMarcas();
    }, []);

    // Cargar estados
    useEffect(() => {
        const cargarEstados = async () => {
            setCargandoEstados(true);
            try {
                const filtro = JSON.stringify({
                    where: {
                        activoSn: 'S'
                    }
                });
                const data = await getEstados(filtro);
                const estadosFormateados = data.map(estado => ({
                    label: estado.nombre,
                    value: estado.id
                }));
                setEstados(estadosFormateados);
            } catch (error) {
                console.error('Error cargando estados:', error);
            } finally {
                setCargandoEstados(false);
            }
        };

        cargarEstados();
    }, []);
    
    //Crear inputs de archivos
    const inputsDinamicos = [];
    for (const tipoArchivo of listaTipoArchivos || []) {
        //Depende del tipo del input se genera multiple o no
        if (tipoArchivo.multiple === 'S') {
            inputsDinamicos.push(
                <div key={tipoArchivo.tipo} className="flex flex-column field gap-2 mt-2 col-12">
                    <label>{tipoArchivo.nombre}</label>
                    <ArchivoMultipleInput
                        registro={producto}
                        setRegistro={setProducto}
                        archivoTipo={tipoArchivo.tipo}
                        campoNombre={(tipoArchivo.nombre).toLowerCase()}
                    />
                </div>
            );
        }
        else {
            inputsDinamicos.push(
                <div key={tipoArchivo.tipo} className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <ArchivoInput
                        registro={producto}
                        setRegistro={setProducto}
                        archivoTipo={tipoArchivo.tipo}
                        archivoHeader={tipoArchivo.nombre}
                        campoNombre={(tipoArchivo.nombre).toLowerCase()}
                    />
                </div>
            );
        }
    }

    const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
        const valor = (e.target && e.target.value) || "";
        let _producto = { ...producto };
        const esTrue = valor === true ? 'S' : 'N';
        _producto[`${nombreInputSwitch}`] = esTrue;
        setProducto(_producto);
    };

    const manejarSeleccionImagenPrincipal = (e) => {
        const file = e.files[0];
        if (file) {
            // Crear URL temporal para mostrar la vista previa
            const imageUrl = URL.createObjectURL(file);
            setImagenPrincipalPreview(imageUrl);
            
            // Guardar el archivo en el producto para procesarlo al guardar
            setProducto({ ...producto, imagenPrincipalFile: file, imagenPrincipal: imageUrl });
        }
    };

    const eliminarImagenPrincipal = () => {
        if (imagenPrincipalPreview && imagenPrincipalPreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagenPrincipalPreview);
        }
        setImagenPrincipalPreview(null);
        setProducto({ ...producto, imagenPrincipal: null, imagenPrincipalFile: null });
    };

    // Efecto para cargar la imagen existente si está editando
    useEffect(() => {
        if (producto.imagenPrincipal && !imagenPrincipalPreview) {
            setImagenPrincipalPreview(devuelveBasePath() + producto.imagenPrincipal);
        }
    }, [producto.imagenPrincipal]);

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Información básica' })} collapsed={false} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="imagenPrincipal">{intl.formatMessage({ id: 'Imagen principal' })}</label>
                        <div className="flex gap-3 align-items-start">
                            <div className="flex-1">
                                {imagenPrincipalPreview && (
                                    <div className="flex flex-column align-items-start gap-2">
                                        <Image
                                            src={imagenPrincipalPreview}
                                            alt="Vista previa imagen principal"
                                            width="160"
                                            height="160"
                                            className="border-round shadow-2"
                                            style={{ objectFit: 'cover' }}
                                            preview
                                        />
                                        <button
                                            type="button"
                                            className="p-button p-button-sm p-button-danger p-button-text"
                                            onClick={eliminarImagenPrincipal}
                                            disabled={estadoGuardando}
                                            title={intl.formatMessage({ id: 'Eliminar imagen' })}
                                        >
                                            <i className="pi pi-trash"></i>&nbsp;{intl.formatMessage({ id: 'Eliminar imagen' })}
                                        </button>
                                    </div>
                                )}
                                <FileUpload
                                    id="imagenPrincipal"
                                    mode="basic"
                                    accept="image/*"
                                    maxFileSize={2000000}
                                    onSelect={manejarSeleccionImagenPrincipal}
                                    chooseLabel={intl.formatMessage({ id: 'Seleccionar imagen' })}
                                    disabled={estadoGuardando}
                                    className="w-full"
                                />
                                <small className="text-muted">{intl.formatMessage({ id: 'Formatos soportados: JPG, PNG, GIF. Máximo 2MB' })}</small>
                            </div>                            
                        </div>
                    </div>
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-8">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={producto.nombre || ''}
                            placeholder={intl.formatMessage({ id: 'Nombre del producto' })}
                            onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
                            className={`${(estadoGuardando && !producto.nombre) ? "p-invalid" : ""}`}
                            maxLength={200}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="sku"><b>{intl.formatMessage({ id: 'SKU' })}*</b></label>
                        <InputText 
                            id="sku"
                            value={producto.sku || ''}
                            placeholder={intl.formatMessage({ id: 'Código SKU del producto' })}
                            onChange={(e) => setProducto({ ...producto, sku: e.target.value })}
                            className={`${(estadoGuardando && !producto.sku) ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="ean">{intl.formatMessage({ id: 'EAN' })}</label>
                        <InputText 
                            id="ean"
                            value={producto.ean || ''}
                            placeholder={intl.formatMessage({ id: 'Código EAN del producto' })}
                            onChange={(e) => setProducto({ ...producto, ean: e.target.value })}
                            maxLength={50}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="categoria"><b>{intl.formatMessage({ id: 'Categoría' })}*</b></label>
                        <Dropdown 
                            id="categoria"
                            value={producto.categoriaId || null}
                            options={categorias}
                            onChange={(e) => setProducto({ ...producto, categoriaId: e.value })}
                            placeholder={intl.formatMessage({ id: 'Selecciona una categoría' })}
                            className={`${(estadoGuardando && !producto.categoriaId) ? "p-invalid" : ""}`}
                            disabled={estadoGuardando || cargandoCategorias}
                            loading={cargandoCategorias}
                            showClear
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="marca">{intl.formatMessage({ id: 'Marca' })}</label>
                        <Dropdown 
                            id="marca"
                            value={producto.marcaId || null}
                            options={marcas}
                            onChange={(e) => setProducto({ ...producto, marcaId: e.value })}
                            placeholder={intl.formatMessage({ id: 'Selecciona una marca' })}
                            disabled={estadoGuardando || cargandoMarcas}
                            loading={cargandoMarcas}
                            showClear
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="estado"><b>{intl.formatMessage({ id: 'Estado' })}*</b></label>
                        <Dropdown 
                            id="estado"
                            value={producto.estadoId || null}
                            options={estados}
                            onChange={(e) => setProducto({ ...producto, estadoId: e.value })}
                            placeholder={intl.formatMessage({ id: 'Selecciona un estado' })}
                            className={`${(estadoGuardando && !producto.estadoId) ? "p-invalid" : ""}`}
                            disabled={estadoGuardando || cargandoEstados}
                            loading={cargandoEstados}
                            showClear
                        />
                    </div>

                    
                </div>

                <div className="formgrid grid">

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={producto.activoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                        <label htmlFor="finalizado" className="font-bold block">{intl.formatMessage({ id: 'Finalizado' })}</label>
                        <InputSwitch
                            id="finalizado"
                            checked={producto.finalizadoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "finalizadoSn")}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
            <br/>
            <Fieldset legend={intl.formatMessage({ id: 'Descripción y contenido' })} collapsed={true} toggleable>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcionCorta">{intl.formatMessage({ id: 'Descripción corta' })}</label>
                        <InputTextarea 
                            id="descripcionCorta"
                            value={producto.descripcionCorta || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción breve del producto' })}
                            onChange={(e) => setProducto({ ...producto, descripcionCorta: e.target.value })}
                            rows={3}
                            maxLength={500}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcionLarga">{intl.formatMessage({ id: 'Descripción larga' })}</label>
                        <InputTextarea 
                            id="descripcionLarga"
                            value={producto.descripcionLarga || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción detallada del producto' })}
                            onChange={(e) => setProducto({ ...producto, descripcionLarga: e.target.value })}
                            rows={5}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="puntosClave">{intl.formatMessage({ id: 'Puntos clave' })}</label>
                        <InputTextarea 
                            id="puntosClave"
                            value={producto.puntosClave || ''}
                            placeholder={intl.formatMessage({ id: 'Características destacadas del producto' })}
                            onChange={(e) => setProducto({ ...producto, puntosClave: e.target.value })}
                            rows={4}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>            

            {listaTipoArchivos && listaTipoArchivos.length > 0 && (
                <Fieldset legend={intl.formatMessage({ id: 'Archivos multimedia' })} collapsed={true} toggleable>
                    <div className="formgrid grid">
                        {
                            ...inputsDinamicos //Muestra las inputs generados
                        }
                    </div>
                </Fieldset>
            )}
        </>
    );
};

export default EditarDatosProducto;