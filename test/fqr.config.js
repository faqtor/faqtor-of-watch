const { cmd } = require("faqtor");

const testFile = "./test.js";
const testOutput = "./test.min.js";

module.exports = {
    clean: cmd(`rimraf ${testOutput}`).factor(testOutput)
}