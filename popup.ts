import { allStorageObjType, checklist, formInfoType, rateType, recordType } from "./background.js";
import { getElement, setChromeStorage } from "./utility.js";

//button click starts the background worker
//on loop it calls the content script until user stopped - storage state
//content script pullls from storage and goes to the latest record, and latest automation
//saves changes
//loops by sending another signal

//to do
//ensure the script keeps running on page change - if not use storage state, read and adapt
//
//
//

async function popup() {
    const startButton = getElement<HTMLButtonElement>("#startButton")
    const stopButton = getElement<HTMLButtonElement>("#stopButton")

    startButton.addEventListener("click", async () => {
        try {
            //show stop button
            stopButton.style.display = "block"

            const shiftText = getElement<HTMLTextAreaElement>("#shiftText") //get textarea input
            if (shiftText.value === "") throw new Error("need to enter shift schedule") //ensure shift text is there

            const lines = shiftText.value.trim().split('\n');
            const records: recordType[] = []; //each entry of shift and times

            //go over each line and add to shifts
            lines.forEach(eachLine => {
                const [dateStr, shiftPre] = eachLine.trim().split(/\t+/);

                //add to shifts
                const shift = shiftPre.toLowerCase() as recordType["shift"]
                if (shift !== "e" && shift !== "n") throw new Error("wrong input entered for shift e/n only")

                records.push({ date: dateStr, shift, successful: undefined });
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

            //start automation
            chrome.runtime.sendMessage({ type: 'START_AUTOMATION' });

        } catch (error) {
            console.log(`$error happened in popup`, error);
            const seenError = error as Error
            alert(seenError.message)
        }
    });

    stopButton.addEventListener("click", async () => {
        //stop automation
        chrome.runtime.sendMessage({ type: 'STOP_AUTOMATION' });
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