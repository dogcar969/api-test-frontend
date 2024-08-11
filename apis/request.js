import instance from "@/utils/request";

export const createRequest = async (data) => {
  return await instance.post("/request", data);
};

export const updateRequest = async (data) => {
  return await instance.patch("/request", data);
};

export const getRequest = (id) => {
  instance.get("/request", { params: { requestId: id } });
};

export const DeleteRequest = async (id) => {
  await instance.delete("/request", { params: { requestId: id } });
};

export const RenameRequest = async (id, name) => {
  await instance.patch("/requestRename", null, {
    requestId: id,
    name,
  });
};
