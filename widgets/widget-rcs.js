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
    const bgColor = count > 0 ? '#e53935' : '#43a047';
    this.innerHTML = `
      <div style="
        background:${bgColor};
        color:white;
        padding:2px 10px;
        border-radius:12px;
        font-size:12px;
        font-weight:600;
        display:flex;
        align-items:center;
        gap:4px;
      ">
        RCS&nbsp;${count}
      </div>
    `;
  }
}

customElements.define('rcs-queue-widget', RcsQueueWidget);