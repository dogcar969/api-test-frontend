import instance from "@/utils/request";

export const registerUser = async (id, name, password) => {
  return await instance.post("/user", {
    ID: id,
    Name: name,
    Password: password,
  });
};

export const loginUser = async (id, password) => {
  return await instance.post("/login", { ID: id, Password: password });
};
export const getUser = async () => {
  return await instance.get("/user");
};

export const renameUser = async (name) => {
  return await instance.patch("/user", null, {
    params: { Name: name },
  });
};
