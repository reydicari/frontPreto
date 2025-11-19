import { api } from "boot/axios.js";
const URL_PART = "/api/partido";
import { Notify } from "quasar";
export const listarPartidos = async (id_torneo) => {
  try {
    const response = await api.get(URL_PART + "/listar/" + id_torneo);
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al listar los partidos",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const actualizarPartido = async (partido) => {
  try {
    const response = await api.put(URL_PART + "/actualizar", partido);
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al actualizar el partido",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const agregarEncargadoTorneo = async (encargado) => {
  try {
    const response = await api.post(
      URL_PART + "/agregarEncargadoTorneo",
      encargado,
    );
    Notify.create({
      type: "info",
      message: "Encargado agregado con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al agregar encargado al torneo",
      position: "bottom",
    });
    return error.response.data;
  }
};
