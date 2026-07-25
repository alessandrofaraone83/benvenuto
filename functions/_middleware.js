export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === "benvenutodigitale.it") {
    url.hostname = "www.benvenutodigitale.it";
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
