import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "public_Wmk2RG+ZVObRGnkh33gD5Nfh70E=",
  privateKey: process.env.IMAGEKIT_PRIVATE_KIT || "private_your_key_here",
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/pi9wuccc0i",
});

export async function GET() {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    return Response.json(authenticationParameters);
  } catch (error) {
    return Response.json({ error: "Authentication failed" }, { status: 500 });
  }
}
