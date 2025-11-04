import { api } from "boot/axios.js";
const URL_PART = "/api/ubicacion";
import { Notify } from "quasar";

export const listarUbicaciones = async (params) => {
  try {
    const response = await api.get(URL_PART + "/listar", { params });

    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al listar las ubicaciones",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const agregarUbicacion = async (ubicacionData) => {
  try {
    const response = await api.post(URL_PART + "/agregar", ubicacionData);
    Notify.create({
      type: "info",
      message: "ubicacion creada con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al crear la ubicacion",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const modificarUbicacion = async (ubicacionData) => {
  try {
    const response = await api.put(
      URL_PART + "/modificar/" + ubicacionData.id,
      ubicacionData,
    );
    Notify.create({
      type: "info",
      message: "ubicacion modificada con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al modificar la ubicacion",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const cambiarEstadoUbicacion = async (ubicacionData) => {
  try {
    const response = await api.put(
      URL_PART + "/cambiarEstado/" + ubicacionData.id,
      ubicacionData,
    );
    Notify.create({
      type: "info",
      message: "Cambio de estado exitoso",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    Notify.create({
      type: "negative",
      message: "Error al cambiar el estado de la ubicacion",
      position: "bottom",
    });
    return error.response.data;
  }
};
