const CLOUD_NAME = "jnvtguiz";
const UPLOAD_PRESET = "farmingtech";

export async function uploadToCloudinary(file: File, folder = "farmtech"): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  form.append("folder", folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
}