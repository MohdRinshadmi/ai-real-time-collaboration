import React, {createContext, useContext, type ReactNode} from 'react';

// The active workspace for everything below the Workspace route. The web app
// derives this from the [workspaceSlug] URL segment; on mobile we carry it in
// a context seeded by the Workspace route param.

type WorkspaceContextValue = {
  slug: string;
  // The REST API keys most resources by workspace id. Several seed/demo
  // deployments accept the slug as the id, so we default id to slug until a
  // dedicated lookup is wired in.
  workspaceId: string;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  return (
    <WorkspaceContext.Provider value={{slug, workspaceId: slug}}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return ctx;
}
