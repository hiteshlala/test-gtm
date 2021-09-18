const can = document.getElementById( 'map' );
const coords = document.getElementById( 'coords' );
const ctx = can.getContext( '2d' );
const traderdiv = document.getElementById( 'traderdiv' );
const sellOffers = document.getElementById( 'num-sells' );
const numTraders = document.getElementById('num-traders');
const hubswithTraders = document.getElementById('trade-hub-with-trader');
const hubSearch = document.getElementById('hub-search');
const hubList = document.getElementById('hub-list');
const clearHubSearch = document.getElementById('x-button');
const mapRegions = document.getElementById( 'map-regions' );

const objects = [];

let hubSearchResult;
let dragging = false;
let pointx = 0;
let pointy = 0;
let showRegions = false;

// these are equivalent to illyriad map
const x = { min:-1000, max: 1000 };
const y = { min:-3300, max: 1000 };

can.width = Math.abs( x.max - x.min );
can.height = Math.abs( y.max - y.min );

const styleHeight = 600;
const styleWidth = Math.round( can.width * 660 / can.height);
can.style.height = `${ styleHeight }px`;
can.style.width = `${ styleWidth }px`;

can.style.backgroundColor = 'black';//'papayawhip';
can.style.border = '1px solid black';

function xyTouv( xy ) {
  return { 
    u: Math.round( ( xy.x + Math.abs(x.min) ) / ( Math.abs(x.min) + Math.abs( x.max ) ) * can.width ),
    v: Math.round( -( xy.y - y.max ) / ( Math.abs(y.min) + Math.abs( y.max ) ) * can.height )
  };
}

function winXyToCanUv( uv ) {
  return {
    x: Math.round(uv.u / styleWidth * can.width ),
    y: Math.round( uv.v / styleHeight * can.height )
  }
}

function hoverPopupContent(hovered) {
  return hovered ? `
    <div>
      <div>${hovered.name}</div>
      <div>x:${hovered.x} y:${hovered.y}</div>
      ${ hovered.trades ? `<div>Selling Items: ${hovered.trades}</div>` : ''} 
    </div>`
    : ``;
}
can.onmousemove = e => {
  if ( dragging ) {
    clear();
    const x = ( e.offsetX - pointx ) * 5;
    const y = ( e.offsetY - pointy ) * 5;
    ctx.translate( x, y );
    draw( objects );
    pointx = e.offsetX;
    pointy = e.offsetY;
  }
  else {
    const winxy = { u: parseInt(e.offsetX), v: parseInt( e.offsetY ) };
    const xy = winXyToCanUv( winxy );
    let hovered;
    objects.forEach( o => {
      // only works when zoomed I think because not enough resolution 
      if ( ctx.isPointInPath( o.path, xy.x, xy.y ) ) { 
        hovered = o;
      }
    });
    // coords.innerText = hovered ? 
    //   `${hovered.name} x:${hovered.x} y:${hovered.y} u:${hovered.u} v:${hovered.v}`: 
    //   `x:${xy.x} y:${xy.y} u:${winxy.u} v:${winxy.v}`;
    coords.innerHTML = hoverPopupContent(hovered);
    coords.style.position = 'absolute';
    coords.style.top = (e.offsetY + 20) + 'px';
    coords.style.left = (e.offsetX + 20) + 'px';
  }
}

can.onwheel = e => {
  e.preventDefault();
  e.stopPropagation();
  clear();
  const scale = e.deltaY > 0 ? 0.01 : -0.01;
  const T = ctx.getTransform();
  T.a += scale;
  T.d += scale;
  
  ctx.setTransform( T );
  draw( objects );
};

can.onmousedown = e => {
  pointx = e.offsetX;
  pointy = e.offsetY;
  dragging = true;
}

can.onmouseup = e => {
  dragging = false;
}

can.onmouseleave = e => {
  coords.innerText = '';
}
hubSearch.oninput = searchAndHighlightHub;
function searchAndHighlightHub( event ) {
  const name = ( event.target.value ).trim();
  const tradeHub = hubs.find( n => (n.name === name || n.name.toLowerCase() === name) );
  if ( hubSearchResult ) {
    const index = objects.indexOf( hubSearchResult );
    objects.splice( index, 1);
    redraw(objects);
    hubSearchResult = undefined;
  }
  if ( tradeHub ) {
    hubSearchResult = createHighlightHubObject(tradeHub);
    hubSearchResult.fill = 'orange';
    objects.push( hubSearchResult );
    redraw(objects);
  }
}

clearHubSearch.onclick = () => {
  hubSearch.value = '';
  searchAndHighlightHub({ target: { value: '' } });
};

hubs.forEach( h => {
  objects.push( createItem( h, 'green', { trades: trades[h.name] } ) );

  const hubListItem = document.createElement('option');
  hubListItem.innerText = h.name;
  hubList.appendChild( hubListItem );
});

towns.forEach( h => {
  objects.push( createItem( h, 'red') );
});

function createItem( item, fill, other ) {
  const uv = xyTouv( item );
  const p = new Path2D();
  const r = 15;
  let color = fill;
  // red - town
  // green - hub
  // orange - hub with trader
  // pink - hub with trade
  // yellow - hub with trader with trade
  if ( trades[ item.name ]  && traders[ item.name ] ) {
    color = 'yellow';
  }
  else if ( trades[ item.name ] ) {
    color = 'pink';
  }
  else if ( traders[ item.name ] ) {
    color = 'blue';
  }

  p.arc( uv.u, uv.v, r, 0, 2 * Math.PI );
  return {
    ...other,
    ...item,
    ...uv,
    path: p,
    fill: color,
  };
}

function createHighlightHubObject( item ) {
  const uv = xyTouv( item );
  const p = new Path2D();
  const r = 30;
  let color = 'white';
  p.arc( uv.u, uv.v, r, 0, 2 * Math.PI );
  return {
    ...item,
    ...uv,
    path: p,
    fill: color,
  };
}

function draw( objects ) {
  showRegions && ctx.drawImage(mapRegions, 0, 0, 2001, 4290, 0, 0, can.width, can.height);
  objects.forEach( i => {
    ctx.save();
    ctx.fillStyle = i.fill;
    ctx.fill( i.path );
    ctx.restore();
  })
}

function clear() {
  // ctx.setTransform( 1, 0, 0, 1, 0, 0 );
  ctx.clearRect( -100, -100, can.width + 100, can.height + 100 );
}

function redraw( objects ) {
  clear();
  draw( objects );
}

window.onload = () => {
  const traderHubNames = Object.keys(traders);
  sellOffers.innerText = Object.keys(trades).length;
  numTraders.innerText = traderHubNames.length;
  draw( objects );

  traderHubNames.forEach( t => {
    const tradeHub = hubs.find( n => n.name === t);
    const li = document.createElement('li');
    let hoveredObj;
    li.innerText = `${tradeHub.name} - (${tradeHub.x}, ${tradeHub.y})`;
    li.onmouseenter = () => {
      hoveredObj = createHighlightHubObject(tradeHub);
      objects.push(hoveredObj);
      redraw(objects);

    };
    li.onmouseleave =() => {
      const index = objects.indexOf(hoveredObj);
      objects.splice( index, 1);
      redraw(objects);
    };
    hubswithTraders.appendChild(li);
  })
}

function dist( a, b ) {
  return Math.sqrt( (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) );
}

function toggleRegionBckgrnd() {
  showRegions = !showRegions;
  redraw( objects );
}
