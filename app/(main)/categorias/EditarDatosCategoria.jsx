import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import ArchivoMultipleInput from "../../components/shared/archivo_multiple_input";
import ArchivoInput from "../../components/shared/archivo_input";
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { useIntl } from 'react-intl';

const EditarDatosCategoria = ({ categoria, setCategoria, estadoGuardando, isEdit, listaTipoArchivos, listaCategoriasPadre = [] }) => {
    const intl = useIntl();
    
    //Crear inputs de archivos
    const inputsDinamicos = [];
    for (const tipoArchivo of listaTipoArchivos) {
        //Depende del tipo del input se genera multiple o no
        if (tipoArchivo.multiple === 'S') {
            inputsDinamicos.push(
                <div className="flex flex-column field gap-2 mt-2 col-12">
                    <label>{tipoArchivo.nombre}</label>
                    <ArchivoMultipleInput
                        registro={categoria}
                        setRegistro={setCategoria}
                        archivoTipo={tipoArchivo.tipo}
                        campoNombre={(tipoArchivo.nombre).toLowerCase()}
                    />
                </div>
            );
        }
        else {
            inputsDinamicos.push(
                <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-4">
                    <ArchivoInput
                        registro={categoria}
                        setRegistro={setCategoria}
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
        let _categoria = { ...categoria };
        const esTrue = valor === true ? 'S' : 'N';
        _categoria[`${nombreInputSwitch}`] = esTrue;
        setCategoria(_categoria);
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos de la categoría' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={categoria.nombre}
                            placeholder={intl.formatMessage({ id: 'Nombre de la categoría' })}
                            onChange={(e) => setCategoria({ ...categoria, nombre: e.target.value })}
                            className={`${(estadoGuardando && categoria.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={100}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="categoriaPadreId">{intl.formatMessage({ id: 'Categoría Padre' })}</label>
                        <Dropdown 
                            id="categoriaPadreId"
                            value={categoria.categoriaPadreId}
                            options={[
                                { label: intl.formatMessage({ id: 'Sin categoría padre' }), value: null },
                                ...listaCategoriasPadre.map(cat => ({
                                    label: cat.nombre,
                                    value: cat.id
                                }))
                            ]}
                            onChange={(e) => setCategoria({ ...categoria, categoriaPadreId: e.value })}
                            placeholder={intl.formatMessage({ id: 'Selecciona una categoría padre' })}
                            disabled={estadoGuardando}
                            showClear
                            filter
                            filterBy="label"
                            emptyMessage={intl.formatMessage({ id: 'No hay categorías disponibles' })}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="orden">{intl.formatMessage({ id: 'Orden' })}</label>
                        <InputNumber 
                            id="orden"
                            value={categoria.orden || 0}
                            placeholder={intl.formatMessage({ id: 'Orden de visualización' })}
                            onValueChange={(e) => setCategoria({ ...categoria, orden: e.value || 0 })}
                            disabled={estadoGuardando}
                            min={0}
                            inputStyle={{ textAlign: 'right' }}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={categoria.activoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={estadoGuardando}
                        />
                    </div>
                    
                    {
                        ...inputsDinamicos //Muestra las inputs generados
                    }
                    
                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcion">{intl.formatMessage({ id: 'Descripción' })}</label>
                        <InputTextarea 
                            id="descripcion"
                            value={categoria.descripcion || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción de la categoría' })}
                            onChange={(e) => setCategoria({ ...categoria, descripcion: e.target.value })}
                            rows={3}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosCategoria;