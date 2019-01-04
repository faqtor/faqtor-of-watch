const { cmd } = require("faqtor");
const { watch } = require("../dist/index");

const testInput = "./test.js";

const echo = cmd("echo OOOOOK").factor(testInput);

module.exports = {
    watch: watch(echo)
}