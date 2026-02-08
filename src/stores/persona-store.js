import { api } from "boot/axios.js";
const URL_PART = "/api/persona";
import { Notify } from "quasar";
export const listar = async (params = {}) => {
  try {
    const response = await api.get(URL_PART + `/personasTipo`, {
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error("Error en el store:", error.response || error);
    throw error; // Lanzamos el error para manejarlo en el componente
  }
};
export const listarTodosEstudiantes = async () => {
  try {
    const response = await api.get(URL_PART + "/todosEstudiantes");
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    Notify.create({
      type: "negative",
      message: "Error al listar los estudiantes",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const listarRoles = async () => {
  try {
    const response = await api.get(URL_PART + "/listarRoles");
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    return error.response.data;
  }
};
export const agregar = async (formData) => {
  try {
    const response = await api.post(URL_PART + "/agregar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (error) {
    console.log("error en el store", error.response.data.error);
    return error.response;
  }
};
export const categoriasUnicas = async () => {
  try {
    const response = await api.get(URL_PART + "/categoriasUnicas");
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    return error.response.data;
  }
};
export const modificar = async (formData) => {
  try {
    const response = await api.put(URL_PART + "/modificar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (error) {
    console.log("error en el store", error.response.data.error);
    return error.response;
  }
};
export const eliminarPersona = async (persona) => {
  try {
    const response = await api.delete(URL_PART + "/eliminar/" + persona.id);
    return response;
  } catch (error) {
    console.log("error en el store", error.response.data.error);
    return error.response;
  }
};
export const cambiarEstado = async (persona) => {
  try {
    const response = await api.put(URL_PART + "/cambiarEstado/" + persona.id);
    return response;
  } catch (error) {
    console.log("error en el store", error.response.data.error);
    return error.response;
  }
};
export const buscarCiRepetido = async (ci) => {
  try {
    const response = await api.get(URL_PART + "/existePersona/" + ci);
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    return error.response.data;
  }
};
export const todasPersonas = async (params = {}) => {
  try {
    const response = await api.get(URL_PART + "/todasPersonas", { params });
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    Notify.create({
      type: "negative",
      message: "Error al listar las personas",
      position: "bottom",
    });
    return error.response.data;
  }
};

export const datosEstudiantes = async () => {
  try {
    const response = await api.get(URL_PART + "/datosEstudiantes");
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    Notify.create({
      type: "negative",
      message: "Error al obtener datos de estudiantes",
      position: "bottom",
    });
    return (
      error.response?.data || {
        total: 0,
        activos: 0,
        inactivos: 0,
        cumpleanosEsteMes: 0,
      }
    );
  }
};

export const datosEntrenadoresAdministradores = async () => {
  try {
    const response = await api.get(
      URL_PART + "/datosEntrenadoresAdministradores",
    );
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    Notify.create({
      type: "negative",
      message: "Error al obtener datos de entrenadores",
      position: "bottom",
    });
    return (
      error.response?.data || {
        totalEntrenadores: 0,
        totalAdministradores: 0,
        cumpleanosEsteMes: 0,
      }
    );
  }
};
