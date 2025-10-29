import { api } from "boot/axios.js";
const URL_PART = "/api/paquete";
import { Notify } from "quasar";
export const listarPaquetes = async () => {
  try {
    const response = await api.get(URL_PART + "/listar");
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const crearPaquete = async (paquete) => {
  try {
    const response = await api.post(URL_PART + "/agregar", paquete);
    Notify.create({
      type: "info",
      message: "Paquete creado con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    Notify.create({
      type: "negative",
      message: "Error al crear el paquete",
      position: "bottom",
    });
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const actualizarPaquete = async (paquete) => {
  try {
    const response = await api.put(URL_PART + "/actualizar", paquete);
    Notify.create({ type: "info", message: response.data, position: "bottom" });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al actualizar el paquete",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const eliminarPaquete = async (id) => {
  try {
    const response = await api.delete(URL_PART + `/eliminar/${id}`);
    Notify.create({ type: "info", message: response.data, position: "bottom" });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al eliminar el paquete",
      position: "bottom",
    });
    return error.response.data;
  }
};
