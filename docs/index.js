function sendEvent(e, v) {
  e = e || 'button.click';
  v = v || `happy faces - ${Date.now()}`;
  const event = {
    event: e,
    variable: v
  };
  // console.log(event);
  if ( dataLayer ) {
    dataLayer.push(event);
  }
}

function toggleConsent() {
  const cookies = document.cookie.split(';')
  .filter(f => !!f)
  .map(v => {
    const [ key, value ] = v.split('=').map(a=> a.trim());
    return { key, value };
  });
  if ( cookies.length ) {
    for( let i = 0; i < cookies.length; i++) {
      const c = cookies[i];
      if( c.key === 'consent') {
        c.value === 'true' ? c.value = 'false' : c.value = 'true';
      }
    }
  }
  else {
    cookies.push({key: 'consent', value: 'false' });
  }
  const toSet = cookies.reduce((res, cookie) => `${res}${cookie.key}=${cookie.value};samesite;`,'');
  document.cookie = toSet;
  console.log(toSet)
}
