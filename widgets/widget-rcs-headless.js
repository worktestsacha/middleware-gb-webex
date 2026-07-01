class RcsHeadlessWidget extends HTMLElement {
  connectedCallback() {
    console.log('[RCS Headless] Widget chargé et connecté');

    // Log tous les événements custom qui passent sur window
    const originalDispatch = window.dispatchEvent.bind(window);
    window.dispatchEvent = (event) => {
      if (event.type && !event.type.startsWith('mouse') && !event.type.startsWith('pointer')) {
        console.log('[RCS Headless] Événement window :', event.type, event.detail || '');
      }
      return originalDispatch(event);
    };

    // Écoute également les événements sur document
    document.addEventListener('*', (e) => {
      console.log('[RCS Headless] Événement document :', e.type);
    });

    // Tente d'accéder au SDK via différentes méthodes connues
    console.log('[RCS Headless] window.Desktop :', !!window.Desktop);
    console.log('[RCS Headless] window.AgentX :', !!window.AgentX);
    console.log('[RCS Headless] window.wxcc :', !!window.wxcc);

    // Écoute les événements AgentX connus
    ['agentx-action', 'agentx-store-change', 'TASK_ACCEPTED', 'TASK_CONNECTED', 
     'AgentContactAssigned', 'task-accepted', 'interaction-accepted'].forEach(eventName => {
      window.addEventListener(eventName, (e) => {
        console.log(`[RCS Headless] Événement "${eventName}" reçu :`, e.detail || e);
      });
    });
  }
}

customElements.define('rcs-headless-widget', RcsHeadlessWidget);