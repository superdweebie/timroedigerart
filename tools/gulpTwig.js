var Transform = require('stream').Transform;
var Twig = require('twig');
var path = require('path');
var data = require('../src/data/data.js');
var util = require('util');
var File = require('vinyl');

Twig.cache(false);
var twig = Twig.twig;

util.inherits(GulpTwig, Transform);

function GulpTwig() {
    if (!(this instanceof GulpTwig))
        return new GulpTwig();

    Transform.call(this, {objectMode: true});
}

GulpTwig.prototype._transform = function (file, encoding, done) {

    var template = twig({path: file.path, async: false});
    var pageName = path.basename(file.path).replace('.twig', '');
    file.contents = new Buffer(template.render(data[pageName]));
    file.path = file.path.replace(path.basename(file.path), pageName + '.html');

    this.push(file);

    if (data[pageName].works) {
        var workTemplate = twig({path: __dirname + '/../src/twig/include/work.twig', async: false, cache: false});
        for (var i = 0; i < data[pageName].works.length; i++) {
            var workData = data[pageName].works[i];
            var workFile = new File({
                cwd: file.cwd,
                base: file.base,
                path: file.path.replace(path.basename(file.path), workData.path + '/' + workData.slug + '.html'),
                contents: new Buffer(workTemplate.render(workData))
            });
            this.push(workFile);
        }
    }

    done();
};

module.exports = function () {
        return new GulpTwig()
    }
