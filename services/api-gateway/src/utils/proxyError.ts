import { ServerResponse } from 'http';
import { Socket } from 'net';

export function sendProxyError(res: ServerResponse | Socket, message: string): void {
    if (res instanceof ServerResponse) {
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ error: message }));
    }
}
