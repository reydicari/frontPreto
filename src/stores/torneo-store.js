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
export async function suspenderTorneo(datos) {
  try {
    const res = await api.put(`/api/torneo/suspender/${datos.torneoId}`, datos);
    Notify.create({
      type: "warning",
      message: "Torneo suspendido",
      position: "bottom",
    });
    return res.data;
  } catch (error) {
    console.log(error);
    Notify.create({
      type: "negative",
      message: "Error al suspender el torneo",
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

// Iniciar / comenzar un torneo en backend (envía id)
export const comenzarTorneo = async (id) => {
  try {
    // se espera que el backend responda con un objeto { mensaje: '...' } o similar
    const resp = await api.post(`${URL_PART}/comenzar/${id}`);
    // Notify.create({
    //   type: "positive",
    //   message: "Solicitud de inicio enviada",
    //   position: "bottom",
    // });
    return resp.data;
  } catch (error) {
    console.error("Error al comenzar torneo", error);
    Notify.create({
      type: "negative",
      message: "Error al comenzar el torneo",
      position: "bottom",
    });
    return null;
  }
};
export const confirmarInicioTorneo = async (id, partidos) => {
  try {
    console.log("confirmando inicio de torneo");

    // se espera que el backend responda con un objeto { mensaje: '...' } o similar
    const resp = await api.put(`${URL_PART}/confirmarComienzo/${id}`, {
      partidos,
    });
    Notify.create({
      type: "positive",
      message: "Torneo iniciado con éxito",
      position: "bottom",
    });
    return resp.data;
  } catch (error) {
    console.error("Error al comenzar torneo", error);
    Notify.create({
      type: "negative",
      message: "Error al iniciar el torneo",
      position: "bottom",
    });
    return null;
  }
};
export const finalizarTorneo = async (id_torneo) => {
  try {
    console.log("confirmando fin de torneo");
    Notify.create({
      type: "positive",
      message: "Torneo finalizado con éxito no en backend",
      position: "bottom",
    });
    // se espera que el backend responda con un objeto { mensaje: '...' } o similar
    const resp = await api.put(`${URL_PART}/finalizar`, {
      id_torneo,
    });

    return resp.data;
  } catch (error) {
    console.error("Error al comenzar torneo", error);
    Notify.create({
      type: "negative",
      message: "Error al iniciar el torneo",
      position: "bottom",
    });
    return null;
  }
};
