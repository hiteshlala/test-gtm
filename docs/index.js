function sendEvent(e, v) {
  e = e || 'button.click';
  v = v || `happy faces - ${Date.now()}`;
  const event = {
    event: e,
    variable: v
  };
  console.log(event);
  if ( dataLayer ) {
    dataLayer.push(event);
  }
}
