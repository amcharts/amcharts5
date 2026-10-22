export const metadata = {
	title: "amCharts 5 with Next.js",
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
