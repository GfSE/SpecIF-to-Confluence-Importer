/**
 * Created by baetz on 27.04.2017.
 */
define([
    "jquery",
    "vis",
    "data",
    "purl",
    "host"
], function ($,
             vis,
             d,
             purl,
             host) {


    function init() {
        /**
         * The id of the page, the the macro is used in
         */
        let pageID = purl().param("pageID");

        $('#main').css("display", "flex");

        /**
         * get the page the macro is running on
         */
        d.getPageExpand(pageID, "?expand=body.storage", function (res) {
            //Parse the hidden json string that contains the relation
            let $body = $(JSON.parse(res).body.storage.value);
            let relation;
            for (let i = 0; i < $body.length; i++) {
                if ($($body[i]).hasClass("hidden")) {
                    relation = JSON.parse($($body[i]).text());
                    break;
                }
            }
            //if there are no relations do not create a graph
            if (!relation)return;
            let nodesData = [];
            let edgeData = [];


            let relProp = getRelationsCountAndLength(relation);
            let id = 0;

            for (let entry in relation) {
                if (relation.hasOwnProperty(entry)) {
                    if (entry === "pageTitle") {
                        id = pushMainNode( nodesData, relation[entry]);
                    }
                    else {
                        id = pushAllChildNodesAndEdges(id, nodesData, edgeData, relation[entry], entry, relProp);
                    }
                }
            }
            let nodes = new vis.DataSet(nodesData);


            let edges = new vis.DataSet(edgeData);


            let container = document.getElementById('main');


            let data = {
                nodes: nodes,
                edges: edges
            };
            let options = {
                autoResize: true,
                height: '100%',
                width: '100%',
                locale: 'en',
                clickToUse: false,
                nodes: {
                    shape: "box"
                },
                edges: {

                    font: {
                        align: "bottom"
                    },
                    smooth: {
                        type: "continuous"
                    }
                },
                manipulation: {
                    "enabled": false
                },
                physics: {
                    enabled: false
                }
            };

            let network = new vis.Network(container, data, options);
            network.getConnectedNodes("0").forEach(function (connectedNode) {
                let neighbours = network.getConnectedNodes(connectedNode);
                if (neighbours.length > 5) {
                    closeCluster(connectedNode, network);
                }
            });
            network.on("doubleClick", function (options) {
                if (options.nodes.length === 1) {
                    if (!isIE() && options.nodes[0] !== 0 &&
                        network.getConnectedNodes(options.nodes[0]).length === 1 &&
                        !network.clustering.isCluster(options.nodes[0])) {
                        let pageID = nodes.get(options.nodes[0]).label.replace(/-\n/g, "").replace(/\n/g, " ");
                        console.log(pageID);
                        if (!pageID)return;
                        d.getPageExpand("", "?title=" + pageID, function (res) {
                            let response = JSON.parse(res);
                            if (response.results.length) {
                               window.top.location.href=  host.baseUrl+ response.results[0]._links.webui;
                            }
                        });

                        return;
                    }
                    if (typeof options.nodes[0] === "string" && options.nodes[0].includes(":")) {
                        if (!network.clustering.isCluster(options.nodes[0]))return;

                    }
                    let releaseOptions = {
                        releaseFunction: function (clusterPosition, containedNodesPositions) {
                            let newPositions = {};
                            let dist, offset;
                            let i = 0;
                            let length = Object.keys(containedNodesPositions).length - 1;
                            for (let id in containedNodesPositions) {
                                if (containedNodesPositions.hasOwnProperty(id)) {
                                    if (id === "0" || (!containedNodesPositions["0"] && !id.includes(":"))) {
                                        newPositions[id] = {x: clusterPosition.x, y: clusterPosition.y};
                                        if (id !== "0") {
                                            offset = Math.atan(clusterPosition.y / clusterPosition.x);
                                            if (clusterPosition.x < 0) offset += Math.PI;
                                            dist = 100;
                                        }
                                    } else {
                                        newPositions[id] = getNodePosition(
                                            i,
                                            length,
                                            clusterPosition.x, clusterPosition.y,
                                            dist,
                                            offset);
                                        i++;
                                    }
                                }
                            }
                            return newPositions;
                        }
                    };
                    if (network.clustering.isCluster(options.nodes[0])) {
                        network.clustering.openCluster(options.nodes[0], releaseOptions);
                    } else {
                        closeCluster(options.nodes[0], network);
                    }
                }
            });
        });

        /**
         * This function closes a given cluster
         * @param node A node that is a cluster
         * @param network the network the node is part of
         */
        function closeCluster(node, network) {

            if (node === 0) {
                network.getConnectedNodes("0").forEach(function (connectedNode) {
                    closeCluster(connectedNode, network);
                });
            }
            let options = {
                joinCondition: function (nodeOptions, childNode) {

                    return childNode.id !== 0;
                },
                clusterNodeProperties: {
                    label: "",
                    shape: "diamond"
                }
            };
            network.clustering.clusterByConnection(node, options);
        }

        /**
         * wraps a text after e specific number of chars
         * @param str The Stringt that hast to be wrapped
         * @returns {string} the wrapped string
         */
        function wrapText(str) {
            let maxWidth = 20;
            let newLineStr = "\n";
            res = '';
            if (str.length <= maxWidth)return str;
            do {
                found = false;
                // Inserts new line at first whitespace of the line
                for (i = maxWidth - 1; i >= maxWidth - 5; i--) {
                    if (testWhite(str.charAt(i))) {
                        res = res + [str.slice(0, i), newLineStr].join('');
                        str = str.slice(i + 1);
                        found = true;
                        break;
                    }
                }
                // Inserts new line at maxWidth position, the word is too long to wrap
                if (!found) {
                    res += [str.slice(0, maxWidth) + "-", newLineStr].join('');
                    str = str.slice(maxWidth);
                }

            } while (str.length >= maxWidth);

            return res + str;
        }

        /**
         * test a char if it is a whitespace
         * @param x the given char as string
         * @returns {boolean}
         */
        function testWhite(x) {
            let white = new RegExp(/^\s$/);
            return white.test(x.charAt(0));
        }

        /**
         * Returns a calculated Position for a given node
         * @param i the index of the node in the list of neighbour nodes of the parent
         * @param length The length of the list of neighbour nodes of the parent
         * @param x the x position of the parent
         * @param y the y position of the parent
         * @param dist the preferred distance between the parent node and this node
         * @param offset the offset as rad angle where the placement start
         * @returns {{x: number, y: number, alpha: number}}
         */
        function getNodePosition(i, length, x, y, dist, offset) {

            let pos = {x: 0, y: 0, alpha: 0};
            if (!dist) dist = 150;
            let u = (length <= 4 ? 8 : length) * dist;
            let r = u / (2 * Math.PI);
            if (r < dist * 2) r = dist * 2;
            if (r > 2 * dist && i % 2 === 0) r = r / 1.5;
            else if (offset && i % 2 === 0) r = r / 2;

            let alpha = (2 * Math.PI) / (length <= 4 ? 8 : length) * i;
            if (offset) alpha = offset + alpha - (2 * Math.PI) / (length <= 4 ? 8 : length) * ((length - 1) / 2);
            pos.x = x + r * Math.cos(alpha);
            pos.y = y + r * Math.sin(alpha);
            pos.alpha = alpha;
            return pos;
        }

        /**
         * Returns an object that contains two keys:
         * relations represent the number of relations
         * length represent the number of relations multilpied with the number of available combinations
         * e.g. if relation contains only on relation: SpecIF:shows and this has a list of targets and a list of sources
         * then relations would be 1 and length would be 2
         * if it has a second relation SpecIF:writes with only a target list that relations would be 2 and length 3
         * @param relation The relations object
         * @returns {{relations: number, length: number}}
         */
        function getRelationsCountAndLength(relation) {
            let relProb = {relations: 0, length: 0};
            for (let entry in relation) {
                if (relation.hasOwnProperty(entry)) {
                    if (entry !== "pageTitle") {
                        if (relation[entry].targets.length) relProb.length++;
                        if (relation[entry].sources.length) relProb.length++;
                        relProb.relations++;
                    }
                }
            }
            return relProb;
        }

        /**
         * pushes the Main Node into the nodesData array
         * @param nodesData
         * @param entry
         * @returns {number}
         */
        function pushMainNode( nodesData, entry) {
            nodesData.push(
                {
                    id: 0,
                    label: wrapText(entry),
                    x: 0,
                    y: 0,
                    shape: "circle"
                }
            );
            return 1;
        }

        /**
         * Pushes all child nodes and edges for targets and sources for a given relation entry in the nodesData
         * and edgeData object
         * @param id A ongoing id number for all childs of the main node
         * @param nodesData The nodesData object
         * @param edgeData The edgeData object
         * @param entry The relation entry
         * @param value the label for the edge
         * @param relProp the relation properties object containing length and relations number
         * @returns returns a new id for the next object
         */
        function pushAllChildNodesAndEdges(id, nodesData, edgeData, entry, value, relProp) {

            if (entry.targets.length)
                id = pushChildNodesAndEdges(id, nodesData, edgeData, entry.targets, value, relProp, true);

            if (entry.sources.length)
                id = pushChildNodesAndEdges(id, nodesData, edgeData, entry.sources, value, relProp, false);
            return id;
        }

        /**
         * Pushes one Child node and edge in the nodesData and edgeData object
         * @param id The id of the node
         * @param nodesData The nodesData object
         * @param edgeData The childData object
         * @param array Array of all connected child nodes
         * @param value The value of the edge label
         * @param relProp The relation properties object
         * @param isTarget A bool that represents if it is a target or a source relationship
         * @returns {*}
         */
        function pushChildNodesAndEdges(id, nodesData, edgeData, array, value, relProp, isTarget) {

            if (array.length < 2 || relProp.relations < 2) {
                array.forEach(function (entry) {
                    let pos = getNodePosition(id,
                        relProp.relations < 2 ? array.length : relProp.length, 0, 0);
                    pushNodeAndEdge(id,
                        isTarget ? 0 : id,
                        isTarget ? id : 0,
                        nodesData,
                        edgeData,
                        entry,
                        value,
                        pos);
                    id++;
                });
            } else {
                let pos = getNodePosition(id, relProp.length, 0, 0);
                pushNodeAndEdge(id,
                    isTarget ? 0 : id,
                    isTarget ? id : 0,
                    nodesData,
                    edgeData,
                    "",
                    value,
                    pos);
                let childID = 0;
                array.forEach(function (entry) {
                    let childPos = getNodePosition(
                        childID,
                        array.length,
                        pos.x, pos.y,
                        100,
                        pos.alpha);
                    let childIDString = id + ":" + childID;
                    pushNodeAndEdge(childIDString, id, childIDString, nodesData, edgeData, entry, "", childPos);
                    childID++;
                });
                id++;
            }
            return id;
        }

        /**
         * Finally creates and pushes the child and parent node and edge objects into the nodesData and edgeData object
         * @param id The id of the Parent node(main node or helper node)
         * @param sourceID the id of the source the arrow comes from
         * @param targetID the id of the traget the arrow goes to
         * @param nodesData The nodeData object
         * @param edgeData The edgeData object
         * @param entry The relation entry
         * @param value The value of the edge label
         * @param pos the pos of the node
         */
        function pushNodeAndEdge(id, sourceID, targetID, nodesData, edgeData, entry, value, pos) {
            nodesData.push({
                id: id,
                label: wrapText(entry),
                x: pos.x,
                y: pos.y,
                shape: entry === "" ? "circle" : "box"
            });
            edgeData.push({
                from: sourceID,
                to: targetID,
                arrows: sourceID === 0 || targetID === 0 ? "to" : "",
                label: value
            });


        }

        /**
         * Checks if the ie 11 or lower is used
         * @returns {boolean} true if ie es 11 or lower else false
         */
        function isIE() {
            let ua = window.navigator.userAgent;
            let msie = ua.indexOf("MSIE ");
            return msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
        }
    }

    return {init: init};
});
