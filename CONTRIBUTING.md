# Contributing

## Questions and support

The amCharts team monitors the issues in this repository, so a question can be
asked there. Guaranteed support is for holders of amPlus subscription service.

* The [documentation](https://www.amcharts.com/docs/v5/) and the
  [demos](https://www.amcharts.com/demos/) answer most "how do I" questions.
* With a license or subscription:
  [contact support directly](https://www.amcharts.com/support/support-info/priority-support/).
* Without one: open an issue with the question template, or see the
  [other options](https://www.amcharts.com/support/support-info/free-support/).

## Reporting a bug

Open an [issue](https://github.com/amcharts/amcharts5/issues) with the bug
report template. What helps most:

* the amCharts 5 version, the browser and any framework involved;
* the smallest chart that shows the problem, ideally running on CodePen,
  jsFiddle, CodeSandbox or StackBlitz.

A security problem is not reported in an issue: see [SECURITY.md](SECURITY.md).

## Pull requests

amCharts 5 is developed by the amCharts team. Before sending a pull request,
open an issue that describes the change, so we can say whether it fits.

## Building

```
yarn install
yarn build           # ES modules, into dist/es2015
yarn build:script    # script files, into dist/script
yarn examples        # the examples, into both; needs build:script first
```

Where things are:

* `src/`: the library. `src/locales/` has the translations;
  [this tutorial](https://www.amcharts.com/docs/v5/concepts/locales/creating-translations/)
  explains how a locale file is made.
* `examples/shared/<name>/`: one bundled example. `index.ts` is the chart,
  `template/` holds anything else it ships with, and the build makes the
  versions that are published.
* `packages/`: what ships beside the code (README, changelog, license,
  `AGENTS.md`, `docs/`).
