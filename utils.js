/**
 * @file This file contains a list of utility functions for helping in graph visualization.
 */

/**
 * This module is a collection of utility functions for convenience.
 * @module utils
 */
/**
 * Reads the graph from graphviz dot format string and returns it.
 * @param {string} dotfile The dot format string to read from.
 * @returns {Graph} - A graph object.
 */
let readDot = dotfile => {
  let absGraph = parse(dotfile);
  let items = absGraph[0].children;
  console.log(items);
  let graph = { nodes: [], edges: [] };
  for(let i = 0; i < items.length; i++) { 
    if(items[i].type === 'node_stmt') {
      let node = { id: items[i].node_id.id };
      for(let j = 0; j < items[i].attr_list.length; j++) {
        node[items[i].attr_list[j].id] = items[i].attr_list[j].eq;
      }
      graph.nodes.push(node);
    }
    else if(items[i].type === 'edge_stmt') {
      let edge = {
        source: items[i].edge_list[0].id,
        target: items[i].edge_list[1].id
      };
      for(let j = 0; j < items[i].attr_list.length; j++) {
        edge[items[i].attr_list[j].id] = items[i].attr_list[j].eq;
      }
      graph.edges.push(edge);
    }
  }
  console.log(graph);

  return graph;
}
