import { api } from "boot/axios.js";
const URL_PART = "/api/progreso";
import { Notify } from "quasar";
export const listarProgreso = async (params) => {
  try {
    const response = await api.get(URL_PART + "/listar", { params });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};

export const agregarProgresos = async (dataform) => {
  try {
    const response = await api.post(URL_PART + "/agregar", dataform);
    Notify.create({
      type: "info",
      message: "progresos agregados con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    Notify.create({
      type: "negative",
      message: "Error al crear la progresos",
      position: "bottom",
    });
    console.log("error en el store", error);
    return error.response.data;
  }
};
