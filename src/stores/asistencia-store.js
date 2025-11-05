import { api } from "boot/axios.js";
import { Notify } from "quasar";

const URL_PART = "/api/asistencia";

export const listarAsistenciasPorEntrenamiento = async (entrenamientoId) => {
  try {
    const response = await api.get(URL_PART + `/listar/${entrenamientoId}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error obteniendo asistencias por entrenamiento",
      error?.response || error,
    );
    Notify.create({
      type: "negative",
      message: "Error al obtener asistencias",
      position: "bottom",
    });
  }
};
export const guardarAsistencias = async (asistencias = []) => {
  try {
    const response = await api.post(URL_PART + "/agregar", { asistencias });
    Notify.create({
      type: "info",
      message: "Asistencias guardadas con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.error("Error guardando asistencias", error?.response || error);
    Notify.create({
      type: "negative",
      message: "Error al guardar asistencias",
    });
    throw error;
  }
};
