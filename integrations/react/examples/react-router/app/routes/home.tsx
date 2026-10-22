import { Charts } from "../Charts";

export function meta() {
	return [{ title: "amCharts 5 with React Router" }];
}

// No .client.tsx file and no ClientOnly wrapper: the package loads the
// library in the browser only
export default function Home() {
	return (
		<main>
			<h1>amCharts 5 with React Router</h1>
			<Charts />
		</main>
	);
}
