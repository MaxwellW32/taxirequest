import { getChromeStorage, getElement, setChromeStorage } from "./utility.js";

//read date and shift...
//collect nature of service reasoning for evening/night...
//collect rate...
//collect from to and purpose...
//detect the necessary buttons - click em
//detect the necessary inputs - fill em
//save button
//loop

//each line - date - shift should have a completed check to see if done successfully
////each line has a checklist - each button search, input place has a success marker
//in each there should be smaller checks for each button click, text insert - mark completion
//if anything goes wrong alert user, and restart where left off - i.e last success

//to do
//ensure the script keeps running on page change - if not use storage state, read and adapt
//
//
//

type rateType = 950 | 2000

type formInfoType = {
    reasonEvening: string,
    reasonNight: string,
    rate: rateType,
    from: string,
    to: string,
    purpose: string,
}

type recordType = {
    date: Date | String,
    shift: "e" | "n",
    successful: boolean | undefined
}

type clickButtonType = {
    funcKey: string,
    success: boolean | undefined
}

type fillInputType = {
    funcKey: string,
    success: boolean | undefined
}

//go over each line and ensure things are complete
type checklistType = (fillInputType | clickButtonType)[]

//all the steps required to fill out the webpage
const checklist: checklistType = [
    {//click button
        funcKey: "getInsertButton",
        success: undefined
    },
    {//input
        funcKey: "inputText",
        success: undefined
    },
]

type allStorageObjType = {
    checklist: checklistType,
    records: recordType[],
    formInfo: formInfoType
}

async function popup() {
    const startButton = getElement<HTMLButtonElement>("#myButton")

    startButton.addEventListener("click", async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.id === undefined) throw new Error("not seeing tab id")

            const shiftText = getElement<HTMLTextAreaElement>("#shiftText") //get textarea input
            if (shiftText.value === "") throw new Error("need to enter shift schedule") //ensure shift text is there

            const lines = shiftText.value.trim().split('\n');


            const records: recordType[] = []; //each entry of shift and times

            //go over each line and add to shifts
            lines.forEach(eachLine => {
                const [dateStr, shiftPre] = eachLine.trim().split(/\t+/);
                const date = new Date(dateStr);

                //add to shifts
                const shift = shiftPre.toLowerCase() as recordType["shift"]
                if (shift !== "e" && shift !== "n") throw new Error("wrong input entered for shift e/n only")

                records.push({ date, shift, successful: undefined });
            })

            //get other fields
            const formInfo: formInfoType | undefined = getAndValidateForm()
            if (formInfo === undefined) return

            //set all storage obj
            const allStorageObj: allStorageObjType = {
                checklist: checklist,
                formInfo: formInfo,
                records: records
            }
            await setChromeStorage("allStorageObj", allStorageObj)

            //content on tab
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: async () => {
                    try {
                        console.clear();

                        type functionMapType = { [key: string]: () => Promise<void> }
                        const functionMap: functionMapType = {
                            "getInsertButton": async () => {//get the insert button on the new request page
                                const rows = document.querySelectorAll('div.row');

                                let foundTaxiHeading = false

                                rows.forEach(row => {
                                    const h2 = row.querySelector('h2');

                                    if (h2 && h2.innerText.toLowerCase().includes('taxi')) {
                                        foundTaxiHeading = true

                                        // Search all buttons in the row
                                        const buttons = row.querySelectorAll('button');

                                        let clicked = false;

                                        buttons.forEach(button => {
                                            if (button.hasAttribute('href')) {
                                                clicked = true;

                                                console.log('Clicking button with href:', button);
                                                button.click()
                                            }
                                        });

                                        if (!clicked) {
                                            console.warn(`not seeing input button to click`);
                                        }
                                    }
                                });

                                if (!foundTaxiHeading) throw new Error("not seeing taxi heading")

                            },
                            "inputText": async () => {
                                console.log(`$2`);
                            }
                        }

                        const seenAllStorageObj = await getAllStorageObj()
                        if (seenAllStorageObj === undefined) throw new Error("not seeing seenAllStorageObj")

                        console.log(`$seenAllStorageObj`, seenAllStorageObj);

                        //go over each record and do the checklist
                        for (let index = 0; index < seenAllStorageObj.records.length; index++) {
                            const eachRecord: recordType = seenAllStorageObj.records[index]; //e/g 09/20/2024 e undefined

                            //carry out each checklist item for the record
                            for (let smallIndex = 0; smallIndex < seenAllStorageObj.checklist.length; smallIndex++) {
                                const eachChecklistItem: checklistType[number] = seenAllStorageObj.checklist[smallIndex]; //each 

                                const seenFuncToRun: () => Promise<void> | undefined = functionMap[eachChecklistItem.funcKey]
                                if (seenFuncToRun === undefined) throw new Error("invalid function key")

                                //run the function
                                await seenFuncToRun()

                                //write updated checklist to storage - updated success
                                seenAllStorageObj.checklist[smallIndex].success = true
                                await setAllStorageObj(seenAllStorageObj)
                            }
                        }

                        async function getAllStorageObj(): Promise<allStorageObjType | undefined> {
                            return new Promise((resolve) => {
                                chrome.storage.local.get(["allStorageObj"]).then((res) => {
                                    const value = res["allStorageObj"];

                                    if (value === undefined) {
                                        resolve(undefined);

                                    } else {
                                        resolve(value);
                                    }
                                });
                            })
                        }

                        async function setAllStorageObj(allStorageObj: allStorageObjType): Promise<void> {
                            return new Promise((resolve) => {
                                chrome.storage.local.set({ ["allStorageObj"]: allStorageObj }, resolve);
                            });
                        }

                    } catch (error) {
                        console.log(`$error happened in executeScript`, error);
                        const seenError = error as Error
                        alert(seenError.message)
                    }
                },
            });

        } catch (error) {
            console.log(`$error happened in popup`, error);
            const seenError = error as Error
            alert(seenError.message)
        }
    });
}
popup();

function getAndValidateForm() {
    const reasonEvening = getElement<HTMLInputElement>("#reasonEvening").value.trim();
    const reasonNight = getElement<HTMLInputElement>("#reasonNight").value.trim();

    const rate = parseInt(getElement<HTMLInputElement>("#rate").value) as rateType;

    const from = getElement<HTMLInputElement>("#from").value.trim();
    const to = getElement<HTMLInputElement>("#to").value.trim();
    const purpose = getElement<HTMLInputElement>("#purpose").value.trim();

    let errors = [];

    if (reasonEvening === "") errors.push("Evening shift reasoning is required.");
    if (reasonNight === "") errors.push("Night shift reasoning is required.");
    if (![950, 2000].includes(rate)) errors.push("Rate must be either 950 or 2000.");
    if (from === "") errors.push("From field is required.");
    if (to === "") errors.push("To field is required.");
    if (purpose === "") errors.push("Purpose field is required.");

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

    return result
}