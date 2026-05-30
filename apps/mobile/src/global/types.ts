import type {SessionResponse} from '@collab/api-contracts';

// App-wide types shared across layers. Domain request/response shapes live
// alongside their endpoints in src/api.

export type AuthUser = SessionResponse['user'];

// A member currently present in a workspace (presence room payloads).
export type PresentMember = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};
