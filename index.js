const puppeteer = require('puppeteer');
const dotEnv = require('dotenv');
const Sheet = require('./Sheet');
dotEnv.config({path: '.env'});


(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto(`${process.env.DOMAIN}/wp-admin/`, { waitUntil: 'networkidle0' });

  // Login with the details
  await page.type('#user_login', `${process.env.USERNAME}`, {delay : 200});
  await page.type('#user_pass',`${process.env.PASSWORD}`, {delay : 200});
  
  // click and wait for navigation
  await Promise.all([
    page.click('#wp-submit'),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
  ]);

  // After login navigate the user list page
  await page.goto(`${process.env.DOMAIN}/wp-admin/users.php`);

  // Empty Array to output all data
  const userDetails = []

  // Next button link selector
  const nextLink = '.next-page';

  // loop limit
  const loopLimit = process.env.LOOP_LIMIT;

  for(let i = 0; i < loopLimit; i++){
    const data = await page.evaluate(()=> {
      return [...document.querySelectorAll('#the-list tr')].map(e => {
          return {
          user_name: e.querySelector('[data-colname="Name"]').textContent,
          name: e.querySelector('[data-colname="Name"]').textContent,
          email: e.querySelector('[data-colname="Email"]').textContent,
          role: e.querySelector('[data-colname="Role"]').textContent,
          posts: e.querySelector('[data-colname="Posts"]').textContent,
        }
      });
    });

    // push each page user list data
    userDetails.push(...data);

    // check if the next button return true | false
    const exist = await page.evaluate((nextLink)=>{
      return !!document.querySelector(nextLink);
    }, nextLink);

    // click the next button until it has
    if(exist && i < loopLimit) {
      await Promise.all([
        page.waitForNavigation(),
        page.click(nextLink),
      ]);
    }else{
      break;
    }
  }

  // Add data in the Google sheets
  const sheet = new Sheet();
  await sheet.auth();
  await sheet.load();
  await sheet.addRows(userDetails);

  await browser.close();

})();