import React from "react";
import { Fieldset } from 'primereact/fieldset';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { useIntl } from 'react-intl';

const EditarDatosTipoUsoMultimedia = ({ tipoUsoMultimedia, setTipoUsoMultimedia, estadoGuardando }) => {
    const intl = useIntl();

    const manejarCambioInputSwitch = (e, nombreInputSwitch) => {
        const valor = (e.target && e.target.value) || "";
        let _tipoUsoMultimedia = { ...tipoUsoMultimedia };
        const esTrue = valor === true ? 'S' : 'N';
        _tipoUsoMultimedia[`${nombreInputSwitch}`] = esTrue;
        setTipoUsoMultimedia(_tipoUsoMultimedia);
    };

    return (
        <>
            <Fieldset legend={intl.formatMessage({ id: 'Datos del tipo de uso multimedia' })}>
                <div className="formgrid grid">
                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="nombre"><b>{intl.formatMessage({ id: 'Nombre' })}*</b></label>
                        <InputText 
                            id="nombre"
                            value={tipoUsoMultimedia.nombre || ''}
                            placeholder={intl.formatMessage({ id: 'Nombre del tipo de uso multimedia' })}
                            onChange={(e) => setTipoUsoMultimedia({ ...tipoUsoMultimedia, nombre: e.target.value })}
                            className={`${(estadoGuardando && tipoUsoMultimedia.nombre === "") ? "p-invalid" : ""}`}
                            maxLength={50}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12 lg:col-6">
                        <label htmlFor="activo" className="font-bold block">{intl.formatMessage({ id: 'Activo' })}</label>
                        <InputSwitch
                            id="activo"
                            checked={tipoUsoMultimedia.activoSn === 'S'}
                            onChange={(e) => manejarCambioInputSwitch(e, "activoSn")}
                            disabled={estadoGuardando}
                        />
                    </div>

                    <div className="flex flex-column field gap-2 mt-2 col-12">
                        <label htmlFor="descripcion">{intl.formatMessage({ id: 'Descripción' })}</label>
                        <InputTextarea 
                            id="descripcion"
                            value={tipoUsoMultimedia.descripcion || ''}
                            placeholder={intl.formatMessage({ id: 'Descripción del tipo de uso multimedia' })}
                            onChange={(e) => setTipoUsoMultimedia({ ...tipoUsoMultimedia, descripcion: e.target.value })}
                            maxLength={500}
                            rows={4}
                            disabled={estadoGuardando}
                        />
                    </div>
                </div>
            </Fieldset>
        </>
    );
};

export default EditarDatosTipoUsoMultimedia;