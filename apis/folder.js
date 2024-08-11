import instance from "@/utils/request";

export const RenameFolder = async (id, name) => {
  return await instance.patch("/folder", null, {
    params: { folderId: id, Name: name },
  });
};

export const NewFolder = async (name) => {
  return await instance.post("/folder", null, {
    params: { name },
  });
};

export const DeleteFolder = async (id) => {
  return await instance.delete("/folder", {
    params: { folderId: id },
  });
};
