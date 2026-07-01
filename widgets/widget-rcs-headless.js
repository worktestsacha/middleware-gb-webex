class RcsHeadlessWidget extends HTMLElement {
  constructor() {
    super();
    console.log('[RCS Headless] Constructor appelé');
    this._init();
  }

  async _init() {
    console.log('[RCS Headless] Init');

    // Écoute tous les événements custom sur window
    const originalDispatch = window.dispatchEvent.bind(window);
    window.dispatchEvent = function(event) {
      if (event.type && !['mousemove','pointermove','scroll'].includes(event.type)) {
        console.log('[RCS Headless] window event :', event.type, event.detail || '');
      }
      return originalDispatch(event);
    };

    // Écoute les événements AgentX connus
    [
      'agentx-action',
      'AgentContactAssigned', 
      'task-accepted',
      'TASK_ACCEPTED',
      'interaction-accepted',
      'agentx-store-change'
    ].forEach(name => {
      window.addEventListener(name, (e) => {
        console.log(`[RCS Headless] "${name}" :`, e.detail || e.data || '');
      });
    });

    console.log('[RCS Headless] Listeners enregistrés');
    console.log('[RCS Headless] window.Desktop :', typeof window.Desktop);
    console.log('[RCS Headless] window.AgentX :', typeof window.AgentX);
  }
}

customElements.define('rcs-headless-widget', RcsHeadlessWidget);