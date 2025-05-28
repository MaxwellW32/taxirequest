import { checklist } from "./background.js";
import { getElement, setChromeStorage } from "./utility.js";
async function popup() {
    const startButton = getElement("#startButton");
    const stopButton = getElement("#stopButton");
    startButton.addEventListener("click", async () => {
        try {
            //show stop button
            stopButton.style.display = "block";
            startButton.style.display = "none";
            const shiftText = getElement("#shiftText"); //get textarea input
            if (shiftText.value === "")
                throw new Error("need to enter shift schedule"); //ensure shift text is there
            const lines = shiftText.value.trim().split('\n');
            const records = []; //each entry of shift and times
            //go over each line and add to shifts
            lines.forEach(eachLine => {
                const [dateStr, shiftPre] = eachLine.trim().split(/\t+/);
                //add to shifts
                const shift = shiftPre.toLowerCase();
                if (shift !== "e" && shift !== "n")
                    throw new Error("wrong input entered for shift e/n only");
                records.push({ date: dateStr, shift, successful: undefined });
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
            //start automation
            chrome.runtime.sendMessage({ type: 'START_AUTOMATION' });
        }
        catch (error) {
            console.log(`$error happened in popup`, error);
            const seenError = error;
            alert(seenError.message);
        }
    });
    stopButton.addEventListener("click", async () => {
        startButton.style.display = "block";
        stopButton.style.display = "none";
        //stop automation
        chrome.runtime.sendMessage({ type: 'STOP_AUTOMATION' });
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
