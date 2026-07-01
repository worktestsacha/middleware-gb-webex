(async () => {
  // Attend que le Desktop SDK soit disponible
  const waitForSDK = () => new Promise((resolve) => {
    const check = () => {
      if (window?.Desktop?.actions) {
        resolve(window.Desktop);
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  });

  const Desktop = await waitForSDK();
  console.log('[RCS Headless] SDK disponible');

  // Écoute les changements de tâche active
  Desktop.actions.subscribe((action) => {
    console.log('[RCS Headless] Action reçue :', action.type, action);

    if (action.type === 'TASK_ACCEPTED' || action.type === 'TASK_CONNECTED') {
      const taskId = action.data?.taskId || action.data?.interactionId;
      if (!taskId) return;

      console.log('[RCS Headless] Tâche acceptée :', taskId);

      fetch(`https://vm.inspear.org/api/room-for-task/${taskId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (!data?.roomId) {
            console.log('[RCS Headless] Pas de room GreenBureau pour cette tâche');
            return;
          }

          console.log('[RCS Headless] room_id trouvé :', data.roomId);

          // Met à jour l'iframe de l'onglet SFR avec la bonne conversation
          const url = `https://cms.greenbureau.com/gb-agent/im/${data.roomId}?from-search=false`;

          // Navigue vers l'onglet SFR
          Desktop.actions.navigateTo('rcs-greenbureau');

          // Cherche l'iframe et met à jour son src
          setTimeout(() => {
            const iframes = document.querySelectorAll('agentx-wc-iframe, iframe');
            iframes.forEach(el => {
              if (el.src?.includes('greenbureau') || el.getAttribute('src')?.includes('greenbureau')) {
                el.src = url;
                el.setAttribute('src', url);
                console.log('[RCS Headless] iframe mise à jour :', url);
              }
            });
          }, 800);
        })
        .catch(err => console.error('[RCS Headless] Erreur :', err));
    }
  });
})();