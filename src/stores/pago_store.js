import { api } from "boot/axios.js";
const URL_PART = "/api/pago";
import { Notify } from "quasar";
export const listarPagos = async (params) => {
  try {
    const response = await api.get(URL_PART + "/listar", { params });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al listar los pagos",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const personaPagos = async (personaId) => {
  try {
    const response = await api.get(URL_PART + `/pagoPersona/${personaId}`);
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const agregarPago = async (formData) => {
  try {
    const response = await api.post(URL_PART + "/agregar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    Notify.create({
      type: "info",
      message: "Pago creado con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al crear el pago",
      position: "bottom",
    });
    return error.response.data;
  }
};

export const anularPago = async (pagoId) => {
  try {
    // Llamada PUT para anular (ajustar endpoint si es necesario en backend)
    const response = await api.put(URL_PART + `/anular/${pagoId}`);
    Notify.create({
      type: "positive",
      message: "Pago anulado",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.error("Error anulando pago", error);
    Notify.create({
      type: "negative",
      message: "Error al anular pago",
      position: "bottom",
    });
    return error.response?.data;
  }
};
