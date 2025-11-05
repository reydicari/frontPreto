import { api } from "boot/axios.js";

const URL_PART = "/api/metodo";
import { Notify } from "quasar";
// Intenta obtener las cualidades desde el backend; si falla, devuelve datos de fallback
export const listarMetodos = async () => {
  try {
    const response = await api.get(URL_PART + "/listar");
    return response.data;
  } catch (error) {
    console.warn(
      "No se pudo cargar cualidades desde API, devolviendo fallback",
      error?.response || error,
    );
    Notify.create({
      type: "negative",
      message: "Error al cargar metodos de pago",
      position: "bottom",
    });
    return error.response.data;
  }
};
