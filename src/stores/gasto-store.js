import { api } from "boot/axios.js";
const URL_PART = "/api/gasto";
import { Notify } from "quasar";

export const listarGastos = async (params) => {
  try {
    const response = await api.get(URL_PART + "/listar", { params });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al listar los gastos",
      position: "bottom",
    });
    return error.response.data;
  }
};

export const agregarGasto = async (formData) => {
  try {
    const response = await api.post(URL_PART + "/agregar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    Notify.create({
      type: "positive",
      message: "Gasto registrado con éxito",
      position: "bottom",
    });
    return response;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al registrar el gasto",
      position: "bottom",
    });
    return error.response.data;
  }
};

export const anularGasto = async (gastoId) => {
  try {
    const response = await api.put(URL_PART + `/anular/${gastoId}`);
    Notify.create({
      type: "positive",
      message: "Gasto anulado correctamente",
      position: "bottom",
    });
    return response;
  } catch (error) {
    console.error("Error anulando gasto", error);
    Notify.create({
      type: "negative",
      message: "Error al anular el gasto",
      position: "bottom",
    });
    return error.response?.data;
  }
};
