// Keep the viewport separate from the embedding coordinates and cosine scores.
export function attachPlotControls(svg, projection) {
  const view = projection.viewport ??= {x: 0, y: 0, width: 650, height: 430};
  const zoomIn = document.querySelector('#plot-zoom-in');
  const zoomOut = document.querySelector('#plot-zoom-out');
  const reset = document.querySelector('#plot-reset');
  const level = document.querySelector('#plot-zoom-level');
  function render() {
    svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);
    level.textContent = `${Math.round(650 / view.width * 100)}%`;
    zoomIn.disabled = view.width <= 650 / 8;
    zoomOut.disabled = view.width >= 650;
    reset.disabled = false;
  }
  function zoom(factor, anchor = {x: view.x + view.width / 2, y: view.y + view.height / 2}) {
    const width = Math.max(650 / 8, Math.min(650, view.width / factor));
    const scale = width / view.width;
    view.x = anchor.x - (anchor.x - view.x) * scale;
    view.y = anchor.y - (anchor.y - view.y) * scale;
    view.width = width; view.height = width * 430 / 650;
    render();
  }
  function position(event) {
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
  }
  zoomIn.onclick = () => zoom(1.5);
  zoomOut.onclick = () => zoom(1 / 1.5);
  reset.onclick = () => {Object.assign(view, {x: 0, y: 0, width: 650, height: 430}); render();};
  svg.onwheel = event => {event.preventDefault(); zoom(Math.exp(-event.deltaY * .002), position(event));};
  let drag;
  svg.onpointerdown = event => {
    if (event.button !== 0 || event.target.closest('[data-point]')) return;
    drag = {id: event.pointerId, start: position(event), x: view.x, y: view.y, matrix: svg.getScreenCTM().inverse()};
    svg.setPointerCapture(event.pointerId); svg.classList.add('panning');
  };
  svg.onpointermove = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(drag.matrix);
    view.x = drag.x + drag.start.x - point.x; view.y = drag.y + drag.start.y - point.y; render();
  };
  const stop = () => {drag = undefined; svg.classList.remove('panning');};
  svg.onpointerup = stop; svg.onpointercancel = stop; svg.onlostpointercapture = stop;
  render();
}
