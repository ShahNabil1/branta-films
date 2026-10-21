import { AwsClient } from "aws4fetch";

function r2Config() {
  const accountId = process.env["R2_ACCOUNT_ID"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];
  const bucket = process.env["R2_BUCKET"] ?? "branta-films";
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Video storage is not configured.");
  }
  return { accountId, bucket, client: new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" }) };
}

function objectUrl(accountId: string, bucket: string, key: string) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodedKey}`);
}

/** Time-limited GET link for a private R2 object. */
export async function presignR2Get(key: string, expiresSeconds: number): Promise<string> {
  const { accountId, bucket, client } = r2Config();
  const url = objectUrl(accountId, bucket, key);
  url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
  const signed = await client.sign(new Request(url, { method: "GET" }), { aws: { signQuery: true } });
  return signed.url;
}

/** Checks whether the object exists (used to give a clear "not uploaded yet" message). */
export async function r2ObjectExists(key: string): Promise<boolean> {
  const { accountId, bucket, client } = r2Config();
  const res = await client.fetch(objectUrl(accountId, bucket, key).toString(), { method: "HEAD" });
  if (res.ok) return true;
  if (res.status === 404) return false;
  throw new Error(`Video storage rejected the request (status ${res.status}).`);
}
