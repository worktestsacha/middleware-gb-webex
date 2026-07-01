class RcsNavWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._defaultUrl = 'https://cms.greenbureau.com/gb-agent?nav=true&nav-gba=true';
  }

  connectedCallback() {
    this.render(this._defaultUrl);

    window.addEventListener('rcs-navigate', (e) => {
      const url = e.detail?.url;
      if (url) {
        console.log('[RCS Nav] Navigation vers :', url);
        this.render(url);
      }
    });
  }

  render(url) {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; }
        iframe { width: 100%; height: 100%; border: none; }
      </style>
      <iframe src="${url}"></iframe>
    `;
  }
}

customElements.define('rcs-nav-widget', RcsNavWidget);