import { expect } from 'chai';
import { crawl } from '../web_crawler'; // Update the import path as needed

describe('Web Crawler Tests', function () {
    it('should extract images from a webpage', async function () {
        const startUrl = 'https://www.energypark.ae'; // test URL
        const maxDepth = 2; // test depth

        const results = await crawl(startUrl, maxDepth);

        // Write assertions to validate the results
        expect(results).to.be.an('array');
        expect(results).to.have.lengthOf.at.least(1);
        // Add more specific assertions as needed
    });

    // Add more test cases as needed
});