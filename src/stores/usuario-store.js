import { api } from "boot/axios.js";
const URL_PART = "/api/usuario";
import { Notify } from "quasar";

export const listarUsuarios = async () => {
  try {
    const response = await api.get(URL_PART + "/listar");
    return response.data;
  } catch (error) {
    console.log("error en el store", error.response);
    return error.response.data;
  }
};

export const registrarUsuario = async (dataform) => {
  try {
    const response = await api.post(URL_PART + "/crearUsuario", dataform);
    console.log("respuesta del servidor", response);

    return response.body;
  } catch (error) {
    console.log("error en el store", error.response.data.error);
    return error.response;
  }
};
export const usuarioDuplicado = async (users) => {
  try {
    console.log("store de verificacion");

    const response = await api.post(URL_PART + "/verificarUsuario", users);
    return response.data.existe;
  } catch (error) {
    console.log("error en el store", error.response.data.error);
    return error.response;
  }
};
export const modificarUsuario = async (usu, dataform) => {
  try {
    const response = await api.put(URL_PART + "/modificar/" + usu, dataform);
    console.log("respuesta del servidor", response);
    //notidficacion de exito
    Notify.create({
      type: "info",
      message: "Usuario modificado con éxito",
      position: "bottom",
    });
    return response.body;
  } catch (error) {
    Notify.create({
      type: "negative",
      message: "Error al modificar el usuario",
      position: "bottom",
    });
    console.log("error en el store", error.response.data.error);
    return error.response;
  }
};
export const cambiarEstadoUsuario = async (usu) => {
  try {
    const response = await api.put(URL_PART + "/cambiarEstado", usu);
    //notidficacion de exito
    Notify.create({
      type: "info",
      message: "Cambio de estado con éxito",
      position: "bottom",
    });
    return response.body;
  } catch (error) {
    Notify.create({
      type: "negative",
      message: "Error al cambiar el estado del usuario",
      position: "bottom",
    });
    console.log("error en el store", error.response.data.error);
    return error.response;
  }
};
export const refrescarUsuario = async (usu) => {
  try {
    const response = await api.get(URL_PART + "/refrescar/" + usu);
    return response.data;
  } catch (error) {
    Notify.create({
      type: "negative",
      message: "Error al refrescar el usuario",
      position: "bottom",
    });
    console.log("error en el store", error.response.data.error);
    return error.response;
  }
};
