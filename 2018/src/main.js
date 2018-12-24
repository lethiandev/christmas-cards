import '../sass/main.scss';

const books = Array.from(document.getElementsByClassName('book'))

for (let book of books) {
  initBook(book)
}

const snowfalls = Array.from(document.getElementsByClassName('snowfall'))
for (let snowfall of snowfalls) {
  initSnowfall(snowfall)
}

const christmasTrees = Array.from(document.getElementsByClassName('christmas-tree'))
for (let christmasTree of christmasTrees) {
  initChristmasTree(christmasTree)
}

// Book

function initBook(book) {
  const pages = Array.from(book.getElementsByClassName('page'))
  for (let i in pages) {
    initBookPage(book, pages[i], !!(i % 2))
  }
}

function initBookPage(book, page, isEven) {
  const flips = Array.from(page.getElementsByClassName('page-flip'))
  for (let flip of flips) {
    initBookPageFlipping(book, page, flip, isEven)
  }
}

function initBookPageFlipping(book, page, flip, previous) {
  flip.addEventListener('click', () => {
    const pages = Array.from(book.getElementsByClassName('page'))
    const oddPages = pages.filter((page, idx) => !(idx % 2))

    if (previous) {
      const revealedPages = oddPages.filter(page => page.classList.contains('page-revealed'))

      if (revealedPages.length) {
        const prevPage = revealedPages.pop();
        prevPage.classList.remove('page-revealed')
        prevPage.classList.add('page-closed')
      }
    }
    else {
      const closedPages = oddPages.filter(page => !page.classList.contains('page-revealed'))

      if (closedPages.length) {
        const nextPage = closedPages.shift()
        nextPage.classList.remove('page-closed')
        nextPage.classList.add('page-revealed')
      }
    }

    if (oddPages.some(page => page.classList.contains('page-revealed'))) {
      book.classList.remove('book-closed')
      book.classList.add('book-opened')
    }
    else {
      book.classList.remove('book-opened')
      book.classList.add('book-closed')
    }
  })
}

// Snowfall

function initSnowfall(canvas) {
  window.addEventListener('resize', () => {
    fitSnowfall(canvas)
  });

  fitSnowfall(canvas)
  initSnowfallDraw(canvas)
}

function fitSnowfall(canvas) {
  const parent = canvas.parentElement
  const { width, height } = parent.getBoundingClientRect()

  canvas.width = width
  canvas.height = height
}

function initSnowfallDraw(canvas) {
  const gl = canvas.getContext('webgl')
  const rc = {}

  const vertexShader = `
    precision mediump float;
    attribute vec2 a_position;
    attribute float a_size;
    attribute float a_index;
    varying float v_index;
    void main() {
      gl_Position = vec4(a_position, 0, 1);
      gl_PointSize = a_size;
      v_index = a_index;
    }
  `

  const fragmentShader = `
    precision mediump float;
    uniform sampler2D u_texture;
    varying float v_index;
    void main() {
      vec2 texcoord = gl_PointCoord;
      texcoord.x = texcoord.x * 0.25 + v_index * 0.25;
      gl_FragColor = texture2D(u_texture, texcoord);
    }
  `

  let vsh = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vsh, vertexShader)
  gl.compileShader(vsh)

  if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
    console.error('Vertex shader error:', gl.getShaderInfoLog(vsh));
  }

  let fsh = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fsh, fragmentShader)
  gl.compileShader(fsh)

  if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
    console.error('Fragment shader error:', gl.getShaderInfoLog(fsh));
  }

  let program = gl.createProgram()
  gl.attachShader(program, vsh)
  gl.attachShader(program, fsh)
  gl.linkProgram(program)

  rc.shader = {
    program,
    a_position: gl.getAttribLocation(program, 'a_position'),
    a_size: gl.getAttribLocation(program, 'a_size'),
    a_index: gl.getAttribLocation(program, 'a_index'),
  }

  const snowflakeCount = 64;

  let buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, snowflakeCount * 4*4, gl.DYNAMIC_DRAW)

  rc.buffer = buffer

  let vertexData = new Float32Array(snowflakeCount * 4)
  for (let i = 0; i < snowflakeCount; i++) {
    vertexData[i*4 + 0] = Math.random() * 2.0 - 1.0   // x
    vertexData[i*4 + 1] = Math.random() * 2.0 - 1.0   // y
    vertexData[i*4 + 2] = Math.random() * 48.0 + 32.0 // size
    vertexData[i*4 + 3] = (Math.random() * 4) | 0 // index
  }

  let texture = gl.createTexture()
  let image = new Image()

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  let pixelData = new Uint8Array([0, 0, 0, 0])
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixelData)

  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.generateMipmap(gl.TEXTURE_2D)
  }

  image.src = 'img/snowflake.png'

  rc.snowflakes = {
    vertexData,
    texture,
    count: snowflakeCount
  }

  ;(function drawLoop() {
    requestAnimationFrame(drawLoop)
    drawSnowfall(canvas, gl, rc)
  })()
}

function drawSnowfall(canvas, gl, rc) {
  const { width, height } = canvas

  let drawCount = rc.snowflakes.count
  if (window.innerWidth < 768) {
    drawCount = (rc.snowflakes.count * 0.5) | 0
  }

  const vertices = rc.snowflakes.vertexData;
  for (let i = 0; i < drawCount; i++) {
    const sin = Math.cos(Date.now() * 0.001 + i)

    vertices[i*4 + 0] -= 0.2 / width + (0.3 / width) * sin
    vertices[i*4 + 1] -= 1.0 / height

    const rw = vertices[i*4 + 2] * (1.0 / width)
    if (vertices[i*4 + 0] < -1.0 - rw) {
      vertices[i*4 + 0] = 1.0 + rw
    }

    const rh = vertices[i*4 + 2] * (1.0 / height)
    if (vertices[i*4 + 1] < -1.0 - rh) {
      vertices[i*4 + 0] = Math.random() * 2.0 - 1.0
      vertices[i*4 + 1] = 1.0 + rh
      vertices[i*4 + 3] = (Math.random() * 4) | 0
    }
  }

  gl.viewport(0, 0, width, height)

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.enable(gl.BLEND)

  gl.clearColor(0.0, 0.0, 0.0, 0.0)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.useProgram(rc.shader.program)

  gl.bindBuffer(gl.ARRAY_BUFFER, rc.buffer)
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, rc.snowflakes.vertexData)

  gl.enableVertexAttribArray(rc.shader.a_position)
  gl.vertexAttribPointer(rc.shader.a_position, 2, gl.FLOAT, false, 4*4, 0*4)

  gl.enableVertexAttribArray(rc.shader.a_size)
  gl.vertexAttribPointer(rc.shader.a_size, 1, gl.FLOAT, false, 4*4, 2*4)

  gl.enableVertexAttribArray(rc.shader.a_index)
  gl.vertexAttribPointer(rc.shader.a_index, 1, gl.FLOAT, false, 4*4, 3*4)

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, rc.snowflakes.texture)

  gl.drawArrays(gl.POINTS, 0, drawCount)
}

// Christmas tree animated ornaments

function initChristmasTree(tree) {
  tree.onload = () => initChristmasTreeSVG(tree.contentDocument)
}

function initChristmasTreeSVG(svg) {
  const ornaments = svg.getElementById('ornaments');
  const ornamentElements = Array.from(ornaments.children);

  const colors = [
    'FFEFB9', '941F1F', 'F4D02A', '6040AA', 'E47A1F', '9E001C', '4060F0'
  ];

  ;(function randomizeColors() {
    setTimeout(randomizeColors, 1000);

    for (let ornament of ornamentElements) {
      const color = colors[(Math.random() * colors.length) | 0]
      ornament.style.fill = `#${color}`
    }
  })();
}
