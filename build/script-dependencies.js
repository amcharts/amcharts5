// This specifies which script files are dependent on other files
// TODO handle this automatically
module.exports = {
    "pie": ["percent"],
    "funnel": ["percent"],
    "radar": ["xy"],
    "gantt": ["xy", "plugins/colorPicker"],
    "stock": ["xy"],
    "timeline": ["xy"],
};
