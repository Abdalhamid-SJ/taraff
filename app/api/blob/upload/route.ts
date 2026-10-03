import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth-roles";

// Lets the admin upload widget tell "storage not set up" apart from a bad file.
export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN) });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        // Staff only — customers have sessions too and must not get upload tokens.
        if (!session?.user || !isStaffRole(session.user.role)) {
          throw new Error("Unauthorized");
        }
        return {
          // SVG is allowed for the site logo; it is only ever rendered through
          // <img>/favicon, where the browser never runs scripts inside it.
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
          addRandomSuffix: true,
          maximumSizeInBytes: 5 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // No DB write here — the client receives the blob URL directly and
        // saves it as part of the surrounding form submission.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    // Most often a missing BLOB_READ_WRITE_TOKEN; surface it in the server log.
    console.error("[blob upload]", (error as Error).message);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
