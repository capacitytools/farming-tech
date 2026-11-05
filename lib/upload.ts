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

export function withRatio(url: string, ratio: "2:3" | "4:5"): string {
  if (!url || !url.includes("/upload/")) return url;
  const ar = ratio === "4:5" ? "ar_4:5" : "ar_2:3";
  return url.replace("/upload/", `/upload/c_fill,${ar},w_900,q_auto,f_auto/`);
}