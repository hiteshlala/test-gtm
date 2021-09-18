function sendEvent(e, v) {
  v = v | `happy faces - ${Date.now()}`;
  e = e | 'button.click';
  if ( dataLayer ) {
    dataLayer.push({
      event: e,
      variable: v
    });
  }
}
