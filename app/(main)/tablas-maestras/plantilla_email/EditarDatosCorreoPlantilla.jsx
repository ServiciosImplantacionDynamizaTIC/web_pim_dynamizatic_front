import React, { useState, useEffect, useRef, useCallback } from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { Editor } from 'primereact/editor';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import ArchivoMultipleInput from "../../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../../components/shared/archivo_input";
import { useIntl } from 'react-intl';

const EditarDatosCorreoPlantilla = ({ 
    correoPlantilla, 
    setCorreoPlantilla, 
    contenidoWysiwyg, 
    setContenidoWysiwyg, 
    listaIdiomas, 
    idiomaSeleccionado, 
    setIdiomaSeleccionado, 
    listaTipoArchivos, 
    estadoGuardando
}) => {
    const intl = useIntl();
    // Referencia para el editor
    const editorRef = useRef(null);
    const [dropdownAbierto, setDropdownAbierto] = useState(false);
    
    const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
        const valor = (e.target && e.target.value) || "";
        let objCorreoPlantilla = { ...correoPlantilla };
        const esTrue = valor === true ? 'S' : 'N';
        objCorreoPlantilla[`${nombreInputSwitch}`] = esTrue;
        setCorreoPlantilla(objCorreoPlantilla);
    };
    
    //Para que el dropdown muestre el registro seleccionado aunque no este en la lista
    const options = dropdownAbierto ? listaIdiomas.map(registro => registro.nombre) : [idiomaSeleccionado || '', ...listaIdiomas.map(registro => registro.nombre)];

    //Crear inputs de archivos
    const inputsDinamicos = [];
    for (const tipoArchivo of listaTipoArchivos) {
        //Depende del tipo del input se genera multiple o no
        if (tipoArchivo.multiple === 'S') {
            inputsDinamicos.push(
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label>{tipoArchivo.nombre}</label>
                    <ArchivoMultipleInput
                        registro={correoPlantilla}
                        setRegistro={setCorreoPlantilla}
                        archivoTipo={tipoArchivo.tipo}
                        campoNombre={(tipoArchivo.nombre).toLowerCase()}
                        espacioMaximo={1000000}
                    />
                </div>
            );
        }
        else {
            inputsDinamicos.push(
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <ArchivoInput
                        registro={correoPlantilla}
                        setRegistro={setCorreoPlantilla}
                        archivoTipo={tipoArchivo.tipo}
                        archivoHeader={tipoArchivo.nombre}
                        campoNombre={(tipoArchivo.nombre).toLowerCase()}
                    />
                </div>
            );
        }
    }
 
    // Efecto para establecer el valor inicial del Editor solo una vez
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (editorRef.current && editorRef.current.getQuill) {
                const quillInstance = editorRef.current.getQuill();
                if (quillInstance) {
                    const currentContent = quillInstance.root.innerHTML;
 
                    // Verificamos si el contenido es diferente antes de pegar el HTML
                    if (currentContent !== contenidoWysiwyg) {
                        quillInstance.clipboard.dangerouslyPasteHTML(contenidoWysiwyg);
                    }
                }
            }
        }, 500); // 500ms para asegurarnos de que Quill esté disponible
 
        return () => clearTimeout(timeoutId);
    }, [contenidoWysiwyg]);
 
    // Función para manejar los cambios de texto del Wysiwyg
    const manejarCambioWysiwyg = useCallback((e) => {
        const nuevoContenido = e.htmlValue;
        // Evitar actualizaciones si el contenido no ha cambiado
        if (nuevoContenido !== contenidoWysiwyg) {
            setContenidoWysiwyg(nuevoContenido);
        }
    }, [contenidoWysiwyg, setContenidoWysiwyg]);
 
    return (
        <Fieldset>
            <div className="formgrid grid">
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <label htmlFor="nombre"> <b>{intl.formatMessage({ id: 'Nombre de la plantilla' })}*</b></label>
                    <InputText
                        disabled={correoPlantilla.id}
                        value={correoPlantilla.nombrePlantilla || ""}
                        placeholder={intl.formatMessage({ id: 'Nombre de la plantilla' })}
                        onChange={(e) => setCorreoPlantilla({ ...correoPlantilla, nombrePlantilla: e.target.value })}
                        className={`${(estadoGuardando && correoPlantilla.nombrePlantilla === "") ? "p-invalid" : ""}`}
                        rows={5}
                        cols={30}
                        maxLength={50}
                    />
                </div>
 
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <label htmlFor="idioma"> <b>{intl.formatMessage({ id: 'Idioma' })}*</b></label>
                    <Dropdown
                        value={idiomaSeleccionado || ""}
                        onChange={(e) => setIdiomaSeleccionado(e.value)}
                        options={options}
                        onClick={() => setDropdownAbierto(true)}
                        className={`p-column-filter ${(estadoGuardando && (idiomaSeleccionado == null || idiomaSeleccionado === "")) ? "p-invalid" : ""}`}
                        showClear
                        placeholder={intl.formatMessage({ id: 'Selecciona un idioma' })}
                    />
                </div>
 
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <label htmlFor="titulo">{intl.formatMessage({ id: 'Titulo del mail' })}</label>
                    <InputText
                        value={correoPlantilla.titulo || ""}
                        placeholder={intl.formatMessage({ id: 'Titulo del mail' })}
                        onChange={(e) => setCorreoPlantilla({ ...correoPlantilla, titulo: e.target.value })}
                        rows={5}
                        cols={30}
                        maxLength={100}
                    />
                </div>

                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <label htmlFor="activoSN" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                    <InputSwitch
                        checked={correoPlantilla.activoSn === 'S'}
                        onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                    />
                </div>
 
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label htmlFor="cuerpo">{intl.formatMessage({ id: 'Cuerpo del mensaje' })}</label>
                    <Editor
                        ref={editorRef}
                        onTextChange={manejarCambioWysiwyg}
                        style={{ height: '320px' }}
                    />
                    <label>
                        {`Palabras: ${(((contenidoWysiwyg || '').replace(/<\/?[^>]+(>|$)/g, '')).replace(/\s/g, '')).length}`}
                    </label>
                </div>
                {
                    ...inputsDinamicos //Muestra los inputs generados
                }
            </div>
        </Fieldset>
    );
};
 
export default EditarDatosCorreoPlantilla;