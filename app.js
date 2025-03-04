const puppeteer = require('puppeteer');

async function getCommonUsages(word) {
	const browser = await puppeteer.launch({
		headless: 'new',
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-gpu',
			'--disable-extensions',
			'--disable-notifications',
			'--disable-logging',
			'--disable-infobars',
			'--no-default-browser-check',
		],
	});

	try {
		const page = await browser.newPage();
		await page.setRequestInterception(true);
		page.on('request', req => {
			if (
				['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())
			) {
				req.abort();
			} else {
				req.continue();
			}
		});

		await page.setCacheEnabled(true);
		await page.setViewport({ width: 800, height: 600 });
		await page.setUserAgent(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
		);

		await page.goto(`https://tureng.com/tr/turkce-ingilizce/${word}`, {
			waitUntil: 'domcontentloaded',
			timeout: 5000,
		});

		await page.waitForSelector(
			'tr.tureng-manual-stripe-odd, tr.tureng-manual-stripe-even',
			{
				timeout: 5000,
			}
		);

		const commonUsages = await page.evaluate(() => {
			const rows = document.querySelectorAll(
				'tr.tureng-manual-stripe-odd, tr.tureng-manual-stripe-even'
			);
			const results = [];

			rows.forEach(row => {
				const category = row
					.querySelector('td.hidden-xs:nth-child(2)')
					?.textContent?.trim();
				if (category === 'Yaygın Kullanım') {
					let englishText = row.querySelector('td.en.tm')?.textContent?.trim();
					englishText = englishText.replace(/\s*i\.$/, '').trim(); // "i." ekini kaldır

					results.push({
						number: row.querySelector('td.rc0')?.textContent?.trim(),
						english: englishText,
						turkish: row.querySelector('td.tr.ts')?.textContent?.trim(),
					});
				}
			});
			return results;
		});

		console.log('Yaygın Kullanım Çevirileri:', commonUsages);
		return commonUsages;
	} catch (error) {
		console.error('Hata:', error);
		return null;
	} finally {
		await browser.close();
	}
}

// Kullanım
const word = 'table';
getCommonUsages(word);
