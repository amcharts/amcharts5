import * as am5 from "@amcharts/amcharts5";
import * as am5wc from "@amcharts/amcharts5/wc";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";


// Create root element
// https://www.amcharts.com/docs/v5/getting-started/#Root_element
const root = am5.Root.new("chartdiv");


// Set themes
// https://www.amcharts.com/docs/v5/concepts/themes/
root.setThemes([
  am5themes_Animated.new(root)
]);


// Source text: the series counts how often each word is used
const text = "'Tis sweet and commendable in your nature, Hamlet, to give these mourning " +
  "duties to your father: but, you must know, your father lost a father; that father " +
  "lost, lost his, and the survivor bound in filial obligation for some term to do " +
  "obsequious sorrow: but to persever in obstinate condolement is a course of impious " +
  "stubbornness; 'tis unmanly grief; it shows a will most incorrect to heaven, a heart " +
  "unfortified, a mind impatient, an understanding simple and unschool'd: for what we " +
  "know must be and is as common as any the most vulgar thing to sense, why should we " +
  "in our peevish opposition take it to heart? Fie! 'tis a fault to heaven, a fault " +
  "against the dead, a fault to nature, to reason most absurd: whose common theme is " +
  "death of fathers, and who still hath cried, from the first corse till he that died " +
  "to-day, 'This must be so.'";


// Add series
// Angles are taken in turn, not at random, so the cloud is the same on every load
// https://www.amcharts.com/docs/v5/charts/word-cloud/#Setting_words
const series = root.container.children.push(am5wc.WordCloud.new(root, {
  text: text,
  maxCount: 100,                // at most the 100 most used words
  minWordLength: 3,             // skip words shorter than 3 letters
  excludeWords: ["and", "the", "that", "but", "for"], // common words that would crowd the rest out
  minFontSize: am5.percent(4),  // the rarest words about 4% of the chart's smaller side...
  maxFontSize: am5.percent(25), // ...the most used about 25%
  angles: [0, 0, -90],          // two words in three level, every third on its side
  randomizeAngles: false
}));


// Configure labels
// https://www.amcharts.com/docs/v5/charts/word-cloud/#Configuring
series.labels.template.setAll({
  paddingTop: 5,           // 5 px of space kept around each word
  paddingBottom: 5,
  paddingLeft: 5,
  paddingRight: 5,
  fontFamily: "Courier New" // a typewriter-style font, every letter the same width
});


// Play initial series animation
// https://www.amcharts.com/docs/v5/concepts/animations/#Animation_of_series
series.appear(1000, 100);