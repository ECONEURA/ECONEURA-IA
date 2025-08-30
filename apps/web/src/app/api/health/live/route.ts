export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "web-bff"
    },
    { 
      status: 200,
      headers: {
        'X-System-Mode': 'ok',
        'Content-Type': 'application/json'
      }
    }
  );
}

