import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  // IMAGEKIT_PRIVATE_KEY is the documented name; keep IMAGEKIT_PRIVATE_KIT as a
  // fallback for hosts that configured the old (typo'd) variable name.
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || process.env.IMAGEKIT_PRIVATE_KIT!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export async function GET() {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return Response.json(authenticationParameters);
  } catch (error) {
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }
}
