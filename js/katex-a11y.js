var stringMap = {
    "(": "left parenthesis",
    ")": "right parenthesis",
    "[": "open bracket",
    "]": "close bracket",
    "\\{": "left brace",
    "\\}": "right brace",
    "\\lvert": "open vertical bar",
    "\\rvert": "close vertical bar",
    "|": "vertical bar",
    "\\uparrow": "up arrow",
    "\\Uparrow": "up arrow",
    "\\downarrow": "down arrow",
    "\\Downarrow": "down arrow",
    "\\updownarrow": "up down arrow",
    "\\langle": "open angle",
    "\\rangle": "close angle",
    "\\lfloor": "open floor",
    "\\rfloor": "close floor",
    "\\int": "integral",
    "\\intop": "integral",
    "\\lim": "limit",
    "\\ln": "natural log",
    "\\log": "log",
    "\\sin": "sine",
    "\\cos": "cosine",
    "\\tan": "tangent",
    "\\sum": "sum",
    "/": "slash",
    ",": "comma",
    ".": "point",
    "-": "negative",
    "~": "tilde",
    " ": "space",
    "\\ ": "space",
    "\\$": "dollar sign",
    "\\angle": "angle",
    "\\degree": "degree",
    "\\circ": "degree",
    "\\vec": "vector",
    "\\pi": "pi",
    "\\prime": "prime",
    "\\infty": "infinity",
    "\\alpha": "alpha",
    "\\beta": "beta",
    "\\gamma": "gamma",
    "\\omega": "omega"
};

var noPower = ["\\prime", "\\degree"];

var openMap = {
    "|": "open vertical bar",
    ".": ""
};

var closeMap = {
    "|": "close vertical bar",
    ".": ""
};

var binMap = {
    "+": "plus",
    "-": "minus",
    "\\cdot": "dot product",
    "*": "times",
    "/": "divided by",
    "\\times": "times",
    "\\div": "divided by"
};

var relMap = {
    "=": "equals",
    "\\geq": "greater than or equal to",
    "\\leq": "less than or equal to",
    ">": "greather than",
    "<": "less than"
};

var buildString = function(str, type, a11yStrings) {
    if (!str) {
        return;
    }

    var ret;

    if (type === "open") {
        ret = (str in openMap ? openMap[str] : stringMap[str] || str);
    } else if (type === "close") {
        ret = (str in closeMap ? closeMap[str] : stringMap[str] || str);
    } else if (type === "math") {
        ret = mathMap[str] || str;
    } else if (type === "bin") {
        ret = binMap[str] || str;
    } else if (type === "rel") {
        ret = relMap[str] || str;
    } else {
        ret = stringMap[str] || str;
    }

    // If nothing was found and it's not a plain string or number
    if (ret === str && !/^\w+$/.test(str)) {
        // This is likely a case that we'll need to handle
        throw "KaTeX a11y string not found: " + str;
    }

    // If the text to add is a number and there is already a string
    // in the list and the last string is a number then we should
    // combine them into a single number
    if (/^\d+$/.test(ret) && a11yStrings.length > 0 &&
            /^\d+$/.test(a11yStrings[a11yStrings.length - 1])) {
        a11yStrings[a11yStrings.length - 1] += ret;

    } else if (ret) {
        a11yStrings.push(ret);
    }
};

var buildRegion = function(a11yStrings, callback) {
    var region = [];
    a11yStrings.push(region);
    callback(region);
};

var typeHandlers = {
    accent: function(tree, a11yStrings) {
        buildRegion(a11yStrings, function(a11yStrings) {
            buildA11yStrings(tree.value.base, a11yStrings);
            a11yStrings.push("with");
            buildA11yStrings(tree.value.accent, a11yStrings);
            a11yStrings.push("on top");
        });
    },

    bin: function(tree, a11yStrings) {
        buildString(tree.value, "bin", a11yStrings);
    },

    close: function(tree, a11yStrings) {
        buildString(tree.value, "close", a11yStrings);
    },

    color: function(tree, a11yStrings) {
        var color = tree.value.color.replace(/katex-/, "");

        buildRegion(a11yStrings, function(a11yStrings) {
            a11yStrings.push("start color " + color);
            buildA11yStrings(tree.value.value, a11yStrings);
            a11yStrings.push("end color " + color);
        });
    },

    delimsizing: function(tree, a11yStrings) {
        if (tree.value.value) {
            buildString(tree.value.value, "normal", a11yStrings);
        }
    },

    genfrac: function(tree, a11yStrings) {
        buildRegion(a11yStrings, function(a11yStrings) {
            // NOTE: Not sure if this is a safe assumption
            // hasBarLine true -> fraction, false -> binomial
            if (tree.value.hasBarLine) {
                a11yStrings.push("start fraction");
                buildString(tree.value.leftDelim, "open", a11yStrings);
                buildA11yStrings(tree.value.numer, a11yStrings);
                a11yStrings.push("divided by");
                buildA11yStrings(tree.value.denom, a11yStrings);
                buildString(tree.value.rightDelim, "close", a11yStrings);
                a11yStrings.push("end fraction");
            } else {
                a11yStrings.push("start binomial");
                buildString(tree.value.leftDelim, "open", a11yStrings);
                buildA11yStrings(tree.value.numer, a11yStrings);
                a11yStrings.push("over");
                buildA11yStrings(tree.value.denom, a11yStrings);
                buildString(tree.value.rightDelim, "close", a11yStrings);
                a11yStrings.push("end binomial");
            }
        });
    },

    // inner

    katex: function(tree, a11yStrings) {
        a11yStrings.push("KaTeX");
    },

    leftright: function(tree, a11yStrings) {
        buildRegion(a11yStrings, function(a11yStrings) {
            buildString(tree.value.left, "open", a11yStrings);
            buildA11yStrings(tree.value.body, a11yStrings);
            buildString(tree.value.right, "close", a11yStrings);
        });
    },

    llap: function(tree, a11yStrings) {
        buildA11yStrings(tree.value.body, a11yStrings);
    },

    mathord: function(tree, a11yStrings) {
        buildA11yStrings(tree.value, a11yStrings);
    },

    op: function(tree, a11yStrings) {
        buildString(tree.value.body, "normal", a11yStrings);
    },

    open: function(tree, a11yStrings) {
        buildString(tree.value, "open", a11yStrings);
    },

    ordgroup: function(tree, a11yStrings) {
        buildA11yStrings(tree.value, a11yStrings);
    },

    overline: function(tree, a11yStrings) {
        buildRegion(a11yStrings, function(a11yStrings) {
            a11yStrings.push("start overline");
            buildA11yStrings(tree.value.body, a11yStrings);
            a11yStrings.push("end overline");
        });
    },

    phantom: function(tree, a11yStrings) {
        a11yStrings.push("empty space");
    },

    punct: function(tree, a11yStrings) {
        buildString(tree.value, "punct", a11yStrings);
    },

    rel: function(tree, a11yStrings) {
        buildString(tree.value, "rel", a11yStrings);
    },

    rlap: function(tree, a11yStrings) {
        buildA11yStrings(tree.value.body, a11yStrings);
    },

    rule: function(tree, a11yStrings) {
        // NOTE: Is there something more useful that we can put here?
        a11yStrings.push("rule");
    },

    sizing: function(tree, a11yStrings) {
        buildA11yStrings(tree.value.value, a11yStrings);
    },

    spacing: function(tree, a11yStrings) {
        a11yStrings.push("space");
    },

    styling: function(tree, a11yStrings) {
        // We ignore the styling and just pass through the contents
        buildA11yStrings(tree.value.value, a11yStrings);
    },

    sqrt: function(tree, a11yStrings) {
        buildRegion(a11yStrings, function(a11yStrings) {
            a11yStrings.push("square root of");
            buildA11yStrings(tree.value.body, a11yStrings);
            a11yStrings.push("end square root");
        });
    },

    supsub: function(tree, a11yStrings) {
        if (tree.value.base) {
            buildA11yStrings(tree.value.base, a11yStrings);
        }

        if (tree.value.sub) {
            buildRegion(a11yStrings, function(a11yStrings) {
                a11yStrings.push("start subscript");
                buildA11yStrings(tree.value.sub, a11yStrings);
                a11yStrings.push("end subscript");
            });
        }

        if (tree.value.sup) {
            // There are some cases that just read better if we don't have
            // the extra start/end baggage, so we skip the extra text
            var hidePower = (noPower.indexOf(tree.value.sup) >= 0 ||
                tree.value.sup.value &&
                noPower.indexOf(tree.value.sup.value[0].value) >= 0);

            buildRegion(a11yStrings, function(a11yStrings) {
                if (!hidePower) {
                    a11yStrings.push("start superscript");
                }

                buildA11yStrings(tree.value.sup, a11yStrings);

                if (!hidePower) {
                    a11yStrings.push("end superscript");
                }
            });
        }
    },

    text: function(tree, a11yStrings) {
        if (typeof tree.value !== "string") {
            buildA11yStrings(tree.value.body, a11yStrings);
        } else {
            buildString(tree, "normal", a11yStrings);
        }
    },

    textord: function(tree, a11yStrings) {
        buildA11yStrings(tree.value, a11yStrings);
    }
};

var buildA11yStrings = function(tree, a11yStrings) {
    a11yStrings = a11yStrings || [];

    // Handle strings
    if (typeof tree === "string") {
        buildString(tree, "normal", a11yStrings);

    // Handle arrays
    } else if (tree.constructor === Array) {
        for (var i = 0; i < tree.length; i++) {
            buildA11yStrings(tree[i], a11yStrings);
        }

    // Everything else is assumed to be an object...
    } else {
        if (!tree.type || !(tree.type in typeHandlers)) {
            throw "KaTeX a11y un-recognized type: " + tree.type;
        } else {
            typeHandlers[tree.type](tree, a11yStrings);
        }
    }

    return a11yStrings;
};

var renderStrings = function(a11yStrings, a11yNode) {
    for (var i = 0; i < a11yStrings.length; i++) {
        var a11yString = a11yStrings[i];

        if (i > 0) {
            a11yNode.appendChild(document.createTextNode(", "));
        }

        if (typeof a11yString === "string") {
            a11yNode.appendChild(document.createTextNode(a11yString));
        } else {
            var newBaseNode = document.createElement("span");
            //newBaseNode.tabIndex = 0;
            a11yNode.appendChild(newBaseNode);
            renderStrings(a11yString, newBaseNode);
        }
    }
};

var render = function(text, a11yNode) {
    // NOTE: `katex` is a global, should be included using require
    var tree = katex.__parse(text);

    //console.log(JSON.stringify(tree, null, "    "));

    var a11yStrings = buildA11yStrings(tree);
    renderStrings(a11yStrings, a11yNode);
};

if (typeof module !== "undefined") {
    module.exports = {
        render: render
    };
} else {
    this.katexA11yRender = render;
}