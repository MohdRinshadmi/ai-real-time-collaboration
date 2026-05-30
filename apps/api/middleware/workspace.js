import { prisma } from '../models';
import { forbidden, notFound } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';

// Resolves the workspace from the request (header, route param, query, or body),
// confirms the authenticated user is a member, and attaches the membership to
// `req.workspaceMember` for downstream handlers. Mirrors the old WorkspaceGuard.
export const requireWorkspace = asyncHandler(async (req, _res, next) => {
  if (!req.user) throw forbidden('not authenticated');

  const workspaceId =
    req.headers['x-workspace-id'] ??
    req.params?.workspaceId ??
    req.query?.workspaceId ??
    req.body?.workspaceId;

  if (!workspaceId) throw forbidden('workspace not specified');

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: req.user.id } },
  });
  if (!member) throw notFound('workspace not found');

  req.workspaceMember = member;
  next();
});
