import { api } from "boot/axios.js";
const URL_PART = "/api/nivel";
export const listarNiveles = async () => {
  try {
    const response = await api.get(URL_PART + "/listar");
    return response.data;
  } catch (error) {
    console.log("error en el store", error);
    return error.response.data;
  }
};
