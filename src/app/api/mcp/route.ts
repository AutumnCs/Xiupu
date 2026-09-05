import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextRequest } from "next/server";
import { requireGuest } from "@/lib/auth";
import { buildMcpServer } from "@/lib/mcp/server";

async function handleMcpRequest(request: NextRequest): Promise<Response> {
  const guest = requireGuest(request);

  const transport = new WebStandardStreamableHTTPServerTransport({
    // Stateless mode: each serverless invocation is independent
    sessionIdGenerator: undefined,
  });

  const server = buildMcpServer(guest.guestId);
  await server.connect(transport);

  return transport.handleRequest(request);
}

export async function GET(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function POST(request: NextRequest) {
  return handleMcpRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleMcpRequest(request);
}
