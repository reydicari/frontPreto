import { api } from "boot/axios.js";
const URL_PART = "/api/inscripcion";
import { Notify } from "quasar";

export const listar = async () => {
  try {
    const response = await api.get(URL_PART + "/listar");
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
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
export const agregarIscripcionNuevaPersona = async (dataform) => {
  try {
    console.log("guardando inscripccion en metodo  dentro del store 3");

    const response = await api.post(URL_PART + "/agregar", dataform, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    Notify.create({
      type: "info",
      message: "Inscripcion creada con éxito",
      position: "bottom",
    });
    return response;
  } catch (error) {
    console.log("error en el store", error.response.data.error);
    Notify.create({
      type: "negative",
      message: "Error al crear la inscripción",
      position: "bottom",
    });
    return error.response;
  }
};
export const agregarIscripcionPersona = async (dataform) => {
  try {
    const response = await api.post(URL_PART + "/agregarNormal", dataform);
    Notify.create({
      type: "info",
      message: "inscripcion creada con éxito",
      position: "bottom",
    });
    return response;
  } catch (error) {
    console.log("error en el store", error.response.data.error);
    Notify.create({
      type: "negative",
      message: "Error al crear la inscripción",
      position: "bottom",
    });
    return error.response;
  }
};
