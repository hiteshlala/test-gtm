const can = document.getElementById( 'map' );
const coords = document.getElementById( 'coords' );
const ctx = can.getContext( '2d' );
const mineralListEl = document.getElementById('minerals-list');
const icons = document.getElementById( 'icons' );
const mapRegions = document.getElementById( 'map-regions' );
const mineralShowOnlys = [];
let drawAllEl;

const objects = [];
let todraw = [];

let hubSearchResult;
let dragging = false;
let pointx = 0;
let pointy = 0;
let showRegions = false;
let showLightBkgrnd = false;

let drawCities = false;

// these are equivalent to illyriad map
const x = { min:-1000, max: 1000 };
const y = { min:-3300, max: 1000 };

can.width = Math.abs( x.max - x.min );
can.height = Math.abs( y.max - y.min );

const styleHeight = 600;
const styleWidth = Math.round( can.width * 660 / can.height);
can.style.height = `${ styleHeight }px`;
can.style.width = `${ styleWidth }px`;

can.style.backgroundColor = 'black';
// can.style.border = '1px solid black';

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
      <div>${hovered.name || hovered.type}</div>
      <div>x:${hovered.x} y:${hovered.y}</div>
      ${ hovered.quantity ? `<div>Quantity: ${hovered.quantity}</div>` : ''} 
    </div>`
    : ``;
}
can.onmousemove = e => {
  if ( dragging ) {
    clear();
    const x = ( e.offsetX - pointx ) * 5;
    const y = ( e.offsetY - pointy ) * 5;
    ctx.translate( x, y );
    draw();
    pointx = e.offsetX;
    pointy = e.offsetY;
  }
  else {
    const winxy = { u: parseInt(e.offsetX), v: parseInt( e.offsetY ) };
    const xy = winXyToCanUv( winxy );
    let hovered;
    todraw.forEach( o => {
      // only works when zoomed I think because not enough resolution 
      if ( ctx.isPointInPath( o.path, xy.x, xy.y ) ) { 
        hovered = o;
      }
    });
    coords.innerHTML = hoverPopupContent(hovered);
    coords.style.position = 'absolute';
    coords.style.top = (e.offsetY + 20) + 'px';
    coords.style.left = (e.offsetX + 20) + 'px';
    coords.style.color = can.style.backgroundColor === 'black' ? 'white' : 'black';
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
  draw();
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

towns.forEach( h => {
  objects.push( createItem( h, 'red', 5) );
});

function createItem( item, fill, radius, icon ) {
  const uv = xyTouv( item );
  const p = new Path2D();
  const r = radius;
  let color = fill;
  const { x, y, dx, dy } = icon || {};
  if ( icon ) {
    p.rect( uv.u, uv.v, r, r);
  }
  else {
    p.arc( uv.u, uv.v, r, 0, 2 * Math.PI );
    // p.rect( uv.u, uv.v, r, r);
  }

  return {
    ...item,
    ...uv,
    path: p,
    fill: color,
    icon: icon ? [icons, x, y, dx, dy, uv.u, uv.v, r, r] : undefined
  };
}

function draw() {
  showRegions && ctx.drawImage(mapRegions, 0, 0, 2001, 4290, 0, 0, can.width, can.height);
  if ( drawAllEl.checked ) {
    todraw = drawCities ? objects : objects.filter( o => !o.id);
  }
  else {
    const checked = mineralShowOnlys.reduce((checked, curr) => {
      curr.checked && checked.push( curr.id);
      return checked;
    }, []);
    todraw = objects.filter( o => {
      if ( o.name ) return o;
      if ( checked.indexOf( o.type ) > -1 ) return o;
    });
    todraw = drawCities ? todraw : todraw.filter( o => !o.id);
  }

  todraw.forEach( i => {
    ctx.save();
    if (i.icon) {
      ctx.drawImage(...i.icon);
    }
    ctx.fillStyle = i.icon ? 'transparent' : i.fill;
    ctx.fill( i.path );
    ctx.restore();
  })
}

function clear() {
  ctx.clearRect( -100, -100, can.width + 100, can.height + 100 );
}

function redraw() {
  clear();
  draw();
}

window.onload = () => {
  // render mineral list
  mineralList.forEach( mineral => {
    const { x, y, dx, dy } = mineral.icon;
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 48;
    c.getContext('2d').drawImage(icons, x, y, dx, dy, 0 , 0, 48, 48);
    c.style.width = '20px';
    c.style.height = '20px';
    c.style.marginRight = '4px';

    const n = document.createElement('div');
    n.innerText = mineral.name;

    const i = document.createElement('input');
    i.type = 'checkbox';
    mineralShowOnlys.push(i);
    i.id = mineral.name;
    i.onclick = () => {
      drawAllEl.checked = false;
      redraw();
    };

    const m = document.createElement('li');
    m.className = "minerals-list-item";
    m.appendChild(i);
    m.appendChild(c);
    m.appendChild(n);

    mineralListEl.appendChild(m);
  });

  draw_all_option: {
    const n = document.createElement('div');
    n.innerText = 'Display All';

    const i = document.createElement('input');
    i.type = 'checkbox';
    i.checked = true;
    i.onclick = () => {
      i.checked && mineralShowOnlys.forEach( a => {
        a.checked = false;
      });
      redraw();
    };
    drawAllEl = i;

    const m = document.createElement('li');
    m.className = "minerals-list-item";
    m.appendChild(i);
    m.appendChild(n);

    mineralListEl.appendChild(m);
  }


  // create canvas item for each mineral spot 
  minerals.forEach( m => {
    const data = mineralList.find( i => i.name === m.type );
    objects.push( createItem(m, data.fill, 13, data.icon) );
  });

  draw();

  // secret key to draw my cities [cmd]+[h]
  document.addEventListener('keydown', e => {
    if ( e.metaKey && e.key === 'h') {
      e.preventDefault();
      e.stopPropagation();
      drawCities = !drawCities;
      redraw();
    }
  });

  // set last updated
  document.getElementById('last-updated').innerText = `Updated on ${new Date(lastUpdated).toString()}`;
}

function dist( a, b ) {
  return Math.sqrt( (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) );
}

function toggleCanBckgrnd() {
  showLightBkgrnd = !showLightBkgrnd;
  if ( showLightBkgrnd ) {
    can.style.backgroundColor = 'beige';
  }
  else {
    can.style.backgroundColor = 'black';
  }
}

function toggleRegionBckgrnd() {
  showRegions = !showRegions;
  redraw();
}