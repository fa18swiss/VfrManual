export function getOrCreate<T extends HTMLElement>(container: HTMLElement, tag: string): T {
    let item = <T>container.querySelector(tag);
    if (!item) {
        item = <T>document.createElement(tag);
        container.appendChild(item);
    }
    return item;
}
export function localeUpperCompare(a: string, b: string){
    return a.toUpperCase().localeCompare(b.toUpperCase());
}

export function get(url: string, responseType: XMLHttpRequestResponseType): any {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = responseType;
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                    response: xhr.response
                });
            }
        };
        xhr.onerror = () => {
            reject({
                status: xhr.status,
                statusText: xhr.statusText,
                response: xhr.response
            });
        };
        xhr.send();
    });
}
