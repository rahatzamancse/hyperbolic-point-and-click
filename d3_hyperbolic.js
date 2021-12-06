/**
 * @file This is the main file where hyperbolic and euclidean visualization is done with the class d3Hyperbolic. 
 */

/**
 * The main d3-hyperbolic library class for rendering.
 * @example 
let d3Hyperbolic = require("../../src/d3_hyperbolic").default;
let hyperbolicSys = new d3Hyperbolic()
  .parameters({...})
  .renderCanvas("#the-svg-element-id")
  .setGraph(graphData)
  .render();
 */
class d3Hyperbolic {

  /**
   * The main constructor of the class. Creates an instance of d3Hyperbolic and returns it.
   * @example let hyperbolicSys = new d3Hyperbolic();
   * @returns The created instance.
   */
  constructor() {
    // Initialize default parameters
    this.projection = "hyperbolic";
    this.selectedElement = null;
    this.forceDirected = false;
    this.graph = {};
  }

  /**
   * Set the parameters for for rendering and calculations. You can call this anytime throughout the code to change any parameter. 
   * @param {paramDict} paramDict - The configuration object you want to set.
   * @returns {d3Hyperbolic} `this` instance.
   */
  parameters(paramDict) {
    for (const [key, value] of Object.entries(paramDict)) {
      if (key.toLowerCase() === "projection") {
        this.projection = value;
      }
      else if (key.toLowerCase() === "edgethickness") {
        this.edgeThickness = value;
      }
      else if (key.toLowerCase() === "noderadius") {
        this.nodeRadius = value;
      }
      else if (key.toLowerCase() === "layout") {
        if(value === "force") {
          this.forceDirected = true;
        }
        else {
          this.forceDirected = false;
        }
      }
      else {
      }
    }
    return this;
  }

  /**
   * Sets the element as the default rendering canvas. 
   * @param {string} elementQuery - The element to select. An id of an SVG element is required.
   * @param {margin} margin - The margin to use withing that svg element.
   * @returns `this` instance of d3Hyperbolic.
   */
  renderCanvas(elementQuery, margin = null) {
    // elementQuery must select a single empty div
    let element = document.querySelector(elementQuery);
    this.selectedElement = element;

    if (margin == null) {
      this.margin = { top: 10, right: 10, bottom: 10, left: 10 };
    }
    else {
      this.margin = margin;
    }

    return this;
  }

  /**
   * Sets the graph for rendering. 
   * @param {Graph} graph The graph object with nodes and edges list.
   * @returns `this` instance of d3Hyperbolic
   */
  setGraph(graph) {
    this.graph = graph;
    for(let i  = 0; i<this.graph.edges.length; i++) {
      if(Number.isInteger(this.graph.edges[i].source))  {
        this.graph.edges[i].source = this.graph.nodes[this.graph.edges[i].source];
      }
      if(Number.isInteger(this.graph.edges[i].target))  {
        this.graph.edges[i].target = this.graph.nodes[this.graph.edges[i].target];
      }
    }
    return this;
  }

  /**
   * Reads the graph from graphviz dot format string and sets it as default graph as {@link setGraph}. 
   * @param {string} dotStr The dot format string to read from.
   * @returns `this` instance of d3Hyperbolic
   */
  setGraphFromDot(dotStr) {
    this.graph = utils.readDot(dotStr);
    return this;
  }


  /**
   * Render the default graph to the default svg element.
   * @returns `this` instance of hyperbolic.
   */
  render() {
    let projection = this.projection;
    let vertices = this.graph.nodes;
    let edges = this.graph.edges;

    // set the dimensions and margins of the graph
    this.svgHeight = this.selectedElement.clientHeight;
    this.svgWidth = this.selectedElement.clientWidth;

    this.canvasWidth = this.svgWidth - this.margin.left - this.margin.right,
      this.canvasHeight = this.svgHeight - this.margin.top - this.margin.bottom;



    // append the svg object to the body of the page
    var svg = d3.select(this.selectedElement)
      .append("g")
      .attr("transform",
        "translate(" + this.margin.left + "," + this.margin.top + ")");

    let bottomLayer = svg.append('g')
      .attr("class", "bottomlayer");
    let topLayer = svg.append('g')
      .attr("class", "toplayer");

    // Initialize the links
    var link = topLayer
      .selectAll("path")
      .data(edges, d => String(d.source) + d.target)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr('fill', 'none')
      .attr('stroke-width', this.edgeThickness)
      .attr('stroke', 'black') // TODO: add as param
      .attr('visibility', 'hidden');

    // Initialize the nodes
    console.log(vertices);
    var node = topLayer
      .selectAll("circle")
      .data(vertices, d => d.id)
      .enter()
      .append("circle")
      .attr("fill", d => d.color)
      .attr("r", this.nodeRadius)
      .attr("class", "node")
      // .attr("fill", "#69b3a2") // TODO: Add as param
      .attr('stroke', 'black') // TODO: Add as param
      .attr('stroke-width', 3) // TODO: Add as param
      .attr('visibility', 'hidden');

    let zoom = d3.zoom()
      .scaleExtent([.5, 3]);

    let waitingText = svg.append('g')
      .attr('class', 'wait');

    waitingText
      .append('text')
      .attr("x", this.canvasWidth / 2)
      .attr("y", this.canvasHeight / 2)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text('Applying force directed algorithm');


    if (projection === 'euclidean') {
      // Zoom functionality
      zoom.on("zoom", event => {
        node.attr('transform', event.transform);
        link.attr('transform', event.transform);
      });

      bottomLayer.append('rect')
        .attr('x', this.margin.left)
        .attr('y', this.margin.top)
        .attr('width', this.canvasWidth - this.margin.right - this.margin.left)
        .attr('height', this.canvasHeight - this.margin.bottom - this.margin.top)
        .style('fill', 'lightgrey')
        .style('stroke', 'black');

      // @ts-ignore
      svg.call(zoom);

      let start_drawing = () => {
          link
            .attr('d', d => d3.line()([[d.source.x, d.source.y], [d.target.x, d.target.y]]))
            .attr('visibility', 'visible');

          node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr('visibility', 'visible');

          waitingText.remove()
      }

      if(this.forceDirected) {
        // Let's list the force we wanna apply on the network
        d3.forceSimulation(vertices)                 // Force algorithm is applied to data.nodes
          .force("link", d3.forceLink()                               // This force provides links between nodes
            // @ts-ignore
            .id(d => d.id)                     // This provide  the id of a node
            // @ts-ignore
            .links(edges, d => String(d.source) + d.target)                                    // and this the list of links
          )
          .force("charge", d3.forceManyBody().strength(-400))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
          .force("center", d3.forceCenter(this.canvasWidth / 2, this.canvasHeight / 2))     // This force attracts nodes to the center of the svg area
          .on("end", start_drawing);

      }
      else {
        start_drawing();
      }

    }
    else if (projection === 'hyperbolic') {
      let poindisk = {
        boundbox: null,
        cx: null,
        cy: null,
        r: null,
        center: {
          x: null,
          y: null
        }
      }
      let tmp = this.selectedElement.getBoundingClientRect()
      poindisk.boundbox = {
        left: 0,
        right: this.canvasWidth,
        bottom: this.canvasHeight,
        top: 0
      }
      poindisk.cx = (poindisk.boundbox.right - poindisk.boundbox.left) / 2;
      poindisk.cy = (poindisk.boundbox.bottom - poindisk.boundbox.top) / 2;
      poindisk.r = Math.min(poindisk.cx, poindisk.cy);
      poindisk.center = { x: poindisk.cx, y: poindisk.cy }

      bottomLayer.append('circle')
        .attr('cx', (poindisk.boundbox.right - poindisk.boundbox.left) / 2)
        .attr('cy', (poindisk.boundbox.bottom - poindisk.boundbox.top) / 2)
        .attr('r', (poindisk.boundbox.right - poindisk.boundbox.left) / 2)
        .style('fill', 'lightgrey')
        .style('stroke', 'black')

      let start_drawing = () => {
        let centerX = d3.mean(vertices, d => d.x);
        let centerY = d3.mean(vertices, d => d.y);

        //Set vertices position in the poincare disk.
        for (let i = 0; i < vertices.length; i++) {
          to_poincare(vertices[i], centerX, centerY, poindisk, true)
        }
        //Calculate geodesic arc between vertices in edge set
        for (let i = 0; i < edges.length; i++) {
          edges[i].arc = poincare_geodesic(edges[i].source.center, edges[i].target.center, poindisk)
        }

        link
          .attr('d', d => arc_path(d.arc, poindisk))
          .attr('visibility', 'visible');

        node
          .attr("cx", d => d.circle.cx)
          .attr("cy", d => d.circle.cy)
          .attr('r', d => d.circle.r)
          .attr('visibility', 'visible');
        waitingText.remove()

        // Zoom functionality
        // This helped me a lot: https://www.freecodecamp.org/news/get-ready-to-zoom-and-pan-like-a-pro-after-reading-this-in-depth-tutorial-5d963b0a153e/


        zoom
          .on('start', event => {
          })
          .on("zoom", event => {
            if (event.transform.toString() === d3.zoomIdentity.toString()) {
              return;
            }

            // Zoom not behaving properly.
            // Asked question in SO: https://stackoverflow.com/questions/70025602/how-to-reset-zoom-transform-after-zooming-without-reseting-selections-in-d3
            if (event.transform.k !== 1) {
              return;
            }
            // Update positions of vertices
            // And Set vertices position in the poincare disk.
            for (let i = 0; i < vertices.length; i++) {
              // I know there is more efficient way to do this. Will solve this later
              // Backup the original x and y
              vertices[i].tmp = {
                x: vertices[i].x,
                y: vertices[i].y
              }
              vertices[i].x += event.transform.x;
              vertices[i].y += event.transform.y;
            }
            // Calculate new poincare xy
            for (let i = 0; i < vertices.length; i++) {
              to_poincare(vertices[i], centerX, centerY, poindisk, true)
            }

            //Calculate geodesic arc between vertices in edge set
            for (let i = 0; i < edges.length; i++) {
              edges[i].arc = poincare_geodesic(edges[i].source.center, edges[i].target.center, poindisk)
            }

            node
              .attr("cx", d => d.circle.cx)
              .attr("cy", d => d.circle.cy)
              .attr('r', d => d.circle.r);

            link
              .attr('d', d => arc_path(d.arc, poindisk));

            // Restore original position
            for (let i = 0; i < vertices.length; i++) {
              vertices[i].x = vertices[i].tmp.x;
              vertices[i].y = vertices[i].tmp.y;
            }

            // svg.call(zoom.transform, d3.zoomIdentity);

          })
          .on('end', event => {
          });


        // @ts-ignore
        svg.call(zoom);
      }

      if (this.forceDirected) {
      // Let's list the force we wanna apply on the network
      d3.forceSimulation(vertices)                 // Force algorithm is applied to data.nodes
        .force("link", d3.forceLink()                               // This force provides links between nodes
          // @ts-ignore
          .id(d => d.id)                     // This provide  the id of a node
          // @ts-ignore
          .links(edges, d => String(d.source) + d.target)                                    // and this the list of links
        )
        .force("charge", d3.forceManyBody().strength(-4000))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(poindisk.cx, poindisk.cy))     // This force attracts nodes to the center of the svg area
        // This function is run at each iteration of the force algorithm, updating the nodes position.
        .on("end", start_drawing);

      }
      else {
        start_drawing();
      }



    }
    return this;
  }

  reset() {
    if (this.selectedElement) {
      this.selectedElement.innerHTML = '';
    }

    return this;
  }
}




