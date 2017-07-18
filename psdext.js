/**
 * @license
 * psdext.js 1.0.1
 * Copyright 2017 econosys system    http://econosys-system.com/
 * Available under The MIT license
 */

class psdext {
    constructor() {
        this.depth = 1;
        this.count = 1;
        this.outCss = `
* {
  margin: 0;
  padding: 0;
  left: 0;
  text-align: left;
  word-break: break-all;
  box-sizing: border-box;
}
`;

        this.outHtml = "";
        this.outTemplate = "";
        this.outlayers = "";
        this.dataPsd = Object;
        this.groupFlag = false;
        this.groups = [];
    }

    loadFile(fileName) {
        let psd = require("psd").fromFile(fileName);
        psd.parse();
        let data = psd.tree().export();
        const dataChildrenArray = data.children;
        for (let i = 0; i < dataChildrenArray.length; i++) {
            this.dataPsd[dataChildrenArray[i].name] = dataChildrenArray[i];
        }
    }

    layerList() {
        console.log("---------------------------------------------------------------------top layers");
        for (let k in this.dataPsd) {
            console.log(k);
        }
        console.log("---------------------------------------------------------------------top layers");
    }

    extractText(obj_name) {
        if (!obj_name) {
            console.log('ERROR:psdext.exp(): please set arg "obj_name"');
            return false;
        } else if (!this.dataPsd.hasOwnProperty(obj_name)) {
            console.log(`ERROR:psdext.exp(): layer ${obj_name} is not found. please select layer below.`);
            this.layerList();
            return false;
        }
        this.exp(this.dataPsd[obj_name]);
        this.outputAll();
    }

    exp(obj) {
        this.depth++;
        let indent = "";
        for (var i = 1; i < this.depth; i++) {
            indent += "\t";
        }
        let layerType = "( layer )";
        if (obj.text) {
            layerType = "( text layer )";
            this.createCss(obj);
        } else if (obj.type === "group") {
            layerType = "( group )";
            this.groupFlag = true;
            // this.groupDepth = this.depth; // いらない？
            this.groups.push({
                _depth: this.depth,
                top: obj.top,
                left: obj.left
            });
            this._groupStart(obj);
        }
        this.outlayers += indent + obj.name + layerType + "\n";
        if ("children" in obj) {
            for (let i = 0; i < obj.children.length; i++) {
                this.exp(obj.children[i]);
            }
        }

        let len = this.groups.length - 1;
        let group_depth = this.groups[len]["_depth"];
        if (this.groupFlag === true && group_depth === this.depth) {
            this._groupEnd();
        }
        this.depth--;
        if (this.depth == 1) {
            this.createAll();
        }
    }

    _groupStart(obj) {
        let len = this.groups.length - 1;
        let group_depth = this.groups[len]["_depth"];
        let max_width = 0;
        for (let i = 0; i < obj.children.length; i++) {
            if (max_width < obj.children[i]["width"]) {
                max_width = obj.children[i]["width"];
            }
        }

        // className
        let cssName, htmlName;
        cssName = this._createName(obj.name)["cssName"];
        htmlName = this._createName(obj.name)["htmlName"];

        let cssPos;
        if (group_depth > 2) {
            let parent_len = this.groups.length - 2;
            cssPos = `
left: ${obj.left - this.groups[parent_len]["left"]}px;
top: ${obj.top - this.groups[parent_len]["top"]}px;
width: ${max_width}px;
height: 100%;
/*
_obj__left: ${obj.left}px;
_obj__top: ${obj.top}px;
_parent_group__left: ${this.groups[parent_len]["left"]}px;
_parent_group__top: ${this.groups[parent_len]["top"]}px;
*/
`;
        } else {
            cssPos = `
  left: ${obj.left}px;
  top: ${obj.top}px;
`;
        }

        const css = `
${cssName} {
${cssPos}
  __width: ${obj.width}px;
  __height: ${obj.height}px;
    position: relative;
/*    background-color: black; */
}
`;
        const html = `<div class="${obj.name}">\n`;
        this.outCss += css;
        this.outHtml += html;
    }

    _groupEnd(obj) {
        const html = `</div>\n`;
        this.outHtml += html;

        this.groups.pop();
        if (this.groups.length === 0) {
            this.groupFlag = false;
        }
    }

    _createName(name) {
        let cssName, htmlName;
        name = name.replace(/[^0-9a-zA-Z\-_]+/g, "_");
        if (name === "_") {
            name = `myclass_${this.count}`;
            this.count++;
        } else if (name.match(/^[0-9]/)) {
            name = `myclass_${name}`;
            this.count++;
        }
        if (name.match(/^#/)) {
            cssName = name;
            htmlName = `class="${name.replace(/^#/, "")}"`;
        } else {
            cssName = "." + name;
            htmlName = `class="${name}"`;
        }
        return {
            cssName: cssName,
            htmlName: htmlName
        };
    }

    createCss(obj) {
        let name = obj.name;
        let textObj = obj.text;
        // className
        let cssName, htmlName;
        let n = this._createName(obj.name);
        cssName = n.cssName;
        htmlName = n.htmlName;
        // color
        let cssFontColor = "";
        let c = textObj.font.colors[0];
        if (obj.opacity === 1) {
            cssFontColor = `color: rgb(${c[0]}, ${c[1]}, ${c[2]});`;
        } else {
            cssFontColor = `color: rgba(${c[0]}, ${c[1]}, ${c[2]}, ${obj.opacity});`;
        }
        let css_add = "";
        let css;
        if (this.groupFlag === true) {
            let len = this.groups.length - 1;
            css = `
${cssName} {
  font-size: ${textObj.font.sizes}px;
  font-family: "${textObj.font.name}";
  ${cssFontColor}
  --line-height: ${obj.height / textObj.font.sizes};
  --text-align: ${textObj.font.alignment};

  position: absolute;
  top: ${obj.top - this.groups[len]["top"]}px;
  left: ${obj.left - this.groups[len]["left"]}px;

  width: calc( ${obj.width}px + 2px );
  height: calc( ${obj.height}px + 2px );
  /*
  top-group: ${this.groups[len]["top"]}px;
  left-group: ${this.groups[len]["left"]}px;
  top-this: ${obj.top}px;
  left-this: ${obj.left}px;
  */
}
`;
        } else {
            css = `
${cssName} {
  font-size: ${textObj.font.sizes}px;
  font-family: "${textObj.font.name}";
  ${cssFontColor}
  --line-height: ${obj.height / textObj.font.sizes};
  --text-align: ${textObj.font.alignment};
}
`;
        }
        let text_html = textObj.value;
        text_html = text_html.replace(/(\n|\r|\r\n)/g, "<br>\n");
        const html = `<p ${htmlName}>${text_html}</p>\n`;
        this.outCss += css;
        this.outHtml += html;
    }

    outputLayers() {
        console.log("<!-- \n---------------------------------------------------------------------layers");
        console.log(this.outlayers);
        console.log("---------------------------------------------------------------------layers \n --> \n");
    }

    output() {
        this.outputLayers();
        console.log(this.outHtml);
        console.log(this.outCss);
    }

    outputAll() {
        this.outputLayers();
        console.log(this.outTemplate);
    }

    createAll() {
        this.outTemplate = `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>PSD TEXT Extractor</title>
<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css">
</head>
<body style="background-color:#76c7c0;">
${this.outHtml}
</body>
<style>
${this.outCss}
</style>
</html>
`;
    }
}

module.exports = psdext;
