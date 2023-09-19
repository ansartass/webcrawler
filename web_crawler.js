import * as cheerio from 'cheerio';
//import * as axios from 'axios';
import axios from 'axios';
import fs from 'fs/promises';

// Check if the required command-line arguments are provided
if (process.argv.length !== 4) {
    console.error('Usage: node crawler.js <start_url: string> <depth: number>');
    process.exit(1); // Exit the program with an error code
}

// Get the command-line arguments
const startUrl = process.argv[2];
const maxDepth = parseInt(process.argv[3]);

// Check if the depth is a valid number
if (isNaN(maxDepth)) {
    console.error('Depth must be a valid number.');
    process.exit(1); // Exit the program with an error code
}

const results = []; // Initialize results array

// Function to crawl a URL
async function crawl(url, currentDepth) {
    try {
        // Make an HTTP GET request to the URL
        const response = await axios.get(url);

        // Check if the response status code is OK (200)
        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);

            // Extract images and links from the HTML using Cheerio selectors
            $('img').each((index, element) => {
                const imageUrl = $(element).attr('src');
                results.push({ imageUrl, sourceUrl: url, depth: currentDepth });
            });

            // Extract links and crawl them if depth permits
            if (currentDepth < maxDepth) {
                const links = [];
                $('a').each((index, element) => {
                    const linkUrl = $(element).attr('href');
                    // Ensure the link is absolute and valid before crawling
                    if (linkUrl && linkUrl.startsWith('http')) {
                        links.push(linkUrl);
                    }
                });

                // Recursively crawl the links
                for (const link of links) {
                    await crawl(link, currentDepth + 1);
                }
            }
        }
    } catch (error) {
        console.error(`Error crawling ${url}: ${error.message}`);
    }
}

// Call the crawl function with the initial URL and depth
crawl(startUrl, 0);

// Create a JSON object with the results
const jsonObject = {
    results: results
};

// Convert the JSON object to a JSON string with pretty formatting
const jsonString = JSON.stringify(jsonObject, null, 2);

// Write the JSON data to a file
fs.writeFile('results.json', jsonString, 'utf-8')
    .then(() => {
        console.log('Results saved to results.json');
    })
    .catch((error) => {
        console.error('Error writing results to file:', error);
    });