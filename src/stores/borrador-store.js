import { api } from "boot/axios.js";

const URL_PART = "/api/borrador";
import { Notify } from "quasar";
// Intenta obtener los borradores desde el backend; si falla, devuelve datos de fallback
export const listarBorradores = async (id_torneo) => {
  try {
    const response = await api.get(URL_PART + "/listar/" + id_torneo);
    return response.data;
  } catch (error) {
    console.warn(
      "No se pudo cargar cualidades desde API, devolviendo fallback",
      error?.response || error,
    );
    Notify.create({
      type: "negative",
      message: "Error al cargar borradores",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const listarEquipos = async () => {
  try {
    const response = await api.get("/api/equipo/listar");
    return response.data;
  } catch (error) {
    console.warn(
      "No se pudo cargar cualidades desde API, devolviendo fallback",
      error?.response || error,
    );
    Notify.create({
      type: "negative",
      message: "Error al cargar todos los equipos",
      position: "bottom",
    });
    return [];
  }
};
export async function actualizarBorradores(equipos) {
  try {
    const res = await api.post("/api/borrador/actualizar", equipos);
    Notify.create({
      type: "positive",
      message: "equipos actualizados con éxito",
      position: "bottom",
    });
    return res.data;
  } catch (error) {
    console.log(error);
    Notify.create({
      type: "negative",
      message: "Error al actualizar los equipos",
      position: "bottom",
    });
  }
}
