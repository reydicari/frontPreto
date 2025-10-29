import { api } from "boot/axios.js";
const URL_PART = "/api/usuario";
export const listarUsuarios = async () => {
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
