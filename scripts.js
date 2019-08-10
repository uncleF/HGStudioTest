(function() {
  const LAYER_ORDER = {
    'standart': 0,
    'LayerAMiddle': 1,
    'LayerBMiddle': 2
  };

  let app;
  let url;
  let slots;
  let layers;

  let game;

  let scale;

  function findElements() {
    app = document.querySelector('#app');
    ({ url } = app.dataset);
  }

  function updateLayers(result, value) {
    const index = LAYER_ORDER[value.layer];
    if (!result[index]) result[index] = [value];
    else result[index].push(value);
    return result;
  }

  function generateLayers() {
    return Object.values(slots).reduce(updateLayers, []);
  }

  function onSuccess(response) {
    ({ slots } = response.skins);
    layers = generateLayers();
  }

  function onError(error) {
    console.error(error);
  }

  function processResponse(response) {
    return response.json();
  }

  function loadData() {
    return fetch(url)
      .then(processResponse)
      .then(onSuccess)
      .catch(onError);
  }

  function calculateSize() {
    const [ layer ] = layers[LAYER_ORDER.standart];
    const { width } = layer;
    const height = layer.height * 2;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const gameRatio = width / height;
    const windowRatio = windowWidth / windowHeight;
    let result;
    if (gameRatio > windowRatio) {
      scale = windowWidth / width;
      result = {
        width: windowWidth,
        height: windowWidth / gameRatio,
      }
    } else {
      scale = windowHeight / height;
      result = {
        width: windowHeight * gameRatio,
        height: windowHeight,
      }
    }
    return result;
  }

  function initGame() {
    game = new PIXI.Application({ transparent: true, ...calculateSize() });
    game.renderer.resize = true;
    app.appendChild(game.view);
  }

  function renderImage(image, yShift) {
    let texture = new PIXI.Sprite(PIXI.loader.resources[image.name].texture);
    texture.anchor.x = 0.5;
    texture.anchor.y = 0.5;
    texture.x = image.x * scale;
    texture.y = (image.y * scale) + yShift;
    texture.width = image.width * scale;
    texture.height = image.height * scale;
    game.stage.addChild(texture);
  }

  function renderLayer(layer, yShift = 0) {
    layer.forEach((image) => renderImage(image, yShift));
  }

  function renderLayers() {
    const yShift = game.renderer.height / 2;
    renderLayer(layers[0])
    renderLayer(layers[0], yShift)
    renderLayer(layers[1])
    renderLayer(layers[2], yShift)
  }

  function startGame() {
    renderLayers();
  }

  function generateResource(slot) {
    const extension = slot.layer === 'standart' ? 'jpg' : 'png';
    return {
      name: slot.name,
      url: `/resources/${slot.name}.${extension}`,
    };
  }

  function generateResources() {
    return Object.values(slots).map(generateResource);
  }

  function loadResources() {
    return new Promise((resolve) => { PIXI.loader.add(generateResources()).load(resolve); });
  }

  function initApp() {
    findElements();
    loadData()
      .then(loadResources)
      .then(initGame)
      .then(startGame)
  }

  initApp();
})();