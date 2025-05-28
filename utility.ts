export function getElement<T extends HTMLElement>(
    elSelector: string,
): T;
export function getElement<T extends HTMLElement>(
    elSelector: string,
    option: "all",
): NodeListOf<T>;
export function getElement<T extends HTMLElement>(
    elSelector: string,
    option: undefined,
    searchElement: Document | HTMLElement
): T;
export function getElement<T extends HTMLElement>(
    elSelector: string,
    option: "all",
    searchElement: Document | HTMLElement
): NodeListOf<T>;
export function getElement<T extends HTMLElement>(
    elSelector: string,
    option?: "all",
    searchElement?: Document | HTMLElement
): T | NodeListOf<T> {
    const base = searchElement !== undefined ? searchElement : document;

    if (option === "all") {
        const result = base.querySelectorAll<T>(elSelector);

        return result;

    } else {
        const result = base.querySelector<T>(elSelector);

        if (result === null) {
            throw new Error(`Element not found for selector: ${elSelector}`);
        }

        return result;
    }
}

export function formatDateCustom(date: Date): string {
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).replace(",", ""); // Remove default comma between day and year
}

export async function setChromeStorage<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
    });
}

export async function getChromeStorage<T>(key: string): Promise<T | undefined> {

    return new Promise((resolve) => {
        chrome.storage.local.get(["test"]).then((res) => {
            const value = res["test"];

            if (value === undefined) {
                resolve(undefined);

            } else {
                resolve(value as T);
            }
        });
    })
}

export async function wait(time = 2000) {
    await new Promise((resolve) => setTimeout(() => {
        resolve(true)
    }, time))
}