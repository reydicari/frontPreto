import { api } from "boot/axios.js";
const URL_PART = "/api/rol";
import { Notify } from "quasar";

export const listarRoles = async () => {
  try {
    const response = await api.get(URL_PART + "/listar");
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    Notify.create({
      type: "negative",
      message: "Error al listar los usuarios",
      position: "bottom",
    });
    return error.response.data;
  }
};

export const agregarRol = async (rol) => {
  try {
    const response = await api.post(URL_PART + "/agregar", rol);
    Notify.create({
      type: "info",
      message: "Rol creado con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    Notify.create({
      type: "negative",
      message: "Error al crear el rol",
      position: "bottom",
    });
    return error.response.data;
  }
};
export const modificarRol = async (rol) => {
  try {
    const response = await api.put(URL_PART + "/modificar/" + rol.id, rol);
    Notify.create({
      type: "info",
      message: "Rol modificado con éxito",
      position: "bottom",
    });
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    Notify.create({
      type: "negative",
      message: "Error al modificar el rol",
      position: "bottom",
    });
    return error.response.data;
  }
};
