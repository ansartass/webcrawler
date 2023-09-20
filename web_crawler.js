import * as cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs/promises';
//var resolveUrl = require("resolve-url")
import resolveUrl from 'resolve-url';
import url from 'url';

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

            // Extract background-image URL from inline CSS
            $('*[style]').each((index, element) => {
                const style = $(element).attr('style');
                if (style) {
                    const backgroundImageUrlMatches = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
                    if (backgroundImageUrlMatches) {
                        const backgroundImageUrl = backgroundImageUrlMatches[1];
                        const absoluteBackgroundImageUrl = new URL(backgroundImageUrl, url).toString();
                        results.push({ imageUrl: absoluteBackgroundImageUrl, sourceUrl: url, depth: currentDepth });
                    }
                }
            });

            // Extract images and links from the HTML using Cheerio selectors
            $('img').each((index, element) => {
                const imageUrl = $(element).attr('src');
                if(imageUrl)
                {
                    //var res = getPageImg(imageUrl);                    
                    //const absoluteImageUrl = resolveUrl(url, imageUrl);
                    //const absoluteImageUrl = url.resolve(url, imageUrl);
                    const absoluteImageUrl = new URL(imageUrl, url).toString(); // resolving to absolute url
                    results.push({ imageUrl: absoluteImageUrl, sourceUrl: url, depth: currentDepth });
                }                
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
                    await crawl(link, currentDepth + 1)
                    .then(() => {
                        // Create a JSON object with the results
                        const jsonObject = {
                            results: results
                        };
                
                        // Convert the JSON object to a JSON string with pretty formatting
                        const jsonString = JSON.stringify(jsonObject, null, 2);
                
                        // Write the JSON data to a file
                        return fs.writeFile('results.json', jsonString, 'utf-8');
                    })
                    .then(() => {
                        console.log('Results saved to results.json');
                    })
                    .catch((error) => {
                        console.error('Error writing results to file:', error);
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error crawling ${url}: ${error.message}`);
    }
}

// Call the crawl function with the initial URL and depth
crawl(startUrl, 0)
.then(() => {
    // Create a JSON object with the results
    const jsonObject = {
        results: results
    };

    // Convert the JSON object to a JSON string with pretty formatting
    const jsonString = JSON.stringify(jsonObject, null, 2);

    // Write the JSON data to a file
    return fs.writeFile('results.json', jsonString, 'utf-8');
})
.then(() => {
    console.log('Results saved to results.json');
})
.catch((error) => {
    console.error('Error writing results to file:', error);
});
    

// getPageImg(url)(()=> {
//     return new Promise((resolve, reject) => {
//         //get our html
//         axios.get(url)
//         .then(resp => {
//             //html
//             const html = resp.data;
//             //load into a $
//             const $ = cheerio.load(html);
//             //find ourself a img
//             const retURL = nodeURL.resolve(url,$("body").find("img")[0].attribs.src);
//             resolve(retURL);
//         })
//         .catch(err => {
//            reject(err);
//         });
//     });
// });