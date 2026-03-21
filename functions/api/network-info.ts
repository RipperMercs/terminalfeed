// Cloudflare Pages Function — returns visitor IP, location, ISP from CF headers
// Zero external API calls — all data comes from Cloudflare's built-in request metadata
export const onRequestGet: PagesFunction = async (context) => {
  const headers = context.request.headers;

  const data: Record<string, string> = {
    ip: headers.get('CF-Connecting-IP') || '',
    country: headers.get('CF-IPCountry') || '',
    city: '',
    region: '',
    colo: '',
    asn: '',
    asOrg: '',
    timezone: '',
  };

  // The cf object on the request has richer geo/network data from Cloudflare's edge
  // @ts-expect-error — cf is available on Cloudflare Workers requests
  const cf = context.request.cf;
  if (cf) {
    data.city = cf.city || '';
    data.region = cf.region || '';
    data.country = cf.country || data.country;
    data.colo = cf.colo || '';
    data.asn = cf.asn ? String(cf.asn) : '';
    data.asOrg = cf.asOrganization || '';
    data.timezone = cf.timezone || '';
  }

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
};
