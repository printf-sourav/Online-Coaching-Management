import https from "https";
import http from "http";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import cloudinary from "../utils/cloudinary.js";

/**
 * GET /api/files/view?url=<encoded_cloudinary_url>
 * Generates a short-lived signed Cloudinary URL and redirects to it.
 * Falls back to proxying the file if a direct signed URL cannot be built.
 */
export const viewFile = asyncHandler(async (req, res) => {
  const { url } = req.query;
  if (!url) throw new apiError(400, "url query param is required");

  // Security: only allow our Cloudinary cloud
  const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
  if (!url.startsWith(`https://res.cloudinary.com/${CLOUD}/`)) {
    throw new apiError(400, "Invalid file URL");
  }

  // Parse resource_type and public_id from URL
  // Format: https://res.cloudinary.com/<cloud>/<resource_type>/upload/[transformations/][vVERSION/]<public_id>
  const path = url.replace(`https://res.cloudinary.com/${CLOUD}/`, "");
  const parts = path.split("/");
  const resourceType = parts[0]; // image | raw | video
  // Skip "upload" (parts[1]), then strip optional transformation + version segments
  let rest = parts.slice(2).join("/");
  // Remove version segment like v1773057273/
  rest = rest.replace(/^v\d+\//, "");
  // rest is now the public_id (possibly with extension)
  const publicId = rest;

  try {
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      flags: "attachment:false",
    });

    return res.redirect(302, signedUrl);
  } catch {
    // Fallback: proxy through the server
    return proxyToClient(url, res);
  }
});

function proxyToClient(fileUrl, res) {
  return new Promise((resolve, reject) => {
    const client = fileUrl.startsWith("https") ? https : http;
    client
      .get(fileUrl, (fileRes) => {
        if (fileRes.statusCode === 401 || fileRes.statusCode === 403) {
          return reject(new apiError(403, "File access denied by storage provider"));
        }
        if (fileRes.statusCode === 404) {
          return reject(new apiError(404, "File not found"));
        }
        res.setHeader("Content-Type", fileRes.headers["content-type"] || "application/pdf");
        res.setHeader("Content-Disposition", "inline");
        res.setHeader("Cache-Control", "private, max-age=3600");
        fileRes.pipe(res);
        fileRes.on("end", resolve);
      })
      .on("error", (err) => reject(new apiError(500, "Failed to fetch file: " + err.message)));
  });
}
