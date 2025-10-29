import { api } from "boot/axios.js";
const URL_PART = "/api/auth";
export const loguear = async (dataform) => {
  try {
    console.log("logueando a: ", dataform);
    const response = await api.post(URL_PART + "/login", dataform, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.log(error);

    console.log("error en el store", error.response.data.error);
    return error.response.data;
  }
};
