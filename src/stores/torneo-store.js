import { api } from "src/boot/axios";
import { Notify } from "quasar";
const URL_PART = "/api/torneo";
// Store de torneos: funciones para CRUD básico y generación de fixtures simples en cliente.
export async function listarTorneos() {
  try {
    const res = await api.get(`${URL_PART}/listar`);
    return res.data;
  } catch (error) {
    console.log(error);
    Notify.create({
      type: "negative",
      message: "Error al listar los torneos",
      position: "bottom",
    });
  }
}

export async function obtenerTorneo(id) {
  try {
    const res = await api.get(`/api/torneo/unico/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    Notify.create({
      type: "negative",
      message: "Error al obtener el torneo",
      position: "bottom",
    });
  }
}

export async function crearTorneo(torneo) {
  try {
    const res = await api.post("/api/torneo/agregar", torneo);
    Notify.create({
      type: "positive",
      message: "Torneo creado con éxito",
      position: "bottom",
    });
    return res.data;
  } catch (error) {
    console.log(error);
    Notify.create({
      type: "negative",
      message: "Error al crear el torneo",
      position: "bottom",
    });
  }
}
export async function modificarTorneo(torneo) {
  try {
    const res = await api.put(`/api/torneo/modificar/${torneo.id}`, torneo);
    Notify.create({
      type: "positive",
      message: "Torneo modificado con éxito",
      position: "bottom",
    });
    return res.data;
  } catch (error) {
    console.log(error);
    Notify.create({
      type: "negative",
      message: "Error al modificar el torneo",
      position: "bottom",
    });
  }
}

export const listarTiposTorneo = async () => {
  try {
    const response = await api.get(`${URL_PART}/listar-tipos`);
    return response.data;
  } catch (error) {
    console.warn(
      "No se pudo cargar tipos de torneo desde API, devolviendo fallback",
      error?.response || error,
    );
    Notify.create({
      type: "negative",
      message: "Error al cargar tipos de torneo",
      position: "bottom",
    });
    // Fallback para desarrollo / pruebas
    return [];
  }
};
export const listarFases = async (id_torneo) => {
  try {
    const response = await api.get(`${URL_PART}/listar-fases/${id_torneo}`);
    return response.data;
  } catch (error) {
    console.warn(
      "No se pudo cargar fases desde API, devolviendo fallback",
      error?.response || error,
    );
    Notify.create({
      type: "negative",
      message: "Error al cargar fases",
      position: "bottom",
    });
    // Fallback para desarrollo / pruebas
    return [];
  }
};
export const listarEquipos = async () => {
  try {
    const response = await api.get(`${URL_PART}/listar-equipos`);
    return response.data;
  } catch (error) {
    console.warn(
      "No se pudo cargar tipos de torneo desde API, devolviendo fallback",
      error?.response || error,
    );
    Notify.create({
      type: "negative",
      message: "Error al cargar equipos",
      position: "bottom",
    });
    // Fallback para desarrollo / pruebas
    return [];
  }
};
