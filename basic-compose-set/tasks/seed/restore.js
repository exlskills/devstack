'use strict';

/*
 * initialize module
 */
const systemRegex = /^system\./;
const fs = require('graceful-fs');
const path = require('path');
let BSON;
let logger;
let meta;

/*
 * functions
 */
/**
 * error handler
 *
 * @function error
 * @param {Object} err - raised error
 */
const error = err => {
  if (err) {
    logger(err.message);
  }
}

/**
 * read collection metadata from file
 *
 * @function readMetadata
 * @param {Object} collection - db collection
 * @param {String} metadata - path to metadata file
 * @param {Function} next - callback
 */
const readMetadata = (collection, metadataPath, next) => {
  let doc, data;
  try {
    data = fs.readFileSync(metadataPath);
  } catch (err) {
    return next(null);
  }

  try {
    doc = JSON.parse(data).indexes;
  } catch (err) {
    return next(err);
  }

  const last = doc.length;
  let counter = 0;

  if (!last) {
    return next();
  }

  doc.forEach(function(index) {
    collection.createIndex(index.key, index, function(err) {
      error(err);
      if (last === ++counter) {
        next(err);
      }
    });
  });
}

/**
 * make dir
 *
 * @function makeDir
 * @param {String} pathname - pathname of dir
 * @param {Function} next - callback
 */
const makeDir = (pathname, next) => {
  fs.stat(pathname, function(err, stats) {
    if (err && err.code === 'ENOENT') {
      logger('make dir at ' + pathname);
      return fs.mkdir(pathname, function(err) {
        next(err, pathname);
      });
    } else if (stats && stats.isDirectory() === false) {
      logger('unlink file at ' + pathname);
      return fs.unlink(pathname, function() {
        logger('make dir at ' + pathname);
        fs.mkdir(pathname, function(err) {
          next(err, pathname);
        });
      });
    }

    next(null, pathname);
  });
}

/**
 * remove dir
 *
 * @function rmDir
 * @param {String} pathname - path of dir
 * @param {Function} [next] - callback
 */
const rmDir = (pathname, next) => {
  fs.readdirSync(pathname).forEach(function(first) {
    // database

    let database = pathname + first;
    if (fs.statSync(database).isDirectory() === false) {
      return;
    }

    let metadata = '';
    let collections = fs.readdirSync(database);
    let metadataPath = path.join(database, '.metadata');
    if (fs.existsSync(metadataPath) === true) {
      metadata = metadataPath + path.sep;
      delete collections[collections.indexOf('.metadata')]; // undefined is not a dir
    }

    collections.forEach(function(second) {
      // collection

      let collection = path.join(database, second);
      if (fs.statSync(collection).isDirectory() === false) {
        return;
      }
      fs.readdirSync(collection).forEach(function(third) {
        // document

        let document = path.join(collection, third);
        fs.unlinkSync(document);
        return next ? next(null, document) : '';
      });

      if (metadata !== '') {
        fs.unlinkSync(metadata + second);
      }
      fs.rmdirSync(collection);
    });

    if (metadata !== '') {
      fs.rmdirSync(metadata);
    }
    fs.rmdirSync(database);
  });
}

/**
 * JSON parser
 *
 * @function fromJson
 * @param {Object} collection - collection model
 * @param {String} collectionPath - path of collection
 * @param {Function} next - callback
 */
const fromJson = (collection, collectionPath, next) => {
  let docsBulk = [];
  let docs = fs.readdirSync(collectionPath);
  let last = docs.length,
    counter = 0;
  if (!last) {
    return next(null);
  }

  docs.forEach(function(docName) {
    let doc, data;
    try {
      data = fs.readFileSync(collectionPath + docName);
    } catch (err) {
      return last === ++counter ? next(null) : null;
    }
    try {
      doc = JSON.parse(data);
    } catch (err) {
      return last === ++counter ? next(err) : error(err);
    }

    docsBulk.push({
      insertOne: {
        document: doc
      }
    });

    return last === ++counter ? collection.bulkWrite(docsBulk, next) : null;
  });
}

/**
 * Parse BSON files in a folder
 *
 * @function fromBson
 * @param {Object} collection - collection model
 * @param {String} collectionPath - path of the folder
 * @param {Function} next - callback
 */
const fromBson = (collection, collectionPath, next) => {
  let docsBulk = [];
  let docs = fs.readdirSync(collectionPath);
  let last = ~~docs.length,
    counter = 0;
  if (last === 0) {
    return next(null);
  }

  docs.forEach(function(docName) {
    let doc, data;
    try {
      data = fs.readFileSync(collectionPath + docName);
    } catch (err) {
      return last === ++counter ? next(null) : null;
    }
    try {
      doc = BSON.deserialize(data);
    } catch (err) {
      return last === ++counter ? next(err) : error(err);
    }

    docsBulk.push({
      insertOne: {
        document: doc
      }
    });

    return last === ++counter ? collection.bulkWrite(docsBulk, next) : null;
  });
}

/**
 * Parser a single BSON file
 *
 * @function fromBson
 * @param {Object} collection - collection model
 * @param {String} collectionPath - path of the bson file
 * @param {Function} next - callback
 */
const importBson = (collection, collectionPath, next) => {
  try {
    const data = fs.readFileSync(collectionPath);
    const doc = BSON.deserialize(data);
    const docsBulk = [];
    docsBulk.push({
      insertOne: {
        document: doc
      }
    });
    collection.bulkWrite(docsBulk, next);
  } catch (err) {
    return next(err)
  }
}

/**
 * set data to all collections available
 *
 * @function allCollections
 * @param {Object} db - database
 * @param {String} name - path to the folder containing BSON files
 * @param {Function} parser - data parser
 * @param {Function} next - callback
 */
const allCollections = (db, name, parser, next) => {
  let collections = fs.readdirSync(name);
  const last = collections.length;
  let counter = 0;
  
  if (!last) {
    // empty set
    return next(null);
  }

  collections.forEach(function(collectionName) {
    if (!collectionName.endsWith('.bson')) {
      const err = new Error(collectionName + ' is not a bson file');
      return (last === ++counter) ? next(err) : error(err);
    }

    collectionName = collectionName.substring(0, collectionName.length - 5)
    const collectionPath = name + collectionName + '.bson';
    const metaDataPath = name + collectionName + '.metadata.json';
    db.createCollection(collectionName, function(err, collection) {
      if (err) {
        return last === ++counter ? next(err) : error(err);
      }
      logger('select collection ' + collectionName);
      meta(collection, metaDataPath, function(err) {
        if (err) {
          error(err);
        }
        parser(collection, collectionPath, function(err) {
          if (err) {
            return last === ++counter ? next(err) : error(err);
          }
          return last === ++counter ? next(null) : null;
        });
      });
    });
  });
}

/**
 * drop data from some collections
 *
 * @function someCollections
 * @param {Object} db - database
 * @param {Array} collections - selected collections
 * @param {Function} next - callback
 */
const someCollections = (db, collections, next) => {
  const last = collections.length;
  let counter = 0;

  if (!last) {
    // empty set
    return next(null);
  }

  collections.forEach(function(collection) {
    db.collection(collection, function(err, collection) {
      logger('select collection ' + collection.collectionName);
      if (err) {
        return last === ++counter ? next(err) : error(err);
      }
      collection.drop(function(err) {
        if (err) {
          error(err); // log if missing
        }
        return last === ++counter ? next(null) : null;
      });
    });
  });
}

/**
 * function wrapper
 *
 * @function wrapper
 * @param {Object} my - parsed options
 */
const wrapper = config => {
  let parser;
  if (typeof config.parser === 'function') {
    parser = config.parser;
  } else {
    switch (config.parser.toLowerCase()) {
      case 'bson':
        BSON = require('bson-ext');
        BSON = new BSON([BSON.Binary, BSON.Code, BSON.DBRef, BSON.Decimal128, BSON.Double, BSON.Int32, BSON.Long, BSON.Map, BSON.MaxKey, BSON.MinKey, BSON.ObjectId, BSON.BSONRegExp, BSON.Symbol, BSON.Timestamp]);
        parser = importBson;
        break;
      case 'json':
        // JSON error on ObjectId and Date
        parser = fromJson;
        break;
      default:
        throw new Error('missing parser option');
    }
  }

  let discriminator = allCollections;

  if (!config.logger) {
    logger = () => {};
  } else {
    logger = require('logger-request')({
      filename: config.logger,
      standalone: true,
      daily: true,
      winston: {
        logger: '_mongo_r' + config.logger,
        level: 'info',
        json: false
      }
    });
    logger('restore start');
    const log = require('mongodb').Logger;
    log.setLevel('info');
    log.setCurrentLogger(function(msg) {
      logger(msg);
    });
  }

  meta = config.metadata ? readMetadata : (a, b, next) => next();

  /**
   * latest callback
   *
   * @return {Null}
   */
  const callback = err => {
    logger('restore stop');
    if (config.tar) {
      rmDir(config.dir);
    }

    if (config.callback !== null) {
      logger('callback run');
      config.callback(err);
    } else if (err) {
      logger(err);
    }
  }

  /**
   * entry point
   *
   * @return {Null}
   */
  const go = root => {
    require('mongodb').MongoClient.connect(
      config.uri,
      config.options,
      function(err, client) {
        logger('client connected');
        if (err) {
          return callback(err);
        }

        const db = client.db();

        const next = err => {
          if (err) {
            logger('client disconnected');
            client.close();
            return callback(err);
          }

          // waiting for `db.fsyncLock()` on node driver
          discriminator(db, root, parser, function(err) {
            logger('client disconnect');
            client.close();
            callback(err);
          });
        }

        if (config.drop === true) {
          return db.dropDatabase(next);
        } else if (config.dropCollections) {
          if (Array.isArray(config.dropCollections)) {
            return someCollections(db, config.dropCollections, next);
          }
          return db.collections(function(err, collections) {
            if (err) {
              // log if missing
              error(err);
            }
            config.dropCollections = [];
            collections.forEach(collection => {
              const collectionName = collection.collectionName;
              if (!systemRegex.test(collectionName)) {
                config.dropCollections.push(collectionName);
              }
            })
            someCollections(db, config.dropCollections, next);
          });
        }

        next(null);
      }
    );
  }

  if (!config.tar) {
    return go(config.root);
  }

  makeDir(config.dir, function() {
    let extractor = require('tar')
      .Extract({
        path: config.dir
      })
      .on('error', callback)
      .on('end', function() {
        let dirs = fs.readdirSync(config.dir);
        for (let i = 0, ii = dirs.length; i < ii; ++i) {
          let t = config.dir + dirs[i];
          if (fs.statSync(t).isFile() === false) {
            return go(t + path.sep);
          }
        }
      });

    if (config.stream !== null) {
      // user stream
      logger('get tar file from stream');
      config.stream.pipe(extractor);
    } else {
      // filesystem stream
      logger('open tar file at ' + config.root + config.tar);
      fs.createReadStream(config.root + config.tar)
        .on('error', callback)
        .pipe(extractor);
    }
  });
}

/**
 * option setting
 *
 * @exports restore
 * @function restore
 * @param {Object} options - various options. Check README.md
 */
function restore(options) {
  let opt = options || Object.create(null);
  if (!opt.uri) {
    throw new Error('missing uri option');
  }
  if (!opt.stream) {
    if (!opt.root) {
      throw new Error('missing root option');
    } else if (
      !fs.existsSync(opt.root) ||
      !fs.statSync(opt.root).isDirectory()
    ) {
      throw new Error('root option is not a directory');
    }
  }

  const config = {
    dir: path.join(__dirname, 'dump', path.sep),
    uri: opt.uri,
    root: path.resolve(String(opt.root)) + path.sep,
    stream: opt.stream || null,
    parser: opt.parser || 'bson',
    callback: typeof opt.callback === 'function' ? opt.callback : ()=> {},
    tar: typeof opt.tar === 'string' ? opt.tar : null,
    logger: typeof opt.logger === 'string' ? path.resolve(opt.logger) : null,
    metadata: opt.metadata,
    drop: opt.drop,
    dropCollections: opt.dropCollections,
    options: typeof opt.options === 'object' ? opt.options : { useNewUrlParser: true }
  };

  if (config.stream) {
    config.tar = true; // override
  }

  wrapper(config);
}

module.exports = restore;
