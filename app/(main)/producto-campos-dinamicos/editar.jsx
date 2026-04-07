"use client";
import React, { useEffect, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { getProductoCampoDinamicos, postProductoCampoDinamico, patchProductoCampoDinamico } from "@/app/api-endpoints/producto_campo_dinamico";
import EditarDatosProductoCampoDinamico from "./EditarDatosProductoCampoDinamico";
import { getUsuarioSesion } from "@/app/utility/Utils";
import { useIntl } from "react-intl";

const EditarProductoCampoDinamico = ({ idEditar: idEditarCampoDinamico, setIdEditar: setIdEditarCampoDinamico, rowData, emptyRegistro, setRegistroResult, editable, idProducto }) => {
    const intl = useIntl();
    const toast = useRef(null);

    const [productoCampoDinamico, setProductoCampoDinamico] = useState(emptyRegistro || {
        productoId: null,
        campoDinamicoId: null,
        valor: "",
        tipoCampo: "texto",
        opciones: null,
    });
    const [estadoGuardando, setEstadoGuardando] = useState(false);
    const [estadoGuardandoBoton, setEstadoGuardandoBoton] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (idEditarCampoDinamico !== 0) {
                const registro = rowData.find((element) => element.id === idEditarCampoDinamico);
                setProductoCampoDinamico(registro);
                setIsEdit(true);
            }
        };
        fetchData();
    }, [idEditarCampoDinamico, rowData]);

    const convertirValorAFormatoGuardado = (valor, tipoCampo) => {
        const tipoNormalizado = `${tipoCampo || "texto"}`.toLowerCase();

        if (tipoNormalizado === "booleano" || tipoNormalizado === "switch") {
            return valor ? "S" : "N";
        }

        if (tipoNormalizado === "numero") {
            if (valor === undefined || valor === null || valor === "") {
                return null;
            }
            return `${valor}`;
        }

        if (tipoNormalizado === "fecha") {
            if (!valor) {
                return null;
            }
            if (valor instanceof Date) {
                return valor.toISOString().split("T")[0];
            }
            return `${valor}`;
        }

        if (tipoNormalizado === "multiselect") {
            if (!Array.isArray(valor) || valor.length === 0) {
                return null;
            }
            return valor.join(", ");
        }

        if (Array.isArray(valor)) {
            return valor.length ? valor.join(", ") : null;
        }

        if (valor === undefined || valor === null) {
            return null;
        }

        const texto = `${valor}`.trim();
        return texto === "" ? null : texto;
    };

    const validaciones = async () => {
        const validaProducto = productoCampoDinamico.productoId === undefined || productoCampoDinamico.productoId === null || productoCampoDinamico.productoId === "";
        const validaCampoDinamico = productoCampoDinamico.campoDinamicoId === undefined || productoCampoDinamico.campoDinamicoId === null || productoCampoDinamico.campoDinamicoId === "";
        const valorNormalizado = convertirValorAFormatoGuardado(productoCampoDinamico.valor, productoCampoDinamico.tipoCampo);
        const validaValor = valorNormalizado === undefined || valorNormalizado === null || `${valorNormalizado}`.trim() === "";

        if (validaProducto) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Debe seleccionar un producto" }),
                life: 3000,
            });
        }

        if (validaCampoDinamico) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Debe seleccionar un campo dinámico" }),
                life: 3000,
            });
        }

        if (validaValor) {
            toast.current?.show({
                severity: "error",
                summary: "ERROR",
                detail: intl.formatMessage({ id: "Debe especificar un valor para el campo dinámico" }),
                life: 3000,
            });
        }

        return (!validaProducto && !validaCampoDinamico && !validaValor);
    };

    const guardarProductoCampoDinamico = async () => {
        setEstadoGuardando(true);
        setEstadoGuardandoBoton(true);

        if (await validaciones()) {
            try {
                const usuarioSesion = getUsuarioSesion();
                const valorNormalizado = convertirValorAFormatoGuardado(productoCampoDinamico.valor, productoCampoDinamico.tipoCampo);

                const productoCampoDinamicoData = {
                    productoId: productoCampoDinamico.productoId,
                    campoDinamicoId: productoCampoDinamico.campoDinamicoId,
                    valor: valorNormalizado,
                    ...(isEdit
                        ? { usuarioModificacion: usuarioSesion.id }
                        : { usuarioCreacion: usuarioSesion.id })
                };

                let resultado;
                if (isEdit) {
                    resultado = await patchProductoCampoDinamico(idEditarCampoDinamico, productoCampoDinamicoData);
                    setRegistroResult("editado");
                } else {
                    resultado = await postProductoCampoDinamico(productoCampoDinamicoData);
                    setRegistroResult("insertado");
                }

                toast.current.show({
                    severity: "success",
                    summary: intl.formatMessage({ id: "Éxito" }),
                    detail: intl.formatMessage({
                        id: isEdit ? "Registro actualizado correctamente" : "Registro creado correctamente"
                    }),
                    life: 3000
                });

                setIdEditarCampoDinamico(null);
                setIsEdit(false);
            } catch (error) {
                console.error("Error al guardar:", error);
                toast.current.show({
                    severity: "error",
                    summary: intl.formatMessage({ id: "Error" }),
                    detail: intl.formatMessage({ id: "Error al guardar el registro" }),
                    life: 3000
                });
            }
        }

        setEstadoGuardando(false);
        setEstadoGuardandoBoton(false);
    };

    const cancelarEdicion = () => {
        setIdEditarCampoDinamico(null);
        setIsEdit(false);
        const registroReset = emptyRegistro || {
            productoId: idProducto || null,
            campoDinamicoId: null,
            valor: "",
            tipoCampo: "texto",
            opciones: null,
        };
        setProductoCampoDinamico(registroReset);
    };

    return (
        <div>
            <div className="grid ProductoCampoDinamico">
                <div className="col-12">
                    <div className="card">
                        <Toast ref={toast} />

                        <EditarDatosProductoCampoDinamico
                            productoCampoDinamico={productoCampoDinamico}
                            setProductoCampoDinamico={setProductoCampoDinamico}
                            estadoGuardando={estadoGuardando}
                            editable={editable}
                            idProducto={idProducto}
                            rowData={rowData}
                        />

                        <div className="flex justify-content-end mt-2">
                            {editable && (
                                <Button
                                    label={intl.formatMessage({ id: "Guardar" })}
                                    className="mr-2"
                                    onClick={guardarProductoCampoDinamico}
                                    loading={estadoGuardandoBoton}
                                    disabled={estadoGuardandoBoton || !editable}
                                />
                            )}
                            <Button label={intl.formatMessage({ id: "Cancelar" })} onClick={cancelarEdicion} className="p-button-secondary" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditarProductoCampoDinamico;
