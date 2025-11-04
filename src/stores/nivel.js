import { api } from "boot/axios.js";
const URL_PART = "/api/nivel";
import { Notify } from "quasar";
export const listarNiveles = async () => {
  try {
    const response = await api.get(URL_PART + "/listar");
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al listar los niveles",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const agregarNivel = async (nivel) => {
  try {
    const response = await api.post(URL_PART + "/agregar", nivel);
    Notify.create({
      type: "info",
      message: "Nivel creado con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al listar los niveles",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const modificarNivel = async (nivel) => {
  try {
    const response = await api.put(URL_PART + "/modificar/" + nivel.id, nivel);
    Notify.create({
      type: "info",
      message: "Nivel modificado con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al modificar nivel",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const cambiarEstado = async (nivel) => {
  try {
    const response = await api.put(
      URL_PART + "/cambiarEstado/" + nivel.id,
      nivel,
    );
    Notify.create({
      type: "info",
      message: "Estado del nivel cambiado con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al listar los niveles",
      position: "bottom",
    });
    return error.response.data;
  }
};
