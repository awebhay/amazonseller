const puppeteer = require('puppeteer');
const fs = require('fs');
const cookies = require('./cookies.json');
const lineReader = require('line-reader');
const thuTuCustomizeTrongDropDOwn = 1; // Hàng số mấy chứa chữ custom trong dropdown
const customizeText = 'Customization';
const fromPage = 3;
const size = {
    "Adult Small (S)": 0,
    "Adult Medium (M)": 0,
    "Adult Large (L)": 0,
    "Adult X Large (XL)": 1.5,
    "Adult 2X Large (2XL)": 2.5,
    "Adult 3X Large (3XL)": 3,
    "Youth Small (YS)": 0,
    "Youth Medium (YM)": 0,
    "Youth Large (YL)": 0,
    "Youth X Large (YXL)": 0
};
const style = {
    "Short Sleeve T-Shirt": 0,
    "Long Sleeve T-Shirt": 5,
    "Ladies Short-Sleeve": 5,
    "Unisex Tank": 5,
    "Unisex V-Neck T-Shirt": 5,
    "Crewneck Sweatshirt": 15,
    "Heavy Blend Hoodie": 20
};
const color = {
    "Black": 0,
    "White": 0,
    "Carolina Blue": 0,
    "Irish Green": 0,
    "Red": 0,
    "Pink": 0,
    "Daisy": 0,
    "Navy": 0,
    "Sport Grey": 0
}
let howManyPageYouWant = 6;

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        // slowMo: 500,
        userDataDir: "./user_data"
    });

    const page = await browser.newPage();
    await page.setViewport({width: 1580, height: 768});
    if (!Object.keys(cookies).length) {
        try {
            // đăng nhập lần đầu, sau khi đăng nhập xong thì bỏ đoạn này đi
            await page.goto('https://sellercentral.amazon.com/inventory', {
                waitUntil: 'networkidle2',
                // await page.type('#ap_email', '###');
                // await page.type('#ap_password', '###');
            });
            let currentCookies = await page.cookies();
            fs.writeFileSync('./cookies.json', JSON.stringify(currentCookies));
        } catch (err) {
            console.log("failed to login");
        }
    } else {
        await page.setCookie(...cookies);
        await page.goto('https://sellercentral.amazon.com/inventory', {waitUntil: 'networkidle2'});
        await page.evaluate(() => document.querySelector('input#myitable-gotopage').value = '');
        await page.type('input#myitable-gotopage', String(fromPage));
        let gotoButton = '#myitable-gotopage-button input';
        await page.evaluate((gotoButton) => document.querySelector(gotoButton).click(), gotoButton);
        await page.waitForNavigation({waitUntil: "networkidle0"});

        let CountRowItems = 1;
        while (howManyPageYouWant !== 0) {
            let startItem = 1;
            let itemsPerPage = 25;
            let startItemSelection = 0;
            for (startItem; startItem <= itemsPerPage; startItem++) {
                console.log('inserting product data');

                // Click to open new customize tab
                await page.evaluate((startItemSelection) => document.querySelectorAll('.a-splitdropdown-container button[data-action="a-splitdropdown-button"]')[startItemSelection].click(), startItemSelection);
                startItemSelection += 2;
                let selectorCustomize = '#dropdown' + CountRowItems + '_' + thuTuCustomizeTrongDropDOwn;
                CountRowItems++;
                await page.waitForSelector(selectorCustomize, {timeout: 30000});
                let innerHTML = await page.evaluate((selectorCustomize) => document.querySelector(selectorCustomize).text, selectorCustomize);
                if (innerHTML.indexOf(customizeText) === -1) continue;
                await page.evaluate((selectorCustomize) => document.querySelector(selectorCustomize).click(), selectorCustomize);
                await page.waitForTimeout(5000);

                //switch tabs here
                const [tabOne, tabTwo, tabThree] = (await browser.pages());
                try {
                    await tabThree.bringToFront();
                } catch (e) {
                    await closeTabThree(tabTwo, tabThree);
                    continue;
                }

                try {
                    await tabThree.waitForSelector(".confirmation-modal-view", {timeout: 3000});
                    if (await tabThree.$('.confirmation-modal-view') !== null) {
                        await tabThree.$eval('kat-modal-footer div', elem => elem.click());
                        // console.log('clicked');
                    }
                } catch (e) {}

                // check customized exist
                try {
                    await tabThree.waitForSelector('kat-input[value="CUSTOMIZED"]', {timeout: 3000});
                    if (await tabThree.$('kat-input[value="CUSTOMIZED"]') !== null) {
                        await closeTabThree(tabTwo, tabThree);
                        continue;
                    }
                } catch (e) { // console.log('do not have CUSTOMIZED data');
                }
                try {
                    await tabThree.waitForSelector('kat-input[value="Option Dropdown 1"]', {timeout: 3000});
                    if (await tabThree.$('kat-input[value="Option Dropdown 1"]') !== null) {
                        await closeTabThree(tabTwo, tabThree);
                        continue;
                    }
                } catch (e) { // console.log('do not have Option Dropdown data');
                }

                // 1 Create new custom attribute
                await tabThree.waitForSelector("#root .gestalt-Customizations .secondary");
                await tabThree.$eval('#root .gestalt-Customizations .secondary', elem => elem.click());
                await tabThree.waitForTimeout(1000);
                let selector3 = 'kat-modal-body kat-box:nth-child(3) div';
                await tabThree.waitForSelector(selector3);
                await tabThree.evaluate((selector3) => document.querySelector(selector3).click(), selector3);
                await tabThree.waitForSelector("kat-modal-footer button");
                await tabThree.$eval('kat-modal-footer button', elem => elem.click());
                //Upload image 400x400
                await tabThree.waitForSelector('#root > div > div:nth-child(2) > div.one-by-one-content > div.gestalt-building-block.gestalt-building-block-container-picker.gestalt-Surfaces > div.building-block-content > div:nth-child(2) > div.children-list__2_5Dx > div.child-container__LXV6B > div > div:nth-child(2) > div > div > div.building-block-content > div > div.preview-container-image-upload > div.kat-col-md-6 > div > div.image-input.preview-container-base-image-upload > div.image-upload > div > div > div > div')
                await tabThree.waitForTimeout(1000);
                const input = await tabThree.$('#root > div > div:nth-child(2) > div.one-by-one-content > div.gestalt-building-block.gestalt-building-block-container-picker.gestalt-Surfaces > div.building-block-content > div:nth-child(2) > div.children-list__2_5Dx > div.child-container__LXV6B > div > div:nth-child(2) > div > div > div.building-block-content > div > div.preview-container-image-upload > div.kat-col-md-6 > div > div.image-input.preview-container-base-image-upload > div.image-upload > div > div > div > input')
                await input.uploadFile('./400.jpg');
                await tabThree.waitForTimeout(3000);
                await tabThree.focus('#root > div > div:nth-child(2) > div.one-by-one-content > div.gestalt-building-block.gestalt-building-block-container-picker.gestalt-Surfaces > div.building-block-content > div:nth-child(2) > div.children-list__2_5Dx > div.child-container__LXV6B > div > div:nth-child(2) > div > div > div.building-block-content > div > div.preview-container-image-upload > div.kat-col-md-6 > div > div.image-input.preview-container-base-image-upload > div.image-upload > div > div > div > input');
                await tabThree.keyboard.press('Escape');
                await input.press('Escape');
                //Edit Surface Label
                await tabThree.evaluate(() => document.querySelector('#katal-id-1').value = '');
                await tabThree.evaluate(() => document.querySelector('#katal-id-2').value = '');
                await tabThree.type('#katal-id-1', 'CUSTOMIZED');
                await tabThree.type('#katal-id-2', 'CUSTOMIZED');
                await tabThree.keyboard.press('Escape');

                let DropDownLabel1 = '.building-block-content .gestalt-options kat-input[value="Option Dropdown 1"]';
                await tabThree.evaluate((DropDownLabel1) => document.querySelector(DropDownLabel1).id = 'dropdownlabel1', DropDownLabel1);
                await tabThree.evaluate(() => document.querySelector('#dropdownlabel1').value = '');
                await tabThree.type('#dropdownlabel1', 'SIZE');
                await tabThree.evaluate(async (size) => {
                    const customizes = {
                        size
                    };
                    let count = 1;
                    for (let key in customizes) {
                        for (let name in customizes[key]) {
                            if (count === 1) {
                                let customName = name;
                                let customPrice = customizes[key][name];
                                let option1 = document.querySelector('kat-input[value="Option 1"] input');
                                let optionValue = document.querySelector('kat-input[value="Option 1"]');
                                let nextEl = parseInt(option1.id.split('-').pop()) + 1;
                                let price = document.querySelector('#katal-id-' + nextEl);
                                console.log('#katal-id-' + nextEl);
                                console.log(customName);
                                console.log(customPrice);
                                option1.value = customName;
                                optionValue.value = customName;
                                price.value = customPrice;
                                document.querySelector('kat-input[value="Option 1"]').value = customName;
                            } else if (count === 2) {
                                let customName = name;
                                let customPrice = customizes[key][name];
                                let option2 = document.querySelector('kat-input[value="Option 2"] input');
                                let optionValue = document.querySelector('kat-input[value="Option 2"]');
                                let nextEl = parseInt(option2.id.split('-').pop()) + 1;
                                let price = document.querySelector('#katal-id-' + nextEl);
                                option2.value = customName;
                                optionValue.value = customName;
                                price.value = customPrice;
                                document.querySelector('kat-input[value="Option 2"]').value = customName;
                            } else {
                                if (count < 10) {
                                    //kat-icon[name="add_box"]
                                    await document.getElementsByName("add_box")[0].click();
                                    let option = "Option " + count;
                                    let customPrice = customizes[key][name];
                                    let optionInput = await document.querySelector('kat-input[value="' + option + '"] input');
                                    let nextEl = parseInt(optionInput.id.slice(-2)) + 1;
                                    let price = document.querySelector('#katal-id-' + nextEl);
                                    optionInput.value = name;
                                    price.value = customPrice;
                                    document.querySelector('kat-input[value="' + option + '"]').value = name;
                                }
                            }
                            count++;
                        }
                    }
                }, size);
                await reEnterInput(tabThree, size);

// 2 Create new custom attribute
                await tabThree.waitForSelector("#root .gestalt-Customizations .secondary");
                await tabThree.$eval('#root .gestalt-Customizations .secondary', elem => elem.click());
                await tabThree.waitForTimeout(1000);
                let selector31 = 'kat-modal-body kat-box:nth-child(3) div';
                await tabThree.waitForSelector(selector31);
                await tabThree.evaluate((selector31) => document.querySelector(selector31).click(), selector31);
                await tabThree.waitForSelector("kat-modal-footer button");
                await tabThree.$eval('kat-modal-footer button', elem => elem.click());

                let DropDownLabel2 = '.building-block-content .gestalt-options kat-input[value="Option Dropdown 2"]';
                await tabThree.evaluate((DropDownLabel2) => document.querySelector(DropDownLabel2).id = 'dropdownlabel2', DropDownLabel2);
                await tabThree.evaluate(() => document.querySelector('#dropdownlabel2').value = '');
                await tabThree.type('#dropdownlabel2', 'STYLE');
                await tabThree.evaluate(async (style) => {
                    const customizes = {
                        style
                    };
                    let count = 1;
                    for (let key in customizes) {
                        for (let name in customizes[key]) {
                            if (count === 1) {
                                let customName = name;
                                let customPrice = customizes[key][name];
                                let option1 = document.querySelector('kat-input[value="Option 1"] input');
                                let nextEl = parseInt(option1.id.slice(-2)) + 1;
                                let price = document.querySelector('#katal-id-' + nextEl);
                                option1.value = customName;
                                price.value = customPrice;
                                document.querySelector('kat-input[value="Option 1"]').value = customName;
                            } else if (count === 2) {
                                let customName = name;
                                let customPrice = customizes[key][name];
                                let option2 = document.querySelector('kat-input[value="Option 2"] input');
                                let nextEl = parseInt(option2.id.slice(-2)) + 1;
                                let price = document.querySelector('#katal-id-' + nextEl);
                                option2.value = customName;
                                price.value = customPrice;
                                document.querySelector('kat-input[value="Option 2"]').value = customName;
                            } else {
                                if (count < 10) {
                                    //kat-icon[name="add_box"]
                                    let addBox = document.getElementsByName("add_box");
                                    let lastAddBox = addBox[addBox.length - 1];
                                    await lastAddBox.click();
                                    let option = "Option " + count;
                                    let customPrice = customizes[key][name];
                                    let optionInput = await document.querySelector('kat-input[value="' + option + '"] input');
                                    let nextEl = parseInt(optionInput.id.slice(-2)) + 1;
                                    let price = document.querySelector('#katal-id-' + nextEl);
                                    optionInput.value = name;
                                    price.value = customPrice;
                                    document.querySelector('kat-input[value="' + option + '"]').value = name;
                                }
                            }
                            count++;
                        }
                    }
                }, style);
                await reEnterInput(tabThree, style);

// 3 Create new custom attribute
                await tabThree.waitForSelector("#root .gestalt-Customizations .secondary");
                await tabThree.$eval('#root .gestalt-Customizations .secondary', elem => elem.click());
                await tabThree.waitForTimeout(1000);
                let selector33 = 'kat-modal-body kat-box:nth-child(3) div';
                await tabThree.waitForSelector(selector33);
                await tabThree.evaluate((selector33) => document.querySelector(selector33).click(), selector33);
                await tabThree.waitForSelector("kat-modal-footer button");
                await tabThree.$eval('kat-modal-footer button', elem => elem.click());

                let DropDownLabel3 = '.building-block-content .gestalt-options kat-input[value="Option Dropdown 3"]';
                await tabThree.evaluate((DropDownLabel3) => document.querySelector(DropDownLabel3).id = 'dropdownlabel3', DropDownLabel3);
                await tabThree.evaluate(() => document.querySelector('#dropdownlabel3').value = '');
                await tabThree.type('#dropdownlabel3', 'COLOR');
                await tabThree.evaluate(async (color) => {
                    const customizes = {
                        color
                    };
                    let count = 1;
                    for (let key in customizes) {
                        for (let name in customizes[key]) {
                            if (count === 1) {
                                let customName = name;
                                let option1 = document.querySelector('kat-input[value="Option 1"] input');
                                option1.value = customName;
                                document.querySelector('kat-input[value="Option 1"]').value = customName;
                            } else if (count === 2) {
                                let customName = name;
                                let option2 = document.querySelector('kat-input[value="Option 2"] input');
                                option2.value = customName;
                                document.querySelector('kat-input[value="Option 2"]').value = customName;
                            } else {
                                if (count < 10) {
                                    let addBox = document.getElementsByName("add_box");
                                    let lastAddBox = addBox[addBox.length - 1];
                                    await lastAddBox.click();
                                    let option = "Option " + count;
                                    let optionInput = await document.querySelector('kat-input[value="' + option + '"] input');
                                    optionInput.value = name;
                                    document.querySelector('kat-input[value="' + option + '"]').value = name;
                                }
                            }
                            count++;
                        }
                    }
                }, color);
                await reEnterInput(tabThree, color);
                try {
                    await tabThree.waitForSelector('button[data-action="PUBLISH"]', {timeout: 1000});
                    await tabThree.waitForTimeout(6000)
                } catch (e) {
                    // console.log('do not have PUBLISH button');
                }
                try {
                    await tabThree.waitForSelector('kat-button.save-button', {timeout: 1000});
                    await tabThree.$eval('kat-button.save-button', elem => elem.click());
                    await tabThree.waitForTimeout(6000)
                } catch (e) {
                    // console.log('do not have PUBLISH button');
                }
                await closeTabThree(tabTwo, tabThree);
            }
            howManyPageYouWant--;
            let nextBtnSelector = '.a-pagination .a-last a';
            await page.evaluate((nextBtnSelector) => document.querySelector(nextBtnSelector).click(), nextBtnSelector);
            await page.waitForTimeout(3000);
        }
        console.log('process done!!!');
    }
})();

/**
 *
 * @param tabThree
 * @param page
 * @returns {Promise<void>}
 */
async function createNewCustomize(tabThree, page) {
    await tabThree.click('#root .gestalt-Customizations .secondary', {delay: 2000});
    await tabThree.waitForTimeout(3000);
    await tabThree.click('kat-modal-body kat-box:nth-child(3)', {delay: 2000});
    await tabThree.waitForTimeout(3000);
    await tabThree.click('kat-modal-footer button', {delay: 2000});
}

function readFile() {
    var data;
    try {
        var customizes = [];
        lineReader.eachLine('./data.txt', function (line) {
            if (line.indexOf('*') > -1) {
                customizes[line] = [];
            }
        });
    } catch (e) {
        // console.log('Error:', e.stack);
    }
    return data;
}

async function reEnterInput(tabThree, input) {
    let count = 1;
    for (let key in input) {
        if (count === 10) break;
        await tabThree.focus('kat-input[value="' + key + '"] input');
        await tabThree.keyboard.type(' ');
        await tabThree.keyboard.press('Enter');
        let id = await tabThree.$eval('kat-input[value="' + key + '"] input', el => el.id);
        let nextEl = parseInt(id.split('-').pop()) + 1;
        await tabThree.type('#katal-id-' + nextEl, ' ');
        await tabThree.keyboard.press('Enter');
        count++;
    }
}

async function closeTabThree(tabTwo, tabThree) {
    await tabTwo.bringToFront();
    await tabThree.close();
}