/**
 * @file This file has a list of random graph generators.
 */
/**
 * This module is a collection of random graph generative algorithms.
 * @module graph_generators
 */

/**
 * Generates an undirected graph on n nodes, with each edge having probability p to appear
 * @param {number} n - The number of nodes.
 * @param {number} p - The probability of two nodes being connected. Can be imagined as the density parameter of the graph. 
 * @returns Graph - The graph created randomly.
 */
let erdos_renyi = function(n,p, x_width=1000, y_width=1000) {
  let nodes = new Array(n);
  for (let i = 0; i < n; i ++){
    nodes[i] = {
      id: i,
      x: Math.random() * Math.round(x_width),
      y: Math.random() * Math.round(y_width),
      color: '#' + Math.floor(Math.random()*16777215).toString(16)

    }
  }
  let edges = [];
  for (let i = 0; i < n; i ++){
    for (let j = 0; j<i; j++){
      if (Math.random() < p){
        edges.push({'source': i, 'target': j})
      }
    }
  }

 return {'nodes': nodes, 'edges': edges}
}