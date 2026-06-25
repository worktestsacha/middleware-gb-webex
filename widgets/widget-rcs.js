class RcsQueueWidget extends HTMLElement {
  connectedCallback() {
    this.style.display = 'inline-block';
    this.fetchCount();
    this.intervalId = setInterval(() => this.fetchCount(), 5000);
  }

  disconnectedCallback() {
    clearInterval(this.intervalId);
  }

  async fetchCount() {
    try {
      const response = await fetch('https://vm.inspear.org/api/rcs-queue-count');
      const data = await response.json();
      this.render(data.count);
    } catch (err) {
      console.error('Erreur widget RCS:', err);
    }
  }

render(count) {
    this.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #6FB8F2 0%, #4A9FE8 100%);
        color:white;
        padding:4px 12px 4px 6px;
        border-radius:14px;
        font-size:12px;
        font-weight:600;
        display:flex;
        align-items:center;
        gap:6px;
      ">
        <img src="https://www.brandcolorcode.com/media/google-business-messaging-logo.png"
             alt=""
             style="width:18px;height:18px;border-radius:50%;display:block;" />
        <span>${count}</span>
      </div>
    `;
  }
}

customElements.define('rcs-queue-widget', RcsQueueWidget);