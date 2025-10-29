import { api } from "boot/axios.js";
const URL_PART = "/api/pago";
export const listarPagos = async (params) => {
  try {
    const response = await api.get(URL_PART + "/listar", { params });
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};
export const personaPagos = async (personaId) => {
  try {
    const response = await api.get(URL_PART + `/pagoPersona/${personaId}`);
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};
