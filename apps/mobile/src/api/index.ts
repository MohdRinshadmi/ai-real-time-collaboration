// Transport
export {http, onUnauthorized} from './http';
export {streamSSE, type SSEController, type SSEHandlers} from './sse';
export {getSocketClient, SocketClient, type RoomEvent} from './socket';

// Domain endpoints
import * as authApi from './auth';
import * as channelsApi from './channels';
import * as documentsApi from './documents';

export {authApi, channelsApi, documentsApi};

export type {Channel, Message} from './channels';
export type {Doc, DocDetail} from './documents';
