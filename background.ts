const TARGET_URL = "https://ss.myhrplus.gov.jm/MyHrPlusSS";

export type rateType = 950 | 2000

export type formInfoType = {
    reasonEvening: string,
    reasonNight: string,
    rate: rateType,
    from: string,
    to: string,
    purpose: string,
}

export type recordType = {
    date: String,
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
export const checklist: checklistType = [
    {//click button
        funcKey: "clickInsertButton",
        success: undefined
    },
    {//input
        funcKey: "inputDate",
        success: undefined
    },
    {
        funcKey: "inputNatureOfService",
        success: undefined
    },
    {
        funcKey: "inputRate",
        success: undefined
    },
    {
        funcKey: "clickInsertTripsButton",
        success: undefined
    },
    {
        funcKey: "inputFrom",
        success: undefined
    },
    {
        funcKey: "inputTo",
        success: undefined
    },
    {
        funcKey: "inputPurpose",
        success: undefined
    },
    {
        funcKey: "clickSaveButton",
        success: undefined
    },
    {
        funcKey: "clickSaveButton",
        success: undefined
    },
]

export type allStorageObjType = {
    checklist: checklistType,
    records: recordType[],
    formInfo: formInfoType
}

chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'START_AUTOMATION') {
        console.log('Automation triggered from popup.');

        //set running
        await setRunningStatus(true)
        runAutomationLoop();
    }

    if (message.type === 'STOP_AUTOMATION') {
        //stop running
        await setRunningStatus(false)
    }
});

async function runAutomationLoopOld() {
    //start a loop where it runs the interval
    const running = await getRunningStatus()
    if (!running) return;


    const canContinue = await new Promise(async resolve => {
        // const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({ url: `${TARGET_URL}/*` });
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id === undefined) {
            resolve(false)
            return
        }

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async () => {
                try {
                    console.clear();
                    console.log(`$runAutomationLoop started`);

                    const seenAllStorageObj = await getAllStorageObj()
                    if (seenAllStorageObj === undefined) throw new Error("not seeing seenAllStorageObj")

                    type functionMapType = { [key: string]: (eachRecord: recordType) => Promise<void> }
                    const functionMap: functionMapType = {
                        "clickInsertButton": async () => {//get the insert button on the new request page
                            let foundTaxiHeading = false

                            const rows = document.querySelectorAll('div.row');
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
                        "inputDate": async (eachRecord: recordType) => {
                            const seenDateElement: HTMLInputElement | null = document.querySelector('#ValDate');
                            if (seenDateElement === null) throw new Error("not seeing date element")

                            const seenDate = new Date(`${eachRecord.date}`)
                            const year = seenDate.getFullYear();
                            const month = String(seenDate.getMonth() + 1).padStart(2, '0');
                            const day = String(seenDate.getDate()).padStart(2, '0');
                            const formattedDate = `${year}/${month}/${day}`;

                            //adding to the date field
                            seenDateElement.value = formattedDate

                            // Trigger events to notify the system
                            seenDateElement.dispatchEvent(new Event('change', { bubbles: true }));
                            seenDateElement.dispatchEvent(new Event('blur', { bubbles: true })); // simulate leaving the field

                        },
                        "inputNatureOfService": async (eachRecord: recordType) => {
                            const seenNatureOfServiceInput: HTMLInputElement | null = document.querySelector('#ValPurpose');
                            if (seenNatureOfServiceInput === null) throw new Error("not seeing seenNatureOfServiceInput element")

                            //adding to the seenNatureOfServiceInput field
                            seenNatureOfServiceInput.value = eachRecord.shift === "e" ? seenAllStorageObj.formInfo.reasonEvening : seenAllStorageObj.formInfo.reasonNight
                        },
                        "inputRate": async () => {
                            const rateSelectElement: HTMLSelectElement | null = document.querySelector('#ValCodclaim');
                            if (rateSelectElement === null) throw new Error("not seeing rateSelectElement element")

                            const targetLabel = seenAllStorageObj.formInfo.rate === 950 ? "Taxi <15km" : "Taxi >= 15km";

                            // Find the matching <option>
                            const matchingOption = Array.from(rateSelectElement.options).find(
                                option => option.textContent?.trim() === targetLabel
                            );

                            if (matchingOption === undefined) throw new Error("not seeing expected rate text")

                            // Set the value on the <select>
                            rateSelectElement.value = matchingOption.value;
                        },
                        "clickInsertTripsButton": async () => {
                            let foundTripsHeading = false

                            const rows = document.querySelectorAll('div.row');
                            rows.forEach(row => {
                                const h2 = row.querySelector('h2');

                                if (h2 && h2.innerText.toLowerCase().includes('trips')) {
                                    foundTripsHeading = true

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

                            if (!foundTripsHeading) throw new Error("not seeing trips heading")
                        },
                        "inputFrom": async () => {
                            const seenFromInput: HTMLInputElement | null = document.querySelector('#ValFrom');
                            if (seenFromInput === null) throw new Error("not seeing seenFromInput element")

                            //adding to the seenFromInput field
                            seenFromInput.value = seenAllStorageObj.formInfo.from
                        },
                        "inputTo": async () => {
                            const seenToInput: HTMLInputElement | null = document.querySelector('#ValTo');
                            if (seenToInput === null) throw new Error("not seeing seenToInput element")

                            //adding to the seenToInput field
                            seenToInput.value = seenAllStorageObj.formInfo.to
                        },
                        "inputPurpose": async () => {
                            const seenPurposeInput: HTMLTextAreaElement | null = document.querySelector('#ValPurpose');
                            if (seenPurposeInput === null) throw new Error("not seeing seenPurposeInput element")

                            //adding to the seenPurposeInput field
                            seenPurposeInput.value = seenAllStorageObj.formInfo.purpose
                        },
                        "clickSaveButton": async () => {
                            const submitButton: HTMLButtonElement | null = document.querySelector('button[type="submit"]');
                            if (submitButton === null) throw new Error("not seeing submitButton")

                            submitButton.click()
                        },
                    }

                    const nextRecordIndex = seenAllStorageObj.records.findIndex(r => !r.successful);
                    if (nextRecordIndex === -1) {
                        console.log("All records processed");

                        //stop automation
                        chrome.runtime.sendMessage({ type: 'STOP_AUTOMATION' });
                        return;
                    }

                    const currentRecord = seenAllStorageObj.records[nextRecordIndex];
                    const checklist = seenAllStorageObj.checklist;

                    const nextChecklistIndex = checklist.findIndex(item => !item.success);
                    if (nextChecklistIndex === -1) {
                        // All checklist items for this record are done
                        seenAllStorageObj.records[nextRecordIndex].successful = true;

                        // Reset checklist for next record
                        seenAllStorageObj.checklist = seenAllStorageObj.checklist.map(item => ({ ...item, success: undefined }));

                        await setAllStorageObj(seenAllStorageObj);
                        return;
                    }

                    const checklistItem = checklist[nextChecklistIndex];

                    console.log("Starting automation for:", currentRecord, checklistItem.funcKey);

                    const funcToRun = functionMap[checklistItem.funcKey];
                    if (!funcToRun) throw new Error("Invalid function key");
                    await funcToRun(currentRecord);
                    resolve(true)

                    // Mark checklist item as done
                    seenAllStorageObj.checklist[nextChecklistIndex].success = true;
                    await setAllStorageObj(seenAllStorageObj);





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
                    const seenError = error as Error

                    alert(seenError.message)
                    console.log(`$error happened in executeScript`, seenError);

                    //stop automation
                    chrome.runtime.sendMessage({ type: 'STOP_AUTOMATION' });
                    resolve(false)
                }
            },
        });
    })
    if (!canContinue) return

    //wait 2 seconds
    await wait()

    runAutomationLoop()
}

async function runAutomationLoop() {
    console.log(`$runAutomationLoop`);
    const running = await getRunningStatus();
    if (!running) return;

    const canContinue = await new Promise<boolean>(async (resolve) => {
        const listener = (message: any) => {
            if (message.type === "AUTOMATION_STEP_DONE") {
                chrome.runtime.onMessage.removeListener(listener);
                resolve(message.success);
            }
        };
        chrome.runtime.onMessage.addListener(listener);

        // const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({ url: `${TARGET_URL}/*` });
        const tab = tabs[0];

        if (tab.id === undefined) {
            chrome.runtime.sendMessage({ type: 'STOP_AUTOMATION' });
            chrome.runtime.sendMessage({ type: "AUTOMATION_STEP_DONE", success: false });

            return
        };

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async () => {
                try {
                    const seenAllStorageObj = await getAllStorageObj();
                    if (!seenAllStorageObj) throw new Error("not seeing seenAllStorageObj");

                    type functionMapType = { [key: string]: (eachRecord: recordType) => Promise<void> }
                    const functionMap: functionMapType = {
                        "clickInsertButton": async () => {//get the insert button on the new request page
                            let foundTaxiHeading = false

                            const rows = document.querySelectorAll('div.row');
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
                        "inputDate": async (eachRecord: recordType) => {
                            const seenDateElement: HTMLInputElement | null = document.querySelector('#ValDate');
                            if (seenDateElement === null) throw new Error("not seeing date element")

                            const seenDate = new Date(`${eachRecord.date}`)
                            const year = seenDate.getFullYear();
                            const month = String(seenDate.getMonth() + 1).padStart(2, '0');
                            const day = String(seenDate.getDate()).padStart(2, '0');
                            const formattedDate = `${year}/${month}/${day}`;

                            //adding to the date field
                            seenDateElement.value = formattedDate

                            // Trigger events to notify the system
                            seenDateElement.dispatchEvent(new Event('change', { bubbles: true }));
                            seenDateElement.dispatchEvent(new Event('blur', { bubbles: true })); // simulate leaving the field

                        },
                        "inputNatureOfService": async (eachRecord: recordType) => {
                            const seenNatureOfServiceInput: HTMLInputElement | null = document.querySelector('#ValPurpose');
                            if (seenNatureOfServiceInput === null) throw new Error("not seeing seenNatureOfServiceInput element")

                            //adding to the seenNatureOfServiceInput field
                            seenNatureOfServiceInput.value = eachRecord.shift === "e" ? seenAllStorageObj.formInfo.reasonEvening : seenAllStorageObj.formInfo.reasonNight
                        },
                        "inputRate": async () => {
                            const rateSelectElement: HTMLSelectElement | null = document.querySelector('#ValCodclaim');
                            if (rateSelectElement === null) throw new Error("not seeing rateSelectElement element")

                            const targetLabel = seenAllStorageObj.formInfo.rate === 950 ? "Taxi <15km" : "Taxi >= 15km";

                            // Find the matching <option>
                            const matchingOption = Array.from(rateSelectElement.options).find(
                                option => option.textContent?.trim() === targetLabel
                            );

                            if (matchingOption === undefined) throw new Error("not seeing expected rate text")

                            // Set the value on the <select>
                            rateSelectElement.value = matchingOption.value;
                        },
                        "clickInsertTripsButton": async () => {
                            let foundTripsHeading = false

                            const rows = document.querySelectorAll('div.row');
                            rows.forEach(row => {
                                const h2 = row.querySelector('h2');

                                if (h2 && h2.innerText.toLowerCase().includes('trips')) {
                                    foundTripsHeading = true

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

                            if (!foundTripsHeading) throw new Error("not seeing trips heading")
                        },
                        "inputFrom": async () => {
                            const seenFromInput: HTMLInputElement | null = document.querySelector('#ValFrom');
                            if (seenFromInput === null) throw new Error("not seeing seenFromInput element")

                            //adding to the seenFromInput field
                            seenFromInput.value = seenAllStorageObj.formInfo.from
                        },
                        "inputTo": async () => {
                            const seenToInput: HTMLInputElement | null = document.querySelector('#ValTo');
                            if (seenToInput === null) throw new Error("not seeing seenToInput element")

                            //adding to the seenToInput field
                            seenToInput.value = seenAllStorageObj.formInfo.to
                        },
                        "inputPurpose": async () => {
                            const seenPurposeInput: HTMLTextAreaElement | null = document.querySelector('#ValPurpose');
                            if (seenPurposeInput === null) throw new Error("not seeing seenPurposeInput element")

                            //adding to the seenPurposeInput field
                            seenPurposeInput.value = seenAllStorageObj.formInfo.purpose
                        },
                        "clickSaveButton": async () => {
                            const submitButton: HTMLButtonElement | null = document.querySelector('button[type="submit"]');
                            if (submitButton === null) throw new Error("not seeing submitButton")

                            submitButton.click()
                        },
                    }

                    const nextRecordIndex = seenAllStorageObj.records.findIndex(r => !r.successful);
                    if (nextRecordIndex === -1) {
                        chrome.runtime.sendMessage({ type: 'STOP_AUTOMATION' });
                        chrome.runtime.sendMessage({ type: "AUTOMATION_STEP_DONE", success: false });
                        return;
                    }

                    const currentRecord = seenAllStorageObj.records[nextRecordIndex];
                    const checklist = seenAllStorageObj.checklist;
                    const nextChecklistIndex = checklist.findIndex(item => !item.success);

                    if (nextChecklistIndex === -1) {
                        seenAllStorageObj.records[nextRecordIndex].successful = true;
                        seenAllStorageObj.checklist = seenAllStorageObj.checklist.map(item => ({ ...item, success: undefined }));
                        await setAllStorageObj(seenAllStorageObj);
                        chrome.runtime.sendMessage({ type: "AUTOMATION_STEP_DONE", success: true });
                        return;
                    }

                    const checklistItem = checklist[nextChecklistIndex];
                    const funcToRun = functionMap[checklistItem.funcKey];
                    if (!funcToRun) throw new Error("Invalid function key");

                    await funcToRun(currentRecord);

                    seenAllStorageObj.checklist[nextChecklistIndex].success = true;
                    await setAllStorageObj(seenAllStorageObj);

                    chrome.runtime.sendMessage({ type: "AUTOMATION_STEP_DONE", success: true });

                } catch (error) {
                    const seenError = error as Error;
                    alert(seenError.message);
                    console.error("Error in automation script:", seenError);
                    chrome.runtime.sendMessage({ type: "AUTOMATION_STEP_DONE", success: false });
                    chrome.runtime.sendMessage({ type: "STOP_AUTOMATION" });
                }

                async function getAllStorageObj(): Promise<allStorageObjType | undefined> {
                    return new Promise((resolve) => {
                        chrome.storage.local.get(["allStorageObj"]).then((res) => {
                            resolve(res["allStorageObj"]);
                        });
                    });
                }

                async function setAllStorageObj(allStorageObj: allStorageObjType): Promise<void> {
                    return new Promise((resolve) => {
                        chrome.storage.local.set({ allStorageObj }, resolve);
                    });
                }
            },
        });
    });

    if (!canContinue) return;

    await wait(); // your delay function
    runAutomationLoop();
}


async function getRunningStatus(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.storage.local.get(["running"], (res) => {
            resolve(res.running === true);
        });
    });
}

async function setRunningStatus(value: boolean): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ running: value }, resolve);
    });
}

async function wait(time = 2000) {
    await new Promise((resolve) => setTimeout(() => {
        resolve(true)
    }, time))
}