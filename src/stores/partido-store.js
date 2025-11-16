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
