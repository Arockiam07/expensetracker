import { createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

// Create a new query client instance
const queryClient = new QueryClient();

// Create the router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

function App() {
  return <RouterProvider router={router} />;
}

export default App;
