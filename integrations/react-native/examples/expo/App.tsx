import { useRef, useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AmChart } from "@amcharts/amcharts5-react-native";
import type { AmChartHandle } from "@amcharts/amcharts5-react-native";
import { columnChartCode, mapConfig, pieConfig, randomVisits, visits } from "./src/charts";

// Each chart is drawn by amCharts itself, in a WebView. The library is loaded
// from the amCharts CDN, so the first start needs a connection
export default function App() {
	const [data, setData] = useState(visits);
	const [country, setCountry] = useState<string>();
	const [errors, setErrors] = useState<Array<string>>([]);
	const [ready, setReady] = useState<Array<string>>([]);

	// A ref gives run(): code to run in the chart's WebView
	const pie = useRef<AmChartHandle>(null);

	const onReady = (name: string) => () => setReady((list) => list.concat(name));
	const onError = (name: string) => (message: string) => setErrors((list) => list.concat(name + ": " + message));

	return (
		<ScrollView contentContainerStyle={styles.page}>
			<StatusBar style="auto" />
			<Text style={styles.title}>amCharts 5 with React Native</Text>

			<Text style={styles.heading}>A chart written in code</Text>
			<Button title="New data" onPress={() => setData(randomVisits())} />
			{/* New `data` goes to the function the code returned, without making the chart again */}
			<AmChart
				code={columnChartCode}
				data={data}
				themes={["Animated"]}
				style={styles.chart}
				onMessage={(name, value) => name === "country" && setCountry(String(value))}
				onReady={onReady("column chart")}
				onError={onError("column chart")}
			/>
			<Text>{country ? "Tapped: " + country : "Tap a column"}</Text>

			<Text style={styles.heading}>A chart from a JSON config</Text>
			<Button title="Animate again" onPress={() => pie.current?.run("chart.series.getIndex(0).appear(1000)")} />
			<AmChart
				ref={pie}
				config={pieConfig}
				themes={["Animated"]}
				style={styles.chart}
				onReady={onReady("pie chart")}
				onError={onError("pie chart")}
			/>

			<Text style={styles.heading}>A map from a JSON config</Text>
			<AmChart
				config={mapConfig}
				style={styles.chart}
				onReady={onReady("map")}
				onError={onError("map")}
			/>

			<View style={styles.status}>
				<Text>Ready: {ready.length ? ready.join(", ") : "none yet"}</Text>
				{errors.map((error, i) => <Text key={i} style={styles.error}>{error}</Text>)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	page: { padding: 16, paddingTop: 56, gap: 8 },
	title: { fontSize: 22, fontWeight: "bold" },
	heading: { fontSize: 18, fontWeight: "bold", marginTop: 16 },
	// A chart needs a height, or flex: 1
	chart: { height: 300 },
	status: { marginTop: 16, gap: 4 },
	error: { color: "#c00" },
});
