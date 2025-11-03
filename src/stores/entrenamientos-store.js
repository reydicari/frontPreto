import { api } from "boot/axios.js";
const URL_PART = "/api/entrenamiento";
import { Notify } from "quasar";
export const listarEntrenamientos = async () => {
  try {
    const response = await api.get(URL_PART + "/listar");
    return response.data;
  } catch (error) {
    Notify.create({
      type: "negative",
      message: "Error al listar las inscripciones",
      position: "bottom",
    });
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const crearEntrenamiento = async (data) => {
  try {
    const response = await api.post(URL_PART + "/agregar", data);
    Notify.create({
      type: "info",
      message: "Entrenamiento creado con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al crear entrenamiento",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const modificarEntrenamiento = async (data) => {
  try {
    const response = await api.put(URL_PART + "/modificar", data);
    Notify.create({
      type: "info",
      message: "Entrenamiento modificado con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al modificar entrenamiento",
      position: "bottom",
    });
    return error.response.data;
  }
};
