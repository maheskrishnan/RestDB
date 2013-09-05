
/*
* this file does 2 things
* 1. do actual entity persistance
* 2. expose expressjs rest routes
*/


var fs      =   require('fs');
var path    =   require('path');

var Entity = function(rootDataDir){ this.rootDataDir = rootDataDir; return this; }

Entity.prototype.getEntityList = function (callback) {
    var dataDirPath = this.rootDataDir;
    fs.exists(dataDirPath, function(exists){
        if (!exists) callback(null, []);
        else{
            fs.readdir(dataDirPath, function(err, files){
                if (err) callback(err);
                else {
                    var entities = files.map(function(fileName){ return {name: fileName}; });
                    callback(null, entities);
                }
            });
        }
    });
};

Entity.prototype.getEntities = function (strEntityName, callback) {
    console.log('::strEntityName'+strEntityName);
    var dataDirPath = path.join(this.rootDataDir, strEntityName);
    fs.exists(dataDirPath, function(exists){
        if (!exists) callback(null, []);
        else{
            fs.readdir(dataDirPath, function(err, files){
                if (err) callback(err);
                else {
                    var arrData = files.map(function(fileName){
                        var filePath = path.join(dataDirPath, fileName);
                        var strFileContent = fs.readFileSync(filePath, {encoding:'utf8'});
                        return JSON.parse(strFileContent.toString('utf8'));
                    });
                    callback(null, arrData);
                }
            });
        }
    });
};

Entity.prototype.getEntity = function (strEntityName, strEntityId, callback) {
    var dataFilePath = path.join(path.join(this.rootDataDir, strEntityName), ''+strEntityId+'.json');
    fs.exists(dataFilePath, function(exists){
        if (!exists) callback(null, null);
        else {
            fs.readFile(dataFilePath, function(err, data){
                if (err) callback(err, null);
                else callback(null, JSON.parse(data.toString('utf-8')));
            });
        }
    });
};

Entity.prototype.createEntityByGeneratingId = function (strEntityName, objEntity, callback) {

    var entityDirPath = path.join(this.rootDataDir, strEntityName);

    function getRandomId(dir, callback){
        var r = Math.floor(Math.random()*1000*1000*1000*1000*1000);
        fs.exists(path.join(dir, ''+r+'.json'), function(exists){
            if (exists) { getRandomId(dir, callback) }
            else callback(null, r);
        });
    }

    var thisEntity = this;

    getRandomId(entityDirPath, function(err, rndId){
        objEntity.id = rndId;
        thisEntity.createEntityWithGivenId(strEntityName, objEntity, callback);
    });
}

Entity.prototype.createEntityWithGivenId = function (strEntityName, objEntity, callback) {
    var entityDirPath = path.join(this.rootDataDir, strEntityName);
    var strEntityId = objEntity.id;
    var entityFilePath = path.join(entityDirPath, ''+strEntityId+'.json');

    function createEntityFile(filePath, data, callback){
        fs.writeFile(filePath, JSON.stringify(data), function(err){
            if (err) callback(err, data);
            else {
                callback(null, data);
            }
        });
    }

    fs.exists(entityDirPath, function(exists){
        if (!exists) {
            fs.mkdir(entityDirPath, function(err){
                if (err) console.log(err);
                else {
                    createEntityFile(entityFilePath, objEntity, function(err, data){ callback(err, data); });
                }
            });
        }
        else {
            createEntityFile(entityFilePath, objEntity, function(err, data){ callback(err, data); });
        }
    });
};

Entity.prototype.updateEntity = function (strEntityName, objEntity, callback) {
    this.createEntityWithGivenId(strEntityName, objEntity, callback);
};

Entity.prototype.deleteEntity = function (strEntityName, strEntityId, callback) {
    var dataFilePath = path.join(path.join(this.rootDataDir, strEntityName), ''+strEntityId+'.json');
    fs.exists(dataFilePath, function(exists){
        if (!exists) callback(null, null);
        else fs.unlink(dataFilePath, function(err){
            callback(err);
        });
    });
};



module.exports = function(rest_api_options){

    var fnDataDirectory = rest_api_options.datadir;
    var authenticate = rest_api_options.authenticate;
    var fnOwnerId = rest_api_options.owner;

    if (authenticate==null) authenticate = function(req, res, next){next();};

    var express = require('express');
    var router = new express.Router();

    router.post('/admin/entities', function(req, res){
        var entityName = req.params["entity"];
        var entity = new Entity(fnDataDirectory(req, res));
        var arrEntity = entity.getEntityList (function(err, arrEntity){
            if (err) {
                res.setHeader('Content-Type', 'application/json');
                res.end('[]');
            }else{
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(arrEntity).toString('utf-8'));
            }
        });
    });

    router.get('/:entity', authenticate, function(req, res){
        var entityName = req.params["entity"];
        var entity = new Entity(fnDataDirectory(req, res));
        var arrEntity = entity.getEntities(entityName, function(err, arrEntity){
            if (err) {
                res.setHeader('Content-Type', 'application/json');
                res.end('[]');
            }else{
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(arrEntity).toString('utf-8'));
            }
        });
    });

    router.get('/:entity/:id', authenticate, function(req, res){
        var entityId = req.params["id"];
        var entityName = req.params["entity"];
        var entity = new Entity(fnDataDirectory(req, res));
        entity.getEntity(entityName, entityId, function(err, objEntity){
            if (err){
                res.setHeader('Content-Type', 'application/json');
                res.end('');
            }else{
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(objEntity).toString('utf-8'));
            }
        });
    });

    router.put('/:entity/:id', authenticate, function(req, res){
        var entityName = req.params["entity"];
        var entityId = req.params["id"];
        var entity = new Entity(fnDataDirectory(req, res));
        entity.createEntityWithGivenId(entityName, req.body, function(err, data){
            if (err) res.send(500);
            else res.send(201, data);
        });
    });

    router.post('/:entity', function(req, res){
        var entityName = req.params["entity"];
        req.body['_owner'] = fnOwnerId(req, res);
        var entity = new Entity(fnDataDirectory(req, res));
        entity.createEntityByGeneratingId(entityName, req.body, function(err, data){
            if (err) res.send(500);
            else {
                res.send(201, data);
            }
        });
    });

    router.delete('/:entity/:id', authenticate, function(req, res){
        var entityName = req.params["entity"];
        var entityId = req.params["id"];
        var entity = new Entity(fnDataDirectory(req, res));
        entity.deleteEntity(entityName, entityId, function(err){
            if (err) res.send(500);
            else res.send(200);
        });
    });

    return router;
};