export function getElement(elSelector, option, searchElement) {
    const base = searchElement !== undefined ? searchElement : document;
    if (option === "all") {
        const result = base.querySelectorAll(elSelector);
        return result;
    }
    else {
        const result = base.querySelector(elSelector);
        if (result === null) {
            throw new Error(`Element not found for selector: ${elSelector}`);
        }
        return result;
    }
}
export function formatDateCustom(date) {
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).replace(",", ""); // Remove default comma between day and year
}
export async function setChromeStorage(key, value) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
    });
}
export async function getChromeStorage(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get([key]).then((res) => {
            const value = res[key];
            if (value === undefined) {
                resolve(undefined);
            }
            else {
                resolve(value);
            }
        });
    });
}
export async function wait(time = 2000) {
    await new Promise((resolve) => setTimeout(() => {
        resolve(true);
    }, time));
}
