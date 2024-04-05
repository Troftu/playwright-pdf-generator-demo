const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('serve', {
    alias: 's',
    describe: 'Directory to serve files from',
    type: 'string',
    default: process.cwd(), // Default serving from the current working directory
  })
  .option('output', {
    alias: 'o',
    describe: 'Path to save the PDF',
    type: 'string',
    default: 'output.pdf', // Default output file name
  })
  .option('port', {
    alias: 'p',
    describe: 'Port to run the server on',
    type: 'number',
    default: 14924, // Set default port to 14924
  })
  .option('browser', {
    alias: 'b',
    describe: 'Path to the browser executable',
    type: 'string',
    // Default to the current directory of the binary; adjust as needed for actual deployment
    default: path.join(path.dirname(process.execPath), 'chrome')
  })
  .help()
  .alias('help', 'h')
  .parse();

const app = express();
const serverPort = argv.port;

// Convert paths to absolute
const hostDirectory = path.resolve(argv.serve);
const outputFilePath = path.resolve(argv.output);
const browserPath = path.resolve(argv.browser);

// Serve files from the specified directory
app.use(express.static(hostDirectory));

// Start the server
const server = app.listen(serverPort, async () => {
    console.log(`Serving files from ${hostDirectory} on http://localhost:${serverPort}`);
    
    // Start Playwright process to generate PDF
    const browser = await chromium.launch({
        executablePath: browserPath || undefined // Use the provided browser path, if any
    });
    
    const page = await browser.newPage();
    await page.goto(`http://localhost:${serverPort}`, { waitUntil: 'networkidle' });
    await page.pdf({ path: outputFilePath, format: 'A4' });
    await browser.close();

    // Stop the server once PDF is generated
    server.close();
    console.log(`PDF saved at ${outputFilePath}`);
});