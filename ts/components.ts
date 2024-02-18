import {BiExclamationTriangleFill} from "./constants"

export class VfrSection extends HTMLElement {
    private button: HTMLButtonElement;
    private lastCheck: HTMLSpanElement;
    public dest: HTMLDivElement;
    public static readonly RefreshClick: string = "refresh-click"

    connectedCallback(){
        const nav = document.createElement("nav")
        this.appendChild(nav);
        nav.setAttribute("class", "navbar navbar-light bg-light")

        const container = document.createElement("div")
        nav.appendChild(container);
        container.classList.add("container-fluid");

        this.button = document.createElement("button");
        container.appendChild(this.button);
        this.button.setAttribute("class", "btn btn-outline-success");
        this.button.innerText = "Refresh";
        this.button.addEventListener("click", e => {
            e.preventDefault();
            this.dispatchEvent(new Event(VfrSection.RefreshClick));
        })

        const title = document.createElement("span");
        container.appendChild(title)
        title.setAttribute("class", "navbar-brand")
        title.innerText = this.getAttribute("data-title")

        this.lastCheck = document.createElement("span");
        container.appendChild(this.lastCheck)
        this.lastCheck.setAttribute("class", "navbar-brand right")
        this.lastCheck.innerText = "N/A"

        const dest = document.createElement("div");
        this.appendChild(dest)
        this.dest = dest;
        dest.setAttribute("class", "list-group dest inop");

        const inop = document.createElement("div");
        inop.setAttribute("data-id", "inop");
        inop.setAttribute("class", "list-group-item list-group-item-action list-group-item-danger inopDescr");
        const svg = document.createElement("svg")
        inop.appendChild(svg)
        svg.outerHTML = BiExclamationTriangleFill;
        const span = document.createElement("span")
        inop.appendChild(span)
        span.textContent = " Fail to get latest data, use with caution";
        dest.appendChild(inop);
    }

    loading(isLoading: boolean) {
        this.button.disabled = isLoading
        if (isLoading)  {
            const span = document.createElement("span");
            span.setAttribute("class", "spinner-border spinner-border-sm");
            span.setAttribute("role", "status");
            span.setAttribute("aria-hidden", "true");
            this.button.prepend(span)
        } else {
            for (const elem of this.button.querySelectorAll("span")) {
                elem.remove();
            }
        }
    }
    manageDate(lastCheck: string) {
        let ok: boolean, date: string;
        if (lastCheck) {
            const lastCheckDate: Date = new Date(lastCheck);
            ok = (new Date().getTime() - lastCheckDate.getTime()) < (1 * 60 * 60 * 1000) // 1 jours
            date = lastCheckDate.toLocaleString();
        } else{
            ok = false;
            date = "N/A";
        }
        this.lastCheck.textContent = date;
        this.dest.classList.toggle("inop", !ok);
        this.lastCheck.classList.toggle("text-danger", !ok);
    }
}
