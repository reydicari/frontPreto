import { api } from "boot/axios.js";
import { Notify } from "quasar";

const URL_PART = "/api/asistencia";

export const listar = async (params = {}) => {
  try {
    params.hoy = null;
    const response = await api.get(URL_PART + "/listar", { params });
    return response.data;
  } catch (error) {
    console.error("Error listando asistencias", error?.response || error);
    Notify.create({
      type: "negative",
      message: "Error al listar asistencias",
      position: "bottom",
    });
    throw error;
  }
};

// export const listarAsistenciasPorEntrenamiento = async (entrenamientoId) => {
//   try {
//     const response = await api.get(URL_PART + `/listar/${entrenamientoId}`);
//     return response.data;
//   } catch (error) {
//     console.error(
//       "Error obteniendo asistencias por entrenamiento",
//       error?.response || error,
//     );
//     Notify.create({
//       type: "negative",
//       message: "Error al obtener asistencias",
//       position: "bottom",
//     });
//   }
// };
export const asistenciaEstudiante = async (asistencia) => {
  try {
    const response = await api.post(
      URL_PART + "/agregarAsistenciaEstudiante",
      asistencia,
    );
    Notify.create({
      type: "positive",
      message: "Asistencia registrada correctamente",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.error("Error registrando asistencia", error);
    Notify.create({
      type: "negative",
      message:
        error?.response?.data?.mensaje || "Error al registrar asistencia",
      position: "bottom",
    });
    throw error;
  }
};

export const listarEstudiantesPorEntrenamiento = async (idEntrenamiento) => {
  try {
    const response = await api.get(
      `/api/estudiante/entrenamiento/${idEntrenamiento}`,
    );
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  } catch (error) {
    console.error(
      "Error listando estudiantes del entrenamiento",
      error?.response || error,
    );
    Notify.create({
      type: "negative",
      message: "Error al obtener estudiantes del entrenamiento",
      position: "bottom",
    });
    throw error;
  }
};

export const guardarAsistencias = async (asistencias = []) => {
  try {
    const response = await api.post(URL_PART + "/agregar", { asistencias });
    Notify.create({
      type: "info",
      message: "Asistencias registradas correctamente",
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
