class RcsConversationWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._taskId = null;
  }

  static get observedAttributes() {
    return ['task-id'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'task-id' && newVal && newVal !== oldVal) {
      this._taskId = newVal;
      this.loadConversation(newVal);
    }
  }

  connectedCallback() {
    this.render('Sélectionnez une interaction RCS pour afficher la conversation.');
    const initial = this.getAttribute('task-id');
    if (initial) {
      this._taskId = initial;
      this.loadConversation(initial);
    }
  }

  async loadConversation(taskId) {
    this.render('Chargement de la conversation...');
    try {
      const res = await fetch(`https://vm.inspear.org/api/room-for-task/${taskId}`);
      if (!res.ok) {
        this.render("Aucune conversation GreenBureau associée à cette tâche pour l'instant.");
        return;
      }
      const data = await res.json();
      this.renderIframe(data.roomId);
    } catch (err) {
      this.render('Erreur de chargement : ' + err.message);
    }
  }

  renderIframe(roomId) {
    const url = `https://cms.greenbureau.com/gb-agent/im/${roomId}?from-search=false`;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; }
        iframe { width: 100%; height: 100%; border: none; }
      </style>
      <iframe src="${url}"></iframe>
    `;
  }

  render(message) {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; }
        .placeholder {
          display: flex; align-items: center; justify-content: center;
          height: 100%; color: #666; font-family: sans-serif; text-align: center; padding: 16px;
        }
      </style>
      <div class="placeholder">${message}</div>
    `;
  }
}

customElements.define('rcs-conversation-widget', RcsConversationWidget);