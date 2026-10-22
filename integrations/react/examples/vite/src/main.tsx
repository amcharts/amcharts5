import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// In development, strict mode mounts each component twice: the package
// disposes the first chart, so there is one
createRoot(document.getElementById("app")!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
