import { getElement, setChromeStorage } from "./utility.js";
//all the steps required to fill out the webpage
const checklist = [
    {
        funcKey: "getInsertButton",
        success: undefined
    },
    {
        funcKey: "inputText",
        success: undefined
    },
];
async function popup() {
    const startButton = getElement("#myButton");
    startButton.addEventListener("click", async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.id === undefined)
                throw new Error("not seeing tab id");
            const shiftText = getElement("#shiftText"); //get textarea input
            if (shiftText.value === "")
                throw new Error("need to enter shift schedule"); //ensure shift text is there
            const lines = shiftText.value.trim().split('\n');
            const records = []; //each entry of shift and times
            //go over each line and add to shifts
            lines.forEach(eachLine => {
                const [dateStr, shiftPre] = eachLine.trim().split(/\t+/);
                const date = new Date(dateStr);
                //add to shifts
                const shift = shiftPre.toLowerCase();
                if (shift !== "e" && shift !== "n")
                    throw new Error("wrong input entered for shift e/n only");
                records.push({ date, shift, successful: undefined });
            });
            //get other fields
            const formInfo = getAndValidateForm();
            if (formInfo === undefined)
                return;
            //set all storage obj
            const allStorageObj = {
                checklist: checklist,
                formInfo: formInfo,
                records: records
            };
            await setChromeStorage("allStorageObj", allStorageObj);
            //content on tab
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: async () => {
                    try {
                        console.clear();
                        const functionMap = {
                            "getInsertButton": async () => {
                                const rows = document.querySelectorAll('div.row');
                                let foundTaxiHeading = false;
                                rows.forEach(row => {
                                    const h2 = row.querySelector('h2');
                                    if (h2 && h2.innerText.toLowerCase().includes('taxi')) {
                                        foundTaxiHeading = true;
                                        // Search all buttons in the row
                                        const buttons = row.querySelectorAll('button');
                                        let clicked = false;
                                        buttons.forEach(button => {
                                            if (button.hasAttribute('href')) {
                                                clicked = true;
                                                console.log('Clicking button with href:', button);
                                                button.click();
                                            }
                                        });
                                        if (!clicked) {
                                            console.warn(`not seeing input button to click`);
                                        }
                                    }
                                });
                                if (!foundTaxiHeading)
                                    throw new Error("not seeing taxi heading");
                            },
                            "inputText": async () => {
                                console.log(`$2`);
                            }
                        };
                        const seenAllStorageObj = await getAllStorageObj();
                        if (seenAllStorageObj === undefined)
                            throw new Error("not seeing seenAllStorageObj");
                        console.log(`$seenAllStorageObj`, seenAllStorageObj);
                        //go over each record and do the checklist
                        for (let index = 0; index < seenAllStorageObj.records.length; index++) {
                            const eachRecord = seenAllStorageObj.records[index]; //e/g 09/20/2024 e undefined
                            //carry out each checklist item for the record
                            for (let smallIndex = 0; smallIndex < seenAllStorageObj.checklist.length; smallIndex++) {
                                const eachChecklistItem = seenAllStorageObj.checklist[smallIndex]; //each 
                                const seenFuncToRun = functionMap[eachChecklistItem.funcKey];
                                if (seenFuncToRun === undefined)
                                    throw new Error("invalid function key");
                                //run the function
                                await seenFuncToRun();
                                //write updated checklist to storage - updated success
                                seenAllStorageObj.checklist[smallIndex].success = true;
                                await setAllStorageObj(seenAllStorageObj);
                            }
                        }
                        async function getAllStorageObj() {
                            return new Promise((resolve) => {
                                chrome.storage.local.get(["allStorageObj"]).then((res) => {
                                    const value = res["allStorageObj"];
                                    if (value === undefined) {
                                        resolve(undefined);
                                    }
                                    else {
                                        resolve(value);
                                    }
                                });
                            });
                        }
                        async function setAllStorageObj(allStorageObj) {
                            return new Promise((resolve) => {
                                chrome.storage.local.set({ ["allStorageObj"]: allStorageObj }, resolve);
                            });
                        }
                    }
                    catch (error) {
                        console.log(`$error happened in executeScript`, error);
                        const seenError = error;
                        alert(seenError.message);
                    }
                },
            });
        }
        catch (error) {
            console.log(`$error happened in popup`, error);
            const seenError = error;
            alert(seenError.message);
        }
    });
}
popup();
function getAndValidateForm() {
    const reasonEvening = getElement("#reasonEvening").value.trim();
    const reasonNight = getElement("#reasonNight").value.trim();
    const rate = parseInt(getElement("#rate").value);
    const from = getElement("#from").value.trim();
    const to = getElement("#to").value.trim();
    const purpose = getElement("#purpose").value.trim();
    let errors = [];
    if (reasonEvening === "")
        errors.push("Evening shift reasoning is required.");
    if (reasonNight === "")
        errors.push("Night shift reasoning is required.");
    if (![950, 2000].includes(rate))
        errors.push("Rate must be either 950 or 2000.");
    if (from === "")
        errors.push("From field is required.");
    if (to === "")
        errors.push("To field is required.");
    if (purpose === "")
        errors.push("Purpose field is required.");
    if (errors.length > 0) {
        alert("Please fix the following:\n" + errors.join("\n"));
        return;
    }
    // If valid, you can use the values here:
    const result = {
        reasonEvening,
        reasonNight,
        rate,
        from,
        to,
        purpose
    };
    return result;
}
