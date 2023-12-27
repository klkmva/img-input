var imgInputStyleSheet = new CSSStyleSheet();
imgInputStyleSheet.insertRule(`
:host {
  --img-input-size: 100px;
  --img-input-opacity: 0.3;
  --img-input-border-color: black;
  --img-input-border-style: solid;
  --img-input-border-width: 1px;
}`);
imgInputStyleSheet.insertRule(`
img {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: 90%;
  max-height: 90%;
  min-width: 50%;
  transform: translate(-50%, -50%);
}`);
imgInputStyleSheet.insertRule(`
.clear {
  display: none;
  position: absolute;
  top: 0;
  left: calc(100% - 1em);
  cursor: pointer;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: 10pt;
  padding: 2px;
  background-color: bisque;
  width: 1em;
}`);
imgInputStyleSheet.insertRule(`
svg {
  display: none;
}`);
imgInputStyleSheet.insertRule(`
.img-input {
  position: relative;
  opacity: var(--img-input-opacity);
  border-color: var(--img-input-border-color);
  border-style: var(--img-input-border-style);
  border-width: var(--img-input-border-width);
  background-color: white;
  width: var(--img-input-size);
  height: var(--img-input-size);
}`);

class ImgInput extends HTMLElement {
  #internals = this.attachInternals();
  #image = HTMLImageElement;
  #file = HTMLInputElement;
  #reader = new FileReader();

  static formAssociated = true;

  static get observedAttributes() {
    return ["name", "src", "size"];
  }

  get form() { return this.#internals.form; };
  get name() { return this.getAttribute("name"); };
  get type() { return this.localName; };
  get value() { return this.getAttribute("src"); };
  set value(v) { 
    this.#internals.setFormValue(v);
    this.setAttribute("src", v);
  };
  get validity() { return this.#internals.validationMessage; };
  get willValidate() { return this.#internals.willValidate; };

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
    shadow.adoptedStyleSheets.push(imgInputStyleSheet);
    this.shadowRoot.innerHTML = 
    `<div class="img-input" contenteditable="true"><div class="clear">X</div><img src="" alt="aucune image" for="img-file"></div>`+
    `<svg id="noimage" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/></svg>`;

    this.changeSelectorRuleValue = (selector, names, values) => {
      [...this.shadowRoot.adoptedStyleSheets[0].cssRules].forEach((rule) => {
        if (selector == rule.selectorText) {
          if (typeof names == "object" && typeof values == "object" && names.length == values.length) {
            for (let i=0; i<names.length; i++) {
              if (values[i]) rule.style.setProperty(names[i], values[i]);
            }
          }
          else {
            rule.style.setProperty(names, values);
          }
        }
      });
    }
    this.#reader.onloadend = (e) => {
      this.value = e.target.result;
    }
    this.imgBorder = ["--img-input-opacity", "--img-input-border-color", "--img-input-border-style", "--img-input-border-width"];
    this.#image = this.shadowRoot.querySelector("img");
  }
  
  checkValidity() { return this.#internals.checkValidity(); }

  reportValidity() { return this.#internals.reportValidity(); }

  connectedCallback() {
    if (this.form.method != "post") {
      window.alert("form method should be POST !");
    }
    this.value = "";
    let file = this.form.ownerDocument.createElement("input");
    file.setAttribute("type", "file");
    file.setAttribute("style", "display: none;")
    file.setAttribute("name", "img-input-file");
    this.#file = file;
    this.#file.addEventListener("change", (e) => {
      this.value = this.#reader.readAsDataURL(e.target.files[0]);
    });
    this.form.appendChild(file);
    this.addEventListener('dragenter', (e) => {
      e.preventDefault();
      this.changeSelectorRuleValue(":host", this.imgBorder, [null, "red", "dashed", "4px"]);
    });
    this.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.changeSelectorRuleValue(":host", this.imgBorder, [null, "black", "solid", "1px"]);
    });
    this.addEventListener('drop', (e) => {
      e.preventDefault();
      getBlobFromDrop(e, (image) => {
        if (image) {
          if (typeof image == "string") {
            this.xhr = new XMLHttpRequest();
            this.xhr.onload = (e) => {
              this.#reader.readAsDataURL(e.target.response);
            };
            this.xhr.onerror = (e) => {
              e.preventDefault();
              window.alert("Server configuration don't allow drop\nUse copy/paste");
            }
            this.xhr.open('GET', image);
            this.xhr.responseType = 'blob';
            this.xhr.send();
          }
          else {
            this.#reader.readAsDataURL(image);
          }
        }
        else console.log("no blob");
      })
    });
    this.addEventListener("paste", (e) => {
      e.stopPropagation();
      e.preventDefault();
      getBlobFromPaste(e, (image) => {
        if (image) {
          this.#reader.readAsDataURL(image);
        }
        else console.log("no blob");
      });
    });
    this.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) {
        e.stopPropagation();
        e.preventDefault();
        this.#file.click();
      }
    });
    this.addEventListener("keydown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    this.addEventListener("focusin", (e) => {
      e.target.blur();
    })
    this.shadowRoot.querySelector(".clear").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.value = "";
    });
    this.form.addEventListener("submit", (e) => {
      console.log(e.target.method);
      e.target.removeChild(this.#file);
    })
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name == "name") {
    }
    if (name == "size") {
      this.changeSelectorRuleValue(":host", "--img-input-size", newValue);
    }
    if (name == "src") {
      console.log(`change attribute: ${name}: ${oldValue}=>${newValue}`);
      if (newValue) {
        this.#image.src = newValue;
        this.changeSelectorRuleValue(":host", this.imgBorder, [1, "black", "solid", "1px"]);
        this.changeSelectorRuleValue(".clear", "display", "block");
      }
      else {
        this.#image.src = "data:image/svg+xml;charset=utf-8,"+(new XMLSerializer).serializeToString(this.shadowRoot.getElementById("noimage"));
        this.changeSelectorRuleValue(":host", this.imgBorder, [0.3, "black", "solid", "1px"]);
      }
    }
  }
}

customElements.define("img-input", ImgInput);

function getBlobFromPaste(e, callback) {
  if (e.type == "paste") {
    if (e.clipboardData == false) {
      if (typeof(callback) == "function") {
          callback(undefined);
      }
    };
    var items = e.clipboardData.items;  
  }
  if (items == undefined) {
    if (typeof(callback) == "function") {
        callback(undefined);
    }
  };
  for (var i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") == -1) continue;
    var blob = items[i].getAsFile();

    if(typeof(callback) == "function"){
      callback(blob);
    }
  }
}

function getBlobFromDrop(e, callback) {
  var items = e.dataTransfer.items;
  var files = e.dataTransfer.files;
  var blob;
  if (files.length > 0) {
    for (let i=0; i<files.length; i++) {
      if ((files[i].type).indexOf("image") == -1) continue;
      blob = files[i];
      if (typeof(callback) == "function") {
        callback(blob);
      }
    }
  }
  else {
    if (items.length > 0) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].kind == "string" && items[i].type == "text/plain") {
          items[i].getAsString(async (s) => {
            if (typeof(callback) == "function") {
              callback(s);
            }
          });
        }
        else if (items[i].kind == "file") {
          blob = items[i].getAsFile();
          if (typeof(callback) == "function") {
            callback(blob);
          }
        }
      }
    }
  }
}