let slider = document.getElementById("radius");
let output = document.getElementById("rad-label");
// @ts-ignore
output.innerHTML = slider.value; // Display the default slider value

slider.oninput = function () {
  // @ts-ignore
  output.innerHTML = this.value * 0.001;
}

let svg = d3.select("#render");
// @ts-ignore
let width = svg.node().getBoundingClientRect().width

let nodes = [];
let vertices = []
let lines = []
let can_draw_line = false;

let poindisk = {
  'r': width / 2,
  'center': { 'x': width / 2, 'y': width / 2 },
  // @ts-ignore
  'boundbox': svg.node().getBoundingClientRect()
}
poindisk.cx = (poindisk.boundbox.right - poindisk.boundbox.left) / 2;
poindisk.cy = (poindisk.boundbox.bottom - poindisk.boundbox.top) / 2;
poindisk.center = { 'x': poindisk.cx, 'y': poindisk.cy }


console.log(poindisk.boundbox)

let view = svg.append('circle')
  .attr('cx', poindisk.cx)
  .attr('cy', poindisk.cy)
  .attr('r', poindisk.r)
  .style('fill', 'lightgrey')
  .style('stroke', 'black')
  .on('click', onclick)
  .on('mousemove', onmove);



let drawNodes = function (nodes) {
  svg.selectAll('.nodes')
    .data(nodes)
    .join(
      enter => enter.append("circle")
        .attr('class', 'nodes')
        .attr('cx', d => d.cx)
        .attr('cy', d => d.cy)
        .attr('r', 1e-6)
        .style('fill', 'lightblue')
        .style('stroke', 'black')
        .style('stroke-width', "1px")

        // @ts-ignore
        .call(update => update.transition(750)
          .attr('r', d => d.r)
        )

        .on("mouseover", on_mouseover)
        .on("mouseout", on_mouseout)

    )

}

let drawLine = function (line) {
  svg.selectAll('.testline').remove()
  svg.selectAll('.testline')
    .data(line)
    .join(
      enter => enter.append('path')
        .attr('d', d => arc_path(d))
        .attr('class', 'testline')
        .style('stroke', 'black')
        .style('fill', 'none')
    )

    //Draws the inversion center (outside the disk)
    /*svg.selectAll('.tests')
      .data(lines, d => d.p2)
      .join(
        enter => enter.append('circle')
          .attr('class', 'tests')
          .attr('cx', d => d.c.x)
          .attr('cy', d => d.c.y)
          .attr('r', 10)
      )*/
}

let drawLines = function (lines) {
  svg.selectAll('.lines')
    .data(lines, d => d.p2)
    .join(
      enter => enter.append('path')
        .attr('d', d => arc_path(d, poindisk))
        .attr('class', 'lines')
        .style('stroke', 'black')
        .style('fill', 'none')
        //.attr('transform', d => "translate(" + d.c.x.toString() + ',' + d.c.y.toString() + ")")
    )

}

function onmove(e) {
  if (can_draw_line && vertices.length >= 1) {
    let left = poindisk.boundbox.left
    let top = poindisk.boundbox.top
    lines.push(poincare_geodesic(vertices[0], { 'x': e.x , 'y': e.y}, poindisk));
    drawLine(lines)
    lines.pop()
  }

}



function onclick() {
  // @ts-ignore
  let e = event
  let left = poindisk.boundbox.left
  let top = poindisk.boundbox.top
  if (document.getElementById('draw-select').value === 'circle') {
    nodes.push(poincare_circle(canvas_to_disk({ 'x': e.x, 'y': e.y }, poindisk), get_radius(), poindisk))
    // @ts-ignore
  } else if (document.getElementById('draw-select').value === 'line' && can_draw_line === false) {

    vertices.push({ 'x': e.x, 'y': e.y  }, poindisk)
    can_draw_line = true;
  } else if (can_draw_line === true) {

    lines.push(poincare_geodesic(vertices[0], { 'x': e.x , 'y': e.y  }, poindisk))
    vertices = []
    can_draw_line = false
    drawLines(lines)
  }
  console.log(can_draw_line)
  drawNodes(nodes);
  drawLines(vertices);
}

function get_radius() {
  //@ts-ignore
  return document.getElementById("radius").value * 0.001
}

let on_mouseover = function (d, circle) {
  //Modify this objects attributes
  d3.select(this)
    .style("stroke", "goldenrod")
  //.style("stroke-width", "3px");

  svg.append('circle')
    .attr('class', 'centers')
    .attr('cx', circle.hcenter.x)
    .attr('cy', circle.hcenter.y)
    .attr('r', circle.r / 20)

  svg.append('circle')
    .attr('class', 'centers')
    .attr('cx', circle.cx)
    .attr('cy', circle.cy)
    .attr('r', circle.r / 20)
  //console.log(scatterState.cat_lists.Platform.indexOf(data_object['Platform']))

}

let on_mouseout = function (d, i) {
  //Modify this objects attributes
  d3.select(this)
    .style("stroke", "black")
    .style("stroke-width", "1px");

  d3.selectAll(".centers").remove()

}
